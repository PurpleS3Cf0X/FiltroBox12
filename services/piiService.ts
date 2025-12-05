
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, PiiEntity, PiiType, SensitivityLevel, CloudSettings, OllamaSettings } from "../types";

// Define the schema for the AI response (Gemini)
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

// Prompt for Ollama (JSON Mode)
const OLLAMA_SYSTEM_PROMPT = `You are a privacy protection engine. Analyze the text for Personally Identifiable Information (PII).
Return ONLY a valid JSON object with this exact structure:
{
  "summary": "string",
  "classification": "string",
  "riskScore": number (0-100),
  "entities": [
    { "text": "string", "type": "string", "sensitivity": "HIGH"|"MEDIUM"|"LOW", "replacement": "string" }
  ]
}
Do not include markdown formatting or explanations.`;

export const analyzeText = async (
  text: string, 
  engine: 'GEMINI' | 'OLLAMA',
  cloudSettings?: CloudSettings,
  ollamaSettings?: OllamaSettings
): Promise<AnalysisResult> => {
  const startTime = performance.now();

  try {
    let data: any;

    if (engine === 'OLLAMA') {
       if (!ollamaSettings?.url || !ollamaSettings?.model) {
           throw new Error("Ollama settings incomplete");
       }
       data = await analyzeWithOllama(text, ollamaSettings);
    } else {
       // Gemini Engine
       const apiKey = cloudSettings?.apiKey || process.env.API_KEY;
       if (!apiKey) throw new Error("No Gemini API Key provided");

       const ai = new GoogleGenAI({ apiKey });
       const model = "gemini-2.5-flash";

       const response = await ai.models.generateContent({
        model: model,
        contents: `Analyze the following text for PII.\n\nText:\n"""\n${text}\n"""`,
        config: {
          responseMimeType: "application/json",
          responseSchema: piiSchema,
          temperature: 0.1,
          systemInstruction: "You are a privacy protection engine. Classify the document, summarize it, and extract PII entities."
        }
      });
      const responseText = response.text || "{}";
      data = JSON.parse(responseText);
    }
    
    // Normalize entities
    const entities: PiiEntity[] = (data.entities || []).map((e: any, index: number) => ({
      id: `entity-${index}-${Date.now()}`,
      text: e.text,
      type: mapStringToPiiType(e.type),
      level: mapStringToSensitivity(e.sensitivity),
      start: 0, 
      end: 0,
      replacement: e.replacement || `[REDACTED ${e.type}]`
    }));

    // Simple sanitization logic (replace instances)
    let sanitized = text;
    entities.forEach(entity => {
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
    return {
      originalText: text,
      sanitizedText: text,
      entities: [],
      riskScore: 0,
      processingTime: 0,
      summary: `Analysis failed: ${(error as Error).message}`,
      classification: "Error"
    };
  }
};

const analyzeWithOllama = async (text: string, settings: OllamaSettings) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }

    const response = await fetch(`${settings.url.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: settings.model,
            prompt: `${OLLAMA_SYSTEM_PROMPT}\n\nText to Analyze:\n${text}`,
            stream: false,
            format: "json", 
            options: {
                temperature: 0.1
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const json = await response.json();
    try {
        return JSON.parse(json.response);
    } catch (e) {
        console.error("Failed to parse Ollama JSON response", json.response);
        throw new Error("Invalid JSON response from Ollama");
    }
};

// Helper functions
const mapStringToPiiType = (str: string): PiiType => {
  if (!str) return PiiType.CUSTOM;
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
  if (!str) return SensitivityLevel.LOW;
  const upper = str.toUpperCase();
  if (upper === 'HIGH') return SensitivityLevel.HIGH;
  if (upper === 'MEDIUM') return SensitivityLevel.MEDIUM;
  return SensitivityLevel.LOW;
};
