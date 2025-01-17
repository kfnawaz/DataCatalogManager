import { resetDatabase } from "./reset_db.js";
import { seed_dataProducts } from "./seed_dataProducts.js";
import { seed_metricDefinitions } from "./seed_metricDefinitions.js";
import { seed_lineageData } from "./seed_lineageData.js";
import { seed_qualityMetrics } from "./seed_qualityMetrics.js";
import { seed_commentMisc } from "./seed_commentMisc.js";

// Reset database and run seeding
async function runSeeding() {
  await resetDatabase();
  console.log("");
  try {
    await seed_dataProducts();
    console.log("✅ Data Products seeded successfully!");
    console.log("");

    await seed_metricDefinitions();
    console.log("✅ Metric Definitions seeded successfully!");
    console.log("");

    await seed_lineageData();
    console.log("✅ Lineage Data seeded successfully!");
    console.log("");

    await seed_qualityMetrics();
    console.log("✅ Quality metrics seeded successfully!");
    console.log("");

    await seed_commentMisc();
    console.log("✅ Comment misc seeded successfully!");
    console.log("");

console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

runSeeding();