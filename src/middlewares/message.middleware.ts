import { Request, Response, NextFunction } from "express";

export const validateBulkMessageRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { clientId, message, numbers } = req.body;

  if (!clientId || !message || !numbers) {
    res.status(400).json({
      message: "ClientId, message, and numbers array are required",
    });
    return;
  }

  if (!Array.isArray(numbers) || numbers.length === 0) {
    res.status(400).json({
      message: "Numbers must be a non-empty array",
    });
    return;
  }

  if (numbers.length > 1000) {
    res.status(400).json({
      message: "Maximum 1000 numbers allowed per request",
    });
    return;
  }

  next();
};
