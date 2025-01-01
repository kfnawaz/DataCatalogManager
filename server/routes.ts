import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { 
  dataProducts, 
  metricDefinitions, 
  metricDefinitionVersions,
  qualityMetrics, 
  metricTemplates,
  comments 
} from "@db/schema";
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

  // Comments routes
  app.get("/api/data-products/:id/comments", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const productComments = await db
        .select()
        .from(comments)
        .where(eq(comments.dataProductId, productId))
        .orderBy(desc(comments.createdAt));

      res.json(productComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/data-products/:id/comments", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const { content, authorName } = req.body;
      if (!content || !authorName) {
        return res.status(400).json({ error: "Content and author name are required" });
      }

      const [newComment] = await db
        .insert(comments)
        .values({
          dataProductId: productId,
          content,
          authorName,
        })
        .returning();

      res.json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
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

  // Get metric definition history
  app.get("/api/metric-definitions/:id/history", async (req, res) => {
    try {
      const definitionId = parseInt(req.params.id);
      if (isNaN(definitionId)) {
        return res.status(400).json({ error: "Invalid definition ID" });
      }

      const versions = await db
        .select()
        .from(metricDefinitionVersions)
        .where(eq(metricDefinitionVersions.metricDefinitionId, definitionId))
        .orderBy(desc(metricDefinitionVersions.version));

      res.json(versions);
    } catch (error) {
      console.error("Error fetching metric definition history:", error);
      res.status(500).json({ error: "Failed to fetch metric definition history" });
    }
  });

  // Update metric definition
  app.put("/api/metric-definitions/:id", async (req, res) => {
    try {
      const definitionId = parseInt(req.params.id);
      if (isNaN(definitionId)) {
        return res.status(400).json({ error: "Invalid definition ID" });
      }

      const { name, description, type, templateId, formula, parameters, changeMessage } = req.body;

      if (!name || !description || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Start a transaction to update both tables
      await db.transaction(async (tx) => {
        // Get current version number
        const [currentVersion] = await tx
          .select()
          .from(metricDefinitionVersions)
          .where(eq(metricDefinitionVersions.metricDefinitionId, definitionId))
          .orderBy(desc(metricDefinitionVersions.version))
          .limit(1);

        const nextVersion = currentVersion ? currentVersion.version + 1 : 1;

        // Create new version record
        await tx.insert(metricDefinitionVersions).values({
          metricDefinitionId: definitionId,
          name,
          description,
          type,
          templateId: templateId || null,
          formula: formula || null,
          parameters: parameters || null,
          enabled: true,
          version: nextVersion,
          changeMessage: changeMessage || "Updated metric definition",
        });

        // Update current definition
        await tx
          .update(metricDefinitions)
          .set({
            name,
            description,
            type,
            templateId: templateId || null,
            formula: formula || null,
            parameters: parameters || null,
          })
          .where(eq(metricDefinitions.id, definitionId));
      });

      // Get updated definition
      const [updated] = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.id, definitionId))
        .limit(1);

      res.json(updated);
    } catch (error) {
      console.error("Error updating metric definition:", error);
      res.status(500).json({ error: "Failed to update metric definition" });
    }
  });

  // Rollback to specific version
  app.post("/api/metric-definitions/:id/rollback/:versionId", async (req, res) => {
    try {
      const definitionId = parseInt(req.params.id);
      const versionId = parseInt(req.params.versionId);

      if (isNaN(definitionId) || isNaN(versionId)) {
        return res.status(400).json({ error: "Invalid ID parameters" });
      }

      // Get the version to rollback to
      const [version] = await db
        .select()
        .from(metricDefinitionVersions)
        .where(eq(metricDefinitionVersions.id, versionId))
        .limit(1);

      if (!version) {
        return res.status(404).json({ error: "Version not found" });
      }

      // Start a transaction for rollback
      await db.transaction(async (tx) => {
        // Get current version number
        const [currentVersion] = await tx
          .select()
          .from(metricDefinitionVersions)
          .where(eq(metricDefinitionVersions.metricDefinitionId, definitionId))
          .orderBy(desc(metricDefinitionVersions.version))
          .limit(1);

        const nextVersion = currentVersion ? currentVersion.version + 1 : 1;

        // Create new version record for the rollback
        await tx.insert(metricDefinitionVersions).values({
          ...version,
          id: undefined,
          version: nextVersion,
          createdAt: undefined,
          changeMessage: `Rolled back to version ${version.version}`,
        });

        // Update current definition
        await tx
          .update(metricDefinitions)
          .set({
            name: version.name,
            description: version.description,
            type: version.type,
            templateId: version.templateId,
            formula: version.formula,
            parameters: version.parameters,
          })
          .where(eq(metricDefinitions.id, definitionId));
      });

      // Get updated definition
      const [updated] = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.id, definitionId))
        .limit(1);

      res.json(updated);
    } catch (error) {
      console.error("Error rolling back metric definition:", error);
      res.status(500).json({ error: "Failed to rollback metric definition" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}