import aiService from './services/ai.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAIService() {
  console.log('🧪 Testing AI Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const health = await aiService.healthCheck();
    console.log('✅ Health check:', health);
    console.log('');

    // Test 2: Rewrite Bullet Points
    console.log('2. Testing bullet point rewrite...');
    const bulletPoints = [
      'Managed team of developers',
      'Improved system performance'
    ];
    const rewrites = await aiService.rewriteBulletPoints(bulletPoints);
    console.log('✅ Rewrites generated:', rewrites.length, 'items');
    console.log('Sample:', JSON.stringify(rewrites[0], null, 2));
    console.log('');

    // Test 3: Rewrite Summary
    console.log('3. Testing summary rewrite...');
    const summary = 'Experienced software developer with knowledge of multiple programming languages.';
    const summaries = await aiService.rewriteSummary(summary);
    console.log('✅ Summaries generated:', summaries.length, 'versions');
    console.log('Sample:', summaries[0].substring(0, 100) + '...');
    console.log('');

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAIService();
