import mongoose from "mongoose";

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "chatapp", // ✅ THIS ENSURES all data goes to chatapp DB
    });
    console.log("CONNECTED TO MONGODB");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectToMongoDB;
