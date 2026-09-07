import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel, ref } from "./base";
import {
  BANNER_PLACEMENTS,
  CONTENT_STATUSES,
  FRAUD_STATUSES,
  RETURN_STATUSES,
  type BannerPlacement,
  type ContentStatus,
  type FraudStatus,
  type ReturnStatus,
} from "./enums";

export interface ReturnRequestDoc {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  status: ReturnStatus;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const returnRequestSchema = new Schema<ReturnRequestDoc>(
  {
    orderId: ref("Order", { required: true, index: true }),
    userId: ref("User", { required: true, index: true }),
    status: { type: String, enum: RETURN_STATUSES, default: "REQUESTED" },
    reason: { type: String, required: true },
  },
  { ...baseSchemaOptions, timestamps: true },
);

export const ReturnRequest = defineModel<ReturnRequestDoc>("ReturnRequest", returnRequestSchema);

export interface ReturnItemDoc {
  _id: Types.ObjectId;
  returnRequestId: Types.ObjectId;
  orderItemId: Types.ObjectId;
  quantity: number;
  condition?: string | null;
}

const returnItemSchema = new Schema<ReturnItemDoc>(
  {
    returnRequestId: ref("ReturnRequest", { required: true, index: true }),
    orderItemId: ref("OrderItem", { required: true }),
    quantity: { type: Number, required: true },
    condition: { type: String, default: null },
  },
  baseSchemaOptions,
);

export const ReturnItem = defineModel<ReturnItemDoc>("ReturnItem", returnItemSchema);

export interface NotificationDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: ref("User", { required: true, index: true }),
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification = defineModel<NotificationDoc>("Notification", notificationSchema);

export interface BlogPostDoc {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentHtml: string;
  coverImageUrl?: string | null;
  authorId: Types.ObjectId;
  status: ContentStatus;
  publishedAt?: Date | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<BlogPostDoc>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: null },
    contentHtml: { type: String, required: true },
    coverImageUrl: { type: String, default: null },
    authorId: ref("User", { required: true }),
    status: { type: String, enum: CONTENT_STATUSES, default: "DRAFT" },
    publishedAt: { type: Date, default: null },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
  },
  { ...baseSchemaOptions, timestamps: true },
);

export const BlogPost = defineModel<BlogPostDoc>("BlogPost", blogPostSchema);

export interface CmsPageDoc {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  contentHtml: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  updatedAt: Date;
}

const cmsPageSchema = new Schema<CmsPageDoc>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    contentHtml: { type: String, required: true },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: false, updatedAt: true } },
);

export const CmsPage = defineModel<CmsPageDoc>("CmsPage", cmsPageSchema);

export interface BannerDoc {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  placement: BannerPlacement;
  sortOrder: number;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
}

const bannerSchema = new Schema<BannerDoc>(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: null },
    placement: { type: String, enum: BANNER_PLACEMENTS, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Banner = defineModel<BannerDoc>("Banner", bannerSchema);

export interface NewsletterSubscriberDoc {
  _id: Types.ObjectId;
  email: string;
  isSubscribed: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date | null;
}

const newsletterSubscriberSchema = new Schema<NewsletterSubscriberDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isSubscribed: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

export const NewsletterSubscriber = defineModel<NewsletterSubscriberDoc>(
  "NewsletterSubscriber",
  newsletterSubscriberSchema,
);

export interface ContactMessageDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}

const contactMessageSchema = new Schema<ContactMessageDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "OPEN" },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const ContactMessage = defineModel<ContactMessageDoc>("ContactMessage", contactMessageSchema);

export interface FraudFlagDoc {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  riskScore: number;
  reason: string;
  status: FraudStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
}

const fraudFlagSchema = new Schema<FraudFlagDoc>(
  {
    orderId: ref("Order", { required: true, index: true }),
    riskScore: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: FRAUD_STATUSES, default: "FLAGGED", index: true },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const FraudFlag = defineModel<FraudFlagDoc>("FraudFlag", fraudFlagSchema);

export interface AuditLogDoc {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: ref("User", { default: null, index: true }),
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = defineModel<AuditLogDoc>("AuditLog", auditLogSchema);
