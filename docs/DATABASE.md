# ZYLIX — Database & Prisma Schema

**Version:** 1.0
**Status:** Draft for approval — Milestone 3 of 13
**Depends on:** [PRD.md](./PRD.md), [SITEMAP.md](./SITEMAP.md)

This schema will be placed at `apps/api/prisma/schema.prisma` when Milestone 4 scaffolds the folder structure. Database: **PostgreSQL**. ORM: **Prisma**.

---

## 1. Design Notes

- **Money is stored as `Int` in minor units is avoided** — since NGN doesn't subdivide in common UX the way USD cents do, all monetary fields use `Decimal(12,2)` for precision and simplicity, with an explicit `currency` field (defaults to `"NGN"` per launch decision) on every money-bearing entity so multi-currency remains possible later.
- **Snapshotting:** `OrderItem` stores a snapshot of product name/SKU/price at time of purchase so historical orders remain accurate if a product is later edited or deleted.
- **Soft state over hard deletes:** Users, Products, and Sellers use `status` enums rather than deletion, preserving referential integrity for orders/reviews.
- **Guest support:** `Cart` and `Order` allow a null `userId` with a `guestEmail`/`sessionId`, per the guest-checkout flow in the sitemap.
- **RBAC:** `User.role` is the coarse role (CUSTOMER / SELLER / ADMIN); admins additionally carry an `adminPermissions` array for the granular permission matrix from PRD §5.
- **Fraud & audit:** `FraudFlag` and `AuditLog` are first-class tables so Milestone 9 (Admin Dashboard) has real data to operate on, not placeholders.
- **PCI compliance:** No raw card data is ever modeled — `SavedPaymentMethod` stores only tokenized references returned by payment providers.
- **Multi-vendor-ready:** `Seller` exists and `Product`/`OrderItem` both carry `sellerId` from day one, even though Durchex D.A.M is the only active seller at launch (PRD §10).

---

## 2. Full Prisma Schema

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =========================================================
// ENUMS
// =========================================================

enum Role {
  CUSTOMER
  SELLER
  ADMIN
}

enum AdminPermission {
  SUPPORT
  CATALOG_MANAGEMENT
  SELLER_MANAGEMENT
  ORDER_MANAGEMENT
  PAYMENT_CONFIG
  FRAUD_REVIEW
  USER_MANAGEMENT
  ROLE_MANAGEMENT
  MARKETING
  CMS
  SEO
  ANALYTICS
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  PENDING_VERIFICATION
}

