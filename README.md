# Jellyfish Umbrella 🪼

A web interface for controlling LED strip colors and tentacle movement on a jellyfish umbrella art installation via ESP32.

## Architecture

```
Browser (React) → Express Server (Node.js) → ESP32 (HTTP Server)
                        ↕
                   Gemini API (AI colors)
```

## Setup

### 1. Install dependencies

```bash
# From the root directory
npm install
```

```bash
# From the client directory
npm install
```

```bash
# From the server directory
npm install
```
### 2. Configure environment

```bash
cd server
cp .env.example .env
```

### 3. Run the app

```bash
# From root — starts both server and client
npm run dev
```

React will open at `http://localhost:3000` and proxy API requests to Express on port 3001.

## API Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/color` | `{ r, g, b }` | Set LED color on all tentacles |
| POST | `/api/movement` | `{ direction: "left"\|"right" }` | Curl tentacles (auto-resets in 6s) |
| POST | `/api/ai-color` | `{ prompt: "ocean vibes" }` | Generate 3 colors via Gemini |
| GET | `/api/status` | — | Get current color + tentacle state |

## ESP32 Endpoints

The Express server forwards commands to these endpoints on the ESP32:

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/led` | `{ r, g, b }` |
| POST | `/move` | `{ direction: "left"\|"right"\|"neutral" }` |
