# Hôm Nay Ăn Gì

Mobile-first Vietnamese food discovery app built with Expo, Express, MongoDB, Redis, and Docker Compose.

The repo has two runnable parts:

- `frontend/`: Expo app for web/mobile clients
- `backend/`: pnpm workspace for the API and supporting services

Architecture and planning artifacts live in `_bmad-output/planning-artifacts/architecture/`.

## Prerequisites

Install these first:

- Node.js `22.x`
- `pnpm` `10.x`
- `npm` `10+`
- Docker Desktop or Docker Engine with Compose if you want the Docker-based flow

Optional:

- [Ollama](https://ollama.com/) with a local model (e.g. `llama3:latest` or `llama3.2:1b`) for LLM-powered recipe search
- Expo Go on a physical device
- iOS Simulator or Android Emulator

For physical iPhones using Expo Go from the App Store, the frontend is pinned to Expo SDK 54 for compatibility.

## Environment Setup

Create the root environment file used by Docker and backend services:

```bash
cp .env.template .env
```

Create the frontend environment file:

```bash
cp frontend/.env.template frontend/.env
```

Files used:

- Root env: `.env`
- Frontend env: `frontend/.env`

Key variables:

- Root: `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `LLM_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `HERE_API_KEY`, `MONGO_URI`, `REDIS_URI`
- Frontend: `API_BASE_URL`, `GOOGLE_CLIENT_ID`, `SENTRY_DSN`

For local development, placeholder values are enough to boot the app, but external integrations remain non-functional until you replace them.

### LLM Provider

The app uses Ollama by default (`LLM_PROVIDER=ollama`) with `llama3.2:1b`. To use a different model:

```bash
# Install a model via Ollama
ollama pull llama3:latest

# Update .env
OLLAMA_MODEL=llama3:latest
```

To switch to a cloud provider (Gemini, OpenAI), set `LLM_PROVIDER` and provide the API key via `LLM_API_KEY`.

## Service Summary

| Service | Runs how | Purpose | Default endpoint |
| --- | --- | --- | --- |
| `frontend` | Local Expo process only | User interface for web/mobile | `http://localhost:8081` for Expo web |
| `nginx` | Docker container | Public entrypoint that exposes the backend on host port `8080` and proxies to `express-api` | `http://localhost:8080` |
| `express-api` | Docker container or local Node process | Main REST API for the app | `/api/v1/health` via `http://localhost:8080` in Docker, or `http://localhost:3000` directly in non-Docker mode |
| `llm-proxy` | Docker container or local Node process | Proxies requests to Ollama (or cloud LLM provider) | `http://localhost:3001/health` in non-Docker mode |
| `mongo` | Docker container or local MongoDB server | Persistent application database | `mongodb://localhost:27017/homnayangi` |
| `redis` | Docker container or local Redis server | Cache and shared runtime state | `redis://localhost:6379` |
| `cron-worker` | Optional Docker container or local Node process | Background worker for scheduled jobs | No public HTTP endpoint |

Note: `docker-compose.yml` does not include a frontend container. In both startup flows, the Expo frontend runs locally from `frontend/`.

## Start The Project Using Docker

This mode uses Docker for the backend stack and runs the Expo frontend locally.

### 1. Install dependencies for the frontend

```bash
cd frontend
npm install
```

### 2. Start the backend stack with Docker

From the project root:

```bash
docker compose up -d
```

This starts the default backend services:

- `nginx`
- `express-api`
- `llm-proxy`
- `mongo`
- `redis`

To include the optional worker too:

```bash
docker compose --profile full up -d
```

If you change backend code while using Docker, rebuild the affected services:

```bash
docker compose up -d --build express-api llm-proxy nginx
```

### 3. Start the frontend locally

In a separate terminal:

```bash
cd frontend
npm run web
```

Make sure `frontend/.env` points to the Docker-exposed backend:

```env
API_BASE_URL=http://localhost:8080
```

### 4. Run the frontend in Expo Go on a physical device

In a separate terminal:

```bash
cd frontend
npm start
```

Then:

- Connect the phone and your development machine to the same Wi-Fi network
- Open Expo Go on the phone
- Scan the QR code shown by Expo in the terminal or browser

For Expo Go on a physical device, `frontend/.env` must use your machine's LAN IP instead of `localhost`:

```env
API_BASE_URL=http://YOUR_LAN_IP:8080
```

Example:

```env
API_BASE_URL=http://192.168.1.42:8080
```

## Start The Project Without Docker

This mode runs everything as local processes. You need local MongoDB and Redis running on your machine.

### 1. Install dependencies

Backend:

```bash
cd backend
pnpm install
```

Frontend:

```bash
cd frontend
npm install
```

### 2. Start local infrastructure

Make sure these local services are already running:

- MongoDB on `mongodb://127.0.0.1:27017/homnayangi`
- Redis on `redis://127.0.0.1:6379`
- Ollama (if using the default LLM provider): `ollama serve`

The backend defaults already point to those local addresses if you do not override them.

### 3. Start backend services locally

First, build the shared package (required after any change to shared code):

```bash
cd backend
pnpm --filter @hom-nay-an-gi/shared run build
```

Then start all backend processes in one terminal:

```bash
cd backend
pnpm dev
```

This starts the express-api (`:3000`), llm-proxy (`:3001`), and cron-worker in parallel. To use a specific Ollama model:

```bash
OLLAMA_MODEL=llama3:latest pnpm dev
```

Or start everything with Docker:

```bash
docker compose up -d
```

### 4. Start the frontend locally

In another terminal:

```bash
cd frontend
npm run web
```

For non-Docker mode, point the frontend directly to the API process:

```env
API_BASE_URL=http://localhost:3000
```

Other Expo targets:

```bash
cd frontend
npm run ios
npm run android
npm run web
```

### 5. Run the frontend in Expo Go on a physical device

In another terminal:

```bash
cd frontend
npm start
```

Then:

- Connect the phone and your development machine to the same Wi-Fi network
- Open Expo Go on the phone
- Scan the QR code shown by Expo in the terminal or browser

For non-Docker mode on a physical device, point the frontend to your machine's LAN IP:

```env
API_BASE_URL=http://YOUR_LAN_IP:3000
```

Example:

```env
API_BASE_URL=http://192.168.1.42:3000
```

## Verification

### Verify The Docker Startup Flow

1. Check that the Docker services are up:

```bash
docker compose ps
docker compose config --services
```

2. Check backend health through `nginx`:

```bash
curl http://localhost:8080/api/v1/health
```

Expected response:

```json
{"success":true,"data":{"status":"ok"}}
```

3. Optionally verify infrastructure containers:

```bash
docker compose exec redis redis-cli ping
docker compose exec mongo mongosh --quiet --eval "db.adminCommand('ping')"
```

4. Open the frontend from the Expo web terminal output and confirm it can call the API with `API_BASE_URL=http://localhost:8080`.

### Verify The Non-Docker Startup Flow

1. Check local backend endpoints directly:

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3001/health
```

Expected API response:

```json
{"success":true,"data":{"status":"ok"}}
```

2. Verify local infrastructure:

- Confirm MongoDB is listening on `127.0.0.1:27017`
- Confirm Redis is listening on `127.0.0.1:6379`

3. Open the frontend from the Expo web terminal output and confirm it can call the API with `API_BASE_URL=http://localhost:3000`.

### Code-Level Verification Commands

Backend:

```bash
cd backend
pnpm typecheck
pnpm lint
pnpm test
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npx eslint app components lib types tests
npm test
```

## CI Commands

Backend:

```bash
cd backend
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

Frontend:

```bash
cd frontend
npm ci
npx tsc --noEmit
npx eslint app components lib types tests
npm test
```
