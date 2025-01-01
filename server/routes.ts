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

  // Metric definition routes
  app.get("/api/metric-definitions", async (req, res) => {
    try {
      const definitions = await db.select().from(metricDefinitions);
      res.json(definitions);
    } catch (error) {
      console.error("Error fetching metric definitions:", error);
      res.status(500).json({ error: "Failed to fetch metric definitions" });
    }
  });

  app.post("/api/metric-definitions", async (req, res) => {
    try {
      const { name, description, type, formula } = req.body;

      if (!name || !description || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [definition] = await db
        .insert(metricDefinitions)
        .values({
          name,
          description,
          type,
          formula: formula || null,
          enabled: true,
        })
        .returning();

      res.json(definition);
    } catch (error) {
      console.error("Error creating metric definition:", error);
      res.status(500).json({ error: "Failed to create metric definition" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}