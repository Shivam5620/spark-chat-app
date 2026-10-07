import { Server } from "socket.io";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { corsOptions, originAllowed } from "../config/env.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  allowRequest: (req, callback) =>
    callback(null, originAllowed(req.headers.origin)),
});
io.use(async (socket, next) => {
  try {
    const token = (socket.handshake.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("jwt="))
      ?.slice(4);
    const decoded = jwt.verify(token || "", process.env.JWT_SECRET);
    if (!(await User.exists({ _id: decoded.userId })))
      return next(new Error("Unauthorized"));
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});
io.on("connection", (socket) => {
  socket.join(socket.data.userId);
});
export { app, io, server };
