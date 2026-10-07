import axios from "axios";
export const serverUrl = (import.meta.env.VITE_API_URL || "").replace(
  /\/$/,
  "",
);
export const api = axios.create({
  baseURL: `${serverUrl}/api`,
  withCredentials: true,
  timeout: 15000,
});
export const errorText = (err) =>
  err.response?.data?.error ||
  (err.code === "ERR_NETWORK"
    ? "Cannot reach the server. Check the backend, database and CLIENT_URLS configuration."
    : err.message);
