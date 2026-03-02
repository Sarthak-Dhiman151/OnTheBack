/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GRIDS, GridConfig } from './data/levels';
import DotsAndBoxesGame from './components/DotsAndBoxesGame';
import Menu from './components/Menu';
import GameHub from './components/GameHub';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Player, ServerMessage } from './shared/types';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<'hub' | 'menu' | 'playing' | 'connecting'>('hub');
  const [currentGridConfig, setCurrentGridConfig] = useState<GridConfig>(GRIDS[0]);
  const [playerCount, setPlayerCount] = useState(2);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Online State
  const [isOnline, setIsOnline] = useState(false);
  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  const [playerId, setPlayerId] = useState<Player | undefined>(undefined);
  const [serverState, setServerState] = useState<GameState | undefined>(undefined);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'dots-and-boxes') {
      setGameState('menu');
    }
  };

  const handleStart = (config: GridConfig, mode: 'local' | 'online', count: number, joinRoomId?: string) => {
    setCurrentGridConfig(config);
    setPlayerCount(count);
    
    if (mode === 'online') {
        setIsOnline(true);
        setGameState('connecting');
        connectToServer(config, count, joinRoomId);
    } else {
        setIsOnline(false);
        setGameState('playing');
    }
  };

  const connectToServer = (config: GridConfig, count: number, joinRoomId?: string) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      console.log('Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
          console.log('WS Connected');
          if (joinRoomId) {
              ws.send(JSON.stringify({ type: 'JOIN', payload: { roomId: joinRoomId } }));
          } else {
              ws.send(JSON.stringify({ type: 'CREATE', payload: { config, playerCount: count } }));
          }
      };

      ws.onmessage = (event) => {
          const msg: ServerMessage = JSON.parse(event.data);
          console.log('WS Message:', msg.type);
          
          if (msg.type === 'WELCOME') {
              setRoomId(msg.payload.roomId);
              setPlayerId(msg.payload.playerId);
              if (msg.payload.state) {
                  setServerState(msg.payload.state);
                  setCurrentGridConfig(msg.payload.state.config);
                  setPlayerCount(msg.payload.state.playerCount);
              }
              setGameState('playing');
          }
          
          if (msg.type === 'GAME_UPDATE') {
              setServerState(msg.payload);
          }

          if (msg.type === 'GAME_START') {
              // Notification and state update
              if (msg.payload) {
                  setServerState(msg.payload);
              }
          }
          
          if (msg.type === 'ERROR') {
              alert(msg.payload);
              setGameState('menu');
              ws.close();
          }

          if (msg.type === 'PLAYER_LEFT') {
              alert('Opponent disconnected');
          }
      };

      ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
          alert('Connection error. Please try again.');
          setGameState('menu');
      };

      ws.onclose = (event) => {
          console.log('Disconnected:', event.code, event.reason);
          if (gameState === 'connecting') {
             setGameState('menu');
          }
      };
  };

  const handleGameComplete = () => {
    // Game handles its own completion state
  };
  
  const handleMenu = () => {
      if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
      }
      setGameState('menu');
      setIsOnline(false);
      setRoomId(undefined);
      setPlayerId(undefined);
      setServerState(undefined);
  };

  const handleBackToHub = () => {
    setGameState('hub');
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none">
        <div className="pointer-events-auto cursor-pointer flex items-center gap-2" onClick={gameState === 'hub' ? undefined : handleBackToHub}>
          {gameState !== 'hub' && (
            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm text-stone-700 dark:text-stone-200">
              <ArrowLeft size={16} />
            </div>
          )}
          <span className="font-serif italic text-xl font-bold tracking-tight text-stone-800 dark:text-stone-100">On the Back</span>
        </div>
        
        <div className="flex items-center gap-4 pointer-events-auto">
          {gameState === 'playing' && (
            <div className="font-mono text-xs text-stone-500 dark:text-stone-400 uppercase tracking-widest">
              {currentGridConfig.name}
            </div>
          )}
          
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm text-stone-700 dark:text-stone-200"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      <main className="w-full min-h-screen flex flex-col items-center justify-center p-4 pt-20">
        <AnimatePresence mode="wait">
          {gameState === 'hub' ? (
            <motion.div 
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <GameHub onSelectGame={handleSelectGame} />
            </motion.div>
          ) : gameState === 'menu' ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Menu onStart={handleStart} />
            </motion.div>
          ) : gameState === 'connecting' ? (
             <motion.div 
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
             >
                 <div className="w-8 h-8 border-4 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-200 rounded-full animate-spin mb-4"></div>
                 <p className="font-mono text-sm text-stone-600 dark:text-stone-400">Connecting to server...</p>
             </motion.div>
          ) : (
            <motion.div 
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <DotsAndBoxesGame 
                gridConfig={currentGridConfig} 
                onComplete={handleGameComplete}
                onMenu={handleMenu}
                isOnline={isOnline}
                roomId={roomId}
                playerId={playerId}
                initialState={serverState}
                ws={wsRef.current}
                playerCount={playerCount}
                theme={theme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono uppercase tracking-widest">
          Classic Paper Games
        </p>
      </footer>
    </div>
  );
}