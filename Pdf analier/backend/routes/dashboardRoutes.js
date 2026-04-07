import express from "express";
import Resume from "../models/Resume.js";

const router = express.Router();

router.get("/resumes", async (req, res) => {
  const data = await Resume.find().sort({ createdAt: -1 });
  res.json(data);
});

router.get("/search", async (req, res) => {
  const { name, company } = req.query;

  const query = {};
  if (name) query.name = { $regex: name, $options: "i" };
  if (company) query.company = { $regex: company, $options: "i" };

  const data = await Resume.find(query);
  res.json(data);
});

export default router;