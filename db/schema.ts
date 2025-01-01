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

export const dataProducts = pgTable("data_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  owner: text("owner").notNull(),
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

// Relations
export const dataProductRelations = relations(dataProducts, ({ many }) => ({
  qualityMetrics: many(qualityMetrics),
  comments: many(comments),
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

export const commentRelations = relations(comments, ({ one }) => ({
  dataProduct: one(dataProducts, {
    fields: [comments.dataProductId],
    references: [dataProducts.id],
  }),
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