enum SellerStatus {
  PENDING
  APPROVED
  SUSPENDED
  REJECTED
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum AttributeType {
  SELECT
  NUMBER
  BOOLEAN
  TEXT
}

enum AddressType {
  SHIPPING
  BILLING
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum FulfillmentStatus {
  UNFULFILLED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentProvider {
  FLUTTERWAVE
  PAYSTACK
  STRIPE
  PAYPAL
  APPLE_PAY
  GOOGLE_PAY
  WALLET
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum WalletTxnType {
  CREDIT
  DEBIT
}

enum RewardTxnType {
  EARN
  REDEEM
  EXPIRE
}

enum CouponType {
  PERCENTAGE
  FIXED
}

enum ReturnStatus {
  REQUESTED
  APPROVED
  REJECTED
  RECEIVED
  REFUNDED
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

enum BannerPlacement {
  HOME_HERO
  CATEGORY_TOP
  CHECKOUT_SIDEBAR
  BLOG_SIDEBAR
}

enum FraudStatus {
  FLAGGED
  CLEARED
  CONFIRMED_FRAUD
}

enum PayoutStatus {
  PENDING
  PAID
  FAILED
}

// =========================================================
// IDENTITY & AUTH
// =========================================================

model User {
  id                String            @id @default(cuid())
  email             String            @unique
  phone             String?           @unique
  passwordHash      String
  firstName         String
  lastName          String
  role              Role              @default(CUSTOMER)
  adminPermissions  AdminPermission[] @default([])
  status            UserStatus        @default(PENDING_VERIFICATION)
  avatarUrl         String?
  emailVerifiedAt   DateTime?
  phoneVerifiedAt   DateTime?
  twoFactorEnabled  Boolean           @default(false)
  twoFactorSecret   String?
  backupCodes       String[]          @default([])
  emailVerificationTokenHash String?
  emailVerificationExpiresAt DateTime?
  passwordResetTokenHash     String?
  passwordResetExpiresAt     DateTime?
  preferredCurrency String            @default("NGN")
  preferredLocale   String            @default("en")
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  seller            Seller?
  addresses         Address[]
  refreshTokens     RefreshToken[]
  orders            Order[]
  cart              Cart?
  wishlist          Wishlist?
  compareItems      CompareItem[]
  reviews           Review[]
  wallet            Wallet?
  rewardLedger      RewardPointsLedger[]
  referralCode      ReferralCode?
  referralsMade     Referral[]        @relation("Referrer")
  referralReceived  Referral[]        @relation("Referee")
  returnRequests    ReturnRequest[]
  notifications     Notification[]
  savedPaymentMethods SavedPaymentMethod[]
  auditLogs         AuditLog[]
  couponRedemptions CouponRedemption[]
  blogPosts         BlogPost[]

  @@index([role])
}

model RefreshToken {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash  String    @unique
  userAgent  String?
  ipAddress  String?
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())

  @@index([userId])
}

// =========================================================
// SELLER
// =========================================================

model Seller {
  id             String       @id @default(cuid())
  userId         String       @unique
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  storeName      String
  storeSlug      String       @unique
  description    String?
  logoUrl        String?
  bannerUrl      String?
  status         SellerStatus @default(PENDING)
  commissionRate Decimal      @default(0) @db.Decimal(5, 2)
  payoutBankName String?
  payoutAccountNumberMasked String?
  payoutAccountRef String?    // tokenized reference from payment provider, never raw account data
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  products       Product[]
  orderItems     OrderItem[]
  payouts        SellerPayout[]
  reviews        Review[]

  @@index([status])
}

model SellerPayout {
  id          String       @id @default(cuid())
  sellerId    String
  seller      Seller       @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  amount      Decimal      @db.Decimal(12, 2)
  currency    String       @default("NGN")
  status      PayoutStatus @default(PENDING)
  method      String
  reference   String?
  periodStart DateTime
  periodEnd   DateTime
  createdAt   DateTime     @default(now())

  @@index([sellerId])
}

// =========================================================
// CATALOG
// =========================================================

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  imageUrl    String?
  isActive    Boolean    @default(true)
  sortOrder   Int        @default(0)
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]
  attributes  Attribute[]

  seoTitle       String?
  seoDescription String?

  @@index([parentId])
}

model Attribute {
  id         String          @id @default(cuid())
  name       String
  slug       String          @unique
  type       AttributeType   @default(SELECT)
  unit       String?
  categoryId String?
  category   Category?       @relation(fields: [categoryId], references: [id])
  values     AttributeValue[]

  @@index([categoryId])
}

model AttributeValue {
  id          String   @id @default(cuid())
  attributeId String
  attribute   Attribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  value       String

  productLinks ProductAttributeValue[]

  @@unique([attributeId, value])
}

model Product {
  id            String        @id @default(cuid())
  sellerId      String
  seller        Seller        @relation(fields: [sellerId], references: [id])
  categoryId    String
  category      Category      @relation(fields: [categoryId], references: [id])
  name          String
  slug          String        @unique
  brand         String
  description   String
  basePrice     Decimal       @db.Decimal(12, 2)
  compareAtPrice Decimal?     @db.Decimal(12, 2)
  currency      String        @default("NGN")
  sku           String        @unique
  status        ProductStatus @default(DRAFT)
  isFeatured    Boolean       @default(false)
  avgRating     Decimal       @default(0) @db.Decimal(3, 2)
  reviewCount   Int           @default(0)
  viewCount     Int           @default(0)
  weightKg      Decimal?      @db.Decimal(6, 2)

  seoTitle       String?
  seoDescription String?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  images        ProductImage[]
  variants      ProductVariant[]
  attributeValues ProductAttributeValue[]
  reviews       Review[]
  wishlistItems WishlistItem[]
  cartItems     CartItem[]
  orderItems    OrderItem[]
  compareItems  CompareItem[]

  @@index([categoryId])
  @@index([sellerId])
  @@index([status])
  @@index([brand])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  altText   String?
  sortOrder Int     @default(0)

  @@index([productId])
}

model ProductVariant {
  id             String  @id @default(cuid())
  productId      String
  product        Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku            String  @unique
  name           String  // e.g. "256GB / Titanium Black"
  price          Decimal @db.Decimal(12, 2)
  compareAtPrice Decimal? @db.Decimal(12, 2)
  stockQuantity  Int     @default(0)
  isDefault      Boolean @default(false)

  cartItems      CartItem[]
  orderItems     OrderItem[]
  wishlistItems  WishlistItem[]
  compareItems   CompareItem[]

  @@index([productId])
}

model ProductAttributeValue {
  id               String         @id @default(cuid())
  productId        String
  product          Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  attributeValueId String
  attributeValue   AttributeValue @relation(fields: [attributeValueId], references: [id], onDelete: Cascade)

  @@unique([productId, attributeValueId])
  @@index([attributeValueId])
}

model Review {
  id                 String       @id @default(cuid())
  productId          String
  product            Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId             String
  user               User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  sellerId           String?
  seller             Seller?      @relation(fields: [sellerId], references: [id])
  rating             Int
  title              String?
  body               String
  images             String[]     @default([])
  isVerifiedPurchase Boolean      @default(false)
  status             ReviewStatus @default(PENDING)
  createdAt          DateTime     @default(now())

  @@index([productId])
  @@index([userId])
}

// =========================================================
// CART / WISHLIST / COMPARE
// =========================================================

model Cart {
  id        String     @id @default(cuid())
  userId    String?    @unique
  user      User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId String?    @unique // for guest carts
  currency  String     @default("NGN")
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  items     CartItem[]
}

model CartItem {
  id          String          @id @default(cuid())
  cartId      String
  cart        Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId   String
  product     Product         @relation(fields: [productId], references: [id])
  variantId   String?
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  quantity    Int             @default(1)
  priceAtAdd  Decimal         @db.Decimal(12, 2)
  addedAt     DateTime        @default(now())

  @@unique([cartId, productId, variantId])
}

model Wishlist {
  id        String         @id @default(cuid())
  userId    String         @unique
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]
  createdAt DateTime       @default(now())
}

model WishlistItem {
  id         String          @id @default(cuid())
  wishlistId String
  wishlist   Wishlist        @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId  String
  product    Product         @relation(fields: [productId], references: [id])
  variantId  String?
  variant    ProductVariant? @relation(fields: [variantId], references: [id])
  addedAt    DateTime        @default(now())

  @@unique([wishlistId, productId, variantId])
}

model CompareItem {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product         @relation(fields: [productId], references: [id])
  variantId String?
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
  addedAt   DateTime        @default(now())

  @@unique([userId, productId, variantId])
}

// =========================================================
// ADDRESS
// =========================================================

model Address {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  label      String?
  fullName   String
  phone      String
  line1      String
  line2      String?
  city       String
  state      String
  country    String      @default("Nigeria")
  postalCode String?
  type       AddressType @default(SHIPPING)
  isDefault  Boolean     @default(false)
  createdAt  DateTime    @default(now())

  ordersAsShipping Order[] @relation("ShippingAddress")
  ordersAsBilling  Order[] @relation("BillingAddress")

  @@index([userId])
}

// =========================================================
// ORDERS & PAYMENTS
// =========================================================

model Order {
  id                String        @id @default(cuid())
  orderNumber       String        @unique
  userId            String?
  user              User?         @relation(fields: [userId], references: [id])
  guestEmail        String?
  status            OrderStatus   @default(PENDING)
  currency          String        @default("NGN")
  subtotal          Decimal       @db.Decimal(12, 2)
  shippingFee       Decimal       @default(0) @db.Decimal(12, 2)
  tax               Decimal       @default(0) @db.Decimal(12, 2)
  discountTotal     Decimal       @default(0) @db.Decimal(12, 2)
  total             Decimal       @db.Decimal(12, 2)
  shippingAddressId String?
  shippingAddress   Address?      @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  billingAddressId  String?
  billingAddress    Address?      @relation("BillingAddress", fields: [billingAddressId], references: [id])
  placedAt          DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  items             OrderItem[]
  payments          Payment[]
  statusHistory     OrderStatusHistory[]
  returnRequests    ReturnRequest[]
  couponRedemptions CouponRedemption[]
  giftCardTxns      GiftCardTransaction[]
  fraudFlags        FraudFlag[]
  walletTxns        WalletTransaction[]

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id                String            @id @default(cuid())
  orderId           String
  order             Order             @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId         String
  product           Product           @relation(fields: [productId], references: [id])
  variantId         String?
  variant           ProductVariant?   @relation(fields: [variantId], references: [id])
  sellerId          String
  seller            Seller            @relation(fields: [sellerId], references: [id])
  productNameSnapshot String
  skuSnapshot       String
  unitPrice         Decimal           @db.Decimal(12, 2)
  quantity          Int
  subtotal          Decimal           @db.Decimal(12, 2)
  fulfillmentStatus FulfillmentStatus @default(UNFULFILLED)

  returnItems       ReturnItem[]

  @@index([orderId])
  @@index([sellerId])
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  note      String?
  changedBy String?
  createdAt DateTime    @default(now())

  @@index([orderId])
}

model Payment {
  id           String          @id @default(cuid())
  orderId      String
  order        Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  provider     PaymentProvider
  providerRef  String?
  amount       Decimal         @db.Decimal(12, 2)
  currency     String          @default("NGN")
  status       PaymentStatus   @default(PENDING)
  rawResponse  Json?
  createdAt    DateTime        @default(now())

  @@index([orderId])
  @@index([provider])
}

model SavedPaymentMethod {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider      PaymentProvider
  providerToken String   // tokenized reference only, never raw card data
  brand         String?
  last4         String?
  expiryMonth   Int?
  expiryYear    Int?
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([userId])
}

// =========================================================
// WALLET / REWARDS / COUPONS / GIFT CARDS / REFERRALS
// =========================================================

model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance   Decimal  @default(0) @db.Decimal(12, 2)
  currency  String   @default("NGN")
  updatedAt DateTime @updatedAt

