// services/ai/qwen.service.js - IMPROVED: Never throws errors
const axios = require("axios");
const config = require("../../config/env");

const QWEN_MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct";

 
async function describeDamage(imageBuffer) {
  if (!config.hfApiKey) {
    console.warn("HF_API_KEY not set, returning mock Qwen result.");
    return {
      description: "Mock: possible scratch or dent detected.",
      severityScore: 0.5,
      mock: true,
      error: null,
    };
  }

  const prompt = `
You are an expert vehicle damage assessor.
You receive a single car image.
Describe the visible damage (scratches, dents, cracks, broken parts).
Return ONLY a compact JSON object in this exact shape:
{
  "description": string,
  "severityScore": number  // 0 to 1, 1 = very severe damage
}
`;

  return await callQwenVision(imageBuffer, prompt);
}

 
async function describeDamageWithPrompt(imageBuffer, customPrompt) {
  if (!config.hfApiKey) {
    console.warn("HF_API_KEY not set, returning mock Qwen result.");
    return {
      description: "Mock: damage analysis",
      severityScore: 0.5,
      repairRecommendation: "Mock repair needed",
      mock: true,
      error: null,
    };
  }

  return await callQwenVision(imageBuffer, customPrompt);
}

/**
 * Shared function to call Qwen vision model.
 * NEVER throws - always returns valid response with fallback data.
 */
async function callQwenVision(imageBuffer, prompt) {
  const url = "https://router.huggingface.co/v1/chat/completions";

  try {
    const base64 = imageBuffer.toString("base64");

    const response = await axios.post(
      url,
      {
        model: QWEN_MODEL_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${config.hfApiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const choice = response.data?.choices?.[0];
    const content = choice?.message?.content;

    // Extract text from response
    let textOutput = "";
    if (Array.isArray(content)) {
      textOutput = content.map((part) => part.text || "").join("\n").trim();
    } else if (typeof content === "string") {
      textOutput = content;
    } else {
      textOutput = JSON.stringify(response.data);
    }

    // Parse JSON response
    let parsed;
    try {
      const match = textOutput.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { description: textOutput };
    } catch (e) {
      // JSON parse failed - use raw text
      parsed = { description: textOutput };
    }

    // Return successful result
    return {
      description: parsed.description || textOutput,
      severityScore: typeof parsed.severityScore === "number" ? parsed.severityScore : 0.5,
      repairRecommendation: parsed.repairRecommendation || "",
      error: null,
      mock: false,
    };
  } catch (err) {
    // Log error for debugging
    console.error(
      "🔴 Qwen vision failed:",
      err.response?.status,
      err.response?.data || err.message
    );

    // Return fallback data instead of throwing
    const errorMessage = err.response?.status 
      ? `Qwen API error: ${err.response.status}`
      : `Qwen request failed: ${err.message}`;

    return {
      description: "Visual analysis unavailable due to API error",
      severityScore: 0.5,
      repairRecommendation: "Manual inspection recommended",
      error: errorMessage,
      mock: true,
    };
  }
}

module.exports = { 
  describeDamage,
  describeDamageWithPrompt 
};