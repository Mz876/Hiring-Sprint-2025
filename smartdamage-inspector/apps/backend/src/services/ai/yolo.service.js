// services/ai/yolo.service.js
const axios = require("axios");
const config = require("../../config/env");

async function detectDamage(imageBuffer) {
  if (!config.roboflowApiKey) {
    console.warn("ROBOFLOW_API_KEY not set, returning mock YOLO result.");
    return {
      mock: true,
      predictions: [],
      note: "Set ROBOFLOW_API_KEY in .env to enable real Roboflow calls.",
    };
  }

  const modelId = config.roboflowModelId;
  const version = config.roboflowModelVersion;
  const url = `https://serverless.roboflow.com/${modelId}/${version}`;
  const imageBase64 = imageBuffer.toString("base64");

  try {
    const response = await axios({
      method: "POST",
      url,
      params: {
        api_key: config.roboflowApiKey,
        confidence: 0.2,  // lower threshold so it’s less picky
        overlap: 0.3,
      },
      data: imageBase64,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        
      },
    });

    // Roboflow returns { predictions: [...] }
    return response.data;
  } catch (err) {
    console.error(
      "detectDamage Roboflow error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error("detectDamage: Roboflow request failed");
  }
}

module.exports = { detectDamage };
