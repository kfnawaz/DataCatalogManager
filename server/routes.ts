import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { dataProducts, lineageNodes, lineageEdges, qualityMetrics, metricDefinitions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Data product routes
  app.get("/api/data-products", async (req, res) => {
    try {
      // First check if we have any data products
      const existingProducts = await db.select().from(dataProducts);

      // If no data products exist, create some sample data
      if (existingProducts.length === 0) {
        await db.insert(dataProducts).values([
          {
            name: "Customer Data Lake",
            description: "Central repository for all customer-related data",
            owner: "Data Engineering Team",
            schema: {
              columns: [
                { name: "customer_id", type: "string", description: "Unique identifier for customer" },
                { name: "name", type: "string", description: "Customer's full name" },
                { name: "email", type: "string", description: "Customer's email address" },
              ]
            },
            tags: ["customer", "core", "production"],
            sla: "99.9%",
            updateFrequency: "Real-time",
          },
          {
            name: "Sales Analytics",
            description: "Sales performance metrics and analysis",
            owner: "Analytics Team",
            schema: {
              columns: [
                { name: "sale_id", type: "string", description: "Unique identifier for sale" },
                { name: "amount", type: "number", description: "Sale amount" },
                { name: "date", type: "timestamp", description: "Sale date" },
              ]
            },
            tags: ["sales", "analytics", "production"],
            sla: "99.5%",
            updateFrequency: "Daily",
          }
        ]);

        // Return the newly created products
        const products = await db.select().from(dataProducts);
        res.json(products);
      } else {
        // Return existing products
        res.json(existingProducts);
      }
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

  const httpServer = createServer(app);
  return httpServer;
}