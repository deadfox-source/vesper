import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const API_KEY = "AIzaSyAKnUxvKHgfp9x2om3Jin9GL033iNRLf3Q";
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
});

async function run() {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Say hello world" }] }],
      generationConfig: {
        responseModalities: ["TEXT", "AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Fenrir"
            }
          }
        }
      }
    });
    
    console.log("Text response:", result.response.text());
    
    // Check if there's audio in the response
    const audioPart = result.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.mimeType.startsWith("audio/"));
    if (audioPart) {
      console.log("Found audio part!", audioPart.inlineData.mimeType);
      fs.writeFileSync("test_audio.wav", Buffer.from(audioPart.inlineData.data, "base64"));
      console.log("Saved test_audio.wav");
    } else {
      console.log("No audio part found. Parts:", JSON.stringify(result.response.candidates?.[0]?.content?.parts));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
