import { Request, Response } from "express";
import prisma from "../db/prisma.js";
import { getCache, setCache, deleteCache, deleteCachePattern } from "../utils/redis.js";
import apiResponse from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const PRODUCT_CACHE_TTL = 1800;
const PRODUCTS_CACHE_TTL = 3600;

// ─── GET ALL PRODUCTS (Search, Filter, Pagination, Redis Cache) ───────────────
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, page = 1, limit = 10 } = req.query;
  const cacheKey = `products:${JSON.stringify(req.query)}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`);
    return res.status(200).json(new apiResponse(200, cached, "Products fetched (cached)"));
  }

  console.log(`Cache MISS: ${cacheKey} — fetching from PostgreSQL`);

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  
  if (search) {
    let rawSearch = search as string;
    let priceFilter: any = null;

    // NLP Intent parsing for price filters (e.g., "laptop under 100000" or "shoes above 500")
    const underMatch = rawSearch.match(/(.*?)\s+(?:under|below|less than)\s+₹?(\d+)/i);
    const aboveMatch = rawSearch.match(/(.*?)\s+(?:above|over|greater than|more than)\s+₹?(\d+)/i);
    const betweenMatch = rawSearch.match(/(.*?)\s+(?:between)\s+₹?(\d+)\s+and\s+₹?(\d+)/i);

    if (betweenMatch) {
      rawSearch = betweenMatch[1].trim();
      priceFilter = { gte: Number(betweenMatch[2]), lte: Number(betweenMatch[3]) };
    } else if (underMatch) {
      rawSearch = underMatch[1].trim();
      priceFilter = { lte: Number(underMatch[2]) };
    } else if (aboveMatch) {
      rawSearch = aboveMatch[1].trim();
      priceFilter = { gte: Number(aboveMatch[2]) };
    }

    // Replace the search query text but only if there is a remaining product term
    if (rawSearch) {
      where.name = { contains: rawSearch, mode: "insensitive" };
    }
    
    // Apply parsed price boundaries to Prisma query
    if (priceFilter) {
      where.price = priceFilter;
    }
  }

  if (category) {
    where.categoryId = category as string;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        images: { select: { url: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  // Normalize: flatten images array to match frontend expectation
  const normalized = products.map((p) => ({
    ...p,
    _id: p.id,
    brandId: p.brand,
    categoryId: p.category,
    images: p.images.map((img) => img.url),
  }));

  const payload = {
    products: normalized,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      pageSize: Number(limit),
    },
  };

  await setCache(cacheKey, payload, PRODUCTS_CACHE_TTL);
  return res.status(200).json(new apiResponse(200, payload, "Products fetched successfully"));
});

// ─── GET SINGLE PRODUCT ───────────────────────────────────────────────────────
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `product:${req.params.id}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`);
    return res.status(200).json(new apiResponse(200, cached, "Product fetched (cached)"));
  }

  console.log(`Cache MISS: ${cacheKey} — fetching from PostgreSQL`);

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      images: { select: { url: true } },
    },
  });

  if (!product) return res.status(404).json(new apiError(404, "Product not found"));

  const normalized = {
    ...product,
    _id: product.id,
    brandId: product.brand,
    categoryId: product.category,
    images: product.images.map((img) => img.url),
  };

  await setCache(cacheKey, normalized, PRODUCT_CACHE_TTL);
  return res.status(200).json(new apiResponse(200, normalized, "Product fetched successfully"));
});

// ─── CREATE PRODUCT ───────────────────────────────────────────────────────────
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, price, discount, brandId, categoryId, stock, images } = req.body;

  if (!name || !description || !price || !brandId || !categoryId || !stock) {
    return res.status(400).json(new apiError(400, "Missing required fields"));
  }

  const imageList: string[] = Array.isArray(images)
    ? images
    : typeof images === "string"
    ? images.split(",").map((s: string) => s.trim())
    : [];

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: Number(price),
      discount: Number(discount) || 0,
      stock: Number(stock),
      brandId,
      categoryId,
      images: {
        create: imageList.map((url) => ({ url })),
      },
    },
    include: { images: true },
  });

  await deleteCachePattern("products:*");
  return res.status(201).json(new apiResponse(201, product, "Product created successfully"));
});

// ─── UPDATE PRODUCT ───────────────────────────────────────────────────────────
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, discount, stock } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(price && { price: Number(price) }),
      ...(discount !== undefined && { discount: Number(discount) }),
      ...(stock !== undefined && { stock: Number(stock) }),
    },
  });

  await deleteCachePattern("products:*");
  await deleteCache(`product:${id}`);
  return res.status(200).json(new apiResponse(200, product, "Product updated successfully"));
});

// ─── DELETE PRODUCT ───────────────────────────────────────────────────────────
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.delete({ where: { id } });

  await deleteCachePattern("products:*");
  await deleteCache(`product:${id}`);
  return res.status(200).json(new apiResponse(200, product, "Product deleted successfully"));
});
