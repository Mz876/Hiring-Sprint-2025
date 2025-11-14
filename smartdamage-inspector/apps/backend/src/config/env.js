const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || "development",
  hfApiKey: process.env.HF_API_KEY || "",
  qwenApiUrl: process.env.QWEN_API_URL || "",
  qwenApiKey: process.env.QWEN_API_KEY || "",
  roboflowApiKey: process.env.ROBOFLOW_API_KEY,
  roboflowModelId: process.env.ROBOFLOW_MODEL_ID || "car-damage-c1f0i",
  roboflowModelVersion: process.env.ROBOFLOW_MODEL_VERSION || "1",
};

module.exports = config;
