import { Router } from "express";
import { healthRouter } from "@/routes/health.routes";
import { authRouter } from "@/routes/auth.routes";
import { productRouter } from "@/routes/product.routes";
import { categoryRouter } from "@/routes/category.routes";
import { sellerRouter } from "@/routes/seller.routes";
import { blogRouter } from "@/routes/blog.routes";
import { supportRouter } from "@/routes/support.routes";
import { orderRouter } from "@/routes/order.routes";
import { addressRouter } from "@/routes/address.routes";
import { walletRouter } from "@/routes/wallet.routes";
import { rewardRouter } from "@/routes/reward.routes";
import { giftCardRouter } from "@/routes/giftCard.routes";
import { referralRouter } from "@/routes/referral.routes";
import { newsletterRouter } from "@/routes/newsletter.routes";
import { adminRouter } from "@/routes/admin";
import { sellerDashboardRouter } from "@/routes/seller";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/sellers", sellerRouter);
apiRouter.use("/blog", blogRouter);
apiRouter.use("/support", supportRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/addresses", addressRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/rewards", rewardRouter);
apiRouter.use("/gift-cards", giftCardRouter);
apiRouter.use("/referrals", referralRouter);
apiRouter.use("/newsletter", newsletterRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/seller", sellerDashboardRouter);

// Additional domain routers (cart, wishlist, ...) remain for later milestones.
