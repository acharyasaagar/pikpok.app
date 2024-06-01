import { initializePredefinedCategories } from "./category";

async function seed() {
  console.log("Seeding predefined categories...");
  await initializePredefinedCategories();
}

seed();
