import jwt from "jsonwebtoken";
import { cookieOptions } from "../config/env.js";
export default function generateTokenAndSetCookie(userId, res) {
  res.cookie(
    "jwt",
    jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" }),
    { ...cookieOptions(), maxAge: 7 * 86400000 },
  );
}