  transactions WalletTransaction[]
}

model WalletTransaction {
  id             String        @id @default(cuid())
  walletId       String
  wallet         Wallet        @relation(fields: [walletId], references: [id], onDelete: Cascade)
  type           WalletTxnType
  amount         Decimal       @db.Decimal(12, 2)
  reason         String
  referenceOrderId String?
  order          Order?        @relation(fields: [referenceOrderId], references: [id])
  createdAt      DateTime      @default(now())

  @@index([walletId])
}

model RewardPointsLedger {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  points        Int
  type          RewardTxnType
  sourceOrderId String?
  createdAt     DateTime      @default(now())

  @@index([userId])
}

model Coupon {
  id                  String    @id @default(cuid())
  code                String    @unique
  type                CouponType
  value               Decimal   @db.Decimal(12, 2)
  minOrderAmount      Decimal?  @db.Decimal(12, 2)
  maxDiscount         Decimal?  @db.Decimal(12, 2)
  usageLimit          Int?
  usageCount          Int       @default(0)
  perUserLimit        Int?
  startsAt            DateTime?
  expiresAt           DateTime?
  isActive            Boolean   @default(true)
  applicableCategoryIds String[] @default([])
  applicableProductIds  String[] @default([])
  createdAt           DateTime  @default(now())

  redemptions         CouponRedemption[]
}

