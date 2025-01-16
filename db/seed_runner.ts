import { seed } from "./seed.js";

seed()
  .then(() => {
    console.log("Database seeded successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });