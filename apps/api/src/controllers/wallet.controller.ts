import type { Request, Response } from "express";
import { walletService } from "@/services/wallet.service";
import { walletTransactionListQuerySchema } from "@/validation/wallet.schema";

export const walletController = {
  async getMine(req: Request, res: Response) {
    const query = walletTransactionListQuerySchema.parse(req.query);
    const wallet = await walletService.getMyWallet(req.user!.id, query);
    res.status(200).json(wallet);
  },
};
