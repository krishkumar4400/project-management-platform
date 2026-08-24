import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import healthCheckRouter from "./routes/healthCheck.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

// middlewares

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
  message: "Too many request from this IP, please try later",
});

// Apply the rate limiting middleware to all requests.
app.use("/api", limiter);

// security middlewares
app.use(helmet());

// mongoose sanitizer middleware
app.use(mongoSanitize());

// Express middleware to protect against HTTP Parameter Pollution attacks
app.use(hpp());

// body parser middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//cookie parser middleware
app.use(cookieParser());

// logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// cors configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || `http://localhost:5173`,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  }),
);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: "error",
    message: error.message || "Internal server error",
    success: false,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// API routes
app.use("/health", healthCheckRouter);
app.use("/api/v1/users", userRouter);

// 404 handler
// it should be always at bottom
app.use((req, res) => {
  res.status(404).json({
    message: "Page not found",
    success: false,
  });
});

export default app;
