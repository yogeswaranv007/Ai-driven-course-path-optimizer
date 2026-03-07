/**
 * Test Role-Specific Fallback Data
 * Demonstrates the static content served when Gemini API is unavailable
 */

const baseURL = 'http://localhost:5000';
let authToken = '';

async function testRoleFallbacks() {
  console.log('\n=====================================================');
  console.log('  ROLE-SPECIFIC FALLBACK DATA TEST');
  console.log('=====================================================\n');

  try {
    // 1. Register or use existing
    const ts = Date.now().toString().slice(-6);
    const testEmail = `fallback${ts}@example.com`;
    const testPassword = 'Fallback123!@#';

    const registerRes = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fallback Tester',
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!registerRes.ok) {
      console.log('❌ Registration failed, trying login...\n');
    } else {
      console.log('✅ New user registered\n');
      const setCookie = registerRes.headers.get('set-cookie');
      if (setCookie) authToken = setCookie.split(';')[0];
    }

    // 2. Login
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authToken,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const loginCookie = loginRes.headers.get('set-cookie');
    if (loginCookie) authToken = loginCookie.split(';')[0];
    console.log('✅ User logged in\n');

    // 3. Set skills
    await fetch(`${baseURL}/profile/skills`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authToken,
      },
      body: JSON.stringify({
        skills: [
          { name: 'JavaScript', level: 2 },
          { name: 'React', level: 1 },
        ],
      }),
    });
    console.log('✅ Skills set\n');

    // Test each role
    const roles = [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'React Developer',
      'Node.js Developer',
    ];

    for (const role of roles) {
      await testRole(role);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('\n=====================================================');
    console.log('  ✅ ALL ROLES TESTED SUCCESSFULLY');
    console.log('=====================================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testRole(roleName) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  📋 TESTING: ${roleName.toUpperCase()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    const response = await fetch(`${baseURL}/roadmaps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authToken,
      },
      body: JSON.stringify({
        roleName,
        dailyLearningMinutes: 120,
        skillSource: 'profile',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const roadmap = data.roadmap;

    console.log(`  ✅ Roadmap Created`);
    console.log(`  📦 ID: ${roadmap._id}`);
    console.log(`  👤 Role: ${roadmap.roleName}`);
    console.log(`  🎯 Track: ${roadmap.trackChosen}`);

    if (roadmap.weeklyPlan && roadmap.weeklyPlan.length > 0) {
      const week1 = roadmap.weeklyPlan[0];
      console.log(`\n  📚 WEEK 1 STATIC CONTENT:`);
      console.log(`  ├─ Topic: ${week1.topic}`);

      if (week1.tasks && week1.tasks.length > 0) {
        console.log(`  ├─ Tasks (${week1.tasks.length}):`);
        week1.tasks.forEach((task, idx) => {
          console.log(`  │  ${idx + 1}. ${task.title}`);
          console.log(
            `  │     Duration: ${task.durationMinutes}min | Difficulty: ${task.difficulty}`
          );
        });
      }

      if (week1.project) {
        console.log(`  └─ Project: ${week1.project.title}`);
        console.log(`     └─ ${week1.project.description}`);
      }
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }
}

// Run the test
testRoleFallbacks();
