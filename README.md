# IgniteChat 🚀

A full-stack, real-time chat and matchmaking application built with React, Node.js, Express, Socket.IO, and Prisma. Features include global messaging, "stranger connect" matchmaking, AI-assisted grammar practice, and more.

## Architecture

![Architecture](https://via.placeholder.com/800x400?text=IgniteChat+Architecture)

The application utilizes a distributed, multi-cloud architecture for high availability and performance:

1. **Frontend (Vercel)**: 
   - A Vite-based React SPA (Single Page Application).
   - Fast, edge-distributed content delivery.
2. **Backend (Fly.io)**: 
   - Node.js environment utilizing Express and Socket.IO.
   - Containerized deployment running close to edge regions.
   - Kept "warm" by automated GitHub Action pings to prevent cold starts.
3. **Database (Supabase / Postgres)**: 
   - Managed cloud PostgreSQL instance.
   - Communicates securely with the backend via Prisma ORM.

## Local Development Setup

### 1. Prerequisites
- Node.js (v20+)
- Postgres database (local or cloud)
- Docker (optional)

### 2. Environment Variables
Copy the `.env.example` file in the `/backend` directory to `.env` and fill out the details:
```bash
cp backend/.env.example backend/.env
```

### 3. Run Locally

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push # To sync database schema
npm run dev
```

## Docker Usage

The backend is containerized for seamless deployment.

**Build Image:**
```bash
cd backend
docker build -t ignitechat-backend .
```

**Run Container Locally:**
```bash
docker run -p 5000:5000 --env-file .env ignitechat-backend
```

## Deployment & CI/CD 🚀

This project utilizes highly automated CI/CD pipelines via GitHub Actions (`.github/workflows/ci.yml`). Every push to the `main` branch tests and triggers build processes.

### Deploying Frontend (Vercel)
1. Link your GitHub repository in your Vercel Dashboard.
2. Select the `frontend` directory as the Root Directory.
3. Vercel will automatically detect Vite and configure the build settings. `vercel.json` provides strict single-page application routing.
4. Add the backend URL to your Vercel Environment Variables (`VITE_BACKEND_URL` / `CLIENT_URL` if applicable).

### Deploying Backend (Fly.io)
1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
2. Run `fly launch` inside the `backend` directory. Say "Yes" to tweak settings and ensure it uses the provided `Dockerfile`.
3. Set your production secrets securely:
```bash
fly secrets set DATABASE_URL="your-supabase-db-url" JWT_SECRET="your-secret" CLIENT_URL="https://your-vercel-domain.vercel.app"
```
4. **Automating Deployments:** Uncomment the deployment section in `.github/workflows/ci.yml` and provide the `FLY_API_TOKEN` secret in your GitHub repository for continuous delivery.

### Uptime Monitoring
An included GitHub Action runs every 15 minutes (`uptime.yml`) to automatically ping the `https://your-backend.fly.dev/health` endpoint, maintaining the backend instance's active state and reducing latency for the first login of the day. You must provide `BACKEND_URL` in your GitHub repository secrets.

## Features
- **Real-time Messaging**: Socket.IO integrated chat loops.
- **Story Library**: Multilingual AI support powered by integrations.
- **Matchmaking (Stranger Connect)**: Queued user matchmaking connections.
- **Mobile Support**: Capacitor/Ionic configurations existing for Android APK deployment.
