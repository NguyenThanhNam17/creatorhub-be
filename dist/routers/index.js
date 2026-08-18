import express from "express";
import api from "./apis/index.js";
const router = express.Router();
router.use("/api", api);
export default router;
