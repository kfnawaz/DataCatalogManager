import type { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { apiUsage } from "@db/schema";

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export interface ErrorTrace {
  message: string;
  path: string;
  timestamp: string;
  statusCode: number;
  stack?: string;
  query?: Record<string, any>;
  body?: Record<string, any>;
  debugInsights?: string[];
}

export async function errorTracer(
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Get status code
  const statusCode = err.status || err.statusCode || 500;
  const isServerError = statusCode >= 500;

  // Generate debug insights
  const debugInsights = generateDebugInsights(err, req);

  // Create error trace
  const errorTrace: ErrorTrace = {
    message: err.message || "Internal Server Error",
    path: req.path,
    timestamp: new Date().toISOString(),
    statusCode,
    query: req.query,
    body: req.body,
    debugInsights,
    ...(isServerError && process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  // Store error in database for analysis
  try {
    await db.insert(apiUsage).values({
      endpoint: req.path,
      statusCode,
      errorType: err.name,
      metadata: errorTrace,
      isSuccessful: false,
    });
  } catch (dbError) {
    console.error("Failed to store error trace:", dbError);
  }

  // Send error response
  res.status(statusCode).json(errorTrace);
}

function generateDebugInsights(err: ErrorWithStatus, req: Request): string[] {
  const insights: string[] = [];

  // Add common debugging insights
  insights.push(`Request method: ${req.method}`);
  insights.push(`Request path: ${req.path}`);

  // Add error type specific insights
  if (err.name === "SyntaxError") {
    insights.push("Possible invalid JSON in request body");
  }
  
  if (err.name === "TypeError") {
    insights.push("Possible undefined value or incorrect type being accessed");
  }

  if (err.message.includes("duplicate key")) {
    insights.push("Attempting to insert duplicate unique value");
  }

  if (err.message.includes("syntax error")) {
    insights.push("SQL syntax error in database query");
  }

  if (err.message.includes("relation") && err.message.includes("does not exist")) {
    insights.push("Database table or relation not found");
  }

  // Add request context insights
  if (Object.keys(req.query).length > 0) {
    insights.push(`Query parameters: ${JSON.stringify(req.query)}`);
  }

  // Add timestamp for correlation
  insights.push(`Timestamp: ${new Date().toISOString()}`);

  return insights;
}
