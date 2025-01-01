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

// Metric templates for common use cases
export const metricTemplates = pgTable("metric_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: metricTypeEnum("type").notNull(),
  defaultFormula: text("default_formula").notNull(),
  parameters: jsonb("parameters").notNull(), // Configurable parameters for the template
  example: text("example"), // Example usage
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
  formula: text("formula"), // Customized formula based on template
  parameters: jsonb("parameters"), // Customized parameters
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quality metrics with standardized structure
export const qualityMetrics = pgTable("quality_metrics", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id).notNull(),
  metricDefinitionId: integer("metric_definition_id").references(() => metricDefinitions.id).notNull(),
  value: integer("value").notNull(),
  metadata: jsonb("metadata"), // For any additional metric context
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const dataProductRelations = relations(dataProducts, ({ many }) => ({
  qualityMetrics: many(qualityMetrics),
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

export const metricDefinitionRelations = relations(metricDefinitions, ({ one }) => ({
  template: one(metricTemplates, {
    fields: [metricDefinitions.templateId],
    references: [metricTemplates.id],
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

// Types
export type DataProduct = typeof dataProducts.$inferSelect;
export type NewDataProduct = typeof dataProducts.$inferInsert;
export type MetricTemplate = typeof metricTemplates.$inferSelect;
export type NewMetricTemplate = typeof metricTemplates.$inferInsert;
export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type NewMetricDefinition = typeof metricDefinitions.$inferInsert;
export type QualityMetric = typeof qualityMetrics.$inferSelect;
export type NewQualityMetric = typeof qualityMetrics.$inferInsert;