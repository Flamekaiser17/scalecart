import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to PostgreSQL database...");

  // Wipe existing data for clean reseed
  console.log("Wiping old data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  console.log("Fetching 100 products from DummyJSON...");
  const response = await fetch("https://dummyjson.com/products?limit=100");
  if (!response.ok) throw new Error(`DummyJSON responded with ${response.status}`);
  const json = await response.json();
  const raw: any[] = json.products;
  console.log(`   → Received ${raw.length} products`);

  // Map DummyJSON category slugs → clean display names
  // IMPORTANT: These must match EXACTLY the names used in Navbar.jsx options
  const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
    "smartphones":             "Mobile Accessories",
    "laptops":                 "Laptops",
    "furniture":               "Furniture",
    "beauty":                  "Beauty",
    "fragrances":              "Fragrances",
    "groceries":               "Groceries",
    "home-decoration":         "Home Decoration",
    "kitchen-accessories":     "Kitchen Accessories",
    "mens-shirts":             "Men's Fashion",
    "mens-shoes":              "Men's Shoes",
    "mens-watches":            "Mens Watches",
    "womens-dresses":          "Women Dresses",
    "womens-shoes":            "Women's Shoes",
    "womens-watches":          "Womens Watches",
    "womens-bags":             "Women's Fashion",
    "womens-jewellery":        "Women's Fashion",
    "sunglasses":              "Clothing",
    "tops":                    "Clothing",
    "vehicle":                 "Electronics",
    "motorcycle":              "Electronics",
    "sports-accessories":      "Sports Equipments",
    "skin-care":               "Beauty",
    "tablets":                 "Electronics",
  };

  // ─────────────── CATEGORIES ───────────────
  const uniqueCatSlugs: string[] = [...new Set(raw.map((p: any) => p.category))];
  console.log(`Creating ${uniqueCatSlugs.length} categories...`);
  
  const savedCategories = await Promise.all(
    uniqueCatSlugs.map(async (slug) => {
      return await prisma.category.create({
        data: {
          name: CATEGORY_DISPLAY_NAMES[slug] || slug,
          icon: "box",
        }
      });
    })
  );

  // ─────────────── BRANDS ───────────────
  const uniqueBrandNames: string[] = [...new Set(raw.map((p: any) => p.brand || "Generic Brand"))];
  console.log(`Creating ${uniqueBrandNames.length} brands...`);
  
  const savedBrands = await Promise.all(
    uniqueBrandNames.map(async (brandName) => {
      return await prisma.brand.create({
        data: {
          name: brandName,
          productCount: 0,
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=2874f0&color=fff&size=100`,
        }
      });
    })
  );

  // ─────────────── TRANSFORM & INSERT PRODUCTS ───────────────
  console.log("Transforming and inserting DummyJSON data → Prisma...");
  
  for (const item of raw) {
    const catSlug = item.category;
    const brandName = item.brand || "Generic Brand";

    const matchedCategory = savedCategories.find(c => c.name === (CATEGORY_DISPLAY_NAMES[catSlug] || catSlug));
    const matchedBrand = savedBrands.find(b => b.name === brandName);

    if (!matchedCategory || !matchedBrand) continue;

    // Merge thumbnail + images
    const allImages: string[] = [
      ...(item.thumbnail ? [item.thumbnail] : []),
      ...(item.images || []),
    ];
    const uniqueImages = [...new Set(allImages)];

    await prisma.product.create({
      data: {
        name:        item.title,
        description: item.description,
        price:       Math.round(item.price * 83),
        discount:    Math.round(item.discountPercentage) || 0,
        stock:       item.stock,
        rating:      item.rating,
        categoryId:  matchedCategory.id,
        brandId:     matchedBrand.id,
        // Relation write: Create images within the Product Image table
        images: {
          create: uniqueImages.map(img => ({ url: img }))
        }
      }
    });
  }

  console.log("\nPostgreSQL Database Successfully Seeded with 100 products from DummyJSON via Prisma!");
}

main()
  .catch((e) => {
    console.error("Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
