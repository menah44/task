# Deployment Documentation

This guide describes how to configure, seed, build, and deploy the `taskio-backend` NestJS application.

## 1. Environment Variables

Create a `.env` file in the root of the backend directory. The following variables are supported:

| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :--- |
| `PORT` | Port number the backend server listens on. | `5000` | No |
| `NODE_ENV` | Mode of operation (`development` or `production`). | `development` | Yes (`production`) |
| `DB_HOST` | Database host name/IP. | `localhost` | Yes |
| `DB_PORT` | Database port. | `5432` | Yes |
| `DB_USERNAME`| Database connection user. | `postgres` | Yes |
| `DB_PASSWORD`| Database connection password. | `1234` | Yes |
| `DB_NAME` | Database schema name. | `taskio_db` | Yes |
| `JWT_SECRET` | Secret key used for signing JWTs. | None | **Yes (App fails fast on startup if missing)** |
| `CORS_ORIGINS`| Comma-separated list of allowed client origins. | `http://localhost:3000,http://localhost:3001` (Dev only) | **Yes (App fails fast on startup if missing in production)** |

---

## 2. Database Setup

Ensure PostgreSQL is running and the database schema specified in `DB_NAME` exists.
For development setup:
```sql
CREATE DATABASE taskio_db;
```

---

## 3. Installation & Database Migration

### Non-Docker Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run migrations / Schema Setup**:
   - **Local Development**: In `app.module.ts` and `src/data-source.ts`, `synchronize: true` is configured. This automatically synchronizes the database schema with your entities during development and local installs.
   - **Production Deployments**: For production, automatic schema sync is highly discouraged. You must modify `synchronize` to `false` in `app.module.ts` and run TypeORM migrations using the migration command:
     ```bash
     npm run migration:run
     ```

3. **Seed Database**:
   Seed roles and the default admin user by running:
   ```bash
   npm run seed
   ```
   *Note: This command is fully idempotent and safe to run multiple times. It will verify/re-seed the default `admin@taskio.com` password to `123456`.*

4. **Start Application**:
   - For development: `npm run start:dev`
   - For production: `npm run build && npm run start:prod`

---

## 4. Docker Deployment Guide

The project includes a `Dockerfile` for containerized environments.

### Build Docker Image
Run this from the backend folder:
```bash
docker build -t taskio-backend:latest .
```

### Run Container
Specify env variables via `--env` or `-e` flags (or pass an env-file):
```bash
docker run -d \
  -p 5000:5000 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=taskio_db \
  -e JWT_SECRET=your-production-secret \
  -e CORS_ORIGINS=http://domain.com \
  -e NODE_ENV=production \
  --name taskio-backend-service \
  taskio-backend:latest
```

---

## 5. Non-Docker Deployment Guide (Production VM)

1. Clone the project onto the target machine.
2. Install NodeJS (v18+ recommended) and PM2 (Process Manager).
3. Set up the `.env` file with production details.
4. Run `npm install --omit=dev` to install production dependencies only.
5. Build the application:
   ```bash
   npm run build
   ```
6. Run database seeding:
   ```bash
   npm run seed
   ```
7. Start the application process using PM2:
   ```bash
   pm2 start dist/main.js --name taskio-backend
   ```
