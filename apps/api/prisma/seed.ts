import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const hash = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

const CATEGORIES = [
  { name: "Smartphones", slug: "smartphones", description: "Flagship and mid-range smartphones." },
  { name: "Laptops", slug: "laptops", description: "Laptops for work, creativity, and everyday use." },
  { name: "Gaming", slug: "gaming", description: "Consoles, gaming laptops, and accessories." },
  { name: "Smartwatches", slug: "smartwatches", description: "Smartwatches and fitness wearables." },
  { name: "Accessories", slug: "accessories", description: "Audio, input devices, and charging accessories." },
  { name: "Home Electronics", slug: "home-electronics", description: "TVs and appliances for the home." },
] as const;

type CategorySlug = (typeof CATEGORIES)[number]["slug"];

interface SeedVariant {
  name: string;
  skuSuffix: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  isDefault?: boolean;
}

interface SeedProduct {
  category: CategorySlug;
  name: string;
  brand: string;
  skuBase: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  isFeatured?: boolean;
  variants: SeedVariant[];
}

const IMAGE_BY_CATEGORY: Record<CategorySlug, string> = {
  smartphones: "/seed/smartphones.svg",
  laptops: "/seed/laptops.svg",
  gaming: "/seed/gaming.svg",
  smartwatches: "/seed/smartwatches.svg",
  accessories: "/seed/accessories.svg",
  "home-electronics": "/seed/home-electronics.svg",
};

