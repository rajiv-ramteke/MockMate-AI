---
title: Smart Interview Genius AI
emoji: 🚀
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# MockMate AI

Welcome to **MockMate AI**, a modern, AI-powered interview preparation application. This tool helps you prepare for interviews by generating personalized technical and behavioral questions based on your resume.

## Features
- ✨ **Completely Custom UI:** Premium Dark Mode, Glassmorphism, and responsive layout.
- 🤖 **AI-Generated Questions:** Uses Google Gemini AI to analyze your resume and create tailored questions.
- 📊 **Smart Scoring:** Provides match scores and identifies skill gaps.
- 🗺️ **Preparation Roadmap:** Generates a custom day-by-day interview preparation plan.

## Setup Instructions

### 1. Backend Setup
1. Open the `Backend` directory.
2. Ensure you have run `npm install`.
3. Open the `Backend/.env` file and add your `MONGO_URI` and `GOOGLE_GENAI_API_KEY`.
4. Start the server with `npm start` or `npm run dev`.

### 2. Frontend Setup
1. Open the `Frontend` directory.
2. Ensure you have run `npm install`.
3. Start the development server with `npm run dev`.

## Deployment

### Deploying on Render
This project is fully configured to be easily deployed on Render using Docker (which safely handles the Puppeteer and Chromium system dependencies).

1. Push this project to your GitHub repository.
2. Go to [Render](https://render.com/) and create a new account or log in.
3. Click on the **New** button and select **Blueprint**.
4. Connect your GitHub repository. Render will automatically detect the `render.yaml` file and configure the application as a Docker Web Service.
5. In the Render Dashboard, go to your newly created Web Service and add all the required environment variables:
   - `MONGO_URI`
   - `GOOGLE_GENAI_API_KEY`
   - Any other Firebase credentials or tokens used in your `.env`.
6. Click **Deploy**. Render will use the provided `Dockerfile` to automatically build the frontend, install the backend dependencies along with Puppeteer, and start your unified server!

## File Structure

The project is organized into two main workspaces: **Backend** (Node.js/Express) and **Frontend** (React/Vite).

```text
MockMate AI/
├── Backend/                 # Node.js & Express server
│   ├── .env                 # Environment variables
│   ├── server.js            # Server entry point
│   └── src/
│       ├── app.js           # Express app setup
│       ├── config/          # Configurations
│       ├── controllers/     # Request handlers
│       ├── middlewares/     # Custom middleware
│       ├── models/          # Database schemas
│       ├── routes/          # API routes
│       └── services/        # Core business logic (AI integration)
├── Frontend/                # React & Vite application
│   ├── index.html           # Main HTML entry point
│   ├── public/              # Static assets
│   └── src/                 # React source code
│       ├── main.jsx         # React DOM rendering entry point
│       ├── App.jsx          # Main application component
│       ├── app.routes.jsx   # React Router definitions
│       ├── style/           # Global SCSS styles
│       └── features/        # Feature-based component modules
├── .dockerignore            
├── .gitignore               
├── Dockerfile               
├── LICENSE                  
├── package.json             
└── README.md                
```

## Acknowledgements
This project was proudly developed by **Rajiv**, featuring a custom-built user interface and design system.

Special thanks and credits to [ankurdotio/interview-ai-yt](https://github.com/ankurdotio/interview-ai-yt) which served as a reference for the underlying application architecture and logic. The open-source community's contributions made this learning journey and project possible.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
