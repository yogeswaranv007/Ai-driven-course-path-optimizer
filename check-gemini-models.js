/**
 * Check available Gemini models with the current API key
 */

require('dotenv').config({ path: './apps/api/.env' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 API Key status:', apiKey ? '✅ Present' : '❌ Missing');

    if (!apiKey) {
      console.log('⚠️  No GEMINI_API_KEY found. Set it in .env file');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try to get model information
    console.log('\n📋 Attempting to initialize gemini-1.5-flash-latest...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    console.log('✅ Model initialization successful');

    // Try to list available models (if supported by this version)
    console.log('\n🔍 Checking model capabilities...');
    const response = await model.generateContent('Hello, what is 2+2?');
    console.log('✅ Basic content generation works');
    console.log('Response:', response.response.text());
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n📝 Full error details:');
    console.error(error);

    if (error.message.includes('404')) {
      console.log('\n💡 Model might not exist or API key is invalid.');
      console.log('   Try these alternatives:');
      console.log('   - gemini-pro');
      console.log('   - gemini-1.5-pro');
      console.log('   - gemini-1.5-pro-latest');
      console.log('   - gemini-2.0-flash');
    }
  }
}

checkModels();
