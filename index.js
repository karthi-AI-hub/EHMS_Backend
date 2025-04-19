const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const fs = require("fs");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const employeeRoutes = require("./src/routes/employeeRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const instructionRoutes = require("./src/routes/instructionRoutes");
const allergyRoutes = require("./src/routes/allergyRoutes");
const conditionRoutes = require("./src/routes/conditionRoutes");
const clinicRoutes = require("./src/routes/clinicRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const technicianRoutes = require("./src/routes/technicianRoutes");
const pool = require("./src/config/db");
const { syncModels } = require("./src/config/sequelize");
const { getAllEmployees, getAccess } = require("./src/controllers/employeeController");
const { authenticate, authorizeRoles } = require("./src/middlewares/authMiddleware");

dotenv.config();
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(
  `/allemployees`,
  authenticate,
  authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
  getAllEmployees
);

app.get(
  `/checkAccess`,
  authenticate,
  authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
  getAccess);
app.use(`/employee`, employeeRoutes);
app.use(`/auth`, authRoutes);
app.use(`/reports`, reportRoutes);
app.use(`/instructions`, instructionRoutes);
app.use(`/allergies`, allergyRoutes);
app.use(`/conditions`, conditionRoutes);
app.use(`/clinic`, clinicRoutes);
app.use(`/dashboard`, dashboardRoutes);
app.use(`/analytics`, analyticsRoutes);
app.use(`/doctors`, doctorRoutes);
app.use(`/technicians`, technicianRoutes);

// Ensure the temp directory exists
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("✅ Temp directory created:", tempDir);
}

// MySQL Connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  } else {
    console.log("✅ MySQL Connected");
    connection.release();
  }
});

// Sync Sequelize models
syncModels(); // Use the syncModels function from sequelize.js

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error("Error-handling middleware triggered:", err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Add this at the top of your routes or server file
app.get("/", (req, res) => {
  res.send("Backend is up and running!");
});

// Start the server
const PORT = process.env.PORT;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});