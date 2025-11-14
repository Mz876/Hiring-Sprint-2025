const axios = require("axios");
const config = require("../../config/env");

// Example YOLO car-damage model on Hugging Face
const YOLO_MODEL_ID =
  "nezahatkorkmaz/car-damage-level-detection-yolov8"; // you can change this later

async function detectDamage(imageBuffer) {
  if (!config.hfApiKey) {
    console.warn("HF_API_KEY not set, returning mock YOLO result.");
    return {
      mock: true,
      detections: [],
      note: "Set HF_API_KEY in .env to enable real YOLO calls."
    };
  }

  const url = `https://api-inference.huggingface.co/models/${YOLO_MODEL_ID}`;

  const response = await axios.post(url, imageBuffer, {
    headers: {
      Authorization: `Bearer ${config.hfApiKey}`,
      "Content-Type": "application/octet-stream"
    }
  });

  return response.data;
}

module.exports = {
  detectDamage
};
