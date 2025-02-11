import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({ message: "Unauthorized: Invalid API Key" });
    return;
  }

  next();
};
