import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import healthCheckRouter from "./routes/healthCheck.route.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";

const app = express();

// middlewares
app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser({ limit: "16kb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || `http://localhost:5173`,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (req, res) => {
  res.send("Hello express");
});

// routes
app.use("/api/v1/health-check", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);

export default app;
