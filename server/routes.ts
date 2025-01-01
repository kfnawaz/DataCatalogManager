import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { dataProducts, metricDefinitions, qualityMetrics } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Data product routes
  app.get("/api/data-products", async (req, res) => {
    try {
      const products = await db.select().from(dataProducts);
      res.json(products);
    } catch (error) {
      console.error("Error fetching data products:", error);
      res.status(500).json({ error: "Failed to fetch data products" });
    }
  });

  app.get("/api/metadata/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const [product] = await db
        .select()
        .from(dataProducts)
        .where(eq(dataProducts.id, productId))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: "Data product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

  app.get("/api/quality-metrics/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      // Get the latest metrics for the product
      const metrics = await db
        .select()
        .from(qualityMetrics)
        .where(eq(qualityMetrics.dataProductId, productId))
        .orderBy(desc(qualityMetrics.timestamp));

      if (metrics.length === 0) {
        return res.json({
          current: {
            completeness: 0,
            accuracy: 0,
            timeliness: 0,
          },
          history: [],
        });
      }

      const current = metrics[0];
      const history = metrics.map(m => ({
        timestamp: m.timestamp,
        completeness: m.completeness,
        accuracy: m.accuracy,
        timeliness: m.timeliness,
      }));

      res.json({
        current: {
          completeness: current.completeness,
          accuracy: current.accuracy,
          timeliness: current.timeliness,
          metadata: current.metadata,
        },
        history,
      });
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      res.status(500).json({ error: "Failed to fetch quality metrics" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").toLowerCase();
      const products = await db.select().from(dataProducts);

      const results = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );

      res.json(results);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}