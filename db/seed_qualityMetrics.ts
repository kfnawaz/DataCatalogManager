
import { db } from "@db";
import { qualityMetrics } from "@db/schema";

export async function seed_qualityMetrics() {
  try {
    // Get all data products and metric definitions
    const dataProducts = await db.query.dataProducts.findMany();
    const metricDefinitions = await db.query.metricDefinitions.findMany();

    // Create historical data for the last 30 days
    const today = new Date();
    const metrics = [];

    for (const dataProduct of dataProducts) {
      // Get domain-specific metrics based on data product's domain
      const domainMetrics = metricDefinitions.filter(md => {
        if (dataProduct.domain === "Market" && md.name.includes("Market")) return true;
        if (dataProduct.domain === "Trading" && md.name.includes("Trade")) return true;
        if (dataProduct.domain === "Risk" && md.name.includes("Risk")) return true;
        if (dataProduct.domain === "Reference" && md.name.includes("Identifier")) return true;
        return false;
      });

      // Get generic metrics
      const genericMetrics = metricDefinitions.filter(md => 
        ["Record Completeness", "Data Value Accuracy", "Update Timeliness"]
        .includes(md.name)
      );

      // Combine applicable metrics
      const applicableMetrics = [...domainMetrics, ...genericMetrics];

      // Generate 30 days of historical data
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        for (const metric of applicableMetrics) {
          // Generate realistic metric values based on metric type
          let value;
          switch (metric.type) {
            case "completeness":
              // Completeness metrics typically high (95-100%)
              value = Math.floor(95 + Math.random() * 5);
              break;
            case "accuracy":
              // Accuracy metrics typically very high (98-100%)
              value = Math.floor(98 + Math.random() * 2);
              break;
            case "timeliness":
              // Timeliness metrics more variable (85-100%)
              value = Math.floor(85 + Math.random() * 15);
              break;
            case "consistency":
              // Consistency metrics typically high (90-100%)
              value = Math.floor(90 + Math.random() * 10);
              break;
            default:
              value = Math.floor(90 + Math.random() * 10);
          }

          metrics.push({
            dataProductId: dataProduct.id,
            metricDefinitionId: metric.id,
            value: value,
            metadata: {
              calculationTime: date.toISOString(),
              parameters: metric.parameters
            },
            timestamp: date
          });
        }
      }
    }

    // Insert all metrics
    await db.insert(qualityMetrics).values(metrics);

    console.log("✅ Quality metrics seeded successfully!");
  } catch (error) {
    console.error("Error seeding quality metrics:", error);
    throw error;
  }
}
