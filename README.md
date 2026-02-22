# Jellyfish Umbrella 🪼

A web interface for controlling LED strip colors and tentacle movement on a jellyfish umbrella art installation via ESP32.

## Architecture

```
Browser (React) → Express Server (Node.js) → ESP32 (HTTP Server)
                        ↕
                   Gemini API (AI colors)
```

## Project Structure

```
jellyfish-umbrella/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── api.js             # All API calls to Express
│       ├── App.js             # Root component with page routing
│       ├── index.js           # React entry point
│       ├── styles/
│       │   └── global.css     # Theme variables, animations
│       └── components/
│           ├── Header.js          # Navigation bar
│           ├── ControlPanel.js    # Main control page
│           ├── ColorPicker.js     # 9 preset color swatches
│           ├── AIColorPicker.js   # Gemini-powered vibe input
│           ├── TentacleControls.js # Left/right/resting controls
│           └── FunFacts.js        # Fun facts page
├── server/                    # Express backend
│   ├── index.js               # Server entry point
│   ├── esp32.js               # ESP32 HTTP client helper
│   ├── .env.example           # Environment variables template
│   └── routes/
│       ├── color.js           # POST /api/color
│       ├── movement.js        # POST /api/movement (6s auto-reset)
│       ├── aiColor.js         # POST /api/ai-color (Gemini wrapper)
│       └── status.js          # GET  /api/status
└── package.json               # Root scripts (run both)
```

## Setup

### 1. Install dependencies

```bash
# From the root directory
npm install
npm run install:all
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
- `GEMINI_API_KEY` — Get from https://aistudio.google.com/app/apikey
- `ESP32_IP` — Your ESP32's local IP address (e.g. `192.168.1.100`)

### 3. Run the app

```bash
# From root — starts both server and client
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Express server on port 3001
npm run dev:server

# Terminal 2: React dev server on port 3000
npm run dev:client
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

## Notes

- The AI color generator works without Gemini configured — it falls back to random colors
- The React dev server proxies `/api/*` to Express, so no CORS issues in development
- For the live demo, run `npm run build` in `/client` and serve the build folder from Express
