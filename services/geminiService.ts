
import { GoogleGenAI, Type } from "@google/genai";
import { HotelTier, TransportMode, CityNode, TransportEdge } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateItinerary = async (params: {
  destination: string,
  startDate: string,
  endDate: string,
  travelers: number,
  intent?: string
}) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Plan a luxury/standard balance trip to ${params.destination} starting ${params.startDate} for ${params.travelers} people. 
               User intent: ${params.intent || 'General sightseeing'}. 
               Return a structured itinerary with cities (nodes) and transport between them (edges).
               Include a high-quality Unsplash image URL for each city (nature or city landscape).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                nights: { type: Type.INTEGER },
                description: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
                mealPlan: { type: Type.STRING },
                experiences: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "name", "nights", "description", "mealPlan", "experiences", "imageUrl"]
            }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                fromId: { type: Type.STRING },
                toId: { type: Type.STRING },
                mode: { type: Type.STRING, enum: ["Flight", "Train", "Bus", "Cab"] },
                duration: { type: Type.STRING },
                cost: { type: Type.NUMBER }
              },
              required: ["id", "fromId", "toId", "mode", "duration", "cost"]
            }
          }
        },
        required: ["nodes", "edges"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getPlaceRecommendations = async (cityName: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find top-rated hotels and restaurants in ${cityName}. Highlight why a tourist enthusiast would love it.`,
    config: {
      tools: [{ googleMaps: {} }]
    }
  });

  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text,
    sources: grounding.map((chunk: any) => ({
      title: chunk.maps?.title || 'Location Source',
      uri: chunk.maps?.uri || ''
    })).filter((s: any) => s.uri)
  };
};

export const getDeepThinkingOptimization = async (tripData: any) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `You are a world-class travel route optimizer. 
               Review the following trip: ${JSON.stringify(tripData)}.
               Optimize the number of nights in each city and the transport modes for better flow and value.
               Return a JSON object with two fields: 'nodes' and 'edges' which follow the original schema but with updated values. 
               Also include a field 'reasoning' (string) explaining why these changes were made.`,
    config: {
      thinkingConfig: { thinkingBudget: 24576 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, nights: { type: Type.INTEGER } } } },
          edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, mode: { type: Type.STRING }, cost: { type: Type.NUMBER }, duration: { type: Type.STRING } } } },
          reasoning: { type: Type.STRING }
        },
        required: ["nodes", "edges", "reasoning"]
      }
    }
  });
  return JSON.parse(response.text);
};
