import express from "express";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Swipe from "../models/swipeModel.js";
import protectRoute from "../middleware/protectRoute.js";
import { io } from "../socket/socket.js";
const router = express.Router();
router.use(protectRoute);
router.get("/", async (req, res) => {
  const swipes = await Swipe.find({ from: req.user._id }).distinct("to");
  res.json(
    await User.find({
      _id: { $nin: [req.user._id, ...swipes] },
      age: { $gte: 18 },
    })
      .select("-password")
      .limit(100),
  );
});
router.get("/matches", async (req, res) => {
  const liked = await Swipe.find({
    from: req.user._id,
    action: "like",
  }).distinct("to");
  const mutual = await Swipe.find({
    from: { $in: liked },
    to: req.user._id,
    action: "like",
  }).distinct("from");
  res.json(await User.find({ _id: { $in: mutual } }).select("-password"));
});
router.patch("/me", async (req, res) => {
  const { bio, city, interests, profilePic, age } = req.body;
  if (
    typeof bio !== "string" ||
    bio.length > 300 ||
    typeof city !== "string" ||
    city.length > 80 ||
    !Array.isArray(interests) ||
    interests.length > 8 ||
    interests.some((x) => typeof x !== "string" || x.length > 30) ||
    !Number.isInteger(Number(age)) ||
    Number(age) < 18 ||
    Number(age) > 100 ||
    typeof profilePic !== "string" ||
    (profilePic && !/^https:\/\//.test(profilePic))
  )
    return res
      .status(400)
      .json({
        error:
          "Check your profile: age 18–100, bio up to 300 characters, 8 interests maximum and an HTTPS photo URL.",
      });
  res.json(
    await User.findByIdAndUpdate(
      req.user._id,
      { bio, city, interests, profilePic, age: Number(age) },
      { new: true, runValidators: true },
    ).select("-password"),
  );
});
router.post("/:id/swipe", async (req, res) => {
  const { id } = req.params;
  if (
    !mongoose.isValidObjectId(id) ||
    id === String(req.user._id) ||
    !["like", "pass"].includes(req.body.action)
  )
    return res.status(400).json({ error: "Invalid swipe" });
  if (!req.user.age || !(await User.exists({ _id: id, age: { $gte: 18 } })))
    return res
      .status(400)
      .json({
        error: "Complete your adult profile before discovering people.",
      });
  const result = await Swipe.updateOne(
    { from: req.user._id, to: id },
    { $setOnInsert: { action: req.body.action } },
    { upsert: true },
  );
  const own = await Swipe.findOne({ from: req.user._id, to: id });
  const matched =
    own.action === "like" &&
    !!(await Swipe.exists({ from: id, to: req.user._id, action: "like" }));
  if (matched && result.upsertedCount)
    io.to(id).emit("match", { user: req.user });
  res.json({ matched });
});
export default router;
