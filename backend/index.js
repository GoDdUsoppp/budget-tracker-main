import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import insightsRoutes from "./routes/insights.js";
import expenseRoutes from "./routes/expenses.js";
import categoryRoutes from "./routes/categories.js";
import accountRoutes from "./routes/accounts.js";
import incomeRoutes from "./routes/income.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import groupRoutes from './routes/groups.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/groups', groupRoutes);
app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
