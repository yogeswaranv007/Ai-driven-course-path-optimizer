/**
 * Test different Gemini model names to find what's available
 */

require('dotenv').config({ path: './apps/api/.env' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp-01-21',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
];

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('🧪 Testing available models...\n');

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent('Hello');
      console.log(`✅ ${modelName}`);
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`❌ ${modelName} - Not found`);
      } else {
        console.log(`⚠️  ${modelName} - ${error.message.split('\n')[0]}`);
      }
    }
  }
}

testModels();
