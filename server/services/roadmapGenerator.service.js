const { roadmapRepository } = require('../repositories/roadmap.repository.js');
const { userRepository } = require('../repositories/user.repository.js');
const {
  generateDayLearningContent,
  validateSkillRelevance,
  generateCustomPhaseStructure,
  generateCustomDayContent,
} = require('./groq.service.js');
const { resourceService } = require('./resource.service.js');

const KNOWN_BLUEPRINT_SKILLS = [
  'python',
  'fastapi',
  'django',
  'flask',
  'javascript',
  'js',
  'express',
  'node',
  'c++',
  'cpp',
  'stl',
  'boost',
  'qt',
  'rust',
];

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUseDynamicCustomSkillFlow(roadmapLike) {
  const skillSource = String(roadmapLike?.skillSource || '');
  if (skillSource !== 'custom') return false;

  const skills = roadmapLike?.skillsUsed || [];
  if (!Array.isArray(skills) || skills.length !== 1) return false;

  const skillName = String(skills[0]?.name || '').toLowerCase();
  const skillWords = skillName.split(/[\s/+-]+/).filter(Boolean);
  const isKnownSkill = skillWords.some((word) => KNOWN_BLUEPRINT_SKILLS.includes(word));

  return !isKnownSkill;
}

function hasRenderableDayContent(day) {
  if (!day?.content) return false;

  const hasObjectives =
    Array.isArray(day.content.learningObjectives) && day.content.learningObjectives.length > 0;
  const hasWhy = Boolean(String(day.content.whyImportant || '').trim());
  const hasPractice = Boolean(String(day.content.practiceTask?.title || '').trim());

  return hasObjectives || hasWhy || hasPractice;
}

