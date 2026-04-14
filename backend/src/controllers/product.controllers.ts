import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import Product from "../models/product.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Request, Response } from "express";
import { Document } from "mongoose";
import mongoose from "mongoose";
import { getCache, setCache, deleteCache, deleteCachePattern } from "../utils/redis.js";

const PRODUCTS_CACHE_KEY = "products:all";
const PRODUCT_CACHE_TTL = 1800; // 30 min for individual products
const PRODUCTS_CACHE_TTL = 3600; // 1 hour for all products

interface IBrand {
    _id: mongoose.Types.ObjectId;
    name: string;
    productCount: number;
    save: () => Promise<Document>;
}

interface IProduct {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    discount: number;
    brandId: mongoose.Types.ObjectId;
    images: string[];
    categoryId: mongoose.Types.ObjectId;
    stock: number;
    rating: number;
    reviews: mongoose.Types.ObjectId[];
    save: () => Promise<Document>;
    toObject: () => any;
}

type ProductDocument = Document & IProduct;
type BrandDocument = Document & IBrand;

interface RequestWithFiles extends Request {
    files?: Express.Multer.File[];
}

// Create a new product
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    let { name, description, price, discount, brandId, brandName, categoryId, stock } = req.body;
    let images = req.body.images;
    // Ensure images is always an array (if not using file upload)
    if (!req.files && images && !Array.isArray(images)) {
        if (typeof images === 'string' && images.includes(',')) {
            images = images.split(',').map(s => s.trim());
        } else {
            images = [images];
        }
    }
    
    // Handle file upload for images (support multiple files)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        images = [];
        for (const file of req.files) {
            const uploadResult = await uploadOnCloudinary(file.path, 'ecommerce/product-images');
            if (uploadResult && uploadResult.secure_url) {
                images.push(uploadResult.secure_url);
            }
        }
    }

    // Debug log to help trace incoming values
    console.log({ name, description, price, brandId, brandName, images, categoryId, stock });
    if (!name || !description || !price || (!brandId && !brandName) || !images || !categoryId || !stock) {
        return res.status(400).json(new apiError(400, "Missing required fields"));
    }
    // Check if product with the same name already exists (case-insensitive)
    const existingProduct = await Product.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingProduct) {
        return res.status(409).json(new apiError(409, 'Product already exists'));
    }
    // If brandId is not provided, but brandName is, look up the brandId
    let brand: BrandDocument | null = null;
    if (!brandId && brandName) {
        const { default: Brand } = await import("../models/brand.models.js");
        brand = await Brand.findOne({ name: { $regex: `^${brandName}$`, $options: 'i' } }) as BrandDocument;
        if (!brand) {
            return res.status(400).json(new apiError(400, `Brand not found for name: ${brandName}`));
        }
        brandId = brand._id.toString();
    } else if (brandId) {
        const { default: Brand } = await import("../models/brand.models.js");
        brand = await Brand.findById(new mongoose.Types.ObjectId(brandId)) as BrandDocument;
    }

    // Create product
    const product = await Product.create({
        name,
        description,
        price,
        discount: discount || 0.0,
        brandId: new mongoose.Types.ObjectId(brandId as string),
        images,
        categoryId: new mongoose.Types.ObjectId(categoryId as string),
        stock
    });

    // Update Brand: increment productCount
    if (brand) {
        brand.productCount = (brand.productCount || 0) + 1;
        await brand.save();
    }



    // Invalidate product list cache
    await deleteCache(PRODUCTS_CACHE_KEY);
    console.log("🗑️  Cache invalidated: products:all (new product created)");

    return res.status(201).json(new apiResponse(201, product, "Product created successfully"));
});

// Get all products (with Search, Filter, Pagination, and Cache)
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { search, category, page = 1, limit = 10 } = req.query;

    const query: any = {};
    if (search) {
        query.name = { $regex: search as string, $options: "i" };
    }
    if (category) {
        query.categoryId = new mongoose.Types.ObjectId(category as string);
    }

    // Dynamic cache key reflecting the query state
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // 1. Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
        console.log(`🔵 Cache HIT: ${cacheKey}`);
        return res.status(200).json(new apiResponse(200, cached, "Products fetched (cached)"));
    }

    console.log(`🟡 Cache MISS: ${cacheKey} — fetching from MongoDB`);
    
    // 2. Pagination Math & Fetch
    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(query)
                                  .populate("brandId")
                                  .skip(skip)
                                  .limit(Number(limit));

    const total = await Product.countDocuments(query);
    const payload = {
        products,
        pagination: {
            totalItems: total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            pageSize: Number(limit)
        }
    };

    // 3. Store in Redis
    await setCache(cacheKey, payload, PRODUCTS_CACHE_TTL);
    
    return res.status(200).json(new apiResponse(200, payload, "Products fetched successfully"));
});

// Get a single product by ID — with Redis Cache-Aside
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = `product:${req.params.id}`;
    // 1. Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
        console.log(`🔵 Cache HIT: ${cacheKey}`);
        return res.status(200).json(new apiResponse(200, cached, "Product fetched (cached)"));
    }
    // 2. Cache MISS — fetch from DB
    console.log(`🟡 Cache MISS: ${cacheKey} — fetching from MongoDB`);
    const product = await Product.findById(req.params.id).populate('brandId') as ProductDocument;
    if (!product) return res.status(404).json(new apiError(404, "Product not found"));
    // 3. Store in Redis
    await setCache(cacheKey, product, PRODUCT_CACHE_TTL);
    return res.status(200).json(new apiResponse(200, product, "Product fetched successfully"));
});

// Update a product
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    let update = req.body;
    // Find the old product
    const oldProduct = await Product.findById(productId) as ProductDocument;
    if (!oldProduct) return res.status(404).json(new apiError(404, "Product not found"));

    // Handle file upload for images (support multiple files)
    let images = update.images;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        images = [];
        for (const file of req.files) {
            const uploadResult = await uploadOnCloudinary(file.path, 'ecommerce/product-images');
            if (uploadResult && uploadResult.secure_url) {
                images.push(uploadResult.secure_url);
            }
        }
        update.images = images;
    } else if (typeof images === 'string') {
        // If images is a single string, convert to array
        update.images = [images];
    }



    // Update the product
    const product = await Product.findByIdAndUpdate(productId, update, { new: true }) as ProductDocument;
    // Invalidate both the list cache and the individual product cache
    await deleteCache(PRODUCTS_CACHE_KEY);
    await deleteCache(`product:${productId}`);
    console.log(`🗑️  Cache invalidated: products:all + product:${productId} (product updated)`);
    return res.status(200).json(new apiResponse(200, product, "Product updated successfully"));
});

// Delete a product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const product = await Product.findByIdAndDelete(productId) as ProductDocument;
    if (!product) return res.status(404).json(new apiError(404, "Product not found"));

    // Decrement productCount in Brand
    if (product.brandId) {
        const { default: Brand } = await import("../models/brand.models.js");
        const brand = await Brand.findById(product.brandId);
        if (brand && brand.productCount > 0) {
            brand.productCount -= 1;
            await brand.save();
        }
    }



    // Invalidate both the list cache and the individual product cache
    await deleteCache(PRODUCTS_CACHE_KEY);
    await deleteCache(`product:${productId}`);
    console.log(`🗑️  Cache invalidated: products:all + product:${productId} (product deleted)`);
    return res.status(200).json(new apiResponse(200, product, "Product deleted successfully"));
});

