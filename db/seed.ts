import { db } from "@db";
import { dataProducts } from "@db/schema";

async function seed() {
  try {
    // Market Data
    await db.insert(dataProducts).values({
      name: "Market Data",
      description: "Real-time and historical market data from various exchanges and data providers",
      owner: "Market Data Team",
      domain: "Market",
      sources: ["Bloomberg", "Reuters", "exchange feeds"],
      schema: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Unique identifier for the financial instrument"
          },
          price: {
            type: "number",
            description: "Current market price"
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Time of the price update"
          },
          volume: {
            type: "number",
            description: "Trading volume"
          },
          exchange: {
            type: "string",
            description: "Source exchange"
          }
        },
        required: ["symbol", "price", "timestamp"]
      },
      tags: ["market-data", "real-time", "pricing"],
      sla: "99.99% availability during market hours",
      updateFrequency: "Real-time"
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
            description: "Unique trade identifier"
          },
          instrumentId: {
            type: "string",
            description: "Identifier of the traded instrument"
          },
          quantity: {
            type: "number",
            description: "Trade quantity"
          },
          price: {
            type: "number",
            description: "Trade execution price"
          },
          tradeDate: {
            type: "string",
            format: "date-time",
            description: "Date and time of trade execution"
          },
          settlementDate: {
            type: "string",
            format: "date",
            description: "Settlement date"
          },
          status: {
            type: "string",
            enum: ["pending", "settled", "cancelled"],
            description: "Current trade status"
          }
        },
        required: ["tradeId", "instrumentId", "quantity", "price", "tradeDate"]
      },
      tags: ["trading", "positions", "settlement"],
      sla: "99.9% availability",
      updateFrequency: "Near real-time"
    });

    // Reference Data
    await db.insert(dataProducts).values({
      name: "Reference Data",
      description: "Static and reference data for financial instruments and entities",
      owner: "Reference Data Team",
      domain: "Reference",
      sources: ["Internal or external master data services"],
      schema: {
        type: "object",
        properties: {
          instrumentId: {
            type: "string",
            description: "Unique identifier for the instrument"
          },
          isin: {
            type: "string",
            description: "International Securities Identification Number"
          },
          cusip: {
            type: "string",
            description: "CUSIP identifier"
          },
          instrumentType: {
            type: "string",
            enum: ["equity", "bond", "derivative", "fund"],
            description: "Type of financial instrument"
          },
          issuer: {
            type: "string",
            description: "Issuing entity"
          },
          issuanceDate: {
            type: "string",
            format: "date",
            description: "Date of issuance"
          }
        },
        required: ["instrumentId", "instrumentType"]
      },
      tags: ["reference-data", "static-data"],
      sla: "99.9% availability",
      updateFrequency: "Daily"
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
            description: "Unique identifier for the risk factor"
          },
          factorType: {
            type: "string",
            enum: ["interest-rate", "fx-rate", "credit-spread", "volatility"],
            description: "Type of risk factor"
          },
          value: {
            type: "number",
            description: "Current value of the risk factor"
          },
          confidenceInterval: {
            type: "number",
            description: "Confidence interval for the value"
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Time of the last update"
          }
        },
        required: ["factorId", "factorType", "value"]
      },
      tags: ["risk", "market-risk", "scenarios"],
      sla: "99.9% availability",
      updateFrequency: "Daily"
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
            description: "Unique identifier for the counterparty"
          },
          exposureAmount: {
            type: "number",
            description: "Current exposure amount"
          },
          rating: {
            type: "string",
            description: "Credit rating"
          },
          pdScore: {
            type: "number",
            description: "Probability of default score"
          },
          lastReviewDate: {
            type: "string",
            format: "date",
            description: "Date of last credit review"
          }
        },
        required: ["counterpartyId", "exposureAmount", "rating"]
      },
      tags: ["credit-risk", "exposure", "ratings"],
      sla: "99.9% availability",
      updateFrequency: "Daily"
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
            description: "Unique identifier for the regulatory report"
          },
          reportType: {
            type: "string",
            enum: ["MIFID", "EMIR", "SFTR", "FRTB"],
            description: "Type of regulatory report"
          },
          submissionDate: {
            type: "string",
            format: "date-time",
            description: "Date and time of report submission"
          },
          status: {
            type: "string",
            enum: ["draft", "submitted", "accepted", "rejected"],
            description: "Status of the regulatory report"
          },
          validationErrors: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of validation errors if any"
          }
        },
        required: ["reportId", "reportType", "submissionDate", "status"]
      },
      tags: ["regulatory", "compliance", "reporting"],
      sla: "99.99% availability",
      updateFrequency: "As required by regulation"
    });

    console.log("✅ Seed data inserted successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

// Export the seed function to be used by the runner
export { seed };