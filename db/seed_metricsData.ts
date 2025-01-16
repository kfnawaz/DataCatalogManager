import { db } from "@db";
import { metricTemplates, metricDefinitions, qualityMetrics, nodeQualityMetrics, lineageNodes } from "@db/schema";
import { metricTypeEnum } from "@db/schema";

export async function seed_metricsData() {
  try {
    // First, create metric templates
    const completenessTemplate = await db.insert(metricTemplates).values({
      name: "Data Completeness",
      description: "Measures the percentage of non-null values in required fields",
      type: "completeness",
      defaultFormula: "count(non_null) / count(*) * 100",
      parameters: {
        fields: ["required_fields"],
        threshold: 95
      },
      example: "98% completeness across all required fields",
      tags: ["data quality", "completeness"]
    }).returning();

    const accuracyTemplate = await db.insert(metricTemplates).values({
      name: "Data Accuracy",
      description: "Measures the accuracy of data against reference sources",
      type: "accuracy",
      defaultFormula: "count(matching_records) / count(*) * 100",
      parameters: {
        referenceSource: "source_system",
        matchingFields: ["key_fields"],
        threshold: 99
      },
      example: "99.9% accuracy when compared to source system",
      tags: ["data quality", "accuracy"]
    }).returning();

    const timelinessTemplate = await db.insert(metricTemplates).values({
      name: "Data Timeliness",
      description: "Measures how current the data is relative to business requirements",
      type: "timeliness",
      defaultFormula: "avg(current_timestamp - last_update_timestamp)",
      parameters: {
        maxDelay: "PT15M",
        warningThreshold: "PT10M"
      },
      example: "Average delay of 5 minutes",
      tags: ["data quality", "timeliness"]
    }).returning();

    const consistencyTemplate = await db.insert(metricTemplates).values({
      name: "Data Consistency",
      description: "Measures consistency of data across different systems",
      type: "consistency",
      defaultFormula: "count(consistent_records) / count(*) * 100",
      parameters: {
        comparisonSystems: ["system_names"],
        threshold: 98
      },
      example: "99% consistency across systems",
      tags: ["data quality", "consistency"]
    }).returning();

    // Create metric definitions for each domain
    // Market Data Metrics
    const marketDataMetrics = await db.insert(metricDefinitions).values([
      {
        name: "Market Data Completeness",
        description: "Completeness of market data fields",
        type: "completeness",
        templateId: completenessTemplate[0].id,
        formula: "count(non_null_price_fields) / count(*) * 100",
        parameters: {
          fields: ["price", "volume", "timestamp"],
          threshold: 98
        },
        enabled: true
      },
      {
        name: "Market Data Timeliness",
        description: "Timeliness of market data updates",
        type: "timeliness",
        templateId: timelinessTemplate[0].id,
        formula: "max(current_timestamp - price_timestamp)",
        parameters: {
          maxDelay: "PT1M",
          warningThreshold: "PT30S"
        },
        enabled: true
      }
    ]).returning();

    // Trade Data Metrics
    const tradeDataMetrics = await db.insert(metricDefinitions).values([
      {
        name: "Trade Data Accuracy",
        description: "Accuracy of trade records",
        type: "accuracy",
        templateId: accuracyTemplate[0].id,
        formula: "count(matching_trades) / count(*) * 100",
        parameters: {
          referenceSource: "clearing_system",
          threshold: 99.9
        },
        enabled: true
      },
      {
        name: "Trade Data Consistency",
        description: "Consistency of trade data across systems",
        type: "consistency",
        templateId: consistencyTemplate[0].id,
        formula: "count(consistent_trades) / count(*) * 100",
        parameters: {
          systems: ["front_office", "back_office"],
          threshold: 99
        },
        enabled: true
      }
    ]).returning();

    // Risk Data Metrics
    const riskDataMetrics = await db.insert(metricDefinitions).values([
      {
        name: "Risk Calculation Accuracy",
        description: "Accuracy of risk calculations",
        type: "accuracy",
        templateId: accuracyTemplate[0].id,
        formula: "abs(calculated_risk - benchmark_risk) <= tolerance",
        parameters: {
          tolerance: 0.0001,
          benchmarkSource: "validated_risk_engine"
        },
        enabled: true
      },
      {
        name: "Risk Data Completeness",
        description: "Completeness of risk factor data",
        type: "completeness",
        templateId: completenessTemplate[0].id,
        formula: "count(non_null_risk_fields) / count(*) * 100",
        parameters: {
          fields: ["risk_factor", "confidence_level", "horizon"],
          threshold: 99
        },
        enabled: true
      }
    ]).returning();

    // Add quality metrics for each data product
    // Market Data (ID: 1)
    await db.insert(qualityMetrics).values([
      {
        dataProductId: 1,
        metricDefinitionId: marketDataMetrics[0].id,
        value: 99,
        metadata: {
          totalFields: 1000,
          missingFields: 10,
          timestamp: new Date().toISOString()
        }
      },
      {
        dataProductId: 1,
        metricDefinitionId: marketDataMetrics[1].id,
        value: 95,
        metadata: {
          averageDelay: "PT30S",
          maxDelay: "PT1M",
          timestamp: new Date().toISOString()
        }
      }
    ]);

    // Trade Data (ID: 2)
    await db.insert(qualityMetrics).values([
      {
        dataProductId: 2,
        metricDefinitionId: tradeDataMetrics[0].id,
        value: 99.8,
        metadata: {
          totalTrades: 5000,
          mismatchedTrades: 10,
          timestamp: new Date().toISOString()
        }
      },
      {
        dataProductId: 2,
        metricDefinitionId: tradeDataMetrics[1].id,
        value: 98,
        metadata: {
          systemsCompared: ["front_office", "back_office"],
          inconsistencies: 100,
          timestamp: new Date().toISOString()
        }
      }
    ]);

    // Risk Data (ID: 4)
    await db.insert(qualityMetrics).values([
      {
        dataProductId: 4,
        metricDefinitionId: riskDataMetrics[0].id,
        value: 98,
        metadata: {
          sampleSize: 1000,
          deviations: 20,
          timestamp: new Date().toISOString()
        }
      },
      {
        dataProductId: 4,
        metricDefinitionId: riskDataMetrics[1].id,
        value: 99.5,
        metadata: {
          totalFactors: 500,
          missingFactors: 2,
          timestamp: new Date().toISOString()
        }
      }
    ]);

    // Add node quality metrics for lineage nodes
    // First, get the lineage nodes
    const nodes = await db.select().from(lineageNodes);

    // Add node quality metrics for each node
    for (const node of nodes) {
      await db.insert(nodeQualityMetrics).values([
        {
          nodeId: node.id,
          metricDefinitionId: marketDataMetrics[0].id,
          value: 97 + Math.floor(Math.random() * 3), // Random value between 97-99
          metadata: {
            timestamp: new Date().toISOString(),
            nodeType: node.type,
            measurementPeriod: "1h"
          }
        },
        {
          nodeId: node.id,
          metricDefinitionId: riskDataMetrics[0].id,
          value: 98 + Math.floor(Math.random() * 2), // Random value between 98-99
          metadata: {
            timestamp: new Date().toISOString(),
            nodeType: node.type,
            measurementPeriod: "1h"
          }
        }
      ]);
    }

    console.log("✅ Metrics data seeded successfully!");
  } catch (error) {
    console.error("Error seeding metrics data:", error);
    throw error;
  }
}