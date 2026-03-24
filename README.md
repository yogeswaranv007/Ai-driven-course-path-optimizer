# Learning Path Optimizer

An AI-powered MERN web application that generates personalized, bootcamp-style learning roadmaps based on user roles, existing skills, and study time availability.

## 🎯 Quick Links

- **📖 [Complete Documentation](MASTER_DOCUMENTATION.md)** - Comprehensive guide covering setup, architecture, API, features, and troubleshooting
- **🚀 [Quick Start](#quick-start)** - Get running in 5 minutes
- **🏗️ [Architecture](#architecture)** - System design overview

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yogeswaranv007/learning-path-optimizer.git
cd learning-path-optimizer
npm install

# 2. Configure environment
# Copy server/.env.example to server/.env and add:
#   - MONGO_URI
#   - JWT_SECRET
#   - GROQ_API_KEY
#   - CLIENT_URL

# 3. Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
```

## 🏗️ Architecture

**Frontend**: React + Vite + Tailwind CSS  
**Backend**: Node.js + Express + MongoDB  
**AI Integration**: Groq API for content generation  
**Auth**: JWT + httpOnly cookies with multi-device session management

## ✨ Key Features

- ✅ **Bootcamp-style roadmaps**: Multiple phases with detailed day-by-day learning paths
- ✅ **Built-in skills**: React, Node.js, Python, JavaScript, TypeScript, Rust, C++, Java
- ✅ **Custom skills**: Generate roadmaps for any skill dynamically via AI
- ✅ **Rich content**: Learning objectives, WHY important, practice tasks, curated resources
- ✅ **Secure auth**: JWT with refresh tokens and multi-device session management
- ✅ **Role-based**: Different roadmaps for different career paths
- ✅ **Progress tracking**: Monitor completion across days and phases

## 📚 Documentation

**All documentation is consolidated in [MASTER_DOCUMENTATION.md](MASTER_DOCUMENTATION.md)**

This comprehensive guide includes:

- **Setup**: Installation, environment variables, database configuration
- **Architecture**: System design, data models, service layer organization
- **API Reference**: Complete endpoint documentation with examples
- **Authentication**: JWT flow, session management, multi-device support
- **Roadmap Generation**: How the system generates learning paths
- **Services**: Backend and frontend architecture details
- **Development**: Workflow, git strategy, debugging tips
- **Troubleshooting**: Common issues and solutions
- **Contributing**: Code style, git commits, pull requests
- **Known Issues**: Current limitations and future improvements

## 🔧 Common Commands

```bash
npm run dev              # Start frontend + backend
npm run dev:api         # Start backend only
npm run dev:web         # Start frontend only
npm run build           # Build for production
npm run lint:fix        # Fix linting issues
npm run format          # Format all code with Prettier
npm run test            # Run tests
```

## 🌐 Project Structure

```
learning-path-optimizer/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API client
│   │   ├── context/        # Auth context
│   │   └── hooks/          # Custom hooks
│   └── package.json
│
├── server/                  # Express backend
│   ├── controllers/         # HTTP handlers
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── models/             # Mongoose schemas
│   ├── middleware/         # Auth, validation
│   ├── repositories/       # Database access
│   ├── config/             # Configuration
│   └── package.json
│
├── packages/shared/         # Shared schemas and utilities
├── docs/                    # Additional documentation
└── MASTER_DOCUMENTATION.md  # Complete project guide
```

## 🔐 Environment Variables

Required `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/db

# JWT
JWT_SECRET=your_super_secret_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# AI
GROQ_API_KEY=gsk_your_groq_api_key

# Frontend
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Optional
DEMO_MODE=false
```

## 🐛 Troubleshooting

**See [Troubleshooting Guide](MASTER_DOCUMENTATION.md#troubleshooting) in MASTER_DOCUMENTATION.md for:**

- MongoDB connection errors
- Groq API rate limiting (429 errors)
- JWT token issues
- CORS errors
- Port conflicts
- Custom skill generation failures
- Database validation errors
- Performance issues

## 👥 Contributing

We welcome contributions! See [Contributing Guidelines](MASTER_DOCUMENTATION.md#contributing-guidelines) for:

- Code style standards
- Git commit message format
- Testing requirements
- Pull request process
- Code review expectations

## 📖 Additional Resources

- [API Contracts](docs/API_CONTRACTS_V2.md) - Complete API reference
- [System Architecture](docs/COMPLETE_SYSTEM_ARCHITECTURE.md) - Detailed design
- [JWT Authentication](docs/JWT_AUTHENTICATION.md) - Auth implementation
- [ADRs](docs/ADRs/) - Architecture Decision Records

## 📧 Support

Need help?

1. Check [Troubleshooting Guide](MASTER_DOCUMENTATION.md#troubleshooting)
2. Search [GitHub Issues](https://github.com/yogeswaranv007/learning-path-optimizer/issues)
3. Create a new issue with steps to reproduce

## 🙏 Acknowledgments

Built with:

- [React](https://react.dev) - UI framework
- [Express.js](https://expressjs.com) - Backend framework
- [MongoDB](https://mongodb.com) - Database
- [Groq](https://groq.com) - AI API
- [Tailwind CSS](https://tailwindcss.com) - Styling

## 📄 License

[Add license information]

---

**Last Updated**: March 24, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

📖 **Refer to [MASTER_DOCUMENTATION.md](MASTER_DOCUMENTATION.md) for complete documentation.**
