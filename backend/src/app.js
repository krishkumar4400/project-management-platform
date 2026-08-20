import express from "express";

const app = express();

// middlewares
app.use(express.json({ limit: "16kb" }));

app.get("/", (req, res) => {
  res.send("Hello express");
});

export default app;
