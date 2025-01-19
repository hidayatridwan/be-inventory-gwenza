import express from "express";
import { errorMiddleware } from "../middleware/error-middleware.js";
import { publicRouter } from "../route/public-api.js";
import { authRouter } from "../route/auth-api.js";
import path from "path";
import cors from "cors";

export const web = express();

// Configure CORS to allow all origins
web.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  })
);

// Serve static files from the 'public' directory
const __dirname = path.resolve();
web.use(express.static(path.join(__dirname, "public")));

web.use(express.json());
web.use(publicRouter);
web.use(authRouter);
web.use(errorMiddleware);