const PRODUCTS: SeedProduct[] = [
  {
    category: "smartphones",
    name: "ZYLIX Aria 16 Pro",
    brand: "Aria",
    skuBase: "ARIA16PRO",
    description:
      "A flagship smartphone with a titanium frame, pro-grade camera system, and all-day battery life.",
    basePrice: 1_850_000,
    compareAtPrice: 1_999_000,
    isFeatured: true,
    variants: [
      { name: "256GB / Titanium Black", skuSuffix: "256-BLK", price: 1_850_000, stockQuantity: 18, isDefault: true },
      { name: "512GB / Titanium Black", skuSuffix: "512-BLK", price: 2_150_000, stockQuantity: 9 },
      { name: "256GB / Desert Gold", skuSuffix: "256-GLD", price: 1_850_000, stockQuantity: 12 },
    ],
  },
  {
    category: "smartphones",
    name: "Nova Galaxy X30 Ultra",
    brand: "Nova",
    skuBase: "NOVAX30ULT",
    description: "A large-screen Android flagship with a 200MP camera and S Pen support.",
    basePrice: 1_650_000,
    variants: [
      { name: "256GB / Phantom Grey", skuSuffix: "256-GRY", price: 1_650_000, stockQuantity: 15, isDefault: true },
      { name: "512GB / Phantom Grey", skuSuffix: "512-GRY", price: 1_890_000, stockQuantity: 7 },
    ],
  },
  {
    category: "smartphones",
    name: "Pixel Halo 9 Pro",
    brand: "Halo",
    skuBase: "HALO9PRO",
    description: "A clean-software smartphone with computational photography and a bright OLED display.",
    basePrice: 1_320_000,
    isFeatured: true,
    variants: [
      { name: "128GB / Obsidian", skuSuffix: "128-OBS", price: 1_320_000, stockQuantity: 20, isDefault: true },
      { name: "256GB / Obsidian", skuSuffix: "256-OBS", price: 1_480_000, stockQuantity: 11 },
    ],
  },
  {
    category: "laptops",
    name: "ZYLIX Aria Book Pro 16\"",
    brand: "Aria",
    skuBase: "ARIABOOKPRO16",
    description: "A 16-inch professional laptop with a high-efficiency chip, built for creators and developers.",
    basePrice: 3_200_000,
    compareAtPrice: 3_450_000,
    isFeatured: true,
    variants: [
      { name: "512GB / 16GB RAM / Space Grey", skuSuffix: "512-16-GRY", price: 3_200_000, stockQuantity: 10, isDefault: true },
      { name: "1TB / 32GB RAM / Space Grey", skuSuffix: "1TB-32-GRY", price: 3_950_000, stockQuantity: 5 },
    ],
  },
  {
    category: "laptops",
    name: "Meridian XPS 15",
    brand: "Meridian",
    skuBase: "MERIDXPS15",
    description: "A 15-inch ultrabook with a near-borderless display and premium aluminum chassis.",
    basePrice: 2_450_000,
    variants: [
      { name: "512GB / 16GB RAM", skuSuffix: "512-16", price: 2_450_000, stockQuantity: 14, isDefault: true },
    ],
  },
  {
    category: "laptops",
    name: "Vantage Spectre x360",
    brand: "Vantage",
    skuBase: "VANTSPEC360",
    description: "A convertible 2-in-1 laptop with a touch display and stylus support.",
    basePrice: 1_980_000,
    variants: [
      { name: "512GB / 16GB RAM / Nightfall Black", skuSuffix: "512-16-BLK", price: 1_980_000, stockQuantity: 13, isDefault: true },
    ],
  },
  {
    category: "gaming",
    name: "ZYLIX PlayStation 5 Pro",
    brand: "Sonex",
    skuBase: "SONEXPS5PRO",
    description: "A high-performance gaming console with ray tracing and ultra-fast SSD storage.",
    basePrice: 950_000,
    isFeatured: true,
    variants: [
      { name: "2TB / Standard Edition", skuSuffix: "2TB-STD", price: 950_000, stockQuantity: 16, isDefault: true },
    ],
  },
  {
    category: "gaming",
    name: "Xtreme Series Console X",
    brand: "Xtreme",
    skuBase: "XTREMESERIESX",
    description: "A powerful console built for 4K gaming with a vast game library.",
    basePrice: 890_000,
    variants: [
      { name: "1TB / Standard Edition", skuSuffix: "1TB-STD", price: 890_000, stockQuantity: 19, isDefault: true },
    ],
  },
  {
    category: "gaming",
    name: "ROGUE Strix Gaming Laptop 17\"",
    brand: "Rogue",
    skuBase: "ROGUESTRIX17",
    description: "A 17-inch gaming laptop with a high refresh-rate display and discrete graphics.",
    basePrice: 2_750_000,
    compareAtPrice: 2_980_000,
    variants: [
      { name: "1TB / 32GB RAM / RTX-class GPU", skuSuffix: "1TB-32-GPU", price: 2_750_000, stockQuantity: 6, isDefault: true },
    ],
  },
  {
    category: "smartwatches",
    name: "ZYLIX Aria Watch Ultra 2",
    brand: "Aria",
    skuBase: "ARIAWATCHULT2",
    description: "A rugged titanium smartwatch with multi-day battery life and precision GPS.",
    basePrice: 620_000,
    isFeatured: true,
    variants: [
      { name: "49mm / Titanium / Ocean Band", skuSuffix: "49-TI-OCN", price: 620_000, stockQuantity: 17, isDefault: true },
      { name: "49mm / Titanium / Trail Band", skuSuffix: "49-TI-TRL", price: 620_000, stockQuantity: 9 },
    ],
  },
  {
    category: "smartwatches",
    name: "Nova Galaxy Watch 7",
    brand: "Nova",
    skuBase: "NOVAWATCH7",
    description: "An Android-companion smartwatch with advanced health tracking.",
    basePrice: 380_000,
    variants: [
      { name: "44mm / Graphite", skuSuffix: "44-GPH", price: 380_000, stockQuantity: 22, isDefault: true },
    ],
  },
  {
    category: "smartwatches",
    name: "Summit Fenix 8",
    brand: "Summit",
    skuBase: "SUMMITFENIX8",
    description: "An adventure-ready GPS watch with solar charging and multi-sport tracking.",
    basePrice: 540_000,
    variants: [
      { name: "47mm / Carbon Grey", skuSuffix: "47-CGY", price: 540_000, stockQuantity: 10, isDefault: true },
    ],
  },
  {
    category: "accessories",
    name: "Sonex Wave XM6 Headphones",
    brand: "Sonex",
    skuBase: "SONEXWAVEXM6",
    description: "Industry-leading noise-cancelling over-ear headphones with 30-hour battery life.",
    basePrice: 285_000,
    compareAtPrice: 320_000,
    isFeatured: true,
    variants: [
      { name: "Midnight Black", skuSuffix: "BLK", price: 285_000, stockQuantity: 25, isDefault: true },
      { name: "Platinum Silver", skuSuffix: "SLV", price: 285_000, stockQuantity: 14 },
    ],
  },
  {
    category: "accessories",
    name: "VoltCore 20000mAh Power Bank",
    brand: "VoltCore",
    skuBase: "VOLTCORE20K",
    description: "A high-capacity fast-charging power bank for phones, tablets, and laptops.",
    basePrice: 45_000,
    variants: [
      { name: "20000mAh / Black", skuSuffix: "20K-BLK", price: 45_000, stockQuantity: 40, isDefault: true },
    ],
  },
  {
    category: "accessories",
    name: "Logix MX Master 4 Mouse",
    brand: "Logix",
    skuBase: "LOGIXMXM4",
    description: "A precision wireless mouse designed for productivity and multi-device workflows.",
    basePrice: 95_000,
    variants: [
      { name: "Graphite", skuSuffix: "GPH", price: 95_000, stockQuantity: 30, isDefault: true },
    ],
  },
  {
    category: "home-electronics",
    name: "ZYLIX Aria 55\" OLED TV",
    brand: "Aria",
    skuBase: "ARIAOLED55",
    description: "A 55-inch OLED television with perfect blacks and a cinematic sound system.",
    basePrice: 1_450_000,
    compareAtPrice: 1_650_000,
    isFeatured: true,
    variants: [
      { name: "55-inch / Wall Mount Bundle", skuSuffix: "55-WALL", price: 1_450_000, stockQuantity: 8, isDefault: true },
      { name: "55-inch / Standalone", skuSuffix: "55-STD", price: 1_380_000, stockQuantity: 12 },
    ],
  },
  {
    category: "home-electronics",
    name: "AeroTech V15 Cordless Vacuum",
    brand: "AeroTech",
    skuBase: "AEROV15",
    description: "A powerful cordless vacuum with laser dust detection and a 60-minute runtime.",
    basePrice: 385_000,
    variants: [
      { name: "Standard", skuSuffix: "STD", price: 385_000, stockQuantity: 16, isDefault: true },
    ],
  },
  {
    category: "home-electronics",
    name: "HearthPro Multi-Cooker",
    brand: "HearthPro",
    skuBase: "HEARTHPROMC",
    description: "A multi-function electric cooker for pressure cooking, slow cooking, and more.",
    basePrice: 125_000,
    variants: [
      { name: "8L / Stainless Steel", skuSuffix: "8L-SS", price: 125_000, stockQuantity: 24, isDefault: true },
    ],
  },
];

