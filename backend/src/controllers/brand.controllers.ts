import Brand from '../models/brand.models.js';
import apiResponse from '../utils/apiResponse.js';
import apiError  from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Request, Response } from 'express';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import Product from '../models/product.models.js';


interface IBrand {
    _id: string;
    name: string;
    logo: string;
    productCount: number;
    topProducts: string[];
    save: () => Promise<Document>;
    toObject: () => any;
}

type BrandDocument = Document & IBrand;

// Create a new brand
export const createBrand = async (req: Request, res: Response) => {
    try {
        const { name, productCount, topProducts } = req.body;
        let logoUrl = req.body.logo;
        // If a file is uploaded, upload to Cloudinary
        if (req.file) {
            const uploadResult = await uploadOnCloudinary(req.file.path, 'ecommerce/brand-logos');
            if (!uploadResult || !uploadResult.secure_url) {
                return res.status(500).json(new apiError(500, 'Failed to upload logo to Cloudinary'));
            }
            logoUrl = uploadResult.secure_url;
        }
        if (!name || !logoUrl) {
            return res.status(400).json({ message: 'Name and logo are required' });
        }
        // Check if brand with the same name already exists (case-insensitive)
        const existingBrand = await Brand.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existingBrand) {
            return res.status(409).json(new apiError(409, 'Brand already exists'));
        }
        const brand = new Brand({ name, logo: logoUrl, productCount: productCount || 0, topProducts: topProducts || [] });
        await brand.save();

        // After creating the brand, randomly select up to 3 products (if any exist) and set as topProducts
        const products = await Product.find({ brandId: brand._id });
        if (products.length > 0) {
            // Shuffle and pick up to 3 random products
            const shuffled = products.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3).map(p => p._id as mongoose.Types.ObjectId);
            brand.topProducts = selected;
            await brand.save();
        }

        res.status(201).json(new apiResponse(201, brand, 'Brand created successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Get all brands with productCount (aggregation)

export const getBrands = async (req: Request, res: Response) => {
    try {
        const brands = await Brand.find();
        // For each brand, aggregate product count
        const brandsWithCount = await Promise.all(brands.map(async (brand) => {
            const count = await Product.countDocuments({ brandId: brand._id });
            return { ...brand.toObject(), productCount: count };
        }));
        res.status(200).json(new apiResponse(200, brandsWithCount, 'Brands fetched successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Get a single brand by ID with productCount (aggregation)
export const getBrandById = async (req: Request, res: Response) => {
    try {
        const brand = await Brand.findById(req.params.id) as BrandDocument;
        if (!brand) return res.status(404).json(new apiError(404, 'Brand not found'));
        // Aggregate product count for this brand
        const count = await Product.countDocuments({ brandId: brand._id });
        const brandWithCount = { ...brand.toObject(), productCount: count };
        res.status(200).json(new apiResponse(200, brandWithCount, 'Brand fetched successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Update a brand
export const updateBrand = async (req: Request, res: Response) => {
    try {
        const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true }) as BrandDocument;
        if (!brand) return res.status(404).json(new apiError(404, 'Brand not found'));
        res.status(200).json(new apiResponse(200, brand, 'Brand updated successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};

// Delete a brand
export const deleteBrand = async (req: Request, res: Response) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.id) as BrandDocument;
        if (!brand) return res.status(404).json(new apiError(404, 'Brand not found'));
        res.status(200).json(new apiResponse(200, brand, 'Brand deleted successfully'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
}; 

export const searchBrands = async (req: Request, res: Response) => {
    const { q } = req.query;
    const brands = await Brand.find({
      name: { $regex: q, $options: 'i' }
    });
    res.status(200).json({ data: brands });
  };

// Get brands by category
export const getBrandsByCategory = async (req: Request, res: Response) => {
    try {
        const { category } = req.query;
        if (!category) {
            return res.status(400).json(new apiError(400, 'Category is required'));
        }
        // Find all products with this category
        const products = await Product.find({ categories: category });
        // Get unique brandIds
        const brandIds = [...new Set(products.map(p => p.brandId.toString()))];
        // Find brands with those IDs
        const brands = await Brand.find({ _id: { $in: brandIds } });
        // For each brand, aggregate product count
        const brandsWithCount = await Promise.all(brands.map(async (brand) => {
            const count = await Product.countDocuments({ brandId: brand._id });
            return { ...brand.toObject(), productCount: count };
        }));
        res.status(200).json(new apiResponse(200, brandsWithCount, 'Brands fetched successfully by category'));
    } catch (err: any) {
        res.status(500).json(new apiError(500, err.message));
    }
};