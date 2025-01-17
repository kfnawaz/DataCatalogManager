import { seed_dataProducts } from "./seed_dataProducts.js";
import { seed_metricsData } from "./seed_metricDefinitions.js";

// Seed data products first, then metrics
async function runSeeding() {
  try {
    await seed_dataProducts();
    console.log("✅ Data products seeded successfully!");

    await seed_metricDefinitions();
    console.log("✅ Metric Definitions seeded successfully!");

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

runSeeding();
