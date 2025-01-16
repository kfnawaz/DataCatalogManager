import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Create a proper Postgres enum for metric types
export const metricTypeEnum = pgEnum('metric_type', [
  'completeness',
  'accuracy',
  'timeliness',
  'consistency',
  'uniqueness',
  'validity',
]);

// Add stewardship level enum
export const stewardshipLevelEnum = pgEnum('stewardship_level', [
  'novice',
  'intermediate',
  'expert',
  'master',
  'champion'
]);

// Add achievement type enum
export const achievementTypeEnum = pgEnum('achievement_type', [
  'engagement',
  'quality',
  'collaboration',
  'innovation'
]);

export const dataProducts = pgTable("data_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  owner: text("owner").notNull(),
  domain: text("domain").notNull(), // Added domain field
  schema: jsonb("schema").notNull(),
  tags: text("tags").array(),
  sla: text("sla"),
  updateFrequency: text("update_frequency"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table for data products
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id")
    .references(() => dataProducts.id)
    .notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment reactions table for gamification
export const commentReactions = pgTable("comment_reactions", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id")
    .references(() => comments.id)
    .notNull(),
  type: text("type").notNull(), // 'like', 'helpful', 'insightful'
  userIdentifier: text("user_identifier").notNull(), // Store user/session identifier
  createdAt: timestamp("created_at").defaultNow(),
});

// Comment badges for achievements
export const commentBadges = pgTable("comment_badges", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id")
    .references(() => comments.id)
    .notNull(),
  type: text("type").notNull(), // 'quality', 'trending', 'influential'
  createdAt: timestamp("created_at").defaultNow(),
});

