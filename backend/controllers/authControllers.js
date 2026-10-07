import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { cookieOptions } from "../config/env.js";
export const publicUser = (user) => {
  const { password, ...safe } = user.toObject();
  return safe;
};
export const signup = async (req, res) => {
  const { fullName, username, password, gender, age } = req.body;
  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    fullName.length > 80 ||
    typeof username !== "string" ||
    !/^[a-zA-Z0-9_]{3,30}$/.test(username) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72 ||
    !["male", "female", "other"].includes(gender) ||
    !Number.isInteger(Number(age)) ||
    Number(age) < 18 ||
    Number(age) > 100
  )
    return res
      .status(400)
      .json({
        error:
          "Use a name, 3–30 character username, 8–72 character password, gender and age 18–100.",
      });
  try {
    const user = await User.create({
      fullName: fullName.trim(),
      username: username.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      gender,
      age: Number(age),
    });
    generateToken(user._id, res);
    res.status(201).json(publicUser(user));
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: "Username already exists" });
    throw err;
  }
};
export const login = async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== "string" || typeof password !== "string")
    return res.status(400).json({ error: "Enter username and password" });
  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid username or password" });
  generateToken(user._id, res);
  res.json(publicUser(user));
};
export const logout = (req, res) => {
  res.clearCookie("jwt", cookieOptions());
  res.json({ message: "Logged out" });
};
