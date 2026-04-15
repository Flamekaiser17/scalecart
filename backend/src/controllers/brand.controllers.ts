import { Request, Response } from "express";
import prisma from "../db/prisma.js";
import apiResponse from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";

export const getBrands = async (req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" }
    });
    
    // Normalize _id for frontend compatibility
    const normalized = brands.map(b => ({ ...b, _id: b.id }));
    
    res.status(200).json(new apiResponse(200, normalized, "Brands fetched successfully"));
  } catch (err: any) {
    res.status(500).json(new apiError(500, err.message));
  }
};

export const createBrand = async (req: Request, res: Response) => {
  try {
    const { name, logo } = req.body;
    if (!name) return res.status(400).json(new apiError(400, "Name is required"));

    const exists = await prisma.brand.findFirst({
      where: { name: { equals: name, mode: "insensitive" } }
    });
    
    if (exists) return res.status(409).json(new apiError(409, "Brand already exists"));

    const brand = await prisma.brand.create({
      data: { name, logo }
    });
    
    res.status(201).json(new apiResponse(201, brand, "Brand created successfully"));
  } catch (err: any) {
    res.status(500).json(new apiError(500, err.message));
  }
};

export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const brand = await prisma.brand.delete({ where: { id: req.params.id } });
    res.status(200).json(new apiResponse(200, brand, "Brand deleted successfully"));
  } catch (err: any) {
    res.status(500).json(new apiError(500, err.message));
  }
};

export const getBrandById = async (req: Request, res: Response) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (!brand) return res.status(404).json(new apiError(404, "Brand not found"));
    res.status(200).json(new apiResponse(200, { ...brand, _id: brand.id }, "Brand fetched successfully"));
  } catch (err: any) {
    res.status(500).json(new apiError(500, err.message));
  }
};

export const updateBrand = async (req: Request, res: Response) => {
  try {
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.status(200).json(new apiResponse(200, brand, "Brand updated successfully"));
  } catch (err: any) {
    res.status(500).json(new apiError(500, err.message));
  }
};

export const getBrandsByCategory = async (req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        products: {
          some: {
            categoryId: req.params.categoryId
          }
        }
      }
    });
    const normalized = brands.map(b => ({ ...b, _id: b.id }));
    res.status(200).json(new apiResponse(200, normalized, "Brands fetched by category"));
  } catch (err: any) {
    res.status(500).json(new apiError(500, err.message));
  }
};

export const searchBrands = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const brands = await prisma.brand.findMany({
      where: { name: { contains: String(q), mode: "insensitive" } }
    });
    const normalized = brands.map(b => ({ ...b, _id: b.id }));
    res.status(200).json(new apiResponse(200, normalized, "Brands searched successfully"));
  } catch (err: any) {
    res.status(500).json(new apiError(500, err.message));
  }
};