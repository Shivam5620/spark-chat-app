import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    age: { type: Number, min: 18, max: 100 },
    bio: { type: String, default: "", maxlength: 300 },
    city: { type: String, default: "", maxlength: 80 },
    interests: { type: [String], default: [] },
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
