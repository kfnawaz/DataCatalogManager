import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { dataProducts, metricDefinitions, qualityMetrics, metricTemplates } from "@db/schema";
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
        value: m.value,
        metadata: m.metadata,
      }));

      res.json({ current, history });
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      res.status(500).json({ error: "Failed to fetch quality metrics" });
    }
  });

  // Metric template routes
  app.get("/api/metric-templates", async (req, res) => {
    try {
      const templates = await db.select().from(metricTemplates);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching metric templates:", error);
      res.status(500).json({ error: "Failed to fetch metric templates" });
    }
  });

  app.post("/api/metric-templates", async (req, res) => {
    try {
      const { name, description, type, defaultFormula, parameters, example, tags } = req.body;

      if (!name || !description || !type || !defaultFormula || !parameters) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [template] = await db
        .insert(metricTemplates)
        .values({
          name,
          description,
          type,
          defaultFormula,
          parameters,
          example,
          tags,
        })
        .returning();

      res.json(template);
    } catch (error) {
      console.error("Error creating metric template:", error);
      res.status(500).json({ error: "Failed to create metric template" });
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
      const { name, description, type, templateId, formula, parameters } = req.body;

      if (!name || !description || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [definition] = await db
        .insert(metricDefinitions)
        .values({
          name,
          description,
          type,
          templateId: templateId || null,
          formula: formula || null,
          parameters: parameters || null,
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