# Railway Deployment Guide

This guide walks through deploying the Emergency Response and Dispatch Platform on Railway. Each microservice is deployed as a separate Railway service within a single project, allowing them to communicate over Railway's private network without exposing internal ports to the internet.

---

## Table of Contents

- [How Railway Works for This Project](#how-railway-works-for-this-project)
- [Prerequisites](#prerequisites)
- [Step 1 - Push Code to GitHub](#step-1---push-code-to-github)
- [Step 2 - Create a Railway Project](#step-2---create-a-railway-project)
- [Step 3 - Deploy RabbitMQ](#step-3---deploy-rabbitmq)
- [Step 4 - Add MongoDB Databases](#step-4---add-mongodb-databases)
- [Step 5 - Deploy the Auth Service](#step-5---deploy-the-auth-service)
- [Step 6 - Deploy the Incident Service](#step-6---deploy-the-incident-service)
- [Step 7 - Deploy the Tracking Service](#step-7---deploy-the-tracking-service)
- [Step 8 - Deploy the Analytics Service](#step-8---deploy-the-analytics-service)
- [Step 9 - Deploy the Frontend](#step-9---deploy-the-frontend)
- [Step 10 - Verify the Deployment](#step-10---verify-the-deployment)
- [Environment Variable Reference](#environment-variable-reference)
- [Useful Railway CLI Commands](#useful-railway-cli-commands)
- [Troubleshooting](#troubleshooting)

---

## How Railway Works for This Project

Railway organises everything into a single **project**. Within that project you create one **service** per deployable unit. Services in the same project share a private network and can reach each other using internal hostnames in the format:

```
http://<service-name>.railway.internal:<PORT>
```

This traffic never leaves Railway's network, so internal service-to-service calls are both fast and secure.

The full deployment looks like this:

```
Railway Project: emergency-response-platform
|
|-- rabbitmq            (Docker image service - internal only)
|-- auth-db             (Railway MongoDB plugin)
|-- incident-db         (Railway MongoDB plugin)
|-- tracking-db         (Railway MongoDB plugin)
|-- analytics-db        (Railway MongoDB plugin)
|-- auth-service        (GitHub -> auth-service/ Dockerfile) -> public URL
|-- incident-service    (GitHub -> incident-service/ Dockerfile) -> public URL
|-- tracking-service    (GitHub -> tracking-service/ Dockerfile) -> public URL
|-- analytics-service   (GitHub -> analytics-service/ Dockerfile) -> public URL
|-- frontend            (GitHub -> frontend/ static build) -> public URL
```

RabbitMQ and the four MongoDB databases are internal-only (no public domain assigned). The five application services each get a public Railway URL.

---

## Prerequisites

- A Railway account at https://railway.app (the Hobby plan at $5/month is required for projects with more than one service; the Starter plan is enough for testing)
- The project pushed to a GitHub repository (public or private - Railway supports both)
- The Railway CLI installed (optional but useful for logs and manual deploys):

```bash
npm install -g @railway/cli
railway login
```

---

## Step 1 - Push Code to GitHub

Railway deploys directly from a GitHub repository. If the project is not already on GitHub:

```bash
cd course-project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/emergency-response-platform.git
git push -u origin main
```

Make sure your `.gitignore` excludes all `.env` files so credentials are never committed:

```
# .gitignore
.env
node_modules/
dist/
```

---

## Step 2 - Create a Railway Project

1. Go to https://railway.app and sign in.
2. Click **New Project**.
3. Select **Empty Project**.
4. Name the project `emergency-response-platform`.

You will now add services one by one inside this project.

---

## Step 3 - Configure RabbitMQ

If you already have a RabbitMQ instance running externally (for example on CloudAMQP), skip this step. Copy the AMQP connection URL from your provider and use it as the `RABBITMQ_URL` value when configuring the incident-service, tracking-service, and analytics-service in later steps. The URL format is typically:

```
amqps://user:password@host/vhost
```

If you do not yet have a RabbitMQ instance and want to host it on Railway, deploy it as a Docker image service:

1. Inside the project, click **+ New Service**.
2. Select **Docker Image**.
3. Enter the image name: `rabbitmq:3-management-alpine`
4. Click **Deploy**.
5. Once deployed, click on the `rabbitmq` service and go to **Settings**.
6. Under **Networking**, do NOT generate a public domain. Leave it internal only.

The internal AMQP connection string to use in the other services is:

```
amqp://rabbitmq.railway.internal:5672
```

> Note: Railway's internal networking uses the service name as the hostname. If you rename the service, update the hostname in all dependent environment variables accordingly.

---

## Step 4 - Add MongoDB Databases

Add four separate MongoDB databases - one per microservice. Railway's MongoDB plugin provisions a managed MongoDB instance and provides a connection string automatically.

Repeat the following steps four times, naming each database as indicated:

1. Click **+ New Service**.
2. Select **Database -> Add MongoDB**.
3. After it provisions, click the database service and go to **Variables**.
4. Copy the value of `MONGODB_URL` - you will paste this into the corresponding application service later.

Create and name the four databases:

| Service name in Railway | Used by |
|---|---|
| `auth-db` | auth-service |
| `incident-db` | incident-service |
| `tracking-db` | tracking-service |
| `analytics-db` | analytics-service |

You can rename a Railway service after creation by clicking on it and editing the name in **Settings -> General**.

---

## Step 5 - Deploy the Auth Service

### 5a - Create the service

1. Click **+ New Service**.
2. Select **GitHub Repo**.
3. Authorise Railway to access your GitHub account if prompted.
4. Select the repository.
5. Before deploying, set the **Root Directory** to `auth-service` in the service settings. Railway will then look for the Dockerfile at `auth-service/Dockerfile`.
6. Click **Deploy**.

Railway will build the Docker image and start the container. The first deploy may fail because environment variables are not set yet - that is expected.

### 5b - Set environment variables

Click on the `auth-service` service, then go to **Variables**. Add the following:

| Variable | Value |
|---|---|
| `PORT` | `3001` |
| `MONGODB_URI` | Paste the `MONGODB_URL` value from the `auth-db` database service |
| `JWT_SECRET` | A random string of at least 64 characters - generate one with `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |

After saving variables, Railway will automatically redeploy the service.

### 5c - Generate a public domain

1. Go to **Settings -> Networking -> Generate Domain**.
2. Railway assigns a URL such as `auth-service-production.up.railway.app`.
3. Note this URL - it is the auth service's public base URL.

---

## Step 6 - Deploy the Incident Service

### 6a - Create the service

1. Click **+ New Service -> GitHub Repo**.
2. Select the same repository.
3. Set the **Root Directory** to `incident-service`.
4. Click **Deploy**.

### 6b - Set environment variables

| Variable | Value |
|---|---|
| `PORT` | `3002` |
| `MONGODB_URI` | Paste the `MONGODB_URL` from the `incident-db` database service |
| `JWT_SECRET` | Same value used in auth-service |
| `RABBITMQ_URL` | `amqp://rabbitmq.railway.internal:5672` |
| `NODE_ENV` | `production` |

### 6c - Generate a public domain

Go to **Settings -> Networking -> Generate Domain** and note the URL.

---

## Step 7 - Deploy the Tracking Service

### 7a - Create the service

1. Click **+ New Service -> GitHub Repo**.
2. Select the same repository.
3. Set the **Root Directory** to `tracking-service`.
4. Click **Deploy**.

### 7b - Set environment variables

| Variable | Value |
|---|---|
| `PORT` | `3003` |
| `MONGODB_URI` | Paste the `MONGODB_URL` from the `tracking-db` database service |
| `JWT_SECRET` | Same value used in auth-service |
| `RABBITMQ_URL` | `amqp://rabbitmq.railway.internal:5672` |
| `NODE_ENV` | `production` |

### 7c - Generate a public domain

Go to **Settings -> Networking -> Generate Domain** and note the URL. The Socket.io WebSocket connection will use this same domain.

---

## Step 8 - Deploy the Analytics Service

### 8a - Create the service

1. Click **+ New Service -> GitHub Repo**.
2. Select the same repository.
3. Set the **Root Directory** to `analytics-service`.
4. Click **Deploy**.

### 8b - Set environment variables

| Variable | Value |
|---|---|
| `PORT` | `3005` |
| `MONGODB_URI` | Paste the `MONGODB_URL` from the `analytics-db` database service |
| `JWT_SECRET` | Same value used in auth-service |
| `RABBITMQ_URL` | `amqp://rabbitmq.railway.internal:5672` |
| `NODE_ENV` | `production` |

The analytics service does not need a public domain unless you want to expose the analytics API directly. It only consumes RabbitMQ events and its endpoints are accessed via the frontend through the tracking or incident service URLs. If you want it accessible, generate a domain in the same way.

---

## Step 9 - Deploy the Frontend

The React frontend is a static site built with Vite. Railway can serve it using a small nginx container via a Dockerfile, or you can deploy it to Vercel for a simpler zero-config setup.

### Option A - Deploy on Railway (keep everything in one place)

The frontend directory does not currently contain a Dockerfile configured for static serving. Add the following `Dockerfile` inside the `frontend/` directory:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Also create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Commit and push both files. Then in Railway:

1. Click **+ New Service -> GitHub Repo**.
2. Set the **Root Directory** to `frontend`.
3. Go to **Variables** and add:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your API gateway URL. Since there is no single gateway, see the note below. |

4. Generate a public domain for the frontend service.

> Note on `VITE_API_BASE_URL`: Without an nginx API gateway to unify all services behind one URL, the frontend needs to know which backend URL to hit. The cleanest approach for Railway without a gateway is to place an nginx reverse proxy service in front of all backend services. Alternatively, deploy each service at a path-based subdomain and configure the frontend `axios.js` to route differently per service. For a course project the simplest option is to use the Vercel approach below and configure per-service base URLs, or to add a single lightweight nginx gateway service on Railway.

### Option B - Deploy frontend on Vercel (recommended for simplicity)

No Dockerfile or nginx.conf is needed for Vercel. Vercel auto-detects Vite, runs `npm run build` itself, serves the `dist/` output, and handles React Router's client-side routing automatically.

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New Project** and import the repository.
3. Set the **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:

```
VITE_API_BASE_URL = https://your-incident-service.up.railway.app
```

5. Click **Deploy**. Vercel builds the project and provides a URL like `emergency-platform.vercel.app`.

> Because the Vite dev server proxy is only available in local development, in production `VITE_API_BASE_URL` must point to a real URL. If you add an nginx gateway service on Railway that routes all `/api/v1/*` paths, point to that single URL. Without a gateway, point to the incident-service public URL for REST calls and handle the tracking WebSocket connection separately in the Socket.io client code.

---

## Step 10 - Verify the Deployment

Check each service is running in the Railway dashboard (all should show a green status). Then run the following tests:

**Check auth service is reachable:**

```bash
curl -X POST https://auth-service-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'
```

**Check Swagger docs are accessible:**

```
https://auth-service-production.up.railway.app/api-docs
https://incident-service-production.up.railway.app/api-docs
https://tracking-service-production.up.railway.app/api-docs
```

**Check RabbitMQ internal connectivity** (look at the incident-service or tracking-service logs for a successful RabbitMQ connection message):

```bash
railway logs --service incident-service
```

Expected output should include a line like:

```
RabbitMQ connected
```

**Create the first admin user** (only possible via direct API call since the UI requires a logged-in admin first):

```bash
curl -X POST https://auth-service-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Admin",
    "email": "admin@example.com",
    "password": "StrongPassword123",
    "role": "system_admin"
  }'
```

---

## Environment Variable Reference

Quick reference of all variables needed across services for the Railway deployment:

### auth-service

| Variable | Example value |
|---|---|
| `PORT` | `3001` |
| `MONGODB_URI` | Value from Railway auth-db plugin |
| `JWT_SECRET` | Random 64-character string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |

### incident-service

| Variable | Example value |
|---|---|
| `PORT` | `3002` |
| `MONGODB_URI` | Value from Railway incident-db plugin |
| `JWT_SECRET` | Same as auth-service |
| `RABBITMQ_URL` | `amqp://rabbitmq.railway.internal:5672` |
| `NODE_ENV` | `production` |

### tracking-service

| Variable | Example value |
|---|---|
| `PORT` | `3003` |
| `MONGODB_URI` | Value from Railway tracking-db plugin |
| `JWT_SECRET` | Same as auth-service |
| `RABBITMQ_URL` | `amqp://rabbitmq.railway.internal:5672` |
| `NODE_ENV` | `production` |

### analytics-service

| Variable | Example value |
|---|---|
| `PORT` | `3005` |
| `MONGODB_URI` | Value from Railway analytics-db plugin |
| `JWT_SECRET` | Same as auth-service |
| `RABBITMQ_URL` | `amqp://rabbitmq.railway.internal:5672` |
| `NODE_ENV` | `production` |

### frontend

| Variable | Example value |
|---|---|
| `VITE_API_BASE_URL` | `https://your-gateway.up.railway.app` or incident-service public URL |

---

## Useful Railway CLI Commands

Install the CLI once and use it for logs, environment management, and manual deploys.

```bash
# Install
npm install -g @railway/cli

# Authenticate
railway login

# Link local directory to a Railway project
railway link

# View logs for a specific service
railway logs --service auth-service

# Open the Railway dashboard for the linked project
railway open

# Deploy the current directory manually (useful if auto-deploy is off)
railway up

# List all environment variables for the linked service
railway variables

# Set an environment variable from the CLI
railway variables set JWT_SECRET=yoursecrethere --service auth-service

# Run a one-off command inside a service's environment (for seeding data)
railway run --service incident-service node src/scripts/seed.js
```

---

## Troubleshooting

**Service shows "Crashed" status**

Open the service in Railway and click **View Logs**. Common causes:
- A required environment variable is missing or misspelled
- The MongoDB or RabbitMQ connection string is wrong
- The `PORT` variable does not match the port the app listens on

**RabbitMQ connection refused**

Railway's internal networking requires all services to be in the same project. If the incident-service or tracking-service was created in a different project, it cannot reach `rabbitmq.railway.internal`. Verify all services are inside the same Railway project.

Also check that the RabbitMQ service has fully started before the dependent services try to connect. Services with RabbitMQ connections should implement retry logic on startup. If they do not, restart the service manually from the Railway dashboard after RabbitMQ is healthy.

**Frontend shows blank page or API calls fail with network errors**

- Confirm `VITE_API_BASE_URL` is set correctly and does not have a trailing slash.
- Confirm the backend services have public domains generated and are running.
- Check browser console for CORS errors. If present, verify the backend services have CORS configured to allow the frontend's Vercel or Railway domain.

**MongoDB plugin connection string format**

Railway MongoDB plugins provide a `MONGODB_URL` variable in the format:

```
mongodb://mongo:password@host:port
```

Paste this value directly into the `MONGODB_URI` variable of the corresponding application service. Do not modify the format.

**Socket.io WebSocket connection fails in production**

Railway supports WebSocket connections on public domains. Make sure the Socket.io client in the frontend connects to the tracking-service public URL, not a localhost address. The connection string in the frontend code should use the `VITE_TRACKING_SERVICE_URL` environment variable (or equivalent) pointing to the tracking-service Railway domain.

**Redeploying after a code change**

Railway watches the connected GitHub branch and redeploys automatically on every push. To trigger a manual redeploy without a code change, go to the service in the dashboard and click **Redeploy**, or use:

```bash
railway up --service auth-service
```
