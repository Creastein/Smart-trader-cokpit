import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

// Read API key from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

console.log(`Testing API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    try {
        console.log(`\n🧪 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello Gemini");
        const text = result.response.text();
        console.log(`✅ SUCCESS: ${text.substring(0, 50)}...`);
        return true;
    } catch (e) {
        console.error(`❌ FAILED: ${e.message}`);
        if (e.status) console.error(`   Status: ${e.status}`);
        return false;
    }
}

(async () => {
    // Only test the main model we care about
    await testModel("gemini-2.0-flash");
})();
