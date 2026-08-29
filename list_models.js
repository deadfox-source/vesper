import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyAKnUxvKHgfp9x2om3Jin9GL033iNRLf3Q");
async function run() {
  try {
    const list = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAKnUxvKHgfp9x2om3Jin9GL033iNRLf3Q");
    const json = await list.json();
    console.log(json.models.map(m => m.name).join("\n"));
  } catch (e) {
    console.error("Error", e);
  }
}
run();
