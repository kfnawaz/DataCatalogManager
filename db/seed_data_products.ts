import { db } from "@db";
import { dataProducts } from "@db/schema";
import { eq } from "drizzle-orm";

const productsToSeed = [
  {
    name: "VaR Report Data Product",
    description: "Consumer-aligned data product for Value at Risk reporting",
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
          description: "Confidence level of the VaR calculation"
        },
        {
          name: "calculation_date",
          type: "DATE",
          description: "Date of the VaR calculation"
        },
        {
          name: "methodology",
          type: "STRING",
          description: "Method used for VaR calculation (e.g., MC, HS)"
        }
      ]
    },
    tags: ["risk-management", "var", "reporting"],
    sla: "Daily by 8:00 AM EST",
    updateFrequency: "Daily"
  },
  {
    name: "Portfolio Risk Metrics",
    description: "Aggregated data product containing portfolio-level risk metrics",
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
          description: "Total market exposure of the portfolio"
        },
        {
          name: "gamma_exposure",
          type: "FLOAT",
          description: "Gamma exposure of the portfolio"
        },
        {
          name: "volatility",
          type: "FLOAT",
          description: "Portfolio volatility"
        }
      ]
    },
    tags: ["risk-metrics", "portfolio-analytics"],
    sla: "Daily by 9:00 AM EST",
    updateFrequency: "Daily"
  },
  {
    name: "Stress Test Scenarios",
    description: "Stress testing and scenario data for risk analysis",
    owner: "Scenario Analysis Team",
    domain: "Risk Scenarios",
    schema: {
      columns: [
        {
          name: "scenario_id",
          type: "STRING",
          description: "Unique identifier for the stress scenario"
        },
        {
          name: "scenario_description",
          type: "STRING",
          description: "Details of the stress scenario"
        },
        {
          name: "severity_level",
          type: "INTEGER",
          description: "Severity level of the stress test"
        }
      ]
    },
    tags: ["stress-testing", "scenarios"],
    sla: "Weekly by Friday 5:00 PM EST",
    updateFrequency: "Weekly"
  },
  {
    name: "Market Risk Factors",
    description: "Market data and risk factor information",
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
          description: "Type of risk factor (e.g., volatility)"
        },
        {
          name: "source",
          type: "STRING",
          description: "Source of the data (e.g., Bloomberg)"
        }
      ]
    },
    tags: ["market-risk", "risk-factors"],
    sla: "Real-time",
    updateFrequency: "Intraday"
  },
  {
    name: "Counterparty Risk Metrics",
    description: "Counterparty risk assessment and metrics",
    owner: "Credit Risk Team",
    domain: "Credit Risk",
    schema: {
      columns: [
        {
          name: "counterparty_id",
          type: "STRING",
          description: "Unique identifier for the counterparty"
        },
        {
          name: "exposure",
          type: "FLOAT",
          description: "Total exposure to the counterparty"
        },
        {
          name: "default_probability",
          type: "FLOAT",
          description: "Probability of default"
        }
      ]
    },
    tags: ["counterparty-risk", "credit-risk"],
    sla: "Daily by 10:00 AM EST",
    updateFrequency: "Daily"
  },
  {
    name: "Regulatory Metrics",
    description: "Metrics required for regulatory reporting",
    owner: "Regulatory Reporting Team",
    domain: "Regulatory",
    schema: {
      columns: [
        {
          name: "metric_id",
          type: "STRING",
          description: "Unique identifier for the regulatory metric"
        },
        {
          name: "metric_type",
          type: "STRING",
          description: "Type of regulatory metric"
        },
        {
          name: "value",
          type: "FLOAT",
          description: "Value of the metric"
        }
      ]
    },
    tags: ["regulatory", "compliance"],
    sla: "Monthly by 5th business day",
    updateFrequency: "Monthly"
  }
];

export async function seedDataProducts() {
  try {
    console.log("Seeding data products...");

    for (const product of productsToSeed) {
      const [existing] = await db
        .select()
        .from(dataProducts)
        .where(eq(dataProducts.name, product.name))
        .limit(1);

      if (!existing) {
        await db.insert(dataProducts).values(product);
        console.log(`Created data product: ${product.name}`);
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

if (require.main === module) {
  seedDataProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}