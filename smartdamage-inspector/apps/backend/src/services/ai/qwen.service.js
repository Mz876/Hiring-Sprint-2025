// services/describeDamage.js
const axios = require("axios");
const config = require("../../config/env");

// AUTO provider (no :hyperbolic suffix)
const QWEN_MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct";

async function describeDamage(imageBuffer) {
  // If no HF key, return a mock response instead of crashing
  if (!config.hfApiKey) {
    console.warn("HF_API_KEY not set, returning mock Qwen result.");
    return {
      description: "Mock: possible scratch or dent detected.",
      severityScore: 0.5,
      mock: true
    };
  }

  const url = "https://router.huggingface.co/v1/chat/completions";
  const base64 = imageBuffer.toString("base64");

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

  try {
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
                  // inline the uploaded image as a data URL
                  url: `data:image/jpeg;base64,${base64}`
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${config.hfApiKey}`, // HF_TOKEN in your env
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    // ---- Extract text from router-style response ----
    const choice = response.data?.choices?.[0];
    const content = choice?.message?.content;

    let textOutput = "";

    if (Array.isArray(content)) {
      // content is an array of parts: [{ type: "text", text: "..." }, ...]
      textOutput = content
        .map((part) => part.text || "")
        .join("\n")
        .trim();
    } else if (typeof content === "string") {
      textOutput = content;
    } else {
      textOutput = JSON.stringify(response.data);
    }

    // ---- Try to extract JSON { description, severityScore } from the text ----
    let parsed;
    try {
      const match = textOutput.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { description: textOutput };
    } catch (e) {
      parsed = { description: textOutput };
    }

    return {
      description: parsed.description || textOutput,
      severityScore:
        typeof parsed.severityScore === "number" ? parsed.severityScore : 0.5
    };
  } catch (err) {
    console.error(
      "🔥 describeDamage HF router error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error("describeDamage: Hugging Face router request failed");
  }
}

module.exports = { describeDamage };
