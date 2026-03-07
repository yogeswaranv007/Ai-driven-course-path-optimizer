/**
 * Seed Demo Data for Reviewer Presentation
 * Creates realistic demo users and roadmaps
 */

const mongoose = require('mongoose');
const path = require('path');

// Import models with absolute path resolution
const { User } = require(path.join(__dirname, '..', 'models', 'User.model.js'));
const { RoadmapInstance } = require(
  path.join(__dirname, '..', 'models', 'RoadmapInstance.model.js')
);
const bcrypt = require('bcryptjs');

// Demo user credentials
const DEMO_USERS = [
  {
    name: 'Sarah Chen',
    email: 'demo.frontend@example.com',
    password: 'Demo123!@#',
    role: 'Frontend Developer',
  },
  {
    name: 'Michael Rodriguez',
    email: 'demo.backend@example.com',
    password: 'Demo123!@#',
    role: 'Backend Developer',
  },
  {
    name: 'Emily Johnson',
    email: 'demo.fullstack@example.com',
    password: 'Demo123!@#',
    role: 'Full Stack Developer',
  },
];

// Generate realistic roadmap data for each role
function generateRoadmapData(role, userId) {
  const now = new Date();
  const createdDate = new Date(now - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const roleConfig = {
    'Frontend Developer': {
      track: 'react-frontend',
      totalHours: 140,
      weeks: 9,
      skills: [
        { name: 'HTML & CSS', level: 'intermediate' },
        { name: 'JavaScript', level: 'intermediate' },
        { name: 'React', level: 'beginner' },
      ],
      weeklyTopics: [
        'HTML5 & Semantic Elements',
        'CSS Flexbox & Grid Mastery',
        'JavaScript ES6+ Fundamentals',
        'DOM Manipulation & Events',
        'React Components & Props',
        'React Hooks & State Management',
        'Styling in React & CSS-in-JS',
        'API Integration & Async Operations',
        'Building a Complete Portfolio Project',
      ],
    },
    'Backend Developer': {
      track: 'node-backend',
      totalHours: 165,
      weeks: 10,
      skills: [
        { name: 'JavaScript', level: 'intermediate' },
        { name: 'Node.js', level: 'beginner' },
        { name: 'MongoDB', level: 'beginner' },
      ],
      weeklyTopics: [
        'Node.js Fundamentals & Core Modules',
        'npm & Package Management',
        'Express.js & Middleware',
        'RESTful API Design Principles',
        'MongoDB & Mongoose ODM',
        'Authentication & JWT',
        'Error Handling & Validation',
        'API Testing & Documentation',
        'Security Best Practices',
        'Deployment & Production Ready',
      ],
    },
    'Full Stack Developer': {
      track: 'mern-full-stack',
      totalHours: 180,
      weeks: 11,
      skills: [
        { name: 'JavaScript', level: 'intermediate' },
        { name: 'React', level: 'beginner' },
        { name: 'Node.js', level: 'beginner' },
        { name: 'MongoDB', level: 'beginner' },
      ],
      weeklyTopics: [
        'JavaScript Foundations',
        'Frontend with HTML & CSS',
        'React Basics & Components',
        'React State & Lifecycle',
        'Node.js & Express Setup',
        'MongoDB Database Design',
        'Connect Frontend to Backend',
        'Authentication Flow',
        'Advanced React Patterns',
        'API Optimization',
        'Full Stack Deployment',
      ],
    },
  };

  const config = roleConfig[role];
  const weeks = [];

  // Generate weeks with tasks
  for (let weekNum = 1; weekNum <= config.weeks; weekNum++) {
    const topic = config.weeklyTopics[weekNum - 1];
    const isCompleted = weekNum <= 2; // First 2 weeks completed
    const isInProgress = weekNum === 3; // Week 3 in progress

    const tasks = [];

    // Generate 3-4 tasks per week
    const taskCount = 3 + Math.floor(Math.random() * 2);
    for (let taskNum = 1; taskNum <= taskCount; taskNum++) {
      let taskStatus = 'pending';
      let completedAt = null;

      if (isCompleted) {
        taskStatus = 'completed';
        completedAt = new Date(
          createdDate.getTime() + (weekNum * 7 + taskNum) * 24 * 60 * 60 * 1000
        );
      } else if (isInProgress && taskNum <= 2) {
        taskStatus = taskNum === 1 ? 'completed' : 'in-progress';
        completedAt = taskNum === 1 ? new Date(now - 2 * 24 * 60 * 60 * 1000) : null;
      }

      tasks.push({
        taskId: `task-w${weekNum}-${taskNum}`,
        title: getTaskTitle(role, topic, taskNum),
        description: `Master the fundamentals of ${topic} through hands-on exercises and practical examples.`,
        skill: topic,
        estimatedMinutes: 80 + Math.floor(Math.random() * 60),
        dayNumber: (weekNum - 1) * 7 + Math.floor((taskNum - 1) * 2),
        weekNumber: weekNum,
        status: taskStatus,
        completedAt: completedAt,
        reason: `Understanding ${topic} is crucial for mastering ${role} skills. This builds your foundation for real-world applications.`,
        resources: [
          {
            title: `${topic} - Official Documentation`,
            url: `https://docs.example.com/${topic.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'documentation',
          },
          {
            title: `${topic} Video Tutorial`,
            url: `https://youtube.com/watch?v=demo`,
            type: 'video',
          },
        ],
        exercise: {
          description: `Build a mini-project demonstrating ${topic} concepts`,
          expectedOutcome: `Working application showcasing key ${topic} features`,
          estimatedMinutes: 90,
        },
      });
    }

    weeks.push({
      weekNumber: weekNum,
      topic: topic,
      totalMinutes: tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
      aiContent: {
        why: `Week ${weekNum} focuses on ${topic}, which is fundamental for ${role} development. This knowledge will enable you to build production-ready applications.`,
        keyTakeaways: [
          `Master core ${topic} concepts`,
          `Apply best practices in real projects`,
          `Understand common patterns and pitfalls`,
        ],
        summary: `This week covers ${topic} with hands-on exercises, real-world examples, and a practical mini-project.`,
      },
      tasks: tasks,
    });
  }

  // Calculate completion percentage
  const totalTasks = weeks.reduce((sum, w) => sum + w.tasks.length, 0);
  const completedTasks = weeks.reduce(
    (sum, w) => sum + w.tasks.filter((t) => t.status === 'completed').length,
    0
  );
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  return {
    userId: userId,
    roleName: role,
    trackChosen: config.track,
    dailyLearningMinutes: 120,
    estimatedTotalHours: config.totalHours,
    estimatedCompletionDays: Math.ceil(config.totalHours / 2), // 2 hours/day
    skillSource: 'profile',
    skillsUsed: config.skills,
    weeks: weeks,
    status: completionPercentage === 100 ? 'completed' : 'active',
    completionPercentage: completionPercentage,
    roadmapMetadata: {
      trackName: config.track,
      averageHours: config.totalHours,
      marketDemand: 0.88,
      feasibilityScore: 0.85,
    },
    createdAt: createdDate,
    lastAccessedAt: new Date(now - Math.random() * 2 * 24 * 60 * 60 * 1000),
  };
}

function getTaskTitle(role, topic, taskNum) {
  const titles = {
    1: `Learn ${topic} Fundamentals`,
    2: `Practice ${topic} with Examples`,
    3: `Build ${topic} Mini-Project`,
    4: `Master Advanced ${topic} Concepts`,
  };
  return titles[taskNum] || `Explore ${topic}`;
}

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...\n');

  try {
    // Clear existing demo data
    console.log('🗑️  Clearing existing demo data...');
    const existingDemoUsers = await User.find({
      email: { $in: DEMO_USERS.map((u) => u.email) },
    }).select('_id');
    if (existingDemoUsers.length > 0) {
      await RoadmapInstance.deleteMany({ userId: { $in: existingDemoUsers.map((u) => u._id) } });
    }
    await User.deleteMany({ email: { $in: DEMO_USERS.map((u) => u.email) } });
    console.log('✅ Cleared old demo data\n');

    // Create demo users
    console.log('👥 Creating demo users...');
    const createdUsers = [];

    for (const demoUser of DEMO_USERS) {
      const hashedPassword = await bcrypt.hash(demoUser.password, 10);
      const user = await User.create({
        name: demoUser.name,
        email: demoUser.email,
        passwordHash: hashedPassword,
        skills: [],
      });
      createdUsers.push({ ...user.toObject(), role: demoUser.role });
      console.log(`  ✅ Created user: ${demoUser.name} (${demoUser.email})`);
    }
    console.log('');

    // Create roadmaps for each user
    console.log('🗺️  Creating roadmaps...');
    for (const user of createdUsers) {
      const roadmapData = generateRoadmapData(user.role, user._id);
      const roadmap = await RoadmapInstance.create(roadmapData);
      console.log(`  ✅ Created ${user.role} roadmap for ${user.name}`);
      console.log(`     - Weeks: ${roadmapData.weeks.length}`);
      console.log(`     - Progress: ${roadmapData.completionPercentage}%`);
      console.log(`     - ID: ${roadmap._id}\n`);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DEMO DATA SEEDED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📋 Demo Login Credentials:\n');
    DEMO_USERS.forEach((user) => {
      console.log(`  ${user.role}:`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: ${user.password}\n`);
    });

    console.log('🎯 You can now log in with any of these accounts!');
    console.log('   Each account has a roadmap with realistic progress.\n');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

module.exports = { seedDemoData };
