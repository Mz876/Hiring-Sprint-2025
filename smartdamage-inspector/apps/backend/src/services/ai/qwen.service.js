const axios = require("axios");
const config = require("../../config/env");

// Qwen2-VL vision-language model on Hugging Face
const QWEN_MODEL_ID = "Qwen/Qwen2-VL-7B-Instruct";

async function describeDamage(imageBuffer) {
  if (!config.hfApiKey) {
    console.warn("HF_API_KEY not set, returning mock Qwen result.");
    return {
      description:
        "Mock: possible scratch or dent detected. Severity appears moderate.",
      severityScore: 0.6
    };
  }

  const url = `https://api-inference.huggingface.co/models/${QWEN_MODEL_ID}`;

  const base64 = imageBuffer.toString("base64");

  const prompt = `
You are an expert vehicle damage assessor.
Describe any visible damage on this vehicle image (scratches, dents, cracks, broken parts).
Return ONLY a compact JSON with:
- description (string)
- severityScore (number between 0 and 1, 1 = most severe)
`;

  // HF vision models often accept JSON like this; adjust as needed based on actual response.
  const response = await axios.post(
    url,
    {
      inputs: {
        prompt,
        // Some HF backends expect "image" as base64-encoded string
        image: base64
      }
    },
    {
      headers: {
        Authorization: `Bearer ${config.hfApiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  const data = response.data;

  // The model may return plain text or JSON-like text; we try to parse JSON from it.
  const textOutput =
    (Array.isArray(data) && data[0]?.generated_text) ||
    data.generated_text ||
    JSON.stringify(data);

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
}

module.exports = {
  describeDamage
};