model CouponRedemption {
  id              String   @id @default(cuid())
  couponId        String
  coupon          Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  discountAmount  Decimal  @db.Decimal(12, 2)
  createdAt       DateTime @default(now())

  @@index([couponId])
  @@index([userId])
}

model GiftCard {
  id             String   @id @default(cuid())
  code           String   @unique
  initialBalance Decimal  @db.Decimal(12, 2)
  currentBalance Decimal  @db.Decimal(12, 2)
  currency       String   @default("NGN")
  issuedToEmail  String?
  senderName     String?
  message        String?
  purchasedByUserId String?
  isActive       Boolean  @default(true)
  expiresAt      DateTime?
  createdAt      DateTime @default(now())

  transactions   GiftCardTransaction[]
}

model GiftCardTransaction {
  id         String   @id @default(cuid())
  giftCardId String
  giftCard   GiftCard @relation(fields: [giftCardId], references: [id], onDelete: Cascade)
  amount     Decimal  @db.Decimal(12, 2)
  type       String   // ISSUE | REDEEM
  orderId    String?
  order      Order?   @relation(fields: [orderId], references: [id])
  createdAt  DateTime @default(now())

  @@index([giftCardId])
}

model ReferralCode {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  code      String   @unique
  createdAt DateTime @default(now())
}

model Referral {
  id           String   @id @default(cuid())
  referrerId   String
  referrer     User     @relation("Referrer", fields: [referrerId], references: [id])
  refereeId    String   @unique
  referee      User     @relation("Referee", fields: [refereeId], references: [id])
  rewardIssued Boolean  @default(false)
  status       String   @default("PENDING")
  createdAt    DateTime @default(now())

  @@index([referrerId])
}

// =========================================================
// RETURNS
// =========================================================

model ReturnRequest {
  id        String       @id @default(cuid())
  orderId   String
  order     Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  userId    String
  user      User         @relation(fields: [userId], references: [id])
  status    ReturnStatus @default(REQUESTED)
  reason    String
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  items     ReturnItem[]

  @@index([orderId])
  @@index([userId])
}

model ReturnItem {
  id              String        @id @default(cuid())
  returnRequestId String
  returnRequest   ReturnRequest @relation(fields: [returnRequestId], references: [id], onDelete: Cascade)
  orderItemId     String
  orderItem       OrderItem     @relation(fields: [orderItemId], references: [id])
  quantity        Int
  condition       String?

  @@index([returnRequestId])
}

