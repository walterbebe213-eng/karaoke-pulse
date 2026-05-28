import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Fallback catalog if API key is missing or calls fail
const DEFAULT_AI_SUGGESTIONS = [
  { title: "Dancing Queen", artist: "ABBA" },
  { title: "Creep", artist: "Radiohead" },
  { title: "I Will Survive", artist: "Gloria Gaynor" },
  { title: "Shallow", artist: "Lady Gaga & Bradley Cooper" }
];

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not configured in environment. Using fallback recommendations.");
      return NextResponse.json({
        success: true,
        source: "local-fallback",
        suggestions: DEFAULT_AI_SUGGESTIONS
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `O usuário quer cantar no karaokê e deu a seguinte pista sobre o clima ou estilo que deseja: "${prompt}". 
Sugira de 4 a 6 músicas icônicas de karaokê que combinem perfeitamente com essa vibe.
Sempre envie músicas muito conhecidas no mundo todo ou clássicos do Brasil (se o prompt for em português).`,
      config: {
        systemInstruction: "You are an assistant for a premium interactive karaoke kiosk. Given an aesthetic mood or query, provide highly accurate, crowd-pleasing, and classic karaoke song recommendations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The name of the karaoke song."
              },
              artist: {
                type: Type.STRING,
                description: "The artist or group that performed the song."
              }
            },
            required: ["title", "artist"]
          }
        }
      }
    });

    const textOutput = response.text ? response.text.trim() : "";
    if (!textOutput) {
      throw new Error("Empty response text from Gemini API");
    }

    const suggestions = JSON.parse(textOutput);
    return NextResponse.json({
      success: true,
      source: "gemini",
      suggestions
    });

  } catch (error: any) {
    console.error("Gemini suggestion route error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to retrieve suggestions from Gemini API",
      suggestions: DEFAULT_AI_SUGGESTIONS
    });
  }
}
