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
} from "@db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import OpenAI from "openai";
import { trackApiUsage, getApiUsageStats } from "./utils/apiTracker";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function registerRoutes(app: Express): Server {
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

  const httpServer = createServer(app);
  return httpServer;
}