// =========================================================
// NOTIFICATIONS / CMS / MARKETING CONTENT
// =========================================================

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  body      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
}

model BlogPost {
  id             String        @id @default(cuid())
  title          String
  slug           String        @unique
  excerpt        String?
  contentHtml    String
  coverImageUrl  String?
  authorId       String
  author         User          @relation(fields: [authorId], references: [id])
  status         ContentStatus @default(DRAFT)
  publishedAt    DateTime?
  seoTitle       String?
  seoDescription String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model CmsPage {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  contentHtml    String
  seoTitle       String?
  seoDescription String?
  updatedAt      DateTime @updatedAt
}

model Banner {
  id        String          @id @default(cuid())
  title     String
  imageUrl  String
  linkUrl   String?
  placement BannerPlacement
  sortOrder Int             @default(0)
  isActive  Boolean         @default(true)
  startsAt  DateTime?
  endsAt    DateTime?
  createdAt DateTime        @default(now())
}

model NewsletterSubscriber {
  id             String    @id @default(cuid())
  email          String    @unique
  isSubscribed   Boolean   @default(true)
  subscribedAt   DateTime  @default(now())
  unsubscribedAt DateTime?
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  subject   String
  message   String
  status    String   @default("OPEN")
  createdAt DateTime @default(now())
}

// =========================================================
// FRAUD & AUDIT
// =========================================================

model FraudFlag {
  id         String      @id @default(cuid())
  orderId    String
  order      Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  riskScore  Int
  reason     String
  status     FraudStatus @default(FLAGGED)
  reviewedBy String?
  reviewedAt DateTime?
  createdAt  DateTime    @default(now())

  @@index([orderId])
  @@index([status])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  actor      User?    @relation(fields: [actorId], references: [id])
  action     String
  entityType String
  entityId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([actorId])
  @@index([entityType, entityId])
}
```

---

## 3. Entity Relationship Overview (textual ERD)

```
User ──1:1── Seller
User ──1:1── Cart
User ──1:1── Wishlist
User ──1:1── Wallet
User ──1:1── ReferralCode
User ──1:N── Address, Order, Review, Notification, ReturnRequest,
             RewardPointsLedger, SavedPaymentMethod, CompareItem,
             RefreshToken, CouponRedemption

Seller ──1:N── Product, OrderItem, SellerPayout, Review

Category ──1:N(self)── Category (parent/children)
Category ──1:N── Product
Category ──1:N── Attribute ──1:N── AttributeValue ──N:M(join)── Product

Product ──1:N── ProductImage, ProductVariant, Review,
                WishlistItem, CartItem, OrderItem, CompareItem
Product ──N:M(join: ProductAttributeValue)── AttributeValue

Cart ──1:N── CartItem ──N:1── Product/ProductVariant
Wishlist ──1:N── WishlistItem ──N:1── Product/ProductVariant

Order ──1:N── OrderItem, Payment, OrderStatusHistory,
              ReturnRequest, CouponRedemption, GiftCardTransaction,
              FraudFlag, WalletTransaction
OrderItem ──N:1── Product, ProductVariant, Seller
OrderItem ──1:N── ReturnItem

Coupon ──1:N── CouponRedemption
GiftCard ──1:N── GiftCardTransaction
Referral: User(referrer) ──1:N── Referral ──1:1── User(referee)

FraudFlag ──N:1── Order
AuditLog ──N:1── User (actor, nullable for system actions)
```

---

## 4. Indexing & Performance Notes

- Foreign keys are indexed (`categoryId`, `sellerId`, `userId`, `orderId`, etc.) to keep dashboard/list queries (Admin, Seller, Customer) fast.
- `Product.status` and `Order.status` are indexed since both storefront queries and dashboards filter heavily by status.
- Full-text/AI search (Milestone 7/8) will layer on top of `Product` via a search index (e.g. Postgres `tsvector` column or an external search service) — not modeled as a separate table here since it's a derived index, not source-of-truth data.
- Redis sits in front of this schema for session storage, hot product/category reads, and cart caching — it does not have its own "schema" beyond key conventions, which will be documented in Milestone 8 (Backend APIs).

---

## 5. Open Item for Approval

None blocking. Flag any entity that's missing (e.g. if you want a Q&A/product-questions feature, or in-house shipping/logistics tracking beyond order status) before Milestone 4 scaffolds the physical repo structure — schema changes are cheapest before folders and migrations exist.

---

**Approval required to proceed to Milestone 4: Folder Structure.**
