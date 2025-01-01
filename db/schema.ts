import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

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

export const metricDefinitions = pgTable("metric_definitions", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  query: text("query").notNull(),
  threshold: integer("threshold"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lineageNodes = pgTable("lineage_nodes", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id).notNull(),
  type: text("type").notNull(),
  details: jsonb("details"),
});

export const lineageEdges = pgTable("lineage_edges", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => lineageNodes.id).notNull(),
  targetId: integer("target_id").references(() => lineageNodes.id).notNull(),
});

export const qualityMetrics = pgTable("quality_metrics", {
  id: serial("id").primaryKey(),
  dataProductId: integer("data_product_id").references(() => dataProducts.id).notNull(),
  completeness: integer("completeness"),
  accuracy: integer("accuracy"),
  timeliness: integer("timeliness"),
  customMetrics: jsonb("custom_metrics"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const dataProductRelations = relations(dataProducts, ({ many }) => ({
  lineageNodes: many(lineageNodes),
  qualityMetrics: many(qualityMetrics),
  metricDefinitions: many(metricDefinitions),
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
  }),
  target: one(lineageNodes, {
    fields: [lineageEdges.targetId],
    references: [lineageNodes.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertDataProductSchema = createInsertSchema(dataProducts);
export const selectDataProductSchema = createSelectSchema(dataProducts);
export const insertQualityMetricSchema = createInsertSchema(qualityMetrics);
export const selectQualityMetricSchema = createSelectSchema(qualityMetrics);
export const insertMetricDefinitionSchema = createInsertSchema(metricDefinitions);
export const selectMetricDefinitionSchema = createSelectSchema(metricDefinitions);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DataProduct = typeof dataProducts.$inferSelect;
export type NewDataProduct = typeof dataProducts.$inferInsert;
export type QualityMetric = typeof qualityMetrics.$inferSelect;
export type NewQualityMetric = typeof qualityMetrics.$inferInsert;
export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type NewMetricDefinition = typeof metricDefinitions.$inferInsert;