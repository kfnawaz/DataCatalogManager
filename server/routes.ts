import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import {
  dataProducts,
  metricDefinitions,
  metricDefinitionVersions,
  qualityMetrics,
  metricTemplates,
  comments,
  commentReactions,
  lineageNodes,
  lineageEdges,
  lineageVersions
} from "@db/schema";
import { eq, desc, sql, and, inArray, or } from "drizzle-orm";
import OpenAI from "openai";
import { trackApiUsage, getApiUsageStats } from "./utils/apiTracker";
import fetch from 'node-fetch';
import stewardshipRouter from "./routes/stewardship";

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function registerRoutes(app: Express): Server {
  // Register stewardship routes
  app.use(stewardshipRouter);

  // Add usage stats endpoint
  app.get("/api/usage-stats", async (req, res) => {
    try {
      const timeframe = (req.query.timeframe || 'day') as 'day' | 'week' | 'month';
      const stats = await getApiUsageStats(timeframe);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching API usage stats:", error);
      res.status(500).json({ error: "Failed to fetch API usage statistics" });
    }
  });

  // Add health check endpoint for API status
  app.get("/api/health", async (_req, res) => {
    try {
      // Test OpenAI API with a minimal request
      await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });

      res.json({
        status: "healthy",
        aiService: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      // If error is rate limit or auth, mark AI service as unavailable
      const aiUnavailable = error.status === 429 || error.status === 401;

      res.json({
        status: aiUnavailable ? "limited" : "healthy",
        aiService: !aiUnavailable,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Data product routes
  app.get("/api/data-products", async (req, res) => {
    try {
      const products = await db
        .select({
          id: dataProducts.id,
          name: dataProducts.name,
          description: dataProducts.description,
          owner: dataProducts.owner,
          domain: dataProducts.domain,
          schema: dataProducts.schema,
          tags: dataProducts.tags,
          sla: dataProducts.sla,
          updateFrequency: dataProducts.updateFrequency,
          createdAt: dataProducts.createdAt,
          updatedAt: dataProducts.updatedAt
        })
        .from(dataProducts);
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
        .select({
          id: comments.id,
          content: comments.content,
          authorName: comments.authorName,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          dataProductId: comments.dataProductId,
        })
        .from(comments)
        .where(eq(comments.dataProductId, productId))
        .orderBy(desc(comments.createdAt));

      // Get reaction counts for each comment
      const commentsWithReactions = await Promise.all(
        productComments.map(async (comment) => {
          const reactions = await db
            .select({
              type: commentReactions.type,
              count: sql<number>`count(*)::int`,
            })
            .from(commentReactions)
            .where(eq(commentReactions.commentId, comment.id))
            .groupBy(commentReactions.type);

          const reactionCounts = {
            like: 0,
            helpful: 0,
            insightful: 0,
          };

          reactions.forEach((r) => {
            if (r.type in reactionCounts) {
              reactionCounts[r.type as keyof typeof reactionCounts] = r.count;
            }
          });

          return {
            ...comment,
            reactions: reactionCounts,
            badges: [], // Keep badges empty for now
          };
        })
      );

      res.json(commentsWithReactions);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/data-products/:id/comments", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({
          error: "Invalid input",
          details: "Product ID must be a valid number"
        });
      }

      // Verify product exists
      const [product] = await db
        .select()
        .from(dataProducts)
        .where(eq(dataProducts.id, productId))
        .limit(1);

      if (!product) {
        return res.status(404).json({
          error: "Not found",
          details: "Data product not found"
        });
      }

      const { content, authorName } = req.body;

      // Validate required fields
      const errors: Record<string, string> = {};
      if (!content?.trim()) {
        errors.content = "Comment content is required";
      } else if (content.length > 1000) {
        errors.content = "Comment content must be less than 1000 characters";
      }

      if (!authorName?.trim()) {
        errors.authorName = "Author name is required";
      } else if (authorName.length > 100) {
        errors.authorName = "Author name must be less than 100 characters";
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors
        });
      }

      // Create comment with analytics data
      const [newComment] = await db
        .insert(comments)
        .values({
          dataProductId: productId,
          content: content.trim(),
          authorName: authorName.trim(),
        })
        .returning();

      // Track comment metrics
      const commentCount = await db
        .select({ count: sql`count(*)` })
        .from(comments)
        .where(eq(comments.dataProductId, productId));

      res.json({
        comment: newComment,
        metrics: {
          totalComments: commentCount[0].count,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({
        error: "Internal server error",
        details: "Failed to create comment. Please try again later."
      });
    }
  });

  app.get("/api/metadata/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({
          error: "Invalid input",
          details: "Product ID must be a valid number"
        });
      }

      // Get data product information
      const [product] = await db
        .select({
          id: dataProducts.id,
          name: dataProducts.name,
          description: dataProducts.description,
          owner: dataProducts.owner,
          domain: dataProducts.domain,
          schema: dataProducts.schema,
          tags: dataProducts.tags,
          sla: dataProducts.sla,
          updateFrequency: dataProducts.updateFrequency,
          createdAt: dataProducts.createdAt,
          updatedAt: dataProducts.updatedAt
        })
        .from(dataProducts)
        .where(eq(dataProducts.id, productId))
        .limit(1);

      if (!product) {
        // Try to find by name if ID lookup fails
        const [productByName] = await db
          .select({
            id: dataProducts.id,
            name: dataProducts.name,
            description: dataProducts.description,
            owner: dataProducts.owner,
            domain: dataProducts.domain,
            schema: dataProducts.schema,
            tags: dataProducts.tags,
            sla: dataProducts.sla,
            updateFrequency: dataProducts.updateFrequency,
            createdAt: dataProducts.createdAt,
            updatedAt: dataProducts.updatedAt
          })
          .from(dataProducts)
          .where(sql`LOWER(${dataProducts.name}) = LOWER(${req.params.id})`)
          .limit(1);

        if (!productByName) {
          return res.status(404).json({ error: "Data product not found" });
        }
        product = productByName;
      }

      // Get lineage nodes for this data product
      const nodes = await db
        .select({
          id: lineageNodes.id,
          name: lineageNodes.name,
          type: lineageNodes.type,
          metadata: lineageNodes.metadata,
          version: lineageNodes.version
        })
        .from(lineageNodes)
        .where(eq(lineageNodes.dataProductId, product.id));

      // Get lineage edges if nodes exist
      let edges = [];
      if (nodes.length > 0) {
        const nodeIds = nodes.map(n => n.id);
        edges = await db
          .select({
            id: lineageEdges.id,
            sourceId: lineageEdges.sourceId,
            targetId: lineageEdges.targetId,
            metadata: lineageEdges.metadata,
            transformationLogic: lineageEdges.transformationLogic
          })
          .from(lineageEdges)
          .where(
            and(
              inArray(lineageEdges.sourceId, nodeIds),
              inArray(lineageEdges.targetId, nodeIds)
            )
          );
      }

      // Get quality metrics
      const metrics = await db
        .select({
          id: qualityMetrics.id,
          value: qualityMetrics.value,
          timestamp: qualityMetrics.timestamp,
          metadata: qualityMetrics.metadata,
          definitionId: qualityMetrics.metricDefinitionId
        })
        .from(qualityMetrics)
        .where(eq(qualityMetrics.dataProductId, product.id))
        .orderBy(desc(qualityMetrics.timestamp))
        .limit(10);

      // Format response
      const response = {
        ...product,
        lineage: {
          nodes: nodes.map(node => ({
            id: node.id.toString(),
            name: node.name,
            type: node.type,
            metadata: node.metadata,
            version: node.version
          })),
          edges: edges.map(edge => ({
            id: edge.id.toString(),
            source: edge.sourceId.toString(),
            target: edge.targetId.toString(),
            metadata: edge.metadata,
            transformationLogic: edge.transformationLogic
          }))
        },
        metrics: metrics.map(metric => ({
          id: metric.id,
          value: metric.value,
          timestamp: metric.timestamp,
          metadata: metric.metadata,
          definitionId: metric.definitionId
        }))
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({
        error: "Failed to fetch metadata",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/quality-metrics/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      // Get time range from query parameter
      const timeRange = req.query.timeRange as string;
      let dateFilter = new Date(0); // Default to all time

      if (timeRange) {
        const now = new Date();
        switch (timeRange) {
          case '7d':
            dateFilter = new Date(now.setDate(now.getDate() - 7));
            break;
          case '30d':
            dateFilter = new Date(now.setDate(now.getDate() - 30));
            break;
          case '90d':
            dateFilter = new Date(now.setDate(now.getDate() - 90));
            break;
        }
      }

      // Join with metric_definitions to get the metric type
      const metrics = await db
        .select({
          id: qualityMetrics.id,
          value: qualityMetrics.value,
          timestamp: qualityMetrics.timestamp,
          metadata: qualityMetrics.metadata,
          type: metricDefinitions.type
        })
        .from(qualityMetrics)
        .innerJoin(
          metricDefinitions,
          eq(qualityMetrics.metricDefinitionId, metricDefinitions.id)
        )
        .where(
          and(
            eq(qualityMetrics.dataProductId, productId),
            sql`${qualityMetrics.timestamp} >= ${dateFilter}`
          )
        )
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

      // Group metrics by type to get current values
      const currentMetrics = metrics.reduce((acc, metric) => {
        if (!acc[metric.type]) {
          acc[metric.type] = metric.value;
        }
        return acc;
      }, {} as Record<string, number>);

      // Format history data
      const history = metrics.map(m => ({
        timestamp: m.timestamp,
        [m.type]: m.value,
        metadata: m.metadata,
      }));

      // Group history data by timestamp
      const groupedHistory = history.reduce((acc, curr) => {
        const timestamp = curr.timestamp?.toISOString();
        if (!timestamp) return acc;

        if (!acc[timestamp]) {
          acc[timestamp] = {
            timestamp,
            completeness: null,
            accuracy: null,
            timeliness: null,
            metadata: curr.metadata
          };
        }

        // Update the specific metric value
        if (curr.completeness !== undefined) acc[timestamp].completeness = curr.completeness;
        if (curr.accuracy !== undefined) acc[timestamp].accuracy = curr.accuracy;
        if (curr.timeliness !== undefined) acc[timestamp].timeliness = curr.timeliness;

        return acc;
      }, {} as Record<string, any>);

      res.json({
        current: {
          completeness: currentMetrics.completeness || 0,
          accuracy: currentMetrics.accuracy || 0,
          timeliness: currentMetrics.timeliness || 0,
          customMetrics: Object.entries(currentMetrics)
            .filter(([key]) => !['completeness', 'accuracy', 'timeliness'].includes(key))
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
        },
        history: Object.values(groupedHistory)
      });
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

  // Add new route for comment summarization
  app.post("/api/data-products/:id/comments/summarize", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        await trackApiUsage("/api/data-products/:id/comments/summarize", 400, "InvalidInput");
        return res.status(400).json({
          error: "Invalid input",
          details: "Product ID must be a valid number"
        });
      }

      // Get all comments for the product
      const productComments = await db
        .select()
        .from(comments)
        .where(eq(comments.dataProductId, productId))
        .orderBy(desc(comments.createdAt));

      if (productComments.length === 0) {
        await trackApiUsage("/api/data-products/:id/comments/summarize", 200, null, 0);
        return res.json({
          summary: "No comments available to summarize.",
          commentCount: 0
        });
      }

      // Prepare comments for summarization
      const commentsText = productComments
        .map(c => `${c.authorName}: ${c.content}`)
        .join("\n");

      try {
        // Generate summary using OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that summarizes user comments. Provide a concise summary that captures the main points and sentiment of the comments."
            },
            {
              role: "user",
              content: `Please summarize these comments:\n${commentsText}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        });

        const summary = completion.choices[0]?.message?.content || "Unable to generate summary.";

        await trackApiUsage("/api/data-products/:id/comments/summarize", 200, null, completion.usage?.total_tokens);

        res.json({
          summary,
          commentCount: productComments.length,
          lastUpdated: new Date().toISOString()
        });
      } catch (openaiError: any) {
        console.error("OpenAI API Error:", openaiError);

        // Handle specific OpenAI errors
        if (openaiError.status === 429) {
          await trackApiUsage("/api/data-products/:id/comments/summarize", 429, "RateLimit");
          return res.status(429).json({
            error: "API Rate Limit",
            details: "The AI service is currently unavailable due to rate limiting. Please try again later."
          });
        }

        if (openaiError.status === 401) {
          await trackApiUsage("/api/data-products/:id/comments/summarize", 401, "Authentication");
          return res.status(401).json({
            error: "API Authentication",
            details: "Unable to authenticate with the AI service. Please contact support."
          });
        }

        await trackApiUsage("/api/data-products/:id/comments/summarize", 500, openaiError.type);
        return res.status(500).json({
          error: "AI Service Error",
          details: "Failed to generate summary due to an AI service error. Please try again later."
        });
      }
    } catch (error) {
      console.error("Error summarizing comments:", error);
      await trackApiUsage("/api/data-products/:id/comments/summarize", 500, "InternalServerError");
      res.status(500).json({
        error: "Internal server error",
        details: "Failed to generate comment summary. Please try again later."
      });
    }
  });

  // Update POST reaction endpoint to store reactions
  app.post("/api/comments/:id/reactions", async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { type, userIdentifier } = req.body;

      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      if (!['like', 'helpful', 'insightful'].includes(type)) {
        return res.status(400).json({ error: "Invalid reaction type" });
      }

      if (!userIdentifier) {
        return res.status(400).json({ error: "User identifier is required" });
      }

      // Check if user has already reacted
      const existingReaction = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.type, type),
            eq(commentReactions.userIdentifier, userIdentifier)
          )
        )
        .limit(1);

      if (existingReaction.length > 0) {
        return res.status(400).json({
          error: "Already reacted",
          message: "You have already reacted to this comment"
        });
      }

      // Add new reaction
      await db.insert(commentReactions).values({
        commentId,
        type,
        userIdentifier,
      });

      // Get updated reaction count
      const updatedReactions = await db
        .select({
          type: commentReactions.type,
          count: sql<number>`count(*)::int`,
        })
        .from(commentReactions)
        .where(eq(commentReactions.commentId, commentId))
        .groupBy(commentReactions.type);

      const reactionCounts = {
        like: 0,
        helpful: 0,
        insightful: 0,
      };

      updatedReactions.forEach((r) => {
        if (r.type in reactionCounts) {
          reactionCounts[r.type as keyof typeof reactionCounts] = r.count;
        }
      });

      res.json({
        success: true,
        reactions: reactionCounts
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  // Update lineage API endpoint to fix the query and response
  app.get("/api/lineage", async (req, res) => {
    try {
      const dataProductId = parseInt(req.query.dataProductId as string);

      if (isNaN(dataProductId)) {
        return res.status(400).json({ error: "Invalid data product ID" });
      }

      // Get all nodes for this data product first
      const nodes = await db
        .select({
          id: lineageNodes.id,
          name: lineageNodes.name,
          type: lineageNodes.type,
          metadata: lineageNodes.metadata,
          version: lineageNodes.version
        })
        .from(lineageNodes)
        .where(eq(lineageNodes.dataProductId, dataProductId));

      if (nodes.length === 0) {
        return res.json({
          nodes: [],
          links: [],
          version: 1,
          versions: []
        });
      }

      // Get all edges where either source or target is one of our nodes
      const nodeIds = nodes.map(n => n.id);
      const edges = await db
        .select({
          id: lineageEdges.id,
          sourceId: lineageEdges.sourceId,
          targetId: lineageEdges.targetId,
          metadata: lineageEdges.metadata,
          transformationLogic: lineageEdges.transformationLogic,
          version: lineageEdges.version
        })
        .from(lineageEdges)
        .where(
          or(
            inArray(lineageEdges.sourceId, nodeIds),
            inArray(lineageEdges.targetId, nodeIds)
          )
        );

      // Get version history
      const versions = await db
        .select({
          version: lineageVersions.version,
          timestamp: lineageVersions.createdAt,
          changeMessage: lineageVersions.changeMessage
        })
        .from(lineageVersions)
        .where(eq(lineageVersions.dataProductId, dataProductId))
        .orderBy(desc(lineageVersions.version));

      // Format response with consistent types
      const response = {
        nodes: nodes.map(node => ({
          id: node.id.toString(),
          type: node.type,
          label: node.name,
          metadata: node.metadata || {},
          version: node.version
        })),
        links: edges.map(edge => ({
          id: edge.id.toString(),
          source: edge.sourceId.toString(),
          target: edge.targetId.toString(),
          metadata: edge.metadata || {},
          transformationLogic: edge.transformationLogic || "",
          version: edge.version
        })),
        version: versions.length > 0 ? versions[0].version : 1,
        versions: versions.map(v => ({
          version: v.version,
          timestamp: v.timestamp,
          changeMessage: v.changeMessage
        }))
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching lineage data:", error);
      res.status(500).json({
        error: "Failed to fetch lineage data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Add new version endpoint
  app.post("/api/lineage/versions", async (req, res) => {
    try {
      const { dataProductId, snapshot, changeMessage, createdBy } = req.body;

      if (!dataProductId || !snapshot) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current version number
      const [currentVersion] = await db
        .select()
        .from(lineageVersions)
        .where(eq(lineageVersions.dataProductId, dataProductId))
        .orderBy(desc(lineageVersions.version))
        .limit(1);

      const nextVersion = currentVersion ? currentVersion.version + 1 : 1;

      // Create new version
      const [newVersion] = await db
        .insert(lineageVersions)
        .values({
          dataProductId,
          version: nextVersion,
          snapshot,
          changeMessage: changeMessage || null,
          createdBy: createdBy || null
        })
        .returning();

      res.json(newVersion);
    } catch (error) {
      console.error("Error creating lineage version:", error);
      res.status(500).json({ error: "Failed to create lineage version" });
    }
  });

  // Update nodes and edges
  app.put("/api/lineage/nodes", async (req, res) => {
    try {
      const { dataProductId, nodes } = req.body;

      if (!dataProductId || !nodes) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Start a transaction
      await db.transaction(async (tx) => {
        // Delete existing nodes
        await tx
          .delete(lineageNodes)
          .where(eq(lineageNodes.dataProductId, dataProductId));

        // Insert new nodes
        await tx
          .insert(lineageNodes)
          .values(nodes.map((node: any) => ({
            name: node.label,
            type: node.type,
            dataProductId,
            metadata: node.metadata || null
          })));
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating lineage nodes:", error);
      res.status(500).json({ error: "Failed to update lineage nodes" });
    }
  });

  app.put("/api/lineage/edges", async (req, res) => {
    try {
      const { edges } = req.body;

      if (!edges) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Start a transaction
      await db.transaction(async (tx) => {
        // Delete existing edges
        await tx.delete(lineageEdges);

        // Insert new edges
        await tx
          .insert(lineageEdges)
          .values(edges.map((edge: any) => ({
            sourceId: parseInt(edge.source),
            targetId: parseInt(edge.target),
            transformationLogic: edge.transformationLogic || null,
            metadata: edge.metadata || null
          })));
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating lineage edges:", error);
      res.status(500).json({ error: "Failed to update lineage edges" });
    }
  });

  // Add chatbot endpoint for metadata recommendations
  app.post("/api/wellness/chat", async (req, res) => {
    try {
      const { message, dataProductId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemMessage = `You are Dana, the Data Wellness Companion - a friendly AI assistant specializing in metadata management and data quality improvement. 
Your personality is helpful, encouraging, and playful. You provide practical advice for improving data quality and metadata management practices.
Keep responses concise and engaging, using emojis occasionally to maintain a friendly tone.`;

      // Use OpenAI API to get chatbot response
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 250
      });

      const response = completion.choices[0]?.message?.content || "I'm having trouble understanding right now. Could you try rephrasing that?";

      // Track API usage
      await trackApiUsage("/api/wellness/chat", 200, null, completion.usage?.total_tokens);

      res.json({ message: response });
    } catch (error) {
      console.error("Chatbot Error:", error);
      await trackApiUsage("/api/wellness/chat", 500, error.type);
      res.status(500).json({ error: "Something unexpected happened. Please try again." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}