// Metric templates for common use cases
export const metricTemplates = pgTable("metric_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: metricTypeEnum("type").notNull(),
  defaultFormula: text("default_formula").notNull(),
  parameters: jsonb("parameters").notNull(),
  example: text("example"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const metricDefinitions = pgTable("metric_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: metricTypeEnum("type").notNull(),
  templateId: integer("template_id").references(() => metricTemplates.id),
  formula: text("formula"),
  parameters: jsonb("parameters"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add version history table for metric definitions
export const metricDefinitionVersions = pgTable("metric_definition_versions", {
  id: serial("id").primaryKey(),
  metricDefinitionId: integer("metric_definition_id")
    .references(() => metricDefinitions.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: metricTypeEnum("type").notNull(),
  templateId: integer("template_id").references(() => metricTemplates.id),
  formula: text("formula"),
  parameters: jsonb("parameters"),
  enabled: boolean("enabled").notNull(),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
  changeMessage: text("change_message"),
});

export const qualityMetrics = pgTable("quality_metrics", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id).notNull(),
  metricDefinitionId: integer("metric_definition_id").references(() => metricDefinitions.id).notNull(),
  value: integer("value").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Update the lineage node types enum to support Data Mesh architecture
export const lineageNodeTypeEnum = pgEnum('lineage_node_type', [
  'source-aligned',
  'aggregate',
  'consumer-aligned'
]);

// Add lineage nodes table
export const lineageNodes = pgTable("lineage_nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: lineageNodeTypeEnum("type").notNull(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id),
  metadata: jsonb("metadata"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add lineage edges table
export const lineageEdges = pgTable("lineage_edges", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => lineageNodes.id).notNull(),
  targetId: integer("target_id").references(() => lineageNodes.id).notNull(),
  metadata: jsonb("metadata"),
  transformationLogic: text("transformation_logic"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add lineage version history
export const lineageVersions = pgTable("lineage_versions", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id).notNull(),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changeMessage: text("change_message"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Stewardship profiles for users
export const stewardshipProfiles = pgTable("stewardship_profiles", {
  id: serial("id").primaryKey(),
  userIdentifier: text("user_identifier").notNull().unique(),
  displayName: text("display_name").notNull(),
  currentLevel: stewardshipLevelEnum("current_level").notNull().default('novice'),
  totalPoints: integer("total_points").notNull().default(0),
  monthlyPoints: integer("monthly_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Achievements that users can earn
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: achievementTypeEnum("type").notNull(),
  pointValue: integer("point_value").notNull(),
  criteria: jsonb("criteria").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track earned achievements
export const earnedAchievements = pgTable("earned_achievements", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => stewardshipProfiles.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  metadata: jsonb("metadata"),
});

// Stewardship activity tracking
export const stewardshipActivities = pgTable("stewardship_activities", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => stewardshipProfiles.id).notNull(),
  activityType: text("activity_type").notNull(), // 'comment', 'review', 'update', etc.
  entityType: text("entity_type").notNull(), // 'data_product', 'metric', etc.
  entityId: integer("entity_id").notNull(),
  points: integer("points").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly challenges for engagement
export const stewardshipChallenges = pgTable("stewardship_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  pointValue: integer("point_value").notNull(),
  criteria: jsonb("criteria").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track challenge participation
export const challengeParticipation = pgTable("challenge_participation", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => stewardshipProfiles.id).notNull(),
  challengeId: integer("challenge_id").references(() => stewardshipChallenges.id).notNull(),
  progress: jsonb("progress").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add API usage tracking table
export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  statusCode: integer("status_code").notNull(),
  errorType: text("error_type"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
  quotaUsed: integer("quota_used"),
  isSuccessful: boolean("is_successful").notNull(),
});

// Relations
export const dataProductRelations = relations(dataProducts, ({ many }) => ({
  qualityMetrics: many(qualityMetrics),
  comments: many(comments),
  lineageNodes: many(lineageNodes),
  lineageVersions: many(lineageVersions),
}));

export const qualityMetricRelations = relations(qualityMetrics, ({ one }) => ({
  dataProduct: one(dataProducts, {
    fields: [qualityMetrics.dataProductId],
    references: [dataProducts.id],
  }),
  metricDefinition: one(metricDefinitions, {
    fields: [qualityMetrics.metricDefinitionId],
    references: [metricDefinitions.id],
  }),
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
  dataProduct: one(dataProducts, {
    fields: [comments.dataProductId],
    references: [dataProducts.id],
  }),
  reactions: many(commentReactions),
  badges: many(commentBadges),
}));

export const metricDefinitionRelations = relations(metricDefinitions, ({ one, many }) => ({
  template: one(metricTemplates, {
    fields: [metricDefinitions.templateId],
    references: [metricTemplates.id],
  }),
  versions: many(metricDefinitionVersions),
}));

export const metricDefinitionVersionRelations = relations(metricDefinitionVersions, ({ one }) => ({
  metricDefinition: one(metricDefinitions, {
    fields: [metricDefinitionVersions.metricDefinitionId],
    references: [metricDefinitions.id],
  }),
}));

export const lineageNodeRelations = relations(lineageNodes, ({ one, many }) => ({
  dataProduct: one(dataProducts, {
    fields: [lineageNodes.dataProductId],
    references: [dataProducts.id],
  }),
  outgoingEdges: many(lineageEdges, { relationName: "source" }),
  incomingEdges: many(lineageEdges, { relationName: "target" }),
}));

export const lineageEdgeRelations = relations(lineageEdges, ({ one }) => ({
  source: one(lineageNodes, {
    fields: [lineageEdges.sourceId],
    references: [lineageNodes.id],
    relationName: "source",
  }),
  target: one(lineageNodes, {
    fields: [lineageEdges.targetId],
    references: [lineageNodes.id],
    relationName: "target",
  }),
}));

// Add relations
export const stewardshipProfileRelations = relations(stewardshipProfiles, ({ many }) => ({
  earnedAchievements: many(earnedAchievements),
  activities: many(stewardshipActivities),
  challengeParticipations: many(challengeParticipation),
}));

export const achievementRelations = relations(achievements, ({ many }) => ({
  earnedAchievements: many(earnedAchievements),
}));

export const challengeRelations = relations(stewardshipChallenges, ({ many }) => ({
  participations: many(challengeParticipation),
}));


// Schemas for validation
export const insertDataProductSchema = createInsertSchema(dataProducts);
export const selectDataProductSchema = createSelectSchema(dataProducts);
export const insertMetricTemplateSchema = createInsertSchema(metricTemplates);
export const selectMetricTemplateSchema = createSelectSchema(metricTemplates);
export const insertMetricDefinitionSchema = createInsertSchema(metricDefinitions);
export const selectMetricDefinitionSchema = createSelectSchema(metricDefinitions);
export const insertQualityMetricSchema = createInsertSchema(qualityMetrics);
export const selectQualityMetricSchema = createSelectSchema(qualityMetrics);
export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);

// Add schemas for version history
export const insertMetricDefinitionVersionSchema = createInsertSchema(metricDefinitionVersions);
export const selectMetricDefinitionVersionSchema = createSelectSchema(metricDefinitionVersions);

// Add new schemas
export const insertCommentReactionSchema = createInsertSchema(commentReactions);
export const selectCommentReactionSchema = createSelectSchema(commentReactions);
export const insertCommentBadgeSchema = createInsertSchema(commentBadges);
export const selectCommentBadgeSchema = createSelectSchema(commentBadges);

// Add schema for API usage
export const insertApiUsageSchema = createInsertSchema(apiUsage);
export const selectApiUsageSchema = createSelectSchema(apiUsage);

// Add new schemas for lineage
export const insertLineageNodeSchema = createInsertSchema(lineageNodes);
export const selectLineageNodeSchema = createSelectSchema(lineageNodes);
export const insertLineageEdgeSchema = createInsertSchema(lineageEdges);
export const selectLineageEdgeSchema = createSelectSchema(lineageEdges);
export const insertLineageVersionSchema = createInsertSchema(lineageVersions);
export const selectLineageVersionSchema = createSelectSchema(lineageVersions);

// Add schemas for new tables
export const insertStewardshipProfileSchema = createInsertSchema(stewardshipProfiles);
export const selectStewardshipProfileSchema = createSelectSchema(stewardshipProfiles);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);
export const insertEarnedAchievementSchema = createInsertSchema(earnedAchievements);
export const selectEarnedAchievementSchema = createSelectSchema(earnedAchievements);
export const insertStewardshipActivitySchema = createInsertSchema(stewardshipActivities);
export const selectStewardshipActivitySchema = createSelectSchema(stewardshipActivities);
export const insertStewardshipChallengeSchema = createInsertSchema(stewardshipChallenges);
export const selectStewardshipChallengeSchema = createSelectSchema(stewardshipChallenges);
export const insertChallengeParticipationSchema = createInsertSchema(challengeParticipation);
export const selectChallengeParticipationSchema = createSelectSchema(challengeParticipation);

// Types
export type DataProduct = typeof dataProducts.$inferSelect;
export type NewDataProduct = typeof dataProducts.$inferInsert;
export type MetricTemplate = typeof metricTemplates.$inferSelect;
export type NewMetricTemplate = typeof metricTemplates.$inferInsert;
export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type NewMetricDefinition = typeof metricDefinitions.$inferInsert;
export type QualityMetric = typeof qualityMetrics.$inferSelect;
export type NewQualityMetric = typeof qualityMetrics.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

// Add types for version history
export type MetricDefinitionVersion = typeof metricDefinitionVersions.$inferSelect;
export type NewMetricDefinitionVersion = typeof metricDefinitionVersions.$inferInsert;

// Add new types
export type CommentReaction = typeof commentReactions.$inferSelect;
export type NewCommentReaction = typeof commentReactions.$inferInsert;
export type CommentBadge = typeof commentBadges.$inferSelect;
export type NewCommentBadge = typeof commentBadges.$inferInsert;

// Add new types for lineage
export type LineageNode = typeof lineageNodes.$inferSelect;
export type NewLineageNode = typeof lineageNodes.$inferInsert;
export type LineageEdge = typeof lineageEdges.$inferSelect;
export type NewLineageEdge = typeof lineageEdges.$inferInsert;
export type LineageVersion = typeof lineageVersions.$inferSelect;
export type NewLineageVersion = typeof lineageVersions.$inferInsert;

// Add types for API usage
export type ApiUsage = typeof apiUsage.$inferSelect;
export type NewApiUsage = typeof apiUsage.$inferInsert;

// Add new types
export type StewardshipProfile = typeof stewardshipProfiles.$inferSelect;
export type NewStewardshipProfile = typeof stewardshipProfiles.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type EarnedAchievement = typeof earnedAchievements.$inferSelect;
export type NewEarnedAchievement = typeof earnedAchievements.$inferInsert;
export type StewardshipActivity = typeof stewardshipActivities.$inferSelect;
export type NewStewardshipActivity = typeof stewardshipActivities.$inferInsert;
export type StewardshipChallenge = typeof stewardshipChallenges.$inferSelect;
export type NewStewardshipChallenge = typeof stewardshipChallenges.$inferInsert;
export type ChallengeParticipation = typeof challengeParticipation.$inferSelect;
export type NewChallengeParticipation = typeof challengeParticipation.$inferInsert;