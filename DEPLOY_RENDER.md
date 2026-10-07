# Deploy Spark on Render

This package serves the built React frontend, Express API and Socket.IO from one HTTPS Render Web Service. No separate frontend deployment or frontend API URL is needed.

## 1. Push your source to GitHub

Extract this ZIP and upload the CONTENTS of its inner project folder to your GitHub repository root. That root must contain package.json, render.yaml, backend/ and frontend/.
Do not upload node_modules, backend/.env or frontend/vite-project/.env. The included .gitignore excludes them when using Git. GitHub's manual upload screen does not apply .gitignore, so leave those files out yourself. dist is optional: Render builds it.

## 2. Prepare MongoDB Atlas

Create/use your cluster and database user. Copy its Node.js connection string and select a database, for example `spark`. URL-encode any special characters in the database password. Put the real connection string only in Render's MONGO_URI secret field.

Atlas Network Access must allow the Render service's outbound addresses. Obtain these from your Render service's Connect > Outbound section and add the displayed ranges to Atlas. Your Windows localhost database cannot be reached from Render.

## 3. Deploy the Blueprint

At https://dashboard.render.com select New > Blueprint and connect your repository. Render reads render.yaml. Enter MONGO_URI when prompted and deploy. The blueprint uses a free instance and generates JWT_SECRET. If a free instance is unavailable for your account, select an available plan after checking its cost.

Alternative manual setup: New > Web Service, connect the same repository, select Node runtime, leave Root Directory empty and use:

- Build Command: `npm run build:render`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment: NODE_ENV=production; NODE_VERSION=22.16.0; COOKIE_SAME_SITE=lax
- MONGO_URI: your Atlas connection string
- JWT_SECRET: a newly generated secret of at least 32 characters
- VITE_API_URL: leave unset/empty

To generate JWT_SECRET locally:

```cmd
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Render provides PORT and RENDER_EXTERNAL_URL automatically. The application includes that exact public URL in its CORS allowlist; do not manually set PORT. For a custom domain, also set CLIENT_URLS=https://your-domain.example and redeploy.

## 4. Verify

Open the HTTPS URL displayed by Render. Check `/api/health` returns `{ "status": "ok" }`. Register accounts in two separate browser sessions, like each other and send messages. Do not open the old localhost page when testing the deployed app.

A free Render service can sleep when inactive, causing a delay on the first request. This application uses in-process Socket.IO rooms: keep one instance. Horizontal scaling requires a shared Socket.IO adapter and an appropriate load-balancer configuration.

## Local production-build smoke test (Windows CMD)

After dependencies are installed, run `npm run build`. In the same CMD session:

```cmd
set NODE_ENV=production
set MONGO_URI=mongodb://127.0.0.1:27017/spark
set JWT_SECRET=replace_with_a_random_secret_at_least_32_characters
set CLIENT_URLS=http://localhost:8000
npm start
```

The homepage and API will be served on port 8000. Production cookies require HTTPS, so use development mode for local authentication testing, or an HTTPS reverse proxy. Production ignores backend/.env; supply the environment variables through the host. End this terminal session before returning to local dev mode.

No live deployment was performed while preparing this package. Deployment still needs your repository connection and Atlas configuration.
