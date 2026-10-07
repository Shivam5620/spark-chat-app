import "./config/env.js";
import express from "express";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { app, server } from "./socket/socket.js";
import { corsOptions, production } from "./config/env.js";
app.use(cors(corsOptions));
// Reject untrusted browser origins for cookie-authenticated mutations as well.
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.get("/api/health", (req, res) => { const ready = mongoose.connection.readyState === 1; res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable" }); });
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found" }));
if (production) {
  const frontendPath = fileURLToPath(new URL("../frontend/vite-project/dist/", import.meta.url));
  if (!existsSync(path.join(frontendPath, "index.html"))) throw new Error("Frontend build missing. Run npm run build before npm start.");
  app.use(express.static(frontendPath));
  app.get("/{*path}", (req, res) => res.sendFile(path.join(frontendPath, "index.html")));
}
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.status || 500)
    .json({
      error: err.status
        ? err.message
        : "Something went wrong. Please try again.",
    });
});
if (
  !process.env.MONGO_URI ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
)
  throw new Error(
    "Set MONGO_URI and JWT_SECRET (at least 32 characters) in backend/.env",
  );
await mongoose.connect(process.env.MONGO_URI);
server.listen(Number(process.env.PORT || 8000), "0.0.0.0", () =>
  console.log(`Spark API running on port ${process.env.PORT || 8000}`),
);

for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => {
  server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  setTimeout(() => process.exit(0), 10000).unref();
});
