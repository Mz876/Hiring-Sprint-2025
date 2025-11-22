// services/ai/yolo.service.js - IMPROVED: Never throws errors
const axios = require("axios");
const config = require("../../config/env");

/**
 * Detect damage in an image using YOLO model.
 * 
 */
async function detectDamage(imageBuffer) {
  // Case 1: No API key configured
  if (!config.roboflowApiKey) {
    console.warn("ROBOFLOW_API_KEY not set, returning mock YOLO result.");
    return {
      mock: true,
      predictions: [],
      error: null,
      note: "Set ROBOFLOW_API_KEY in .env to enable real Roboflow calls.",
    };
  }

  const modelId = config.roboflowModelId;
  const version = config.roboflowModelVersion;
  const url = `https://serverless.roboflow.com/${modelId}/${version}`;

  try {
    const imageBase64 = imageBuffer.toString("base64");
    
    const response = await axios({
      method: "POST",
      url,
      params: {
        api_key: config.roboflowApiKey,
        confidence: 0.2,
        overlap: 0.3,
      },
      data: imageBase64,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 60000,
    });

    // Success - return Roboflow response
    return {
      ...response.data,
      error: null,
      mock: false,
    };
  } catch (err) {
    // Log the error for debugging
    console.error(
      "🔴 YOLO detection failed:",
      err.response?.status,
      err.response?.data || err.message
    );

    // Return fallback data instead of throwing
    return {
      mock: true,
      predictions: [],
      error: err.response?.status 
        ? `YOLO API error: ${err.response.status}` 
        : `YOLO request failed: ${err.message}`,
      note: "Using empty predictions due to API failure",
    };
  }
}

module.exports = { detectDamage };