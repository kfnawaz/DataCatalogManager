import { db } from "@db";
import { metricTemplates, metricDefinitions } from "@db/schema";
import { metricTypeEnum } from "@db/schema";

export async function seed_metricsData() {
  try {
    // First, create metric templates with generic patterns that can be applied to any data product
    const completenessTemplate = await db.insert(metricTemplates).values({
      name: "Data Completeness",
      description: "Measures the percentage of non-null values in required fields. Basic foundation for data quality assessment.",
      type: "completeness",
      defaultFormula: "count(non_null) / count(*) * 100",
      parameters: {
        fields: ["required_fields"],
        threshold: 95
      },
      example: "98% completeness across all required fields",
      tags: ["data quality", "completeness", "technical"]
    }).returning();

    const accuracyTemplate = await db.insert(metricTemplates).values({
      name: "Data Accuracy",
      description: "Measures the accuracy of data against reference sources or patterns. Ensures data correctness and reliability.",
      type: "accuracy",
      defaultFormula: "count(matching_records) / count(*) * 100",
      parameters: {
        referenceSource: "source_system",
        matchingFields: ["key_fields"],
        threshold: 99
      },
      example: "99.9% accuracy when compared to source system",
      tags: ["data quality", "accuracy", "technical"]
    }).returning();

    const timelinessTemplate = await db.insert(metricTemplates).values({
      name: "Data Timeliness",
      description: "Measures data freshness and update frequency. Critical for operational effectiveness.",
      type: "timeliness",
      defaultFormula: "avg(current_timestamp - last_update_timestamp)",
      parameters: {
        maxDelay: "PT15M",
        warningThreshold: "PT10M"
      },
      example: "Average delay of 5 minutes",
      tags: ["data quality", "timeliness", "technical"]
    }).returning();

    // Create generic metric definitions applicable to any data product
    await db.insert(metricDefinitions).values([
      {
        name: "Record Completeness",
        description: "Technical metric measuring the presence of required data across any dataset",
        type: "completeness",
        templateId: completenessTemplate[0].id,
        formula: `
          -- Generic SQL formula for completeness
          WITH field_stats AS (
            SELECT 
              COUNT(*) as total_records,
              SUM(CASE WHEN all_required_fields_not_null THEN 1 ELSE 0 END) as complete_records
            FROM data_table
          )
          SELECT (complete_records::float / NULLIF(total_records, 0) * 100)::numeric(5,2)
          FROM field_stats
        `,
        parameters: {
          nullCheck: true,
          emptyStringCheck: true,
          whitespaceCheck: true,
          threshold: 95,
          criticalThreshold: 90
        },
        enabled: true
      },
      {
        name: "Data Value Accuracy",
        description: "Technical metric for validating data values against reference data or expected patterns",
        type: "accuracy",
        templateId: accuracyTemplate[0].id,
        formula: `
          -- Generic SQL formula for accuracy
          WITH accuracy_check AS (
            SELECT
              COUNT(*) as total_records,
              SUM(CASE WHEN matches_reference_or_pattern THEN 1 ELSE 0 END) as accurate_records
            FROM data_table
            LEFT JOIN reference_data ON matching_keys
          )
          SELECT (accurate_records::float / NULLIF(total_records, 0) * 100)::numeric(5,2)
          FROM accuracy_check
        `,
        parameters: {
          patternValidation: true,
          rangeValidation: true,
          referenceComparison: true,
          threshold: 99,
          criticalThreshold: 95
        },
        enabled: true
      },
      {
        name: "Update Timeliness",
        description: "Technical metric tracking data freshness and update frequency",
        type: "timeliness",
        templateId: timelinessTemplate[0].id,
        formula: `
          -- Generic SQL formula for timeliness
          WITH time_gaps AS (
            SELECT
              MAX(current_timestamp - last_updated_at) as max_delay,
              AVG(EXTRACT(EPOCH FROM (current_timestamp - last_updated_at)))::integer as avg_delay_seconds
            FROM data_table
            WHERE last_updated_at IS NOT NULL
          )
          SELECT 
            CASE 
              WHEN avg_delay_seconds <= threshold_seconds THEN 100
              ELSE (threshold_seconds::float / NULLIF(avg_delay_seconds, 0) * 100)::numeric(5,2)
            END
          FROM time_gaps
        `,
        parameters: {
          updateFrequencyCheck: true,
          staleDateThresholdMinutes: 15,
          criticalDelayMinutes: 30,
          measurementWindow: "1 hour"
        },
        enabled: true
      }
    ]);

    console.log("✅ Metrics data seeded successfully!");
  } catch (error) {
    console.error("Error seeding metrics data:", error);
    throw error;
  }
}