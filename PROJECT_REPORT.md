# Advanced Project Report

## AI-Driven Learning Path Optimizer SaaS

### 1. Executive Summary

The Learning Path Optimizer is a highly personalized, AI-driven curriculum generator that provides customized daily learning programs based on an individual's target job role, time constraints, and current skill set. The platform merges traditional structured learning with dynamic edge-computed LLM interventions to create a living, breathing learning journey dynamically adapted to user knowledge.

### 2. Architecture & Tech Stack

- **Frontend**: React.js configured with Vite, utilizing modern Glassmorphism UX/UI through Tailwind CSS and Framer Motion for premium micro-animations. Code is natively split via Vite. Hosted globally on **Vercel**.
- **Backend**: Node.js & Express.js. Follows a robust Service/Controller/Repository domain-driven architecture for deep reliability. Connected to external language models. Hosted on **Render**.
- **Database**: MongoDB Atlas using Mongoose ODMs for strongly typed NoSQL schemas mapping Roadmaps to complex multidimensional arrays.
- **Third-Party AI Integration**: Built upon the **Groq API (Llama-3)** for rapid intelligent processing. The most intensive calculations rely on highly specific prompt engineering matrices.

### 3. Key Advanced Logic Implementations

1. **Dynamic Content Laziness**: To prevent long loading times and high API costs, only the "Phases" of a roadmap are generated immediately. The actual deep internal curriculum contents are generated 'on demand' dynamically the second a user inspects a curriculum day.
2. **Deterministic Broadcast Grouping**: A highly advanced mapping logic natively hashes User Profiles (Skill Levels + Frameworks). When an Admin wants to "Broadcast" an AI template to 10,000 users, the server groups identical profiles and sends exactly 1 batch prompt per group to the LLM, effectively reducing AI token costs by over 90% while guaranteeing exact personalization.

### 4. Performance Optimizations

- Database operations are highly tuned with targeted Schema Indices on `(userId, createdAt)`.
- Redundant LLM calls are caught and cached into MongoDB immediately.
- Natively responsive Frontend rendering tree to hit standard core-web Vitals efficiently.

### 5. Future Scope

- WebHook integrations to natively notify Discord/Slack channels upon roadmap completion.
- Expanding from Groq to an LLM-Agnostic architecture allowing dynamic switching between GPT-4o and Claude 3.5 Sonnet.
