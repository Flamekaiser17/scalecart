import multer from "multer";
import fs from "fs";
import { Request, Response } from "express";
import prisma from "../db/prisma.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
            let insertedCount = 0;

            if (type === 'brand') {
                const result = await prisma.brand.createMany({
                    data: data.map((item: any) => ({
                        name: item.name,
                        logo: item.logo,
                        productCount: item.productCount || 0
                    })),
                    skipDuplicates: true
                });
                insertedCount = result.count;
            } else if (type === 'category') {
                for (const item of data) {
                    let icon = item.icon;
                    if (typeof icon === 'string' && !icon.startsWith('http')) {
                        const uploadResult = await uploadOnCloudinary(icon, 'ecommerce/category-icons');
                        if (uploadResult && uploadResult.secure_url) {
                            icon = uploadResult.secure_url;
                        }
                    }
                    await prisma.category.upsert({
                        where: { name: item.name },
                        update: { icon: icon },
                        create: {
                            name: item.name,
                            icon: icon
                        }
                    });
                    insertedCount++;
                }
            } else {
                // Products
                for (const item of data) {
                    // Resolve Brand ID
                    let brandId = item.brandId;
                    if (!brandId && item.brandName) {
                        const brand = await prisma.brand.findFirst({
                            where: { name: { equals: item.brandName, mode: 'insensitive' } }
                        });
                        if (brand) brandId = brand.id;
                    }

                    // Resolve Category ID
                    let categoryId = item.categoryId;
                    if (!categoryId && item.categoryName) {
                        const category = await prisma.category.findFirst({
                            where: { name: { equals: item.categoryName, mode: 'insensitive' } }
                        });
                        if (category) categoryId = category.id;
                    }

                    if (!categoryId) {
                        console.warn(`Skipping product "${item.name}": Category not found.`);
                        continue;
                    }

                    let images = item.images;
                    const imageList: { url: string }[] = [];
                    if (Array.isArray(images)) {
                        for (let img of images) {
                            if (typeof img === 'string' && !img.startsWith('http')) {
                                const uploadResult = await uploadOnCloudinary(img, 'ecommerce/product-images');
                                if (uploadResult && uploadResult.secure_url) {
                                    imageList.push({ url: uploadResult.secure_url });
                                }
                            } else {
                                imageList.push({ url: img });
                            }
                        }
                    } else if (typeof images === 'string' && !images.startsWith('http')) {
                        const uploadResult = await uploadOnCloudinary(images, 'ecommerce/product-images');
                        if (uploadResult && uploadResult.secure_url) {
                            imageList.push({ url: uploadResult.secure_url });
                        }
                    } else if (typeof images === 'string') {
                        imageList.push({ url: images });
                    }

                    // Create product and relate images
                    const product = await prisma.product.create({
                        data: {
                            name: item.name,
                            description: item.description,
                            price: Number(item.price),
                            discount: Number(item.discount) || 0,
                            stock: Number(item.stock),
                            categoryId: categoryId,
                            brandId: brandId || "", // Ensure this is not null if your schema requires it
                            rating: item.rating || 0,
                            images: {
                                create: imageList
                            }
                        }
                    });

                    // Update brand product count
                    if (brandId) {
                        await prisma.brand.update({
                            where: { id: brandId },
                            data: { productCount: { increment: 1 } }
                        });
                    }
                    insertedCount++;
                }
            }

            fs.unlinkSync(filePath);
            res.status(200).json({ 
                message: `Data uploaded and inserted successfully for ${type || 'product'}`, 
                inserted: insertedCount 
            });
        } catch (err: any) {
            console.error("Upload error:", err);
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ message: "Upload failed", error: err.message });
        }
    }
];