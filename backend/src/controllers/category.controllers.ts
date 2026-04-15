import { Request, Response } from "express";
import prisma from "../db/prisma.js";
import apiResponse from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import { getCache, setCache, deleteCache } from "../utils/redis.js";

const CATEGORIES_CACHE_KEY = "categories:all";
const CATEGORIES_CACHE_TTL = 3600;

// ─── GET ALL CATEGORIES ───────────────────────────────────────────────────────
export const getCategories = async (req: Request, res: Response) => {
  try {
    const cached = await getCache(CATEGORIES_CACHE_KEY);
    if (cached) {
      console.log("Cache HIT: categories:all");
      return res.status(200).json(new apiResponse(200, cached, "Categories fetched (cached)"));
    }

    console.log("Cache MISS: categories:all — fetching from PostgreSQL");
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
    });

    // Normalize _id for frontend compatibility
    const normalized = categories.map((c) => ({ ...c, _id: c.id }));

    await setCache(CATEGORIES_CACHE_KEY, normalized, CATEGORIES_CACHE_TTL);
    return res.status(200).json(new apiResponse(200, normalized, "Categories fetched successfully"));
  } catch (err: any) {
    return res.status(500).json(new apiError(500, err.message));
  }
};

// ─── GET CATEGORY BY ID ───────────────────────────────────────────────────────
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!category) return res.status(404).json(new apiError(404, "Category not found"));
    return res.status(200).json(new apiResponse(200, category, "Category fetched successfully"));
  } catch (err: any) {
    return res.status(500).json(new apiError(500, err.message));
  }
};

// ─── CREATE CATEGORY ──────────────────────────────────────────────────────────
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const existing = await prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    if (existing) return res.status(409).json(new apiError(409, "Category already exists"));

    const category = await prisma.category.create({ data: { name, icon } });
    await deleteCache(CATEGORIES_CACHE_KEY);
    return res.status(201).json(new apiResponse(201, category, "Category created successfully"));
  } catch (err: any) {
    return res.status(500).json(new apiError(500, err.message));
  }
};

// ─── UPDATE CATEGORY ──────────────────────────────────────────────────────────
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    await deleteCache(CATEGORIES_CACHE_KEY);
    return res.status(200).json(new apiResponse(200, category, "Category updated successfully"));
  } catch (err: any) {
    return res.status(500).json(new apiError(500, err.message));
  }
};

// ─── DELETE CATEGORY ──────────────────────────────────────────────────────────
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.delete({ where: { id: req.params.id } });
    await deleteCache(CATEGORIES_CACHE_KEY);
    return res.status(200).json(new apiResponse(200, category, "Category deleted successfully"));
  } catch (err: any) {
    return res.status(500).json(new apiError(500, err.message));
  }
};