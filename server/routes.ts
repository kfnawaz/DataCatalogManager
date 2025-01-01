import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { dataProducts, lineageNodes, lineageEdges, qualityMetrics } from "@db/schema";
import { eq, or, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Data product routes
  app.get("/api/data-products", async (req, res) => {
    try {
      const products = await db.select().from(dataProducts);
      console.log("Fetched data products:", products.length);
      res.json(products);
    } catch (error) {
      console.error("Error fetching data products:", error);
      res.status(500).json({ error: "Failed to fetch data products" });
    }
  });

  app.get("/api/metadata/:id", async (req, res) => {
    try {
      console.log("Fetching metadata for id:", req.params.id);
      const [product] = await db
        .select()
        .from(dataProducts)
        .where(eq(dataProducts.id, parseInt(req.params.id)))
        .limit(1);

      if (!product) {
        console.log("No product found for id:", req.params.id);
        return res.status(404).send("Data product not found");
      }

      console.log("Found product:", product.name);
      res.json(product);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

  app.get("/api/lineage/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      console.log("Fetching lineage for id:", productId);

      const nodes = await db
        .select()
        .from(lineageNodes)
        .where(eq(lineageNodes.dataProductId, productId));

      console.log("Found lineage nodes:", nodes.length);

      const nodeIds = nodes.map(node => node.id);
      let edges: any[] = [];

      if (nodeIds.length > 0) {
        edges = await db
          .select()
          .from(lineageEdges)
          .where(
            or(
              eq(lineageEdges.sourceId, nodeIds[0]),
              eq(lineageEdges.targetId, nodeIds[0])
            )
          );
        console.log("Found lineage edges:", edges.length);
      }

      res.json({
        nodes: nodes.map(node => ({
          id: node.id.toString(),
          type: node.type,
          label: node.details ? (node.details as any).name || `Node ${node.id}` : `Node ${node.id}`,
        })),
        links: edges.map(edge => ({
          source: edge.sourceId.toString(),
          target: edge.targetId.toString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching lineage:", error);
      res.status(500).json({ error: "Failed to fetch lineage" });
    }
  });

  app.get("/api/quality-metrics/:id", async (req, res) => {
    try {
      console.log("Fetching quality metrics for id:", req.params.id);
      const metrics = await db
        .select()
        .from(qualityMetrics)
        .where(eq(qualityMetrics.dataProductId, parseInt(req.params.id)))
        .orderBy(qualityMetrics.timestamp);

      if (metrics.length === 0) {
        console.log("No metrics found for id:", req.params.id);
        return res.status(404).send("No metrics found for this data product");
      }

      console.log("Found metrics:", metrics.length);
      const current = metrics[metrics.length - 1];
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
          customMetrics: current.customMetrics,
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
      console.log("Search query:", query);
      const products = await db.select().from(dataProducts);

      const results = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );

      console.log("Search results:", results.length);
      res.json(results);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}