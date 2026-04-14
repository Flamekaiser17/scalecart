import Category  from '../models/category.models.js';
import apiResponse  from '../utils/apiResponse.js';
import apiError  from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Request, Response } from 'express';
import { Document } from 'mongoose';
import { getCache, setCache, deleteCache } from '../utils/redis.js';

const CATEGORIES_CACHE_KEY = "categories:all";
const CATEGORIES_CACHE_TTL = 3600; // 1 hour

interface ICategory {
    _id: string;
    name: string;
    icon: string;
    products: string[];
    save: () => Promise<Document>;
    toObject: () => any;
}

type CategoryDocument = Document & ICategory;

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, products } = req.body;
        let iconUrl = req.body.icon;
        // If a file is uploaded, upload to Cloudinary
        if (req.file) {
            const uploadResult = await uploadOnCloudinary(req.file.path, 'ecommerce/category-icons');
            if (!uploadResult || !uploadResult.secure_url) {
                return res.status(500).json(new apiError(500, 'Failed to upload icon to Cloudinary'));
            }
            iconUrl = uploadResult.secure_url;
        }
        if (!name || !iconUrl) {
            return res.status(400).json({ message: 'Name and icon are required' });
        }
        // Check if category with the same name already exists (case-insensitive)
        const existingCategory = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existingCategory) {
            return res.status(409).json(new apiError(409, 'Category already exists'));
        }
        const category = new Category({ name, icon: iconUrl, products: products || [] });
        await category.save();
        // Invalidate categories cache
        await deleteCache(CATEGORIES_CACHE_KEY);
        console.log("🗑️  Cache invalidated: categories:all (new category created)");
        res.status(201).json(new apiResponse(201, category, 'Category created successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Get all categories with products (aggregation) — with Redis Cache-Aside
import  Product  from '../models/product.models.js';
export const getCategories = async (req: Request, res: Response) => {
    try {
        // 1. Check cache
        const cached = await getCache(CATEGORIES_CACHE_KEY);
        if (cached) {
            console.log("🔵 Cache HIT: categories:all");
            return res.status(200).json(new apiResponse(200, cached, 'Categories fetched (cached)'));
        }
        // 2. Cache MISS — fetch from DB
        console.log("🟡 Cache MISS: categories:all — fetching from MongoDB");
        const categories = await Category.find();
        const categoriesWithProducts = await Promise.all(categories.map(async (category) => {
            const products = await Product.find({ categories: { $in: [category.name] } });
            return { ...category.toObject(), products };
        }));
        // 3. Store in Redis
        await setCache(CATEGORIES_CACHE_KEY, categoriesWithProducts, CATEGORIES_CACHE_TTL);
        res.status(200).json(new apiResponse(200, categoriesWithProducts, 'Categories fetched successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Get a single category by ID
export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const category = await Category.findById(req.params.id) as CategoryDocument;
        if (!category) return res.status(404).json(new apiError(404, 'Category not found'));
        res.status(200).json(new apiResponse(200, category, 'Category fetched successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }) as CategoryDocument;
        if (!category) return res.status(404).json(new apiError(404, 'Category not found'));
        await deleteCache(CATEGORIES_CACHE_KEY);
        console.log("🗑️  Cache invalidated: categories:all (category updated)");
        res.status(200).json(new apiResponse(200, category, 'Category updated successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id) as CategoryDocument;
        if (!category) return res.status(404).json(new apiError(404, 'Category not found'));
        await deleteCache(CATEGORIES_CACHE_KEY);
        console.log("🗑️  Cache invalidated: categories:all (category deleted)");
        res.status(200).json(new apiResponse(200, category, 'Category deleted successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};