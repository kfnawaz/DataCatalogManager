import { db } from "@db";
import { metricTemplates, metricDefinitions, qualityMetrics } from "@db/schema";
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

    // Create metric definitions based on templates
    const marketDataCompleteness = await db.insert(metricDefinitions).values({
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
    }).returning();

    const marketDataTimeliness = await db.insert(metricDefinitions).values({
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
    }).returning();

    const riskDataAccuracy = await db.insert(metricDefinitions).values({
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
    }).returning();

    // Add quality metrics for data products
    // Market Data (ID: 1)
    await db.insert(qualityMetrics).values([
      {
        dataProductId: 1,
        metricDefinitionId: marketDataCompleteness[0].id,
        value: 99,
        metadata: {
          totalFields: 1000,
          missingFields: 10,
          timestamp: new Date().toISOString()
        }
      },
      {
        dataProductId: 1,
        metricDefinitionId: marketDataTimeliness[0].id,
        value: 95,
        metadata: {
          averageDelay: "PT30S",
          maxDelay: "PT1M",
          timestamp: new Date().toISOString()
        }
      }
    ]);

    // Risk Factor Data (ID: 4)
    await db.insert(qualityMetrics).values({
      dataProductId: 4,
      metricDefinitionId: riskDataAccuracy[0].id,
      value: 98,
      metadata: {
        sampleSize: 1000,
        deviations: 20,
        timestamp: new Date().toISOString()
      }
    });

    console.log("✅ Metrics data seeded successfully!");
  } catch (error) {
    console.error("Error seeding metrics data:", error);
    throw error;
  }
}
