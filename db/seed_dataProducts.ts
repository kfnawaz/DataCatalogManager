import { db } from "@db";
import { dataProducts } from "@db/schema";

/**
 * Seeds the database with source-aligned data products.
 * This script matches the existing data in the database.
 * WARNING: Only run this script on a fresh database to avoid duplicates.
 */
export async function seed_dataProducts() {
  try {
    // Create a new source-aligned data product
    // Market Data
    await db.insert(dataProducts).values({
      name: "Market Data",
      description:
        "Real-time and historical market data from various exchanges and data providers",
      owner: "Market Data Team",
      domain: "Market",
      sources: ["Bloomberg", "Reuters", "exchange feeds"],
      schema: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Unique identifier for the financial instrument",
          },
          price: {
            type: "number",
            description: "Current market price",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Time of the price update",
          },
          volume: {
            type: "number",
            description: "Trading volume",
          },
          exchange: {
            type: "string",
            description: "Source exchange",
          },
        },
        required: ["symbol", "price", "timestamp"],
      },
      tags: ["market-data", "real-time", "pricing"],
      sla: "99.99% availability during market hours",
      updateFrequency: "Real-time",
    });

    // Trade and Position Data
    await db.insert(dataProducts).values({
      name: "Trade and Position Data",
      description: "Comprehensive trade and position data from trading systems",
      owner: "Trading Systems Team",
      domain: "Trading",
      sources: ["Internal or external master data services"],
      schema: {
        type: "object",
        properties: {
          tradeId: {
            type: "string",
            description: "Unique trade identifier",
          },
          instrumentId: {
            type: "string",
            description: "Identifier of the traded instrument",
          },
          quantity: {
            type: "number",
            description: "Trade quantity",
          },
          price: {
            type: "number",
            description: "Trade execution price",
          },
          tradeDate: {
            type: "string",
            format: "date-time",
            description: "Date and time of trade execution",
          },
          settlementDate: {
            type: "string",
            format: "date",
            description: "Settlement date",
          },
          status: {
            type: "string",
            enum: ["pending", "settled", "cancelled"],
            description: "Current trade status",
          },
        },
        required: ["tradeId", "instrumentId", "quantity", "price", "tradeDate"],
      },
      tags: ["trading", "positions", "settlement"],
      sla: "99.9% availability",
      updateFrequency: "Near real-time",
    });

    // Reference Data
    await db.insert(dataProducts).values({
      name: "Reference Data",
      description:
        "Static and reference data for financial instruments and entities",
      owner: "Reference Data Team",
      domain: "Reference",
      sources: ["Internal or external master data services"],
      schema: {
        type: "object",
        properties: {
          instrumentId: {
            type: "string",
            description: "Unique identifier for the instrument",
          },
          isin: {
            type: "string",
            description: "International Securities Identification Number",
          },
          cusip: {
            type: "string",
            description: "CUSIP identifier",
          },
          instrumentType: {
            type: "string",
            enum: ["equity", "bond", "derivative", "fund"],
            description: "Type of financial instrument",
          },
          issuer: {
            type: "string",
            description: "Issuing entity",
          },
          issuanceDate: {
            type: "string",
            format: "date",
            description: "Date of issuance",
          },
        },
        required: ["instrumentId", "instrumentType"],
      },
      tags: ["reference-data", "static-data"],
      sla: "99.9% availability",
      updateFrequency: "Daily",
    });

    // Risk Factor Data
    await db.insert(dataProducts).values({
      name: "Risk Factor Data",
      description: "Market risk factors and scenarios for risk calculations",
      owner: "Risk Management Team",
      domain: "Risk",
      sources: ["Risk engines", "pricing libraries"],
      schema: {
        type: "object",
        properties: {
          factorId: {
            type: "string",
            description: "Unique identifier for the risk factor",
          },
          factorType: {
            type: "string",
            enum: ["interest-rate", "fx-rate", "credit-spread", "volatility"],
            description: "Type of risk factor",
          },
          value: {
            type: "number",
            description: "Current value of the risk factor",
          },
          confidenceInterval: {
            type: "number",
            description: "Confidence interval for the value",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Time of the last update",
          },
        },
        required: ["factorId", "factorType", "value"],
      },
      tags: ["risk", "market-risk", "scenarios"],
      sla: "99.9% availability",
      updateFrequency: "Daily",
    });

    // Credit Risk Data
    await db.insert(dataProducts).values({
      name: "Credit Risk Data",
      description: "Credit risk metrics and exposure data",
      owner: "Credit Risk Team",
      domain: "Risk",
      sources: ["Credit risk management systems"],
      schema: {
        type: "object",
        properties: {
          counterpartyId: {
            type: "string",
            description: "Unique identifier for the counterparty",
          },
          exposureAmount: {
            type: "number",
            description: "Current exposure amount",
          },
          rating: {
            type: "string",
            description: "Credit rating",
          },
          pdScore: {
            type: "number",
            description: "Probability of default score",
          },
          lastReviewDate: {
            type: "string",
            format: "date",
            description: "Date of last credit review",
          },
        },
        required: ["counterpartyId", "exposureAmount", "rating"],
      },
      tags: ["credit-risk", "exposure", "ratings"],
      sla: "99.9% availability",
      updateFrequency: "Daily",
    });

    // Regulatory Data
    await db.insert(dataProducts).values({
      name: "Regulatory Data",
      description: "Data required for regulatory reporting and compliance",
      owner: "Regulatory Reporting Team",
      domain: "Compliance",
      sources: ["Compliance and regulatory systems"],
      schema: {
        type: "object",
        properties: {
          reportId: {
            type: "string",
            description: "Unique identifier for the regulatory report",
          },
          reportType: {
            type: "string",
            enum: ["MIFID", "EMIR", "SFTR", "FRTB"],
            description: "Type of regulatory report",
          },
          submissionDate: {
            type: "string",
            format: "date-time",
            description: "Date and time of report submission",
          },
          status: {
            type: "string",
            enum: ["draft", "submitted", "accepted", "rejected"],
            description: "Status of the regulatory report",
          },
          validationErrors: {
            type: "array",
            items: {
              type: "string",
            },
            description: "List of validation errors if any",
          },
        },
        required: ["reportId", "reportType", "submissionDate", "status"],
      },
      tags: ["regulatory", "compliance", "reporting"],
      sla: "99.99% availability",
      updateFrequency: "As required by regulation",
    });

    console.log("✅ Source-aligned data products seeded successfully");
  } catch (error) {
    console.error("Error seeding source-aligned data products data:", error);
    throw error;
  }

  // Create a new aggregate data product
  try {
    // Portfolio Risk Metrics
    await db.insert(dataProducts).values({
      name: "Portfolio Risk Metrics",
      description:
        "Aggregate risk metrics at the portfolio level providing comprehensive risk analysis",
      owner: "Risk Analytics Team",
      domain: "Risk",
      sources: ["Position-level risk metrics", "Market data"],
      schema: {
        type: "object",
        properties: {
          portfolio_id: {
            type: "string",
            description: "Unique identifier for the portfolio",
          },
          total_exposure: {
            type: "number",
            description: "Total market exposure of the portfolio",
          },
          delta: {
            type: "number",
            description: "Portfolio sensitivity to price changes",
          },
          gamma: {
            type: "number",
            description: "Second-order price sensitivity",
          },
          vega: {
            type: "number",
            description: "Sensitivity to changes in volatility",
          },
          risk_classification: {
            type: "string",
            description: "Classification of portfolio risk",
          },
        },
        required: ["portfolio_id", "total_exposure", "delta", "gamma", "vega"],
      },
      tags: ["portfolio-risk", "risk-metrics", "aggregated"],
      sla: "99.9% availability during market hours",
      updateFrequency: "Daily with intraday updates",
    });
    // Stress Testing Data
    await db.insert(dataProducts).values({
      name: "Stress Testing Data",
      description:
        "Aggregated stress test results and scenario analysis for portfolios",
      owner: "Risk Scenarios Team",
      domain: "Risk",
      sources: ["Historical market data", "Scenario definitions"],
      schema: {
        type: "object",
        properties: {
          scenario_id: {
            type: "string",
            description: "Unique identifier for the stress scenario",
          },
          portfolio_id: {
            type: "string",
            description: "Portfolio under evaluation",
          },
          scenario_description: {
            type: "string",
            description: "Details of the stress scenario",
          },
          impact_value: {
            type: "number",
            description: "Portfolio impact under the scenario",
          },
          probability_of_event: {
            type: "number",
            description: "Likelihood of the stress scenario",
          },
          calculation_date: {
            type: "string",
            format: "date",
            description: "Date of stress testing",
          },
        },
        required: [
          "scenario_id",
          "portfolio_id",
          "impact_value",
          "calculation_date",
        ],
      },
      tags: ["stress-testing", "scenarios", "risk-analysis"],
      sla: "99.9% availability",
      updateFrequency: "Daily",
    });
    // Market Risk Factors Aggregate
    await db.insert(dataProducts).values({
      name: "Market Risk Factors Aggregate",
      description:
        "Aggregated market risk factors including volatility, correlations, and interest rate curves",
      owner: "Market Risk Team",
      domain: "Risk",
      sources: ["Source-aligned market data"],
      schema: {
        type: "object",
        properties: {
          risk_factor_id: {
            type: "string",
            description: "Unique identifier for the risk factor",
          },
          risk_factor_type: {
            type: "string",
            description: "Type of risk factor (e.g., volatility)",
          },
          time_series_date: {
            type: "string",
            format: "date",
            description: "Date of the risk factor data",
          },
          value: {
            type: "number",
            description: "Value of the risk factor",
          },
          source: {
            type: "string",
            description: "Source of the data (e.g., Bloomberg)",
          },
        },
        required: [
          "risk_factor_id",
          "risk_factor_type",
          "time_series_date",
          "value",
        ],
      },
      tags: ["market-risk", "risk-factors", "aggregated"],
      sla: "99.95% availability",
      updateFrequency: "Real-time aggregation",
    });
    // Counterparty Risk Metrics
    await db.insert(dataProducts).values({
      name: "Counterparty Risk Metrics",
      description: "Aggregated counterparty risk exposure and credit metrics",
      owner: "Credit Risk Team",
      domain: "Risk",
      sources: ["Source-aligned counterparty exposure data", "Credit ratings"],
      schema: {
        type: "object",
        properties: {
          counterparty_id: {
            type: "string",
            description: "Unique identifier for the counterparty",
          },
          exposure_value: {
            type: "number",
            description: "Total exposure to the counterparty",
          },
          credit_rating: {
            type: "string",
            description: "Credit rating of the counterparty",
          },
          default_probability: {
            type: "number",
            description: "Probability of default",
          },
          lgd: {
            type: "number",
            description: "Loss given default",
          },
          last_updated: {
            type: "string",
            format: "date-time",
            description: "Timestamp of the last update",
          },
        },
        required: [
          "counterparty_id",
          "exposure_value",
          "credit_rating",
          "default_probability",
        ],
      },
      tags: ["counterparty-risk", "credit-risk", "aggregated"],
      sla: "99.9% availability",
      updateFrequency: "Daily with intraday updates",
    });
    // Regulatory Metrics
    await db.insert(dataProducts).values({
      name: "Regulatory Risk Metrics",
      description: "Aggregated regulatory metrics and compliance data",
      owner: "Regulatory Risk Team",
      domain: "Risk",
      sources: ["Source-aligned regulatory data"],
      schema: {
        type: "object",
        properties: {
          metric_id: {
            type: "string",
            description: "Unique identifier for the regulatory metric",
          },
          portfolio_id: {
            type: "string",
            description: "Portfolio under evaluation",
          },
          metric_type: {
            type: "string",
            description: "Type of regulatory metric (e.g., VaR limit)",
          },
          value: {
            type: "number",
            description: "Value of the metric",
          },
          compliance_status: {
            type: "boolean",
            description: "Whether the metric is compliant",
          },
          last_calculation_date: {
            type: "string",
            format: "date",
            description: "Date of the last metric calculation",
          },
        },
        required: [
          "metric_id",
          "portfolio_id",
          "metric_type",
          "value",
          "compliance_status",
        ],
      },
      tags: ["regulatory", "compliance", "risk-metrics"],
      sla: "99.99% availability",
      updateFrequency: "Daily or as required by regulation",
    });
    console.log("✅ Aggregate data products seeded successfully");
  } catch (error) {
    console.error("Error seeding aggregate data products:", error);
    throw error;
  }

  // Create a new consumer data product
  // VaR Report Data Product
  try {
    await db.insert(dataProducts).values({
      name: "VaR Report Data Product",
      description:
        "Provide a comprehensive Value at Risk report, summarizing the potential loss in portfolio value due to market movements",
      owner: "Risk Analytics Team",
      domain: "Risk",
      sources: [
        "Aggregated risk metrics",
        "Market data",
        "Portfolio and position-level data",
        "Historical and simulated data",
      ],
      schema: {
        type: "object",
        properties: {
          portfolio_id: {
            type: "string",
            description: "Unique identifier for the portfolio",
          },
          var_value: {
            type: "number",
            description: "Calculated Value at Risk for the portfolio",
          },
          confidence_level: {
            type: "number",
            description: "Confidence level of the VaR calculation",
          },
          calculation_date: {
            type: "string",
            format: "date",
            description: "Date of the VaR calculation",
          },
          stress_scenario_impact: {
            type: "number",
            description: "Portfolio loss under stress scenarios",
          },
          var_methodology: {
            type: "string",
            description: "Method used for VaR calculation (e.g., MC, HS)",
          },
        },
        required: [
          "portfolio_id",
          "var_value",
          "confidence_level",
          "calculation_date",
          "var_methodology",
        ],
      },
      tags: ["var", "risk-reporting", "portfolio-risk", "consumer-aligned"],
      sla: "99.9% availability during market hours",
      updateFrequency: "Daily with intraday updates",
      consumers: [
        "Risk managers",
        "Regulatory reporting teams",
        "Portfolio managers",
      ],
    });
    console.log("✅ Consumer data products seeded successfully");
  } catch (error) {
    console.error("Error seeding consumer data products:", error);
    throw error;
  }
}
