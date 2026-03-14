# Render Backend Deployment Guide

This guide covers deploying the four backend microservices on Render. The frontend is assumed to be on Vercel. MongoDB is hosted on MongoDB Atlas (Render has no managed MongoDB). RabbitMQ is assumed to already be running externally.

---

## Table of Contents

- [How Render Works for This Project](#how-render-works-for-this-project)
- [Prerequisites](#prerequisites)
- [Step 1 - Set Up MongoDB Atlas](#step-1---set-up-mongodb-atlas)
- [Step 2 - Create an Environment Group](#step-2---create-an-environment-group)
- [Step 3 - Deploy the Auth Service](#step-3---deploy-the-auth-service)
- [Step 4 - Deploy the Incident Service](#step-4---deploy-the-incident-service)
- [Step 5 - Deploy the Tracking Service](#step-5---deploy-the-tracking-service)
- [Step 6 - Deploy the Analytics Service](#step-6---deploy-the-analytics-service)
- [Step 7 - Deploy the nginx Gateway](#step-7---deploy-the-nginx-gateway)
- [Step 8 - Wire Up Inter-Service URLs](#step-8---wire-up-inter-service-urls)
- [Step 9 - Configure the Vercel Frontend](#step-9---configure-the-vercel-frontend)
- [Step 10 - Verify the Deployment](#step-10---verify-the-deployment)
- [Free Tier Limitations](#free-tier-limitations)

---

## How Render Works for This Project

Each microservice is deployed as a **Web Service** on Render. Render detects the `Dockerfile` in each service subdirectory and builds it automatically.

### Inter-service communication

Services need to call each other (for example, the incident-service validates JWTs by sharing the same secret, and may call the auth-service directly in some flows). How they reach each other depends on your plan:

**Free / Starter plan** - all services have public URLs (`https://service-name.onrender.com`). Services call each other using these public URLs. Straightforward but slightly slower for internal calls.

**Standard plan and above** - Render provides a private network. Services on the same account can reach each other via their internal hostname:

```
http://<service-name>:<PORT>
```

For example: `http://auth-service:3001`. No public URL is used for internal traffic. This is faster and more secure. If you are on a paid plan, use internal hostnames anywhere a service URL is referenced in environment variables.

This guide uses public URLs in all examples so it works on any plan. Substitute internal hostnames where noted if you are on a paid plan.

---

## Prerequisites

- A Render account at https://render.com
- The project pushed to a GitHub or GitLab repository
- A MongoDB Atlas account at https://cloud.mongodb.com
- Your RabbitMQ AMQP URL (e.g. `amqps://user:pass@host/vhost` from CloudAMQP or another provider)

---

## Step 1 - Set Up MongoDB Atlas

Render does not provide a MongoDB database. You need four MongoDB databases on Atlas - one per service.

**Create the cluster:**

1. Log in to https://cloud.mongodb.com and create a free M0 cluster (or use an existing one).
2. Go to **Database Access** and create a database user with read/write permissions. Note the username and password.
3. Go to **Network Access** and add `0.0.0.0/0` to the IP allowlist. Render does not provide static outbound IPs on the free tier, so open access is required. On a paid Render plan you can restrict this to Render's IP ranges.

**Get connection strings:**

1. Click **Connect** on your cluster.
2. Choose **Drivers** and copy the connection string. It looks like:

```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

3. You will use this base string four times, adding a different database name for each service:

```
mongodb+srv://username:password@cluster.mongodb.net/auth_db?retryWrites=true&w=majority
mongodb+srv://username:password@cluster.mongodb.net/incident_db?retryWrites=true&w=majority
mongodb+srv://username:password@cluster.mongodb.net/tracking_db?retryWrites=true&w=majority
mongodb+srv://username:password@cluster.mongodb.net/analytics_db?retryWrites=true&w=majority
```

Keep these ready. You will paste them into Render environment variables in the steps below.

---

## Step 2 - Create an Environment Group

An Environment Group lets you define shared variables once and attach them to multiple services. This avoids copy-pasting `JWT_SECRET` and `RABBITMQ_URL` into every service individually.

1. In the Render dashboard, go to **Environment Groups** in the left sidebar.
2. Click **New Environment Group**.
3. Name it `emergency-platform-shared`.
4. Add the following variables:

| Variable       | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| `JWT_SECRET`   | A random string of at least 64 characters. Generate one with `openssl rand -hex 32` |
| `RABBITMQ_URL` | Your full AMQP URL, e.g. `amqps://user:pass@host/vhost`                             |
| `NODE_ENV`     | `production`                                                                        |

5. Save the group.

You will attach this group to each service during deployment so all four services automatically share these values.

---

## Step 3 - Deploy the Auth Service

### 3a - Create the Web Service

1. In the Render dashboard click **New -> Web Service**.
2. Connect your GitHub repository.
3. Fill in the service settings:

| Setting        | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Name           | `auth-service`                                                           |
| Region         | Choose the region closest to your users (e.g. Frankfurt for West Africa) |
| Branch         | `main`                                                                   |
| Root Directory | `auth-service`                                                           |
| Runtime        | Docker (Render auto-detects the Dockerfile)                              |
| Instance Type  | Free (or Starter for always-on)                                          |

4. Scroll to **Environment Variables** and add:

| Variable                 | Value                                                                       |
| ------------------------ | --------------------------------------------------------------------------- |
| `PORT`                   | `3001`                                                                      |
| `MONGODB_URI`            | `mongodb+srv://...@cluster.mongodb.net/auth_db?retryWrites=true&w=majority` |
| `JWT_ACCESS_EXPIRES_IN`  | `15m`                                                                       |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                                                        |

5. Scroll to **Environment Groups** and attach `emergency-platform-shared`.
6. Click **Create Web Service**.

Render will build the Docker image and deploy it. The first build takes 3-5 minutes.

### 3b - Note the public URL

Once deployed, Render shows the service URL at the top of the page:

```
https://neradcp-auth.onrender.com
```

Copy this URL. You will need it when configuring the other services and the frontend.

---

## Step 4 - Deploy the Incident Service

### 4a - Create the Web Service

1. Click **New -> Web Service**.
2. Connect the same repository.
3. Fill in the service settings:

| Setting        | Value              |
| -------------- | ------------------ |
| Name           | `incident-service` |
| Root Directory | `incident-service` |
| Runtime        | Docker             |

4. Add environment variables:

| Variable      | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| `PORT`        | `3002`                                                                          |
| `MONGODB_URI` | `mongodb+srv://...@cluster.mongodb.net/incident_db?retryWrites=true&w=majority` |

5. Attach the `emergency-platform-shared` environment group.
6. Click **Create Web Service**.

### 4b - Note the public URL

```
https://neradcp-incident.onrender.com
```

---

## Step 5 - Deploy the Tracking Service

### 5a - Create the Web Service

1. Click **New -> Web Service**.
2. Connect the same repository.
3. Fill in the service settings:

| Setting        | Value              |
| -------------- | ------------------ |
| Name           | `tracking-service` |
| Root Directory | `tracking-service` |
| Runtime        | Docker             |

4. Add environment variables:

| Variable      | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| `PORT`        | `3003`                                                                          |
| `MONGODB_URI` | `mongodb+srv://...@cluster.mongodb.net/tracking_db?retryWrites=true&w=majority` |

5. Attach the `emergency-platform-shared` environment group.
6. Click **Create Web Service**.

### 5b - WebSocket support

Render supports WebSocket connections on all Web Services with no extra configuration. Socket.io will work on the tracking-service public URL out of the box.

### 5c - Note the public URL

```
https://neradcp-tracking.onrender.com
```

---

## Step 6 - Deploy the Analytics Service

The analytics service only consumes RabbitMQ events and serves read-only analytics endpoints. It does not need to be called by other backend services, only by the frontend.

1. Click **New -> Web Service**.
2. Connect the same repository.
3. Fill in the service settings:

| Setting        | Value               |
| -------------- | ------------------- |
| Name           | `analytics-service` |
| Root Directory | `analytics-service` |
| Runtime        | Docker              |

4. Add environment variables:

| Variable      | Value                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| `PORT`        | `3005`                                                                           |
| `MONGODB_URI` | `mongodb+srv://...@cluster.mongodb.net/analytics_db?retryWrites=true&w=majority` |

5. Attach the `emergency-platform-shared` environment group.
6. Click **Create Web Service**.

### 6c - Note the public URL

```
https://neradcp-analytics.onrender.com
```

---

## Step 7 - Deploy the nginx Gateway

The gateway is a lightweight nginx container that sits in front of all four backend services and routes requests based on the URL path. It lives in the `gateway/` directory of the repository and is already committed with a `Dockerfile` and `nginx.conf.template`.

The routing rules are:

| Path prefix | Routed to |
|---|---|
| `/api/v1/auth/` | auth-service |
| `/api/v1/analytics/` | analytics-service |
| `/api/v1/tracking/` | tracking-service |
| `/socket.io/` | tracking-service (WebSocket) |
| `/api/v1/` (everything else) | incident-service |

### 7a - Create the Web Service

1. Click **New -> Web Service**.
2. Connect the same repository.
3. Fill in the service settings:

| Setting | Value |
|---|---|
| Name | `gateway` |
| Root Directory | `gateway` |
| Runtime | Docker |
| Instance Type | Free |

4. Add environment variables (use the actual public URLs of the services deployed in steps 3-6):

| Variable | Value |
|---|---|
| `AUTH_SERVICE_URL` | `https://neradcp-auth.onrender.com` |
| `INCIDENT_SERVICE_URL` | `https://neradcp-incident.onrender.com` |
| `TRACKING_SERVICE_URL` | `https://neradcp-tracking.onrender.com` |
| `ANALYTICS_SERVICE_URL` | `https://neradcp-analytics.onrender.com` |

> Note: Render automatically injects the `PORT` environment variable into every service. The nginx template reads `${PORT}` so nginx listens on the correct port without any extra configuration.

5. Click **Create Web Service**.

### 7b - Note the gateway URL

Once deployed, the gateway URL will look like:

```
https://neradcp-gateway.onrender.com
```

This is the only URL the frontend needs to know about.

---

## Step 8 - Wire Up Inter-Service URLs

The backend services do not call each other directly in most flows - they share the same JWT secret so each service validates tokens independently without contacting the auth service. No inter-service URL environment variables are needed beyond what is already set.

If a future feature requires direct service-to-service HTTP calls, add the target service's public Render URL as an environment variable on the calling service and redeploy. Render redeploys automatically when environment variables change.

---

## Step 9 - Configure the Vercel Frontend

In the Vercel dashboard for your frontend project, go to **Settings -> Environment Variables** and set:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://neradcp-gateway.onrender.com` |

That is the only variable needed. All REST API calls and the Socket.io WebSocket connection route through the gateway, which forwards them to the correct backend service. `VITE_TRACKING_URL` does not need to be set.

Trigger a redeploy on Vercel after saving by going to **Deployments** and clicking **Redeploy**.

---

## Step 10 - Verify the Deployment

**Check all services are live** by visiting their Render dashboard pages. All five services (gateway + four backend services) should show **Live** status.

**Test the gateway routes correctly to the auth service:**

```bash
curl -X POST https://neradcp-gateway.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'
```

**Test the gateway routes correctly to the incident service:**

```bash
curl https://neradcp-gateway.onrender.com/api/v1/incidents \
  -H "Authorization: Bearer your-token-here"
```

**Create the first system_admin user** via the gateway (do this before opening the frontend):

```bash
curl -X POST https://neradcp-gateway.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Admin",
    "email": "admin@yourdomain.com",
    "password": "StrongPassword123",
    "role": "system_admin"
  }'
```

**Check Swagger docs** by hitting each backend service directly (bypass the gateway, as Swagger is not routed through it):

```
https://neradcp-auth.onrender.com/api-docs
https://neradcp-incident.onrender.com/api-docs
https://neradcp-tracking.onrender.com/api-docs
```

**Check service logs** for any startup errors by clicking on a service in the Render dashboard and opening the **Logs** tab. Look for MongoDB connected and RabbitMQ connected confirmation messages.

---

## Free Tier Limitations

Render's free tier Web Services spin down after 15 minutes of inactivity. The first request after a sleep period takes around 30-50 seconds while the container restarts. Subsequent requests are normal speed.

For a course project or demo this is acceptable. To avoid cold starts:

- Upgrade to the **Starter plan** ($7/month per service) which keeps services always on.
- Or use an uptime monitoring service (such as UptimeRobot on its free plan) to send a ping to each service URL every 10 minutes, keeping them awake.

**UptimeRobot setup for keeping services awake:**

1. Go to https://uptimerobot.com and create a free account.
2. Add a new monitor for each service URL:
   - Monitor type: HTTP(S)
   - URL: `https://auth-service.onrender.com/api/v1/auth/login` (or any lightweight endpoint)
   - Monitoring interval: every 5 minutes
3. Repeat for incident-service, tracking-service, and analytics-service.

This keeps all four services warm at no cost.
