import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectToDatabase } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/projectsRoutes.js";

const app = express();

// ========================================
// CORS
// ========================================

const allowedOrigins = process.env.ORIGINS
    ? process.env.ORIGINS
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
    : ["http://localhost:5173"];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// ========================================
// MIDDLEWARE
// ========================================

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "AI Builder API is running",
    });
});

// ========================================
// ROUTES
// ========================================

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ========================================
// CENTRALIZED ERROR HANDLER
// ========================================

app.use((err, _req, res, _next) => {
    console.error("[Server Error]", err);

    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal server error",
    });
});

// ========================================
// START SERVER
// ========================================

const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectToDatabase();

        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("[Server] Failed to start:", error);
        process.exit(1);
    }
}

startServer();