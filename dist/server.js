import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routers/index.js";
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/", router);
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "";
app.listen(PORT, async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Server is running on port ${PORT}`);
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
});
