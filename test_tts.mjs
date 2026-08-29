import fs from 'fs';

const API_KEY = "AIzaSyAKnUxvKHgfp9x2om3Jin9GL033iNRLf3Q";
const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

const payload = {
  input: { text: "Hello from Vesper." },
  voice: { languageCode: "en-GB", name: "en-GB-Journey-D" },
  audioConfig: { audioEncoding: "MP3" }
};

async function testTTS() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("SUCCESS! Audio content length:", data.audioContent.length);
      fs.writeFileSync('test_journey.mp3', Buffer.from(data.audioContent, 'base64'));
    } else {
      const errorData = await response.json();
      console.error("ERROR:", response.status, errorData);
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}

testTTS();
