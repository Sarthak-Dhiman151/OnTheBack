# On the Back

A collection of classic paper games designed with a warm, hand-drawn aesthetic. Currently featuring Dots and Boxes.


Play it at: https://ontheback.onrender.com

Play local or online multiplayer.

## Features

- Local Multiplayer: Play with friends on the same device.
- Online Multiplayer: Create or join rooms using a unique 4-character code.
- Customizable Grids: Choose from preset levels or create your own custom grid size.
- Dynamic Theming: Switch between light (warm paper) and dark modes.
- Responsive Design: Optimized for both desktop and mobile play.

## Tech Stack

- Frontend: React 19, TypeScript, Tailwind CSS, Motion.
- Backend: Node.js, Express, WebSockets (ws).
- Build Tool: Vite.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Game Rules: Dots and Boxes

1. Players take turns drawing a single horizontal or vertical line between two unjoined adjacent dots.
2. A player who completes the fourth side of a 1x1 box earns one point and takes another turn.
3. The game ends when all possible lines have been drawn and all boxes are completed.
4. The player with the most points wins.

## Project Structure

- `/src/components`: UI components and game views.
- `/src/logic`: Core game engine and state management.
- `/src/shared`: Shared types and interfaces.
- `server.ts`: Express and WebSocket server implementation.

## License

This project is licensed under the Apache-2.0 License.
