import { db } from "@db";
import { metricTemplates } from "@db/schema";
import { eq } from "drizzle-orm";
import { seedDataProducts } from "./seed_data_products";
import { seedLineageData } from "./seed_lineage.ts";

const defaultTemplates = [
  {
    name: "Null Value Check",
    description: "Measures the percentage of non-null values in specified columns",
    type: "completeness" as const,
    defaultFormula: "COUNT(*) FILTER (WHERE {column} IS NOT NULL) * 100.0 / COUNT(*)",
    parameters: {
      column: {
        type: "string",
        description: "Column name to check for null values",
        required: true
      }
    },
    example: "Checking null values in the 'email' column",
    tags: ["completeness", "null-check"]
  },
  {
    name: "Value Range Check",
    description: "Verifies if numeric values fall within an expected range",
    type: "accuracy" as const,
    defaultFormula: "COUNT(*) FILTER (WHERE {column} BETWEEN {min} AND {max}) * 100.0 / COUNT(*)",
    parameters: {
      column: {
        type: "string",
        description: "Column name to check",
        required: true
      },
      min: {
        type: "number",
        description: "Minimum acceptable value",
        required: true
      },
      max: {
        type: "number",
        description: "Maximum acceptable value",
        required: true
      }
    },
    example: "Checking if age values are between 0 and 120",
    tags: ["accuracy", "range-check"]
  },
  {
    name: "Pattern Match Check",
    description: "Validates if text values match a specific pattern",
    type: "validity" as const,
    defaultFormula: "COUNT(*) FILTER (WHERE {column} ~ {pattern}) * 100.0 / COUNT(*)",
    parameters: {
      column: {
        type: "string",
        description: "Column name to validate",
        required: true
      },
      pattern: {
        type: "string",
        description: "Regular expression pattern",
        required: true
      }
    },
    example: "Validating email format with regex pattern",
    tags: ["validity", "pattern-match"]
  }
];

export async function seedTemplates() {
  try {
    console.log("Seeding metric templates...");

    for (const template of defaultTemplates) {
      const [existing] = await db
        .select()
        .from(metricTemplates)
        .where(eq(metricTemplates.name, template.name))
        .limit(1);

      if (!existing) {
        await db.insert(metricTemplates).values({
          name: template.name,
          description: template.description,
          type: template.type,
          defaultFormula: template.defaultFormula,
          parameters: template.parameters,
          example: template.example,
          tags: template.tags,
        });
        console.log(`Created template: ${template.name}`);
      } else {
        console.log(`Template already exists: ${template.name}`);
      }
    }

    console.log("Finished seeding metric templates");
  } catch (error) {
    console.error("Error seeding metric templates:", error);
    throw error;
  }
}

// Run all seed functions if file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  Promise.all([seedTemplates(), seedDataProducts(), seedLineageData()])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}