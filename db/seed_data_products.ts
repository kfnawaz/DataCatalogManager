import { db } from "@db";
import { dataProducts, qualityMetrics, metricDefinitions, lineageNodes, lineageEdges } from "@db/schema";
import { eq } from "drizzle-orm";

const productsToSeed = [
  {
    name: "VaR Report Data Product",
    description: "Consumer-aligned data product for Value at Risk reporting with comprehensive risk metrics",
    owner: "Risk Management Team",
    domain: "Risk Analytics",
    schema: {
      columns: [
        {
          name: "portfolio_id",
          type: "STRING",
          description: "Unique identifier for the portfolio"
        },
        {
          name: "confidence_level",
          type: "FLOAT",
          description: "Statistical confidence level for VaR calculation (e.g., 95%, 99%)"
        },
        {
          name: "calculation_date",
          type: "DATE",
          description: "Date when the VaR calculation was performed"
        },
        {
          name: "methodology",
          type: "STRING",
          description: "VaR calculation methodology (Historical Simulation, Monte Carlo, Parametric)"
        },
        {
          name: "lookback_period",
          type: "INTEGER",
          description: "Historical period used for VaR calculation in days"
        },
        {
          name: "risk_factor_changes",
          type: "ARRAY",
          description: "Array of historical risk factor changes used in calculation"
        }
      ]
    },
    tags: ["risk-management", "var", "reporting", "regulatory-compliance"],
    sla: "Daily by 8:00 AM EST",
    updateFrequency: "Daily"
  },
  {
    name: "Portfolio Risk Metrics",
    description: "Comprehensive risk analytics dashboard providing portfolio-level risk insights and monitoring",
    owner: "Risk Analytics Team",
    domain: "Risk Analytics",
    schema: {
      columns: [
        {
          name: "portfolio_id",
          type: "STRING",
          description: "Unique identifier for the portfolio"
        },
        {
          name: "total_exposure",
          type: "FLOAT",
          description: "Total market exposure of the portfolio in base currency"
        },
        {
          name: "gamma_exposure",
          type: "FLOAT",
          description: "Portfolio's exposure to gamma risk"
        },
        {
          name: "volatility",
          type: "FLOAT",
          description: "Historical volatility of portfolio returns"
        },
        {
          name: "beta",
          type: "FLOAT",
          description: "Portfolio beta relative to benchmark"
        },
        {
          name: "sharpe_ratio",
          type: "FLOAT",
          description: "Risk-adjusted return metric"
        },
        {
          name: "tracking_error",
          type: "FLOAT",
          description: "Portfolio tracking error vs benchmark"
        }
      ]
    },
    tags: ["risk-metrics", "portfolio-analytics", "performance"],
    sla: "Daily by 9:00 AM EST",
    updateFrequency: "Daily"
  },
  {
    name: "ESG Score Analytics",
    description: "Environmental, Social, and Governance scoring and analysis for investment portfolios",
    owner: "ESG Research Team",
    domain: "Sustainable Finance",
    schema: {
      columns: [
        {
          name: "company_id",
          type: "STRING",
          description: "Unique identifier for the company"
        },
        {
          name: "environmental_score",
          type: "FLOAT",
          description: "Environmental impact score (0-100)"
        },
        {
          name: "social_score",
          type: "FLOAT",
          description: "Social responsibility score (0-100)"
        },
        {
          name: "governance_score",
          type: "FLOAT",
          description: "Corporate governance score (0-100)"
        },
        {
          name: "controversies_count",
          type: "INTEGER",
          description: "Number of ESG controversies"
        },
        {
          name: "carbon_footprint",
          type: "FLOAT",
          description: "Carbon emissions metric tons CO2e"
        }
      ]
    },
    tags: ["esg", "sustainable-investing", "green-finance"],
    sla: "Weekly by Monday 9:00 AM EST",
    updateFrequency: "Weekly"
  },
  {
    name: "Market Risk Factors",
    description: "Comprehensive market risk factor data including volatilities, correlations, and risk premia",
    owner: "Market Data Team",
    domain: "Market Data",
    schema: {
      columns: [
        {
          name: "risk_factor_id",
          type: "STRING",
          description: "Unique identifier for the risk factor"
        },
        {
          name: "factor_type",
          type: "STRING",
          description: "Type of risk factor (equity, rates, fx, credit)"
        },
        {
          name: "historical_volatility",
          type: "FLOAT",
          description: "Historical volatility measure"
        },
        {
          name: "correlation_matrix",
          type: "JSON",
          description: "Correlation matrix with other risk factors"
        },
        {
          name: "source",
          type: "STRING",
          description: "Data source provider"
        },
        {
          name: "last_updated",
          type: "TIMESTAMP",
          description: "Last update timestamp"
        }
      ]
    },
    tags: ["market-risk", "risk-factors", "real-time-data"],
    sla: "Real-time",
    updateFrequency: "Intraday"
  },
  {
    name: "Trading Strategy Performance",
    description: "Performance analytics and risk metrics for systematic trading strategies",
    owner: "Quantitative Trading Team",
    domain: "Trading Analytics",
    schema: {
      columns: [
        {
          name: "strategy_id",
          type: "STRING",
          description: "Unique strategy identifier"
        },
        {
          name: "returns",
          type: "ARRAY",
          description: "Historical returns array"
        },
        {
          name: "sharpe_ratio",
          type: "FLOAT",
          description: "Strategy Sharpe ratio"
        },
        {
          name: "max_drawdown",
          type: "FLOAT",
          description: "Maximum historical drawdown"
        },
        {
          name: "win_rate",
          type: "FLOAT",
          description: "Percentage of profitable trades"
        },
        {
          name: "execution_metrics",
          type: "JSON",
          description: "Trading execution quality metrics"
        }
      ]
    },
    tags: ["trading", "strategy", "performance-analytics"],
    sla: "Daily by 6:00 PM EST",
    updateFrequency: "Daily"
  },
  {
    name: "Regulatory Compliance Analytics",
    description: "Regulatory reporting and compliance analytics for financial institutions",
    owner: "Regulatory Reporting Team",
    domain: "Regulatory",
    schema: {
      columns: [
        {
          name: "report_id",
          type: "STRING",
          description: "Unique report identifier"
        },
        {
          name: "regulation_type",
          type: "STRING",
          description: "Type of regulation (Basel, Dodd-Frank, etc.)"
        },
        {
          name: "compliance_status",
          type: "STRING",
          description: "Current compliance status"
        },
        {
          name: "risk_indicators",
          type: "JSON",
          description: "Key risk indicators for regulatory compliance"
        },
        {
          name: "submission_deadline",
          type: "TIMESTAMP",
          description: "Regulatory submission deadline"
        }
      ]
    },
    tags: ["regulatory", "compliance", "reporting"],
    sla: "Monthly by 5th business day",
    updateFrequency: "Monthly"
  }
];

export async function seedDataProducts() {
  try {
    console.log("Seeding data products...");

    // Create base metric definitions if they don't exist
    const baseMetrics = [
      { 
        name: "Data Completeness", 
        type: "completeness" as const, 
        description: "Measures the completeness of required data fields",
        defaultFormula: "COUNT(*) FILTER (WHERE {column} IS NOT NULL) * 100.0 / COUNT(*)",
        parameters: {
          column: {
            type: "string",
            description: "Column to check for completeness",
            required: true
          }
        }
      },
      { 
        name: "Data Accuracy", 
        type: "accuracy" as const, 
        description: "Measures the accuracy of data values",
        defaultFormula: "COUNT(*) FILTER (WHERE {validation_check}) * 100.0 / COUNT(*)",
        parameters: {
          validation_check: {
            type: "string",
            description: "SQL condition for accuracy check",
            required: true
          }
        }
      },
      { 
        name: "Data Timeliness", 
        type: "timeliness" as const, 
        description: "Measures how current the data is",
        defaultFormula: "COUNT(*) FILTER (WHERE {timestamp_column} >= NOW() - INTERVAL '{max_age}') * 100.0 / COUNT(*)",
        parameters: {
          timestamp_column: {
            type: "string",
            description: "Timestamp column to check",
            required: true
          },
          max_age: {
            type: "string",
            description: "Maximum acceptable age (e.g., '1 day')",
            required: true
          }
        }
      }
    ];

    for (const metric of baseMetrics) {
      const [existing] = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.name, metric.name))
        .limit(1);

      if (!existing) {
        await db.insert(metricDefinitions).values(metric);
        console.log(`Created metric definition: ${metric.name}`);
      }
    }

    // Seed data products
    for (const product of productsToSeed) {
      const [existing] = await db
        .select()
        .from(dataProducts)
        .where(eq(dataProducts.name, product.name))
        .limit(1);

      if (!existing) {
        const [newProduct] = await db.insert(dataProducts).values(product).returning();
        console.log(`Created data product: ${product.name}`);

        // Get metric definitions
        const metrics = await db.select().from(metricDefinitions);

        // Add sample quality metrics for each product
        for (const metric of metrics) {
          // Generate realistic quality metrics based on product domain and type
          let value = Math.floor(Math.random() * 30) + 70; // Random value between 70-100

          // Adjust metrics based on product characteristics
          if (product.updateFrequency === "Real-time") {
            value = Math.min(value + 10, 100); // Real-time data tends to be more accurate
          } else if (product.updateFrequency === "Monthly") {
            value = Math.max(value - 5, 0); // Monthly data might be less timely
          }

          await db.insert(qualityMetrics).values({
            dataProductId: newProduct.id,
            metricDefinitionId: metric.id,
            value,
            metadata: {
              lastChecked: new Date().toISOString(),
              samplingRate: "100%",
              confidenceScore: 0.95
            }
          });
        }
      } else {
        console.log(`Data product already exists: ${product.name}`);
      }
    }

    console.log("Finished seeding data products");
  } catch (error) {
    console.error("Error seeding data products:", error);
    throw error;
  }
}

// Run seed function if file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedDataProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}