import { config as dotenvConfig } from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables from .env file
dotenvConfig();

const databaseName = "production";
const categoriesCollectionName = "categories";

const predefinedCategories = [
  {
    name: "Housing",
    description: "Expenses related to rent and utilities for your residence.",
  },
  {
    name: "Food",
    description: "Expenses related to groceries and dining out.",
  },
  {
    name: "Healthcare",
    description:
      "Medical expenses including insurance, prescriptions, and doctor visits.",
  },
  {
    name: "Transportation",
    description: "Costs associated with commuting and travel.",
  },
  {
    name: "Family Support",
    description: "Financial assistance provided to family members.",
  },
  {
    name: "Education",
    description: "Tuition fees, books, and other educational expenses.",
  },
  {
    name: "Personal",
    description:
      "Spending on entertainment, hobbies, and personal items like clothing.",
  },
];

export async function initializePredefinedCategories() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MongoDB URI not found in environment variables.");
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db(databaseName);
    const categoryCollection = database.collection(categoriesCollectionName);

    const existingCategories = await categoryCollection
      .find({ createdByUserId: { $exists: false } })
      .toArray();

    console.log("Existing categories:", existingCategories);
    if (existingCategories.length === 0) {
      await categoryCollection.insertMany(
        predefinedCategories.map((category) => ({
          ...category,
          createdAt: new Date(),
        })),
      );
      console.log("Predefined categories inserted successfully.");
    } else {
      console.log("Predefined categories already exist in the database.");
    }
  } catch (error) {
    console.error("Error initializing predefined categories:", error);
  } finally {
    await client.close();
  }
}
