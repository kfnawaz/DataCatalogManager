import { Request, Response, NextFunction } from "express";

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        displayName: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // For development, always inject test user
  // In production, this would validate session/token
  req.user = {
    username: "test_steward",
    displayName: "Test Steward"
  };
  
  next();
};