async function main() {
  console.log("Seeding ZYLIX demo data...");

  const categoryBySlug = new Map<CategorySlug, string>();
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoryBySlug.set(category.slug, record.id);
  }
  console.log(`Categories: ${categoryBySlug.size}`);

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@zylix.africa" },
    update: {},
    create: {
      email: "seller@zylix.africa",
      passwordHash: await hash("Password123!"),
      firstName: "Durchex",
      lastName: "Store",
      role: "SELLER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      storeName: "zeylixstore",
      storeSlug: "zeylixstore",
      description: "The official ZYLIX store, powered by Durchex D.A.M Company LTD.",
      status: "APPROVED",
      commissionRate: 0,
    },
  });
  console.log(`Seller: ${seller.storeName}`);

  await prisma.user.upsert({
    where: { email: "admin@zylix.africa" },
    update: {},
    create: {
      email: "admin@zylix.africa",
      passwordHash: await hash("Password123!"),
      firstName: "Zylix",
      lastName: "Admin",
      role: "ADMIN",
      adminPermissions: ["SUPER_ADMIN"],
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@zylix.africa" },
    update: {},
    create: {
      email: "customer@zylix.africa",
      passwordHash: await hash("Password123!"),
      firstName: "Ada",
      lastName: "Customer",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  console.log("Demo accounts: admin@zylix.africa, seller@zylix.africa, customer@zylix.africa (all Password123!)");

  let productCount = 0;
  for (const p of PRODUCTS) {
    const categoryId = categoryBySlug.get(p.category)!;
    const slug = p.name
      .toLowerCase()
      .replace(/["']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        sellerId: seller.id,
        categoryId,
        name: p.name,
        slug,
        brand: p.brand,
        description: p.description,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        currency: "NGN",
        sku: p.skuBase,
        status: "ACTIVE",
        isFeatured: p.isFeatured ?? false,
        images: {
          create: [
            { url: IMAGE_BY_CATEGORY[p.category], altText: p.name, sortOrder: 0 },
          ],
        },
        variants: {
          create: p.variants.map((v) => ({
            sku: `${p.skuBase}-${v.skuSuffix}`,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            stockQuantity: v.stockQuantity,
            isDefault: v.isDefault ?? false,
          })),
        },
      },
    });
    productCount += 1;
  }
  console.log(`Products: ${productCount}`);

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
