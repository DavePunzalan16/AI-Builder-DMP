import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToDatabase } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";

const app = express();

const allowedOrigins = process.env.ORIGINS
    ? process.env.ORIGINS.split(",")
    : [];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is Live!");
});

app.use('/api/auth', authRouter)

// Centralized Error Handler
app.use((err, _req, res, _next) => {
    console.error("[Error]", err);

    res.status(500).json({
        error: err.message
    });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

connectToDatabase();