
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, PiiEntity, PiiType, SensitivityLevel } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for the AI response
const piiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise 1-2 sentence summary of what the content is about." },
    classification: { type: Type.STRING, description: "The type of document (e.g., 'Source Code', 'Medical Record', 'Email Thread', 'Server Log', 'Financial Statement')." },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The exact text segment found in the source." },
          type: { type: Type.STRING, description: "The type of PII (e.g., EMAIL, NAME, PHONE)." },
          sensitivity: { type: Type.STRING, description: "Risk level: HIGH, MEDIUM, or LOW." },
          replacement: { type: Type.STRING, description: "A suggested safe replacement text." }
        },
        required: ["text", "type", "sensitivity"],
      }
    },
    riskScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating overall risk." }
  },
  required: ["entities", "riskScore", "summary", "classification"]
};

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  const startTime = performance.now();

  try {
    const model = "gemini-2.5-flash"; // Using flash for speed
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `You are a privacy protection engine. Analyze the following text for Personally Identifiable Information (PII) and sensitive data.
      
      1. Classify the type of document/data (e.g., JSON Dump, Python Script, Customer Email).
      2. Provide a short summary of the content.
      3. Detect sensitive entities like: Names, Emails, Phone Numbers, Credit Cards, API Keys, IP Addresses, and Locations.
      
      Return a JSON object.
      
      Text to analyze:
      """
      ${text}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: piiSchema,
        temperature: 0.1, // Low temperature for deterministic extraction
      }
    });

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText);
    
    const entities: PiiEntity[] = (data.entities || []).map((e: any, index: number) => ({
      id: `entity-${index}-${Date.now()}`,
      text: e.text,
      type: mapStringToPiiType(e.type),
      level: mapStringToSensitivity(e.sensitivity),
      start: 0, // We will calculate this in the frontend logic for highlighting
      end: 0,
      replacement: e.replacement || `[REDACTED ${e.type}]`
    }));

    // Simple sanitization logic (replace instances)
    let sanitized = text;
    entities.forEach(entity => {
      // Global replace for this demo, usually would be index based
      sanitized = sanitized.split(entity.text).join(entity.replacement);
    });

    const endTime = performance.now();

    return {
      originalText: text,
      sanitizedText: sanitized,
      entities: entities,
      riskScore: data.riskScore || 0,
      processingTime: Math.round(endTime - startTime),
      summary: data.summary || "No summary available.",
      classification: data.classification || "Unknown Data Type"
    };

  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback or re-throw
    return {
      originalText: text,
      sanitizedText: text,
      entities: [],
      riskScore: 0,
      processingTime: 0,
      summary: "Analysis failed due to an error.",
      classification: "Error"
    };
  }
};

// Helper functions
const mapStringToPiiType = (str: string): PiiType => {
  const upper = str.toUpperCase();
  if (upper.includes("EMAIL")) return PiiType.EMAIL;
  if (upper.includes("PHONE")) return PiiType.PHONE;
  if (upper.includes("CARD")) return PiiType.CREDIT_CARD;
  if (upper.includes("SSN")) return PiiType.SSN;
  if (upper.includes("KEY") || upper.includes("TOKEN")) return PiiType.API_KEY;
  if (upper.includes("IP")) return PiiType.IP_ADDRESS;
  if (upper.includes("NAME") || upper.includes("PERSON")) return PiiType.NAME;
  if (upper.includes("LOC") || upper.includes("ADDRESS")) return PiiType.LOCATION;
  return PiiType.CUSTOM;
};

const mapStringToSensitivity = (str: string): SensitivityLevel => {
  const upper = str.toUpperCase();
  if (upper === 'HIGH') return SensitivityLevel.HIGH;
  if (upper === 'MEDIUM') return SensitivityLevel.MEDIUM;
  return SensitivityLevel.LOW;
};
