import express from "express";
import { errorMiddleware } from "../middleware/error-middleware.js";
import { publicRouter } from "../route/public-api.js";
import { authRouter } from "../route/auth-api.js";
import path from "path";
import cors from "cors";

export const web = express();

// Define your allowed origins
const allowedOrigins = [
  "http://localhost:5173/",
  "http://86.38.204.197:3001",
  // Add other allowed origins here
];

// CORS middleware configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // If you need to support cookies
  })
);

// Serve static files from the 'public' directory
const __dirname = path.resolve();
web.use(express.static(path.join(__dirname, "public")));

web.use(express.json());
web.use(publicRouter);
web.use(authRouter);
web.use(errorMiddleware);
