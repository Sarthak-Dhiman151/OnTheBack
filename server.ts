import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { GameEngine } from "./src/logic/GameEngine";
import { GridConfig, Line } from "./src/shared/types";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

interface Room {
  id: string;
  engine: GameEngine;
  players: Record<number, WebSocket | null>;
  spectators: WebSocket[];
}

const rooms = new Map<string, Room>();

async function startServer() {
  const app = express();

  // API to check health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create HTTP server first
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Setup WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    console.log(`Upgrade request for ${url.pathname}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: number | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'CREATE') {
          const config: GridConfig = data.payload.config;
          const playerCount: number = data.payload.playerCount || 2;
          const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
          
          const engine = new GameEngine(config, playerCount);
          
          const players: Record<number, WebSocket | null> = {};
          for (let i = 1; i <= playerCount; i++) {
              players[i] = i === 1 ? ws : null;
          }

          rooms.set(roomId, {
            id: roomId,
            engine,
            players,
            spectators: []
          });

          currentRoomId = roomId;
          currentPlayerId = 1;

          ws.send(JSON.stringify({ 
            type: 'WELCOME', 
            payload: { 
              roomId, 
              playerId: 1, 
              state: engine.state 
            } 
          }));
        }

        if (data.type === 'JOIN') {
          const roomId = data.payload.roomId.toUpperCase();
          const room = rooms.get(roomId);

          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: 'Room not found' }));
            return;
          }

          // Find first available slot
          let joined = false;
          for (let i = 1; i <= room.engine.state.playerCount; i++) {
              if (room.players[i] === null) {
                  room.players[i] = ws;
                  currentRoomId = roomId;
                  currentPlayerId = i;
                  joined = true;
                  break;
              }
          }

          if (joined && currentPlayerId) {
            console.log(`Player ${currentPlayerId} joined room ${roomId}`);
            
            // Send WELCOME to joiner
            ws.send(JSON.stringify({ 
              type: 'WELCOME', 
              payload: { 
                roomId, 
                playerId: currentPlayerId, 
                state: room.engine.state 
              } 
            }));

            // Notify ALL players (including joiner) with GAME_START and current state
            const startMsg = JSON.stringify({ 
                type: 'GAME_START',
                payload: room.engine.state
            });

            Object.values(room.players).forEach(playerWs => {
                if (playerWs) {
                    playerWs.send(startMsg);
                }
            });

          } else {
            ws.send(JSON.stringify({ type: 'ERROR', payload: 'Room is full' }));
          }
        }

        if (data.type === 'MOVE') {
          if (!currentRoomId || !currentPlayerId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const line: Line = data.payload;
          console.log(`Move in room ${currentRoomId} by P${currentPlayerId}:`, line);
          
          const success = room.engine.applyMove(line, currentPlayerId);

          if (success) {
            const updateMsg = JSON.stringify({
              type: 'GAME_UPDATE',
              payload: room.engine.state
            });

            Object.values(room.players).forEach(playerWs => {
                if (playerWs) playerWs.send(updateMsg);
            });
          } else {
              console.log(`Invalid move in room ${currentRoomId}`);
          }
        }
        
        if (data.type === 'RESTART') {
             if (!currentRoomId) return;
             const room = rooms.get(currentRoomId);
             if (!room) return;
             
             // Reset engine
             room.engine = new GameEngine(room.engine.state.config, room.engine.state.playerCount);
             
             const updateMsg = JSON.stringify({
                type: 'GAME_UPDATE',
                payload: room.engine.state
             });
             
             Object.values(room.players).forEach(playerWs => {
                if (playerWs) playerWs.send(updateMsg);
            });
        }

      } catch (e) {
        console.error('WS Error:', e);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          if (room.players[currentPlayerId] === ws) {
              room.players[currentPlayerId] = null;
          }

          // Notify other players
          const msg = JSON.stringify({ type: 'PLAYER_LEFT', payload: { playerId: currentPlayerId } });
          Object.values(room.players).forEach(playerWs => {
              if (playerWs) playerWs.send(msg);
          });

          // Clean up empty rooms
          const isEmpty = Object.values(room.players).every(p => p === null);
          if (isEmpty) {
            rooms.delete(currentRoomId);
          }
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }
}

startServer();
