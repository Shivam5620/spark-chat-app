import mongoose from "mongoose";
import Message from "../models/messageModel.js";
import Swipe from "../models/swipeModel.js";
import { io } from "../socket/socket.js";
async function canChat(from, to) {
  return (
    mongoose.isValidObjectId(to) &&
    (await Swipe.exists({ from, to, action: "like" })) &&
    (await Swipe.exists({ from: to, to: from, action: "like" }))
  );
}
export const sendMessage = async (req, res) => {
  const from = req.user._id,
    to = req.params.id;
  if (!(await canChat(from, to)))
    return res
      .status(403)
      .json({ error: "You can chat after a mutual match." });
  if (
    typeof req.body.message !== "string" ||
    !req.body.message.trim() ||
    req.body.message.length > 2000
  )
    return res
      .status(400)
      .json({ error: "Message must be 1–2000 characters." });
  const message = await Message.create({
    senderId: from,
    receiverId: to,
    message: req.body.message.trim(),
  });
  io.to(to).to(String(from)).emit("newMessage", message);
  res.status(201).json(message);
};
export const getMessages = async (req, res) => {
  const from = req.user._id,
    to = req.params.id;
  if (!(await canChat(from, to)))
    return res
      .status(403)
      .json({ error: "You can chat after a mutual match." });
  const rows = await Message.find({
    $or: [
      { senderId: from, receiverId: to },
      { senderId: to, receiverId: from },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(rows.reverse());
};
