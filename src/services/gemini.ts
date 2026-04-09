import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface PredictionResult {
  label: "stain" | "hole" | "broken yarn" | "not fabric" | "no defect";
  confidence: number;
  boundingBoxes?: BoundingBox[];
}

export async function predictFabricDefect(base64Image: string): Promise<PredictionResult> {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
        {
          text: `Analyze this fabric image for defects. 
          Classify it into one of these categories: "stain", "hole", "broken yarn", "not fabric", or "no defect".
          If a defect is found, provide bounding box coordinates [ymin, xmin, ymax, xmax] in the range [0, 1000].`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            label: {
              type: Type.STRING,
              enum: ["stain", "hole", "broken yarn", "not fabric", "no defect"],
            },
            confidence: {
              type: Type.NUMBER,
            },
            boundingBoxes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER },
                },
                required: ["ymin", "xmin", "ymax", "xmax"],
              },
            },
          },
          required: ["label", "confidence"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      label: result.label || "not fabric",
      confidence: result.confidence || 0,
      boundingBoxes: result.boundingBoxes,
    };
  } catch (error) {
    console.error("Prediction error:", error);
    return {
      label: "not fabric",
      confidence: 0,
    };
  }
}
