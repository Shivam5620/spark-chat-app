import express from "express";
import { signup, login, logout } from "../controllers/authControllers.js";

import protectRoute from "../middleware/protectRoute.js";
const router = express.Router();
router.get("/me", protectRoute, (req, res) => res.json(req.user));

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;
