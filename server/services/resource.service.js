const RESOURCE_RULES = [
  {
    keywords: ['let', 'var', 'const'],
    resources: [
      {
        title: 'MDN: let',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'MDN: const',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'MDN: var',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: "var, let, and const - What's the difference?",
        url: 'https://www.youtube.com/watch?v=9WIJQDvt4Us',
        type: 'youtube',
        channelName: 'Traversy Media',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['express', 'routing'],
    resources: [
      {
        title: 'Express Routing Guide',
        url: 'https://expressjs.com/en/guide/routing.html',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'Express JS Crash Course',
        url: 'https://www.youtube.com/watch?v=L72fhGm1tfE',
        type: 'youtube',
        channelName: 'Traversy Media',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['fastapi'],
    resources: [
      {
        title: 'FastAPI Documentation',
        url: 'https://fastapi.tiangolo.com/',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'FastAPI Crash Course',
        url: 'https://www.youtube.com/watch?v=0sOvCWFmrtA',
        type: 'youtube',
        channelName: 'freeCodeCamp.org',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['python', 'variables'],
    resources: [
      {
        title: 'Python Tutorial: Data Types and Variables',
        url: 'https://docs.python.org/3/tutorial/introduction.html',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'Python Variables and Data Types',
        url: 'https://www.youtube.com/watch?v=OH86oLzVzzw',
        type: 'youtube',
        channelName: 'Programming with Mosh',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['asyncio', 'python async', 'await'],
    resources: [
      {
        title: 'Python asyncio',
        url: 'https://docs.python.org/3/library/asyncio.html',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'Asynchronous Programming in Python',
        url: 'https://www.youtube.com/watch?v=t5Bo1Je9EmE',
        type: 'youtube',
        channelName: 'Corey Schafer',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['postgres', 'postgresql', 'indexing', 'indexes'],
    resources: [
      {
        title: 'PostgreSQL: Indexes',
        url: 'https://www.postgresql.org/docs/current/indexes.html',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'PostgreSQL Performance and Indexing',
        url: 'https://www.youtube.com/watch?v=fsG1XaZEa78',
        type: 'youtube',
        channelName: 'Hussein Nasser',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['sqlalchemy', 'orm'],
    resources: [
      {
        title: 'SQLAlchemy ORM Quick Start',
        url: 'https://docs.sqlalchemy.org/en/20/orm/quickstart.html',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'SQLAlchemy ORM Tutorial',
        url: 'https://www.youtube.com/watch?v=woKYyhLCcnU',
        type: 'youtube',
        channelName: 'freeCodeCamp.org',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['redis', 'caching'],
    resources: [
      {
        title: 'Redis Documentation',
        url: 'https://redis.io/docs/latest/',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'Redis Crash Course',
        url: 'https://www.youtube.com/watch?v=jgpVdJB2sKQ',
        type: 'youtube',
        channelName: 'Traversy Media',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['jwt', 'authentication'],
    resources: [
      {
        title: 'JWT Introduction',
        url: 'https://jwt.io/introduction',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'JWT Authentication in Node.js',
        url: 'https://www.youtube.com/watch?v=mbsmsi7l3r4',
        type: 'youtube',
        channelName: 'Web Dev Simplified',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['react'],
    resources: [
      {
        title: 'React Official Learn',
        url: 'https://react.dev/learn',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: "React Course - Beginner's Tutorial",
        url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        type: 'youtube',
        channelName: 'freeCodeCamp.org',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['node', 'event loop'],
    resources: [
      {
        title: 'Node.js Event Loop',
        url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'Node.js Event Loop Explained',
        url: 'https://www.youtube.com/watch?v=PNa9OMajw9w',
        type: 'youtube',
        channelName: 'Hussein Nasser',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['sql', 'index'],
    resources: [
      {
        title: 'PostgreSQL Indexes',
        url: 'https://www.postgresql.org/docs/current/indexes.html',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'SQL Indexing and Query Performance',
        url: 'https://www.youtube.com/watch?v=fsG1XaZEa78',
        type: 'youtube',
        channelName: 'Hussein Nasser',
        source: 'curated',
      },
    ],
  },
  {
    keywords: ['docker'],
    resources: [
      {
        title: 'Docker Docs - Get Started',
        url: 'https://docs.docker.com/get-started/',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'Docker Course for Beginners',
        url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
        type: 'youtube',
        channelName: 'freeCodeCamp.org',
        source: 'curated',
      },
    ],
  },
];

const GENERIC_BACKEND_RESOURCES = [
  {
    title: 'HTTP Overview',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
    type: 'documentation',
    source: 'curated',
  },
  {
    title: 'REST API Best Practices',
    url: 'https://restfulapi.net/',
    type: 'documentation',
    source: 'curated',
  },
];

const GENERIC_JS_RESOURCES = [
  {
    title: 'MDN JavaScript Guide',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    type: 'documentation',
    source: 'curated',
  },
  {
    title: 'JavaScript Full Course for Beginners',
    url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
    type: 'youtube',
    channelName: 'freeCodeCamp.org',
    source: 'curated',
  },
];

function normalizeTopic(topic) {
  return String(topic || '').toLowerCase();
}

function normalizeForKeywordMatching(text) {
  return normalizeTopic(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalizeForKeywordMatching(text)
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function matchesKeyword(topicText, keyword) {
  const normalizedTopic = normalizeForKeywordMatching(topicText);
  const normalizedKeyword = normalizeForKeywordMatching(keyword);

  if (!normalizedKeyword) return false;
  if (normalizedKeyword.includes(' ')) {
    return normalizedTopic.includes(normalizedKeyword);
  }

  const topicTokens = normalizedTopic.split(' ').filter(Boolean);
  return topicTokens.includes(normalizedKeyword);
}

function isResourceRelevantToTopic(resource, topic) {
  const topicTokens = tokenize(topic);
  const resourceText = `${resource?.title || ''} ${resource?.url || ''} ${resource?.channelName || ''}`;
  const normalizedResourceText = normalizeTopic(resourceText);
  return topicTokens.some((token) => normalizedResourceText.includes(token));
}

function getCuratedResourcesForTopic(topic, options = {}) {
  const normalized = normalizeTopic(topic);
  const roleName = normalizeTopic(options.roleName || '');
  const knownSkillsText = normalizeTopic(
    (options.knownSkills || []).map((skill) => skill.name).join(' ')
  );

  const matchedResources = RESOURCE_RULES.map((rule) => {
    const hitCount = (rule.keywords || []).reduce(
      (count, keyword) => count + (matchesKeyword(topic, String(keyword)) ? 1 : 0),
      0
    );
    return { rule, hitCount };
  })
    .filter(({ hitCount }) => hitCount > 0)
    .sort((a, b) => b.hitCount - a.hitCount)
    .flatMap(({ rule }) => rule.resources || []);

  if (matchedResources.length > 0) {
    const uniqueByTitle = new Map();
    for (const resource of matchedResources.filter((resource) =>
      isResourceRelevantToTopic(resource, topic)
    )) {
      uniqueByTitle.set(String(resource.title || '').toLowerCase(), resource);
    }
    const finalMatched = Array.from(uniqueByTitle.values());
    if (finalMatched.length > 0) {
      return finalMatched.slice(0, 6);
    }
  }

  if (
    normalized.includes('python') ||
    normalized.includes('fastapi') ||
    normalized.includes('django') ||
    knownSkillsText.includes('python')
  ) {
    return [
      {
        title: 'Python Docs - Tutorial',
        url: 'https://docs.python.org/3/tutorial/',
        type: 'documentation',
        source: 'curated',
      },
      {
        title: 'Python for Everybody',
        url: 'https://www.youtube.com/watch?v=8DvywoWv6fI',
        type: 'youtube',
        channelName: 'freeCodeCamp.org',
        source: 'curated',
      },
    ];
  }

  if (roleName.includes('backend')) {
    return GENERIC_BACKEND_RESOURCES;
  }

  return GENERIC_JS_RESOURCES;
}

module.exports = {
  resourceService: {
    getCuratedResourcesForTopic,
    isResourceRelevantToTopic,
  },
};
