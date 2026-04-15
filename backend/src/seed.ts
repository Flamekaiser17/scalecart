import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.models.js";
import Category from "./models/category.models.js";
import Brand from "./models/brand.models.js";

dotenv.config();

// Map DummyJSON category slugs → clean display names
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  "smartphones":             "Smartphones",
  "laptops":                 "Laptops",
  "tablets":                 "Tablets",
  "mobile-accessories":      "Mobile Accessories",
  "furniture":               "Furniture",
  "home-decoration":         "Home Decor",
  "kitchen-accessories":     "Kitchen",
  "beauty":                  "Beauty",
  "fragrances":              "Fragrances",
  "skin-care":               "Skin Care",
  "groceries":               "Groceries",
  "sports-accessories":      "Sports",
  "vehicle":                 "Vehicles",
  "mens-shirts":             "Men's Fashion",
  "mens-shoes":              "Men's Shoes",
  "mens-watches":            "Men's Watches",
  "womens-bags":             "Women's Bags",
  "womens-dresses":          "Women's Fashion",
  "womens-jewellery":        "Jewellery",
  "womens-shoes":            "Women's Shoes",
  "womens-watches":          "Women's Watches",
  "sunglasses":              "Sunglasses",
  "tops":                    "Tops",
};

const seedDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URL;
    if (!MONGO_URI) throw new Error("No MONGODB_URL found in .env");

    console.log("⏳ Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Database Connected.");

    // Wipe existing data for a clean reseed every run
    console.log("🗑️  Wiping old Products, Categories, Brands...");
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();

    // ─────────────── FETCH 100 PRODUCTS ───────────────
    console.log("📡 Fetching 100 products from DummyJSON...");
    const response = await fetch("https://dummyjson.com/products?limit=100");
    if (!response.ok) throw new Error(`DummyJSON responded with ${response.status}`);
    const json = await response.json();
    const raw: any[] = json.products;
    console.log(`   → Received ${raw.length} products`);

    // ─────────────── CATEGORIES ───────────────
    // Collect unique category slugs from the fetched products
    const uniqueCatSlugs: string[] = [...new Set(raw.map((p: any) => p.category))];

    console.log(`📁 Creating ${uniqueCatSlugs.length} categories...`);
    const savedCategories = await Promise.all(
      uniqueCatSlugs.map((slug) =>
        Category.create({
          name: CATEGORY_DISPLAY_NAMES[slug] || slug,   // human-readable name
          icon: "box",                                   // generic icon placeholder
        })
      )
    );

    // ─────────────── BRANDS ───────────────
    const uniqueBrandNames: string[] = [
      ...new Set(raw.map((p: any) => p.brand || "Generic Brand")),
    ];

    console.log(`🏷️  Creating ${uniqueBrandNames.length} brands...`);
    const savedBrands = await Promise.all(
      uniqueBrandNames.map((brandName) =>
        Brand.create({
          name: brandName,
          productCount: 0,
          // Placeholder logo — no Cloudinary needed for dev
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=2874f0&color=fff&size=100`,
        })
      )
    );

    // ─────────────── TRANSFORM ───────────────
    console.log("🔄 Transforming DummyJSON data → ScaleCart schema...");
    const transformedProducts = raw.map((item: any) => {
      const catSlug   = item.category;
      const brandName = item.brand || "Generic Brand";

      // Resolve real ObjectIds from our saved documents
      const matchedCategory = savedCategories.find(
        (c) => c.name === (CATEGORY_DISPLAY_NAMES[catSlug] || catSlug)
      );
      const matchedBrand = savedBrands.find((b) => b.name === brandName);

      // Merge thumbnail + images array, deduplicate, ensure ≥1 image
      const allImages: string[] = [
        ...(item.thumbnail ? [item.thumbnail] : []),
        ...(item.images || []),
      ];
      // Remove duplicates (thumbnail is sometimes same as images[0])
      const uniqueImages = [...new Set(allImages)];

      return {
        name:        item.title,
        description: item.description,
        price:       Math.round(item.price * 83),
        discount:    Math.round(item.discountPercentage) || 0,
        stock:       item.stock,
        rating:      item.rating,
        images:      uniqueImages,          // now has thumbnail + all images
        categoryId:  matchedCategory?._id,
        brandId:     matchedBrand?._id,
        reviews:     [],
      };
    });

    // ─────────────── INSERT ───────────────
    console.log(`📥 Inserting ${transformedProducts.length} products into MongoDB...`);
    await Product.insertMany(transformedProducts);

    // Print a quick category breakdown
    const breakdown: Record<string, number> = {};
    raw.forEach((p: any) => {
      const label = CATEGORY_DISPLAY_NAMES[p.category] || p.category;
      breakdown[label] = (breakdown[label] || 0) + 1;
    });
    console.log("\n📊 Category breakdown:");
    Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => console.log(`   ${cat.padEnd(25)} → ${count} products`));

    console.log("\n🎉 Database Successfully Seeded with 100 products from DummyJSON!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
