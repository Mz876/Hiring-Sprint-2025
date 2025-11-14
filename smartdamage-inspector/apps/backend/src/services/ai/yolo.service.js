const axios = require("axios");
const config = require("../../config/env");

const YOLO_MODEL_ID = "nezahatkorkmaz/car-damage-level-detection-yolov8";

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

  try {
  const response = await axios.post(
  url,
  { 
    inputs: imageBuffer.toString("base64")
  },
  {
    headers: {
      Authorization: `Bearer ${config.hfApiKey}`,
      "Content-Type": "application/json"
    }
  }
);

    console.log("Response:",response);

    return response.data;
  } catch (err) {


    console.error(
      "detectDamage HF error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error("detectDamage: Hugging Face request failed");
  }
}

module.exports = { detectDamage };
