const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || "development",
  hfApiKey: process.env.HF_API_KEY || "",
  qwenApiUrl: process.env.QWEN_API_URL || "",
  qwenApiKey: process.env.QWEN_API_KEY || "",
};

module.exports = config;
