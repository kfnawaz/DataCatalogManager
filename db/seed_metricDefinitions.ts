import { db } from "@db";
import { metricTemplates, metricDefinitions } from "@db/schema";
import { metricTypeEnum } from "@db/schema";

export async function seed_metricDefinitions() {
  try {
    // First, create metric templates with generic patterns that can be applied to any data product
    const completenessTemplate = await db
      .insert(metricTemplates)
      .values({
        name: "Data Completeness",
        description:
          "Measures the percentage of non-null values in required fields. Basic foundation for data quality assessment.",
        type: "completeness",
        defaultFormula: "count(non_null) / count(*) * 100",
        parameters: {
          fields: ["required_fields"],
          threshold: 95,
        },
        example: "98% completeness across all required fields",
        tags: ["data quality", "completeness", "technical"],
      })
      .returning();

    const accuracyTemplate = await db
      .insert(metricTemplates)
      .values({
        name: "Data Accuracy",
        description:
          "Measures the accuracy of data against reference sources or patterns. Ensures data correctness and reliability.",
        type: "accuracy",
        defaultFormula: "count(matching_records) / count(*) * 100",
        parameters: {
          referenceSource: "source_system",
          matchingFields: ["key_fields"],
          threshold: 99,
        },
        example: "99.9% accuracy when compared to source system",
        tags: ["data quality", "accuracy", "technical"],
      })
      .returning();

    const timelinessTemplate = await db
      .insert(metricTemplates)
      .values({
        name: "Data Timeliness",
        description:
          "Measures data freshness and update frequency. Critical for operational effectiveness.",
        type: "timeliness",
        defaultFormula: "avg(current_timestamp - last_update_timestamp)",
        parameters: {
          maxDelay: "PT15M",
          warningThreshold: "PT10M",
        },
        example: "Average delay of 5 minutes",
        tags: ["data quality", "timeliness", "technical"],
      })
      .returning();

    const consistencyTemplate = await db
      .insert(metricTemplates)
      .values({
        name: "Data Consistency",
        description:
          "Measures consistency of data values across different systems or data sets. Ensures data uniformity.",
        type: "consistency",
        defaultFormula: "count(matching_records) / total_records * 100",
        parameters: {
          comparisonSystems: ["system_a", "system_b"],
          matchingFields: ["key_fields"],
          threshold: 98,
        },
        example: "99% consistency between front-office and back-office systems",
        tags: ["data quality", "consistency", "technical"],
      })
      .returning();

    // Create generic metric definitions applicable to any data product
    await db.insert(metricDefinitions).values([
      {
        name: "Record Completeness",
        description:
          "Technical metric measuring the presence of required data across any dataset",
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
          criticalThreshold: 90,
        },
        enabled: true,
      },
      {
        name: "Data Value Accuracy",
        description:
          "Technical metric for validating data values against reference data or expected patterns",
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
          criticalThreshold: 95,
        },
        enabled: true,
      },
      {
        name: "Update Timeliness",
        description:
          "Technical metric tracking data freshness and update frequency",
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
          measurementWindow: "1 hour",
        },
        enabled: true,
      },
    ]);

    // Create domain specific metric definitions for each domain
    // Market Data Metrics
    const marketDataMetrics = await db
      .insert(metricDefinitions)
      .values([
        {
          name: "Market Data Completeness",
          description: "Completeness of market data fields",
          type: "completeness",
          templateId: completenessTemplate[0].id,
          formula: "count(non_null_price_fields) / count(*) * 100",
          parameters: {
            fields: ["price", "volume", "timestamp"],
            threshold: 98,
          },
          enabled: true,
        },
        {
          name: "Market Data Timeliness",
          description: "Timeliness of market data updates",
          type: "timeliness",
          templateId: timelinessTemplate[0].id,
          formula: "max(current_timestamp - price_timestamp)",
          parameters: {
            maxDelay: "PT1M",
            warningThreshold: "PT30S",
          },
          enabled: true,
        },
      ])
      .returning();

    // Trade Data Metrics
    const tradeDataMetrics = await db
      .insert(metricDefinitions)
      .values([
        {
          name: "Trade Data Accuracy",
          description: "Accuracy of trade records",
          type: "accuracy",
          templateId: accuracyTemplate[0].id,
          formula: "count(matching_trades) / count(*) * 100",
          parameters: {
            referenceSource: "clearing_system",
            threshold: 99.9,
          },
          enabled: true,
        },
        {
          name: "Trade Data Consistency",
          description: "Consistency of trade data across systems",
          type: "consistency",
          templateId: consistencyTemplate[0].id,
          formula: "count(consistent_trades) / count(*) * 100",
          parameters: {
            systems: ["front_office", "back_office"],
            threshold: 99,
          },
          enabled: true,
        },
      ])
      .returning();

    // Risk Data Metrics
    const riskDataMetrics = await db
      .insert(metricDefinitions)
      .values([
        {
          name: "Risk Calculation Accuracy",
          description: "Accuracy of risk calculations",
          type: "accuracy",
          templateId: accuracyTemplate[0].id,
          formula: "abs(calculated_risk - benchmark_risk) <= tolerance",
          parameters: {
            tolerance: 0.0001,
            benchmarkSource: "validated_risk_engine",
          },
          enabled: true,
        },
        {
          name: "Risk Data Completeness",
          description: "Completeness of risk factor data",
          type: "completeness",
          templateId: completenessTemplate[0].id,
          formula: "count(non_null_risk_fields) / count(*) * 100",
          parameters: {
            fields: ["risk_factor", "confidence_level", "horizon"],
            threshold: 99,
          },
          enabled: true,
        },
      ])
      .returning();

    // Add VaR Report specific metric definitions
    const varReportMetrics = await db
      .insert(metricDefinitions)
      .values([
        {
          name: "VaR Calculation Accuracy",
          description:
            "Measures the accuracy of VaR calculations against benchmark values",
          type: "accuracy",
          templateId: accuracyTemplate[0].id,
          formula: "abs(calculated_var - benchmark_var) / benchmark_var * 100",
          parameters: {
            tolerance: 0.0001,
            benchmarkSource: "validated_risk_engine",
            threshold: 99.9,
            criticalFields: [
              "var_value",
              "confidence_level",
              "stress_scenario_impact",
            ],
          },
          enabled: true,
        },
        {
          name: "VaR Report Timeliness",
          description:
            "Measures the timeliness of VaR report generation and delivery",
          type: "timeliness",
          templateId: timelinessTemplate[0].id,
          formula: "max(report_timestamp - calculation_date)",
          parameters: {
            maxDelay: "PT30M", // 30 minutes maximum delay
            warningThreshold: "PT15M", // Warning at 15 minutes
            criticalDelay: "PT1H", // Critical at 1 hour
            marketHoursOnly: true,
          },
          enabled: true,
        },
        {
          name: "VaR Report Completeness",
          description: "Measures the completeness of VaR report data fields",
          type: "completeness",
          templateId: completenessTemplate[0].id,
          formula: "count(non_null_var_fields) / count(*) * 100",
          parameters: {
            requiredFields: [
              "portfolio_id",
              "var_value",
              "confidence_level",
              "calculation_date",
              "var_methodology",
            ],
            threshold: 100, // All required fields must be present
            criticalThreshold: 99.9,
          },
          enabled: true,
        },
      ])
      .returning();

    console.log("✅ Metrics data seeded successfully!");
  } catch (error) {
    console.error("Error seeding metrics data:", error);
    throw error;
  }
}
