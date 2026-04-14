import multer from "multer";
import fs from "fs";
import { Request, Response } from "express";
import Product from "../models/product.models.js";
import Brand from "../models/brand.models.js";
import Category from "../models/category.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

interface UploadedFile {
    path: string;
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
}

interface RequestWithFile extends Request {
    file?: Express.Multer.File;
}

const upload = multer({ dest: "public/temp/" });

export const uploadData = [
    upload.single("file"),
    async (req: RequestWithFile, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            const filePath = req.file.path;
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const data = JSON.parse(fileContent);

            const type = req.query.type as string || req.body.type;
            let result;
            if (type === 'brand') {
                result = await Brand.insertMany(data);
            } else if (type === 'category') {
                const categoriesToInsert = [];
                for (const item of data) {
                    let icon = item.icon;
                    if (typeof icon === 'string' && !icon.startsWith('http')) {
                        const uploadResult = await uploadOnCloudinary(icon, 'ecommerce/category-icons');
                        if (uploadResult && uploadResult.secure_url) {
                            icon = uploadResult.secure_url;
                        }
                    }
                    categoriesToInsert.push({ ...item, icon });
                }
                result = await Category.insertMany(categoriesToInsert);
            } else {
                const productsToInsert = [];
                for (const item of data) {
                    let brandId = item.brandId;
                    if (!brandId && item.brandName) {
                        const brand = await Brand.findOne({ name: { $regex: `^${item.brandName}$`, $options: 'i' } });
                        if (brand) {
                            brandId = brand._id;
                        } else {
                            throw new Error(`Brand not found for name: ${item.brandName}`);
                        }
                    }
                    let images = item.images;
                    if (Array.isArray(images)) {
                        const uploadedImages = [];
                        for (let img of images) {
                            if (typeof img === 'string' && !img.startsWith('http')) {
                                const uploadResult = await uploadOnCloudinary(img, 'ecommerce/product-images');
                                if (uploadResult && uploadResult.secure_url) {
                                    uploadedImages.push(uploadResult.secure_url);
                                }
                            } else {
                                uploadedImages.push(img);
                            }
                        }
                        images = uploadedImages;
                    } else if (typeof images === 'string' && !images.startsWith('http')) {
                        const uploadResult = await uploadOnCloudinary(images, 'ecommerce/product-images');
                        images = uploadResult && uploadResult.secure_url ? [uploadResult.secure_url] : [];
                    }
                    productsToInsert.push({ 
                        ...item, 
                        brandId: brandId ? new mongoose.Types.ObjectId(brandId) : undefined,
                        images 
                    });
                }
                result = await Product.insertMany(productsToInsert);
                
                for (const product of result) {
                    if (product.brandId) {
                        const brand = await Brand.findById(product.brandId);
                        if (brand) {
                            brand.productCount = (brand.productCount || 0) + 1;
                            await brand.save();
                        }
                    }
                    if (Array.isArray(product.categories)) {
                        for (const catName of product.categories) {
                            const category = await Category.findOne({ name: { $regex: `^${catName}$`, $options: 'i' } });
                            if (category && !category.products.some(pid => pid.equals(product._id))) {
                                category.products.push(product._id as mongoose.Types.ObjectId);
                                await category.save();
                            }
                        }
                    }
                }
            }

            fs.unlinkSync(filePath);
            res.status(200).json({ 
                message: `Data uploaded and inserted successfully for ${type || 'product'}`, 
                inserted: result.length 
            });
        } catch (err: any) {
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ message: "Upload failed", error: err.message });
        }
    }
]; 