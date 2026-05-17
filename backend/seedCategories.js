import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Category from "./models/Category.js";

const seedCategories = async () => {
  await connectDB();

  const count = await Category.countDocuments();
  if (count > 0) {
    console.log("Categories already exist");
    process.exit();
  }

  const categories = [
    { name: "Food" },
    { name: "Travel" },
    { name: "Rent" },
    { name: "Shopping" },
    { name: "Entertainment" },
    { name: "Utilities" }
  ];

  await Category.insertMany(categories);
  console.log("Categories seeded successfully");
  process.exit();
};

seedCategories();
