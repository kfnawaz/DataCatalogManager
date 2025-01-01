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
    const products = await db.select().from(dataProducts);
    res.json(products);
  });

  app.get("/api/metadata/:id", async (req, res) => {
    const [product] = await db
      .select()
      .from(dataProducts)
      .where(eq(dataProducts.id, parseInt(req.params.id)))
      .limit(1);

    if (!product) {
      return res.status(404).send("Data product not found");
    }

    res.json(product);
  });

  app.get("/api/lineage/:id", async (req, res) => {
    const productId = parseInt(req.params.id);
    const nodes = await db
      .select()
      .from(lineageNodes)
      .where(eq(lineageNodes.dataProductId, productId));

    const nodeIds = nodes.map(node => node.id);

    // Fetch all edges where either source or target is in our nodes
    const edges = await db
      .select()
      .from(lineageEdges)
      .where(
        or(
          nodeIds.length > 0 ? eq(lineageEdges.sourceId, nodeIds[0]) : undefined,
          nodeIds.length > 0 ? eq(lineageEdges.targetId, nodeIds[0]) : undefined
        )
      );

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
  });

  app.get("/api/quality-metrics/:id", async (req, res) => {
    const metrics = await db
      .select()
      .from(qualityMetrics)
      .where(eq(qualityMetrics.dataProductId, parseInt(req.params.id)))
      .orderBy(qualityMetrics.timestamp);

    if (metrics.length === 0) {
      return res.status(404).send("No metrics found for this data product");
    }

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
  });

  app.get("/api/search", async (req, res) => {
    const query = (req.query.q as string || "").toLowerCase();
    const products = await db.select().from(dataProducts);

    const results = products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.tags?.some(tag => tag.toLowerCase().includes(query))
    );

    res.json(results);
  });

  const httpServer = createServer(app);
  return httpServer;
}