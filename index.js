const express = require("express");
const connectDB = require("./config/db");
const cors = require('cors');
require("dotenv").config();

const courseRoutes = require("./routes/course_route");
const semesterRoutes = require("./routes/semester_route");
const subjectRoutes = require("./routes/subject_route");
const paperRoutes = require("./routes/paper_route");
const authRoutes = require("./routes/auth_route");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


// Database Connection
connectDB();

// Routes
app.use("/api/course", courseRoutes);
app.use("/api/semester", semesterRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/paper", paperRoutes);
app.use("/api/auth", authRoutes);
// Serve uploads folder (temp files) - optional for debugging
app.use('/uploads', express.static('uploads'));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
