import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

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

// Standard quality metrics types
export const metricTypes = {
  COMPLETENESS: 'completeness',
  ACCURACY: 'accuracy',
  TIMELINESS: 'timeliness',
} as const;

export const metricDefinitions = pgTable("metric_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ['completeness', 'accuracy', 'timeliness'] }).notNull(),
  formula: text("formula"), // Optional formula or calculation method
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quality metrics with standardized structure
export const qualityMetrics = pgTable("quality_metrics", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id).notNull(),
  completeness: integer("completeness").notNull().default(0),
  accuracy: integer("accuracy").notNull().default(0),
  timeliness: integer("timeliness").notNull().default(0),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // For any additional metric context
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
}));

// Schemas for validation
export const insertDataProductSchema = createInsertSchema(dataProducts);
export const selectDataProductSchema = createSelectSchema(dataProducts);
export const insertMetricDefinitionSchema = createInsertSchema(metricDefinitions);
export const selectMetricDefinitionSchema = createSelectSchema(metricDefinitions);
export const insertQualityMetricSchema = createInsertSchema(qualityMetrics);
export const selectQualityMetricSchema = createSelectSchema(qualityMetrics);

// Types
export type DataProduct = typeof dataProducts.$inferSelect;
export type NewDataProduct = typeof dataProducts.$inferInsert;
export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type NewMetricDefinition = typeof metricDefinitions.$inferInsert;
export type QualityMetric = typeof qualityMetrics.$inferSelect;
export type NewQualityMetric = typeof qualityMetrics.$inferInsert;
