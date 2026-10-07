import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
if (process.env.NODE_ENV !== "production") dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
export const production = process.env.NODE_ENV === "production";
const configuredOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || (production ? "" : "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174");
export const allowedOrigins = [
  ...configuredOrigins.split(","),
  process.env.RENDER_EXTERNAL_URL || "",
].map(value => value.trim().replace(/\/$/, "")).filter(Boolean);
export const originAllowed = (origin) =>
  !origin || allowedOrigins.includes(origin);
export const corsOptions = {
  origin(origin, callback) {
    const error = new Error(
      "Origin not allowed. Add the frontend origin to CLIENT_URLS in backend/.env.",
    );
    error.status = 403;
    callback(originAllowed(origin) ? null : error, originAllowed(origin));
  },
  credentials: true,
};
export const cookieOptions = () => ({
  httpOnly: true,
  secure: production,
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
  path: "/",
});