const ROLE_BLUEPRINTS = {
  frontend: [
    {
      phaseName: 'Phase 1 - Web Foundations',
      goal: 'Build production-grade frontend foundations.',
      modules: [
        {
          name: 'Web Core',
          keywords: ['html', 'css', 'accessibility'],
          baseHours: 14,
          topics: [
            'How the web works (HTTP, browser, client-server)',
            'Semantic HTML and accessibility (ARIA, alt text, landmarks)',
            'CSS layout systems (Flexbox + Grid)',
            'Responsive design with media queries',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 2 - JavaScript Fundamentals',
      goal: 'Master JavaScript essentials for frontend engineering.',
      modules: [
        {
          name: 'JavaScript Core',
          keywords: ['javascript', 'js', 'typescript'],
          baseHours: 20,
          topics: [
            'JavaScript variables and scope (let, var, const)',
            'Functions, closures, and higher-order functions',
            'Arrays/objects with map, filter, reduce',
            'Async JavaScript (promises, async/await, fetch)',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 3 - React Application Development',
      goal: 'Build feature-rich React applications.',
      modules: [
        {
          name: 'React',
          keywords: ['react'],
          baseHours: 24,
          topics: [
            'React components and JSX composition',
            'State management with useState/useReducer',
            'Data fetching and caching patterns',
            'React routing, forms, and validation',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 4 - Frontend Engineering',
      goal: 'Ship resilient, tested, and optimized frontend systems.',
      modules: [
        {
          name: 'Quality and Performance',
          keywords: ['testing', 'performance'],
          baseHours: 16,
          topics: [
            'Unit and component testing with Vitest/Jest',
            'Performance optimization and lazy loading',
            'Error boundaries and observability in frontend apps',
            'Mini project: production-ready dashboard UI',
          ],
        },
      ],
    },
  ],
  backendNode: [
    {
      phaseName: 'Phase 1 - JavaScript + Node Foundations',
      goal: 'Build backend foundations in Node.js.',
      modules: [
        {
          name: 'JavaScript for Backend',
          keywords: ['javascript', 'js', 'node'],
          baseHours: 16,
          topics: [
            'JavaScript variables and scope (let, var, const)',
            'Functions, objects, and asynchronous patterns',
            'Node.js runtime, modules, and event loop',
            'File system and process management basics',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 2 - API Development with Express',
      goal: 'Design and implement robust APIs.',
      modules: [
        {
          name: 'Express APIs',
          keywords: ['express', 'rest api', 'http'],
          baseHours: 20,
          topics: [
            'Express app structure and routing',
            'Request validation and centralized error handling',
            'Authentication and authorization (JWT + RBAC)',
            'Mini project: secure CRUD API',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 3 - Data and Persistence',
      goal: 'Build reliable data layers for backend services.',
      modules: [
        {
          name: 'Data Layer',
          keywords: ['mongodb', 'postgresql', 'sql', 'database', 'prisma'],
          baseHours: 22,
          topics: [
            'Data modeling and schema design',
            'Query optimization and indexing',
            'Repository/service pattern implementation',
            'Mini project: analytics-ready data API',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 4 - Production Backend Engineering',
      goal: 'Operate backend systems in production.',
      modules: [
        {
          name: 'Production Systems',
          keywords: ['docker', 'redis', 'testing', 'ci/cd'],
          baseHours: 24,
          topics: [
            'Caching and rate limiting strategy',
            'Testing strategy (unit/integration/API)',
            'Dockerization and deployment workflows',
            'Capstone project: production-grade backend API',
          ],
        },
      ],
    },
  ],
  backendPython: [
    {
      phaseName: 'Phase 1 - Python Backend Foundations',
      goal: 'Build backend foundations in Python.',
      modules: [
        {
          name: 'Python Core',
          keywords: ['python'],
          baseHours: 14,
          topics: [
            'Python variables, data types, and control flow',
            'Functions, modules, and virtual environments',
            'Python async basics and typing essentials',
            'Clean project architecture for backend services',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 2 - API Development with FastAPI',
      goal: 'Build and validate modern Python APIs.',
      modules: [
        {
          name: 'FastAPI',
          keywords: ['fastapi', 'api', 'pydantic'],
          baseHours: 22,
          topics: [
            'FastAPI routing and request lifecycle',
            'Pydantic models and validation',
            'Auth with JWT and dependency injection',
            'Mini project: secure CRUD API (FastAPI)',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 3 - Databases and ORM',
      goal: 'Persist data efficiently with SQL systems.',
      modules: [
        {
          name: 'SQL and ORM',
          keywords: ['postgresql', 'sqlalchemy', 'sql', 'database'],
          baseHours: 22,
          topics: [
            'PostgreSQL schema design and indexing',
            'SQLAlchemy models and query patterns',
            'Migrations and transactional consistency',
            'Mini project: analytics-ready Python API',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 4 - Production Python Backend',
      goal: 'Deploy, monitor, and scale Python backend systems.',
      modules: [
        {
          name: 'Production Python',
          keywords: ['docker', 'redis', 'pytest', 'ci/cd'],
          baseHours: 22,
          topics: [
            'Caching, queues, and background jobs',
            'Testing with pytest and integration suites',
            'Docker deployment and observability',
            'Capstone project: production-grade Python backend API',
          ],
        },
      ],
    },
  ],
  backendCpp: [
    {
      phaseName: 'Phase 1 - C++ Backend Foundations',
      goal: 'Build core C++ foundations for backend systems development.',
      modules: [
        {
          name: 'Modern C++ Core',
          keywords: ['c++', 'cpp', 'stl'],
          baseHours: 18,
          topics: [
            'Modern C++ syntax, types, references, and RAII',
            'STL containers/algorithms and memory-safe patterns',
            'Object-oriented design and interfaces in C++',
            'Build tooling with CMake and project structure basics',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 2 - Networked Services in C++',
      goal: 'Design and implement network-facing backend services.',
      modules: [
        {
          name: 'Service APIs',
          keywords: ['rest api', 'grpc', 'http', 'cpprestsdk', 'boost'],
          baseHours: 22,
          topics: [
            'HTTP service design and routing in C++ frameworks',
            'Input validation, error handling, and response contracts',
            'Authentication and authorization patterns for backend APIs',
            'Mini project: secure C++ CRUD service API',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 3 - Data Layer and Performance',
      goal: 'Build efficient persistence layers and optimize performance.',
      modules: [
        {
          name: 'Persistence and Optimization',
          keywords: ['sql', 'postgresql', 'database', 'performance', 'profiling'],
          baseHours: 22,
          topics: [
            'Database access patterns and repository abstraction in C++',
            'Query optimization, indexing, and transaction safety',
            'Profiling and bottleneck analysis for backend services',
            'Mini project: high-performance data API in C++',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 4 - Production C++ Backend Engineering',
      goal: 'Operate, test, and ship production-grade C++ backend systems.',
      modules: [
        {
          name: 'Production Readiness',
          keywords: ['docker', 'testing', 'ci/cd', 'observability'],
          baseHours: 24,
          topics: [
            'Unit/integration testing in C++ backend projects',
            'Observability: structured logs, metrics, and health checks',
            'Containerization, deployment, and CI/CD workflows',
            'Capstone project: production-grade C++ backend service',
          ],
        },
      ],
    },
  ],
  backendRust: [
    {
      phaseName: 'Phase 1 - Rust Systems Programming Foundations',
      goal: 'Build core Rust fundamentals for systems and backend development.',
      modules: [
        {
          name: 'Rust Essentials',
          keywords: ['rust'],
          baseHours: 16,
          topics: [
            'Rust ownership, borrowing, and memory safety concepts',
            'Pattern matching, enums, and error handling with Result/Option',
            'Traits, generics, and polymorphism in Rust',
            'Cargo, modules, and building production Rust projects',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 2 - Building Async Services with Rust',
      goal: 'Design and implement concurrent, high-performance backend services.',
      modules: [
        {
          name: 'Async Rust & APIs',
          keywords: ['rest api', 'async', 'tokio', 'http', 'webframework'],
          baseHours: 22,
          topics: [
            'Async/await patterns and Tokio runtime fundamentals',
            'Building REST APIs with Axum, Actix, or Rocket',
            'Request validation, error handling, and middleware design',
            'Mini project: concurrent Rust API service with auth',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 3 - Data Persistence and Performance Optimization',
      goal: 'Build efficient data layers with Rust and optimize system performance.',
      modules: [
        {
          name: 'Data & Optimization',
          keywords: ['sql', 'sqlx', 'diesel', 'database', 'performance'],
          baseHours: 22,
          topics: [
            'Database integration with SQLx or Diesel in Rust',
            'Query optimization and transaction safety patterns',
            'Performance profiling, benchmarking, and optimization techniques',
            'Mini project: high-performance data service in Rust',
          ],
        },
      ],
    },
    {
      phaseName: 'Phase 4 - Production-Grade Rust Backend Engineering',
      goal: 'Deploy, monitor, and scale production Rust backend systems.',
      modules: [
        {
          name: 'Production Systems',
          keywords: ['docker', 'testing', 'ci/cd', 'deployment', 'observability'],
          baseHours: 24,
          topics: [
            'Unit/integration/property testing in Rust backend projects',
            'Logging, tracing, and observability for production systems',
            'Containerization, CI/CD workflows, and zero-downtime deployment',
            'Capstone project: production-ready Rust microservice',
          ],
        },
      ],
    },
  ],
};

function normalizeRoleName(roleName) {
  if (!roleName) return 'Full Stack Developer';
  const valid = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer'];
  return valid.includes(roleName) ? roleName : 'Full Stack Developer';
}

function pickBlueprint(roleName, skillsUsed) {
  const normalizedRole = normalizeRoleName(roleName);
  const skillNames = (skillsUsed || []).map((skill) => String(skill.name || '').toLowerCase());

  const hasRust = skillNames.some((name) => name.includes('rust'));
  const hasCpp = skillNames.some(
    (name) =>
      name.includes('c++') ||
      name.includes('cpp') ||
      name.includes('stl') ||
      name.includes('boost') ||
      name.includes('qt')
  );
  const hasPython = skillNames.some(
    (name) =>
      name.includes('python') ||
      name.includes('fastapi') ||
      name.includes('django') ||
      name.includes('flask')
  );

  if (normalizedRole === 'Backend Developer') {
    if (hasRust) return ROLE_BLUEPRINTS.backendRust;
    if (hasCpp) return ROLE_BLUEPRINTS.backendCpp;
    return hasPython ? ROLE_BLUEPRINTS.backendPython : ROLE_BLUEPRINTS.backendNode;
  }

  if (normalizedRole === 'Frontend Developer') {
    return ROLE_BLUEPRINTS.frontend;
  }

  // Full Stack Developer: prioritize Rust for backend, then C++, then Python
  if (hasRust) return ROLE_BLUEPRINTS.backendRust;
  if (hasCpp) return ROLE_BLUEPRINTS.backendCpp;
  return hasPython ? ROLE_BLUEPRINTS.backendPython : ROLE_BLUEPRINTS.backendNode;
}

function toLevelScore(level) {
  const mapping = { beginner: 1, intermediate: 2, advanced: 3 };
  return mapping[level] || 1;
}

function getBestSkillLevelForKeywords(keywords, skillsUsed) {
  let bestScore = 1;
  for (const skill of skillsUsed || []) {
    const skillName = String(skill.name || '').toLowerCase();
    for (const keyword of keywords || []) {
      const normalizedKeyword = String(keyword || '').toLowerCase();
      if (
        skillName.includes(normalizedKeyword) ||
        normalizedKeyword.includes(skillName) ||
        skillName.split(/[\s/+-]+/).includes(normalizedKeyword)
      ) {
        bestScore = Math.max(bestScore, toLevelScore(skill.level));
      }
    }
  }
  return bestScore;
}

const FOUNDATION_TOPIC_PATTERNS = [
  /how the web works/i,
  /semantic html/i,
  /variables?/i,
  /control flow/i,
  /foundations?/i,
  /basics?/i,
  /intro/i,
  /runtime.*basics?/i,
];

function isFoundationalTopic(topic) {
  return FOUNDATION_TOPIC_PATTERNS.some((pattern) => pattern.test(String(topic || '')));
}

function tokenizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function getTopicBestSkillLevel(topic, skillsUsed) {
  const topicTokens = tokenizeText(topic);
  let bestScore = 1;

  for (const skill of skillsUsed || []) {
    const skillTokens = tokenizeText(skill.name);
    const overlap = skillTokens.some((skillToken) => topicTokens.includes(skillToken));
    if (overlap) {
      bestScore = Math.max(bestScore, toLevelScore(skill.level));
    }
  }

  return bestScore;
}

function personalizeModuleTopics(module, levelScore, skillsUsed) {
  const baseTopics = [...(module.topics || [])];
  if (!baseTopics.length) return [];

  let personalizedTopics = baseTopics.filter((topic) => {
    const topicSkillLevel = getTopicBestSkillLevel(topic, skillsUsed || []);

    if (topicSkillLevel >= 3 && isFoundationalTopic(topic)) {
      return false;
    }

    if (topicSkillLevel >= 2 && isFoundationalTopic(topic) && baseTopics.length > 3) {
      return false;
    }

    return true;
  });

  if (personalizedTopics.length < 2) {
    const startIndex =
      levelScore >= 3 ? Math.min(2, Math.max(0, baseTopics.length - 2)) : levelScore === 2 ? 1 : 0;
    personalizedTopics = baseTopics.slice(startIndex);
  }

  if (levelScore >= 2) {
    personalizedTopics.push(
      `Production application: ${module.name} patterns, trade-offs, and debugging`
    );
  }

  return Array.from(new Set(personalizedTopics));
}

function inferPhaseFlavor(phasePlan) {
  const keywordText = (phasePlan.modules || [])
    .flatMap((module) => module.keywords || [])
    .map((keyword) => String(keyword).toLowerCase())
    .join(' ');

  if (keywordText.includes('rust') || keywordText.includes('tokio')) return 'rust-backend';
  if (keywordText.includes('fastapi') || keywordText.includes('python')) return 'python-backend';
  if (keywordText.includes('express') || keywordText.includes('node')) return 'node-backend';
  if (keywordText.includes('react')) return 'frontend-react';
  return 'general-backend';
}

function buildExtensionTopics(phasePlan, extraCount) {
  const flavor = inferPhaseFlavor(phasePlan);
  const topicPoolByFlavor = {
    'rust-backend': [
      'Build async Rust service with Axum or Actix routing',
      'Implement request/response validation using Serde + custom traits',
      'Add Rust error handling and Result-based API design',
      'Write Rust integration tests for async service endpoints',
      'Implement repository pattern with SQLx or Diesel in Rust',
      'Add structured logging and distributed tracing with tokio-tracing',
    ],
    'python-backend': [
      'Build FastAPI router modules for /users and /tasks',
      'Implement Pydantic request/response schemas with validation',
      'Add Python logging + centralized exception handlers',
      'Write pytest API tests for key endpoints',
      'Integrate SQLAlchemy session management and repository layer',
      'Implement token-based auth dependencies in FastAPI',
    ],
    'node-backend': [
      'Build Express routers for /users and /tasks',
      'Add request validation middleware and standardized error responses',
      'Implement JWT auth middleware and protected routes',
      'Write integration tests for API routes',
      'Implement repository/service layering for maintainability',
      'Add structured logging and request correlation IDs',
    ],
    'frontend-react': [
      'Build reusable React component module with typed props',
      'Implement route-level data loading + error boundaries',
      'Add form validation and controlled components',
      'Write component tests for key UI flows',
      'Optimize bundle with lazy loading and code splitting',
      'Integrate API client layer with retries and error handling',
    ],
    'general-backend': [
      'Implement API module with validation and error handling',
      'Write integration tests for core backend flow',
      'Add authentication and authorization checks for protected resources',
      'Implement database repository layer and query optimization',
      'Add deployment-ready logging and health checks',
      'Introduce caching for high-read endpoints',
    ],
  };

  const pool = topicPoolByFlavor[flavor] || topicPoolByFlavor['general-backend'];
  const extensionTopics = [];
  for (let i = 0; i < extraCount; i++) {
    extensionTopics.push(pool[i % pool.length]);
  }
  return extensionTopics;
}

function buildRevisionTopic(phasePlan) {
  const flavor = inferPhaseFlavor(phasePlan);
  if (flavor === 'rust-backend') {
    return 'Revision: Rust ownership, async patterns, error handling, and tests';
  }
  if (flavor === 'python-backend') {
    return 'Revision: FastAPI routes, Pydantic validation, and pytest test fixes';
  }
  if (flavor === 'node-backend') {
    return 'Revision: Express routing, middleware flow, and API error handling';
  }
  if (flavor === 'frontend-react') {
    return 'Revision: React state, routing, and component testing';
  }
  return `Revision: ${phasePlan.phaseName} with refactor + bug-fix checklist`;
}

function buildMiniProjectTopic(phasePlan) {
  const flavor = inferPhaseFlavor(phasePlan);
  if (flavor === 'rust-backend') {
    return 'Mini project: Build async Rust /tasks API with Axum and SQLx auth';
  }
  if (flavor === 'python-backend') {
    return 'Mini project: Build FastAPI /tasks CRUD with validation and auth';
  }
  if (flavor === 'node-backend') {
    return 'Mini project: Build Express /tasks CRUD with JWT middleware';
  }
  if (flavor === 'frontend-react') {
    return 'Mini project: Build React feature module with API integration';
  }
  return `Mini project: Build milestone feature for ${phasePlan.phaseName}`;
}

/**
 * Converts Groq-generated custom phases into final roadmap phase structure
 */
function buildCustomPhaseStructure({ roleName, customPhases, dailyLearningMinutes }) {
  const dailyHours = Math.max(0.5, (dailyLearningMinutes || 120) / 60);
  let globalDay = 1;

  const finalPhases = (customPhases || [])
    .filter((phase) => phase && phase.topics && phase.topics.length > 0)
    .map((phase, idx) => {
      const phaseDays = Math.max(3, Math.round(phase.estimatedHours / dailyHours));
      const topics = Array.isArray(phase.topics) ? phase.topics : [];
      const dayTopics = [];

      for (let i = 0; i < phaseDays; i++) {
        let topic = topics[i] || `${phase.phaseName}: Advanced Topic ${i - topics.length + 1}`;

        // Revision every 8th day
        if (globalDay % 8 === 0) {
          topic = `Revision: ${phase.phaseName} - Practice and Refactor`;
        }
        // Mini project every 9th day starting from phase 2
        if (globalDay % 9 === 0 && idx > 0) {
          topic = phase.miniProject || `Mini Project: ${phase.phaseName}`;
        }

        dayTopics.push({
          dayNumber: globalDay++,
          topic,
          estimatedMinutes: dailyLearningMinutes,
          status: 'pending',
          contentStatus: 'not-generated',
        });
      }

      return {
        phaseNumber: idx + 1,
        phaseName: phase.phaseName,
        goal: phase.goal,
        startDay: dayTopics[0]?.dayNumber || globalDay,
        endDay: dayTopics[dayTopics.length - 1]?.dayNumber || globalDay,
        days: dayTopics,
        isCustomSkillPhase: true,
        customSkillMetadata: {
          topicCount: topics.length,
          miniProjectName: phase.miniProject,
        },
      };
    });

  const totalDays = finalPhases.reduce((sum, phase) => sum + phase.days.length, 0);

  return {
    phases: finalPhases,
    totalPhases: finalPhases.length,
    totalDays,
  };
}

function buildHeuristicCustomPhases(skillName, roleName) {
  const normalizedSkill = String(skillName || 'Custom Skill').trim();
  const roleTag = normalizeRoleName(roleName);

  const roleCompanionTopics =
    roleTag === 'Frontend Developer'
      ? [
          'UI integration patterns',
          'API consumption from frontend clients',
          'state and caching strategies',
        ]
      : roleTag === 'Backend Developer'
        ? ['service architecture', 'API contracts', 'data persistence and observability']
        : ['frontend-backend integration', 'API contracts', 'deployment and monitoring'];

  return [
    {
      phaseNumber: 1,
      phaseName: `Phase 1 - ${normalizedSkill} Foundations`,
      goal: `Build practical foundations in ${normalizedSkill} for ${roleTag.toLowerCase()} work.`,
      estimatedHours: 20,
      topics: [
        `${normalizedSkill} setup, tooling, and project structure`,
        `Core syntax and runtime model in ${normalizedSkill}`,
        `Data structures, control flow, and error handling in ${normalizedSkill}`,
        `${normalizedSkill} coding standards and debugging workflow`,
      ],
      miniProject: `Mini project: build a small ${normalizedSkill} starter application`,
    },
    {
      phaseNumber: 2,
      phaseName: `Phase 2 - ${normalizedSkill} Applied Development`,
      goal: `Build real features in ${normalizedSkill} with role-relevant patterns.`,
      estimatedHours: 22,
      topics: [
        `${normalizedSkill} feature implementation patterns`,
        `${normalizedSkill} architecture and modularization`,
        `${normalizedSkill} integration with ${roleCompanionTopics[0]}`,
        `${normalizedSkill} testing fundamentals`,
      ],
      miniProject: `Mini project: implement a feature-rich ${normalizedSkill} module`,
    },
    {
      phaseNumber: 3,
      phaseName: `Phase 3 - ${normalizedSkill} Production Patterns`,
      goal: `Strengthen reliability, performance, and maintainability in ${normalizedSkill}.`,
      estimatedHours: 22,
      topics: [
        `${normalizedSkill} performance and optimization techniques`,
        `${normalizedSkill} integration with ${roleCompanionTopics[1]}`,
        `${normalizedSkill} test automation and quality gates`,
        `${normalizedSkill} error resilience and operational readiness`,
      ],
      miniProject: `Mini project: production-ready ${normalizedSkill} workflow with tests`,
    },
    {
      phaseNumber: 4,
      phaseName: `Phase 4 - ${normalizedSkill} Capstone Delivery`,
      goal: `Deliver and operate a capstone using ${normalizedSkill} in real project scenarios.`,
      estimatedHours: 24,
      topics: [
        `${normalizedSkill} capstone architecture and planning`,
        `${normalizedSkill} integration with ${roleCompanionTopics[2]}`,
        `${normalizedSkill} deployment, release, and monitoring practices`,
        `${normalizedSkill} documentation, review, and iteration`,
      ],
      miniProject: `Capstone: end-to-end ${normalizedSkill} project for ${roleTag}`,
    },
  ];
}

function buildStructurePhases({ roleName, dailyLearningMinutes, skillsUsed }) {
  const blueprint = pickBlueprint(roleName, skillsUsed);
  const dailyHours = Math.max(0.5, (dailyLearningMinutes || 120) / 60);

  const phasePlans = (blueprint || []).map((phase) => {
    const plannedModules = (phase.modules || [])
      .map((module) => {
        const levelScore = getBestSkillLevelForKeywords(module.keywords, skillsUsed || []);
        const proficiencyMultiplier = levelScore === 3 ? 0.35 : levelScore === 2 ? 0.6 : 1;
        const personalizedTopics = personalizeModuleTopics(module, levelScore, skillsUsed || []);
        const topicCoverageRatio =
          (personalizedTopics.length || 1) / Math.max(1, (module.topics || []).length);
        const adjustedHours = Math.max(
          2,
          Math.round(module.baseHours * proficiencyMultiplier * Math.max(0.6, topicCoverageRatio))
        );

        return {
          ...module,
          levelScore,
          adjustedHours,
          topics: personalizedTopics,
        };
      })
      .filter((module) => module.adjustedHours >= 2 && (module.topics || []).length > 0);

    const phaseHours = plannedModules.reduce((sum, module) => sum + module.adjustedHours, 0);
    return {
      phaseName: phase.phaseName,
      goal: phase.goal,
      modules: plannedModules,
      phaseHours,
    };
  });

  const nonEmptyPhasePlans = phasePlans.filter((phase) => phase.phaseHours > 0);
  const totalHours = Math.max(
    8,
    nonEmptyPhasePlans.reduce((sum, phase) => sum + phase.phaseHours, 0)
  );

  let globalDay = 1;
  const finalPhases = nonEmptyPhasePlans.map((phasePlan, idx) => {
    const phaseDays = Math.max(2, Math.round(phasePlan.phaseHours / dailyHours));
    const dayTopics = [];
    const rawTopics = phasePlan.modules.flatMap((module) => module.topics || []);

    const dayCountForPhase = Math.max(phaseDays, rawTopics.length);
    const extensionTopics = buildExtensionTopics(
      phasePlan,
      Math.max(0, dayCountForPhase - rawTopics.length)
    );

    for (let i = 0; i < dayCountForPhase; i++) {
      let topic = rawTopics[i] || extensionTopics[i - rawTopics.length];
      if (globalDay % 8 === 0) {
        topic = buildRevisionTopic(phasePlan);
      }
      if (globalDay % 9 === 0) {
        topic = buildMiniProjectTopic(phasePlan);
      }

      dayTopics.push({
        dayNumber: globalDay++,
        topic,
        estimatedMinutes: dailyLearningMinutes,
        status: 'pending',
        contentStatus: 'not-generated',
      });
    }

    return {
      phaseNumber: idx + 1,
      phaseName: phasePlan.phaseName,
      goal: phasePlan.goal,
      startDay: dayTopics[0]?.dayNumber || globalDay,
      endDay: dayTopics[dayTopics.length - 1]?.dayNumber || globalDay,
      days: dayTopics,
    };
  });

  return {
    phases: finalPhases,
    totalPhases: finalPhases.length,
    totalDays: Math.max(
      Math.ceil(totalHours / dailyHours),
      finalPhases.reduce((sum, phase) => sum + phase.days.length, 0)
    ),
  };
}

function getRoleDefaults(roleName) {
  const normalized = normalizeRoleName(roleName);
  const defaults = {
    'Frontend Developer': {
      objectivePrefix: 'frontend application',
      practicePrefix: 'Build a small UI module',
    },
    'Backend Developer': {
      objectivePrefix: 'backend service',
      practicePrefix: 'Implement an API-focused exercise',
    },
    'Full Stack Developer': {
      objectivePrefix: 'full-stack workflow',
      practicePrefix: 'Build and connect frontend + backend pieces',
    },
  };

  return defaults[normalized] || defaults['Full Stack Developer'];
}

function buildDefaultDayContentForRole({ roleName, topic, dailyLearningMinutes }) {
  const roleDefaults = getRoleDefaults(roleName);
  return {
    learningObjectives: [
      `Understand ${topic} in a ${roleDefaults.objectivePrefix} context`,
      `Apply ${topic} in a practical coding scenario`,
      `Explain tradeoffs and best practices for ${topic}`,
    ],
    whyImportant: `${topic} is a core skill in the ${roleName} learning path and directly impacts real project delivery quality.`,
    practiceTask: {
      title: `${roleDefaults.practicePrefix}: ${topic}`,
      description: `Implement a focused exercise around ${topic}, validate output, and summarize lessons learned.`,
      estimatedMinutes: Math.max(30, Math.round((dailyLearningMinutes || 120) * 0.5)),
    },
    generatedAt: new Date(),
    generatedBy: 'fallback',
    generationVersion: 1,
  };
}

function applyQuotaFallbackPlan({ phases, roleName, dailyLearningMinutes, knownSkills }) {
  return (phases || []).map((phase) => ({
    ...phase,
    days: (phase.days || []).map((day) => ({
      ...day,
      contentStatus: 'generated',
      content: {
        ...buildDefaultDayContentForRole({ roleName, topic: day.topic, dailyLearningMinutes }),
        resources: resourceService.getCuratedResourcesForTopic(day.topic, {
          roleName,
          knownSkills,
        }),
      },
    })),
  }));
}

function mergeResources(curatedResources, aiSuggestions, topic) {
  const merged = [...(curatedResources || [])];
  for (const suggested of aiSuggestions || []) {
    if (!suggested?.title) continue;
    const isRelevant = resourceService.isResourceRelevantToTopic(
      {
        title: suggested.title,
        url: suggested.url,
        channelName: suggested.channelName,
      },
      topic
    );
    if (!isRelevant) continue;

    const alreadyExists = merged.some(
      (resource) => resource.title?.toLowerCase() === String(suggested.title).toLowerCase()
    );
    if (!alreadyExists) {
      merged.push({
        title: suggested.title,
        url: suggested.url || '',
        type: suggested.type || 'tutorial',
        channelName: suggested.channelName || '',
        source: 'ai',
      });
    }
  }
  return merged;
}

async function generateStructuredDayContent({
  roleName,
  phaseName,
  day,
  dailyLearningMinutes,
  knownSkills,
}) {
  const aiContent = await generateDayLearningContent({
    roleName,
    phaseName,
    dayNumber: day.dayNumber,
    topic: day.topic,
    dailyLearningMinutes,
    knownSkills,
  });

  const curatedResourcesWithContext = resourceService.getCuratedResourcesForTopic(day.topic, {
    roleName,
    knownSkills,
  });
  const resources = mergeResources(
    curatedResourcesWithContext,
    aiContent.resourceSuggestions || [],
    day.topic
  );

  return {
    contentStatus: 'generated',
    content: {
      learningObjectives: aiContent.learningObjectives,
      whyImportant: aiContent.whyImportant,
      practiceTask: aiContent.practiceTask,
      resources,
      generatedAt: new Date(),
      generatedBy: aiContent.generatedBy,
      generationVersion: 1,
    },
  };
}

async function generateStructuredCustomDayContent({
  roleName,
  skillName,
  phaseName,
  day,
  totalDays,
  dailyLearningMinutes,
}) {
  const aiContent = await generateCustomDayContent({
    roleName,
    skillName,
    phaseName,
    dayNumber: day.dayNumber,
    totalDays,
    topic: day.topic,
    dailyLearningMinutes,
  });

  const normalizedLearningObjectives =
    Array.isArray(aiContent.learningObjectives) && aiContent.learningObjectives.length > 0
      ? aiContent.learningObjectives.slice(0, 5)
      : [
          `Build a working ${skillName} implementation for ${day.topic}`,
          `Apply ${skillName} best practices while implementing ${day.topic}`,
          `Validate and improve the solution for production readiness`,
        ];

  const normalizedWhyImportant =
    String(aiContent.whyImportant || '').trim() ||
    `${day.topic} is important for real-world ${skillName} delivery in ${roleName} workflows.`;

  const normalizedPracticeTask = aiContent.practiceTask?.title
    ? aiContent.practiceTask
    : {
        title: `${skillName}: ${day.topic}`,
        description: `Implement a practical feature in ${skillName} focused on ${day.topic}.`,
        estimatedMinutes: dailyLearningMinutes,
      };

  const curatedResourcesWithContext = resourceService.getCuratedResourcesForTopic(day.topic, {
    roleName,
    knownSkills: [{ name: skillName, level: 'beginner' }],
  });
  const resources = mergeResources(
    curatedResourcesWithContext,
    aiContent.resourceSuggestions || [],
    day.topic
  );

  return {
    contentStatus: 'generated',
    content: {
      learningObjectives: normalizedLearningObjectives,
      whyImportant: normalizedWhyImportant,
      practiceTask: normalizedPracticeTask,
      resources,
      generatedAt: new Date(),
      generatedBy: aiContent.generatedBy || 'groq',
      generationVersion: 1,
    },
  };
}

const roadmapGeneratorService = {
  async generateRoadmapStructure(
    userId,
    { roadmapName, roleName, dailyLearningMinutes, skillSource, skills }
  ) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  STAGE 1: ROADMAP STRUCTURE GENERATION                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const normalizedRole = normalizeRoleName(roleName);
    const safeRoadmapName = String(roadmapName || '').trim();
    const finalRoadmapName =
      safeRoadmapName.length >= 2
        ? safeRoadmapName
        : `${normalizedRole} Roadmap - ${new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}`;
    console.log(`📝 Role: ${normalizedRole}`);
    console.log(`🗂️  Roadmap Name: ${finalRoadmapName}`);
    console.log(`⏱️  Daily Learning Time: ${dailyLearningMinutes} minutes`);
    console.log(`🎯 Skill Source: ${skillSource}`);

    let skillsUsed = [];
    if (skillSource === 'profile') {
      const user = await userRepository.findById(userId);
      skillsUsed = (user?.skills || []).map((s) => ({ name: s.name, level: s.level }));
      if (!skillsUsed.length) {
        console.error('❌ No skills found in user profile');
        throw new Error('No skills found in profile. Add skills or use custom skill source.');
      }
      console.log(`✅ Loaded ${skillsUsed.length} skills from user profile`);
    } else {
      skillsUsed = (skills || []).map((s) => ({ name: s.name, level: s.level || 'beginner' }));
      if (!skillsUsed.length) {
        console.error('❌ No skills provided in custom skill source');
        throw new Error('Skills array is required when using custom skill source.');
      }
      console.log(`✅ Using ${skillsUsed.length} custom skills`);
    }

    // ============================================================
    // CUSTOM SKILL DETECTION & DYNAMIC GENERATION
    // ============================================================
    let useCustomSkillGeneration = false;
    let customSkillName = null;

    if (skillSource === 'custom' && skillsUsed.length === 1) {
      const skill = skillsUsed[0].name.toLowerCase();
      const skillWords = skill.split(/[\s/+-]+/);
      const isKnownSkill = skillWords.some((word) => KNOWN_BLUEPRINT_SKILLS.includes(word));

      if (!isKnownSkill) {
        // Unknown custom skill - use dynamic generation
        useCustomSkillGeneration = true;
        customSkillName = skillsUsed[0].name;
        console.log(`\n⭐ Custom skill detected: "${customSkillName}"`);
        console.log('🔄 Validating skill relevance and generating custom phases...\n');
      }
    }

    let { phases, totalPhases, totalDays } = useCustomSkillGeneration
      ? { phases: [], totalPhases: 0, totalDays: 0 }
      : buildStructurePhases({
          roleName: normalizedRole,
          dailyLearningMinutes,
          skillsUsed,
        });

    // If using custom skill, generate phases dynamically
    if (useCustomSkillGeneration && customSkillName) {
      try {
        const validation = await validateSkillRelevance(normalizedRole, customSkillName);
        console.log(`📋 Skill Validation Result:`);
        console.log(`   - Relevant: ${validation.isRelevant ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Level: ${validation.relevanceLevel}`);
        console.log(`   - Explanation: ${validation.explanation}`);
        console.log(
          `   - Complementary Tech: ${validation.complementaryTechs.join(', ') || 'None'}`
        );
        console.log(`   - Est. Hours: ${validation.estimatedHours}\n`);

        if (validation.isRelevant) {
          console.log(`🏗️  Generating ${customSkillName} learning phases...\n`);
          const customPhases = await generateCustomPhaseStructure(
            normalizedRole,
            customSkillName,
            validation.estimatedHours,
            dailyLearningMinutes,
            validation.complementaryTechs
          );

          if (customPhases && customPhases.length > 0) {
            console.log(`✅ Generated ${customPhases.length} ${customSkillName} phases`);
            customPhases.forEach((phase) => {
              console.log(
                `   Phase ${phase.phaseNumber}: ${phase.phaseName} (${phase.estimatedHours}h)`
              );
            });
            console.log('');

            const customStructure = buildCustomPhaseStructure({
              roleName: normalizedRole,
              customPhases,
              dailyLearningMinutes,
            });
            phases = customStructure.phases;
            totalPhases = customStructure.totalPhases;
            totalDays = customStructure.totalDays;
          } else {
            console.warn(
              `⚠️  Failed to generate AI custom phases. Using skill-based heuristic phases for ${customSkillName}.\n`
            );
            const heuristicPhases = buildHeuristicCustomPhases(customSkillName, normalizedRole);
            const customStructure = buildCustomPhaseStructure({
              roleName: normalizedRole,
              customPhases: heuristicPhases,
              dailyLearningMinutes,
            });
            phases = customStructure.phases;
            totalPhases = customStructure.totalPhases;
            totalDays = customStructure.totalDays;
          }
        } else {
          console.warn(
            `⚠️  "${customSkillName}" not relevant to ${normalizedRole}. Using role default.\n`
          );
          const defaultStructure = buildStructurePhases({
            roleName: normalizedRole,
            dailyLearningMinutes,
            skillsUsed: [],
          });
          phases = defaultStructure.phases;
          totalPhases = defaultStructure.totalPhases;
          totalDays = defaultStructure.totalDays;
        }
      } catch (error) {
        console.error(`⚠️  Error in custom skill generation: ${error.message}`);
        console.log(`Using skill-based heuristic phases for ${customSkillName}.\n`);
        const heuristicPhases = buildHeuristicCustomPhases(customSkillName, normalizedRole);
        const customStructure = buildCustomPhaseStructure({
          roleName: normalizedRole,
          customPhases: heuristicPhases,
          dailyLearningMinutes,
        });
        phases = customStructure.phases;
        totalPhases = customStructure.totalPhases;
        totalDays = customStructure.totalDays;
      }
    }

    console.log('\n🏗️  Building phase structure...');

    let useQuotaFallback = false;
    try {
      const firstPhase = phases[0];
      const firstDay = firstPhase?.days?.[0];
      if (firstDay) {
        const sampleGeneration = await generateDayLearningContent({
          roleName: normalizedRole,
          phaseName: firstPhase.phaseName,
          dayNumber: firstDay.dayNumber,
          topic: firstDay.topic,
          dailyLearningMinutes,
          knownSkills: skillsUsed,
        });
        useQuotaFallback =
          sampleGeneration.generatedBy === 'fallback' &&
          sampleGeneration.fallbackReason === 'quota-exceeded';
      }
    } catch (_e) {
      useQuotaFallback = false;
    }

    let finalPhases = phases;
    let generationStage = 'structure-generated';
    let daysWithGeneratedContent = 0;

    if (useQuotaFallback) {
      console.warn('\n⚠️  Groq quota exceeded. Using role-based default full plan content.');
      finalPhases = applyQuotaFallbackPlan({
        phases,
        roleName: normalizedRole,
        dailyLearningMinutes,
        knownSkills: skillsUsed,
      });
      generationStage = 'content-complete';
      daysWithGeneratedContent = totalDays;
    } else {
      console.log('\n🎨 Generating full day-level content for roadmap...');
      finalPhases = [];
      for (const phase of phases || []) {
        const generatedDays = [];

        for (const day of phase.days || []) {
          let generated;

          if (phase.isCustomSkillPhase && customSkillName) {
            generated = await generateStructuredCustomDayContent({
              roleName: normalizedRole,
              skillName: customSkillName,
              phaseName: phase.phaseName,
              day,
              totalDays,
              dailyLearningMinutes,
            });

            await sleep(120);
          } else {
            generated = await generateStructuredDayContent({
              roleName: normalizedRole,
              phaseName: phase.phaseName,
              day,
              dailyLearningMinutes,
              knownSkills: skillsUsed,
            });
          }

          generatedDays.push({
            ...day,
            contentStatus: generated.contentStatus,
            content: generated.content,
          });
        }

        finalPhases.push({
          ...phase,
          days: generatedDays,
        });
      }

      generationStage = 'content-complete';
      daysWithGeneratedContent = totalDays;
    }

    console.log(`\n✅ Structure Generated:`);
    console.log(`   📊 Total Phases: ${totalPhases}`);
    console.log(`   📅 Total Days: ${totalDays}`);
    console.log(
      `   🎓 Completion Time: ${Math.round((totalDays * dailyLearningMinutes) / 60)} hours\n`
    );

    phases.forEach((phase) => {
      console.log(`   Phase ${phase.phaseNumber}: ${phase.phaseName}`);
      console.log(`      Goal: ${phase.goal}`);
      console.log(`      Days: ${phase.startDay}-${phase.endDay} (${phase.days.length} days)`);
    });

    const roadmapData = {
      userId,
      roleName: normalizedRole,
      roadmapName: finalRoadmapName,
      trackChosen: normalizedRole.toLowerCase().replace(/\s+/g, '-'),
      dailyLearningMinutes,
      estimatedCompletionDays: totalDays,
      estimatedTotalHours: Math.round((totalDays * dailyLearningMinutes) / 60),
      skillSource,
      skillsUsed,
      phases: finalPhases,
      totalPhases,
      totalDays,
      status: 'active',
      completionPercentage: 0,
      lastAccessedAt: new Date(),
      roadmapMetadata: {
        generationStage,
        generatedAt: new Date(),
        aiProvider: 'groq',
        aiModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        daysWithGeneratedContent,
        quotaFallbackUsed: useQuotaFallback,
      },
    };

    console.log('\n💾 Saving roadmap to database...');
    const savedRoadmap = await roadmapRepository.create(roadmapData);
    console.log(`✅ Roadmap saved with ID: ${savedRoadmap._id}\n`);
    console.log('═══════════════════════════════════════════════════════════════');

    return {
      roadmap: savedRoadmap,
      quotaFallbackUsed: useQuotaFallback,
      quotaFallbackMessage: useQuotaFallback
        ? 'Groq quota exceeded. Generated a role-based default plan with full day content.'
        : null,
    };
  },

  async generateDayContent(userId, roadmapId, dayNumber) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  STAGE 2: DAY CONTENT GENERATION                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📖 Fetching roadmap: ${roadmapId}`);
    const roadmap = await roadmapRepository.findById(roadmapId);
    if (!roadmap) {
      console.error('❌ Roadmap not found');
      throw new Error('Roadmap not found');
    }

    const ownerId = roadmap?.userId?._id
      ? roadmap.userId._id.toString()
      : roadmap?.userId?.toString();
    if (ownerId !== String(userId)) {
      console.error('❌ Access denied - user does not own this roadmap');
      throw new Error('Access denied');
    }

    console.log(`📅 Looking for Day ${dayNumber}...`);
    const match = roadmap.getDayByNumber(dayNumber);
    if (!match) {
      console.error(`❌ Day ${dayNumber} not found in roadmap`);
      throw new Error('Day not found in roadmap');
    }

    console.log(`✅ Found Day ${dayNumber}: ${match.day.topic}`);
    console.log(`   Phase: ${match.phase.phaseName}`);
    console.log(`   Content Status: ${match.day.contentStatus}`);

    if (match.day.contentStatus === 'generated' && hasRenderableDayContent(match.day)) {
      console.log('✅ Content already generated - returning from cache\n');
      console.log('═══════════════════════════════════════════════════════════════');
      return {
        roadmap,
        phase: match.phase,
        day: match.day,
        fromCache: true,
      };
    }

    console.log('\n🎨 Generating new content...');
    const useDynamicCustomFlow = shouldUseDynamicCustomSkillFlow(roadmap);
    const customSkillName = roadmap?.skillsUsed?.[0]?.name;

    const generated = useDynamicCustomFlow
      ? await generateStructuredCustomDayContent({
          roleName: roadmap.roleName,
          skillName: customSkillName,
          phaseName: match.phase.phaseName,
          day: match.day,
          totalDays: roadmap.totalDays,
          dailyLearningMinutes: roadmap.dailyLearningMinutes,
        })
      : await generateStructuredDayContent({
          roleName: roadmap.roleName,
          phaseName: match.phase.phaseName,
          day: match.day,
          dailyLearningMinutes: roadmap.dailyLearningMinutes,
          knownSkills: roadmap.skillsUsed,
        });

    console.log('\n📚 Day content generated with merged resources...');
    console.log(`   Total resources: ${generated.content.resources?.length || 0}\n`);

    match.day.content = generated.content;
    match.day.contentStatus = generated.contentStatus;

    const generatedCount = (roadmap.phases || [])
      .flatMap((phase) => phase.days || [])
      .filter((d) => d.contentStatus === 'generated').length;

    roadmap.roadmapMetadata = roadmap.roadmapMetadata || {};
    roadmap.roadmapMetadata.daysWithGeneratedContent = generatedCount;
    roadmap.roadmapMetadata.generationStage =
      generatedCount >= (roadmap.totalDays || 1) ? 'content-complete' : 'content-partial';
    roadmap.lastAccessedAt = new Date();

    console.log('💾 Saving updated roadmap...');
    await roadmap.save();

    console.log(`\n✅ Day ${dayNumber} Content Generated!`);
    console.log(`   Objectives: ${generated.content?.learningObjectives?.length || 0}`);
    console.log(`   Resources: ${generated.content?.resources?.length || 0}`);
    console.log(`   Generated by: ${generated.content?.generatedBy || 'unknown'}`);
    console.log(`   Progress: ${generatedCount}/${roadmap.totalDays} days with content\n`);
    console.log('═══════════════════════════════════════════════════════════════');

    return {
      roadmap,
      phase: match.phase,
      day: match.day,
      fromCache: false,
    };
  },
};

module.exports = {
  roadmapGeneratorService,
};
