import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Home, Copy, Check } from 'lucide-react';
import { GameState, Player } from '../shared/types';

interface GomokuGameProps {
  onComplete: () => void;
  onMenu: () => void;
  isOnline?: boolean;
  roomId?: string;
  playerId?: Player;
  initialState?: GameState;
  ws?: WebSocket | null;
  theme?: 'light' | 'dark';
}

const BOARD_SIZE = 15;

const PLAYER_COLORS = {
    1: { name: 'Black', color: 'bg-stone-800 dark:bg-stone-100', text: 'text-stone-800 dark:text-stone-100' },
    2: { name: 'White', color: 'bg-stone-100 dark:bg-stone-800 border-2 border-stone-800 dark:border-stone-100', text: 'text-stone-500 dark:text-stone-400' },
};

export default function GomokuGame({ 
  onComplete, 
  onMenu,
  isOnline = false,
  roomId,
  playerId,
  initialState,
  ws,
  theme = 'light'
}: GomokuGameProps) {
  const [board, setBoard] = useState<(Player | null)[][]>(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialState) {
      applyState(initialState);
    }
  }, [initialState]);

  const applyState = (state: GameState) => {
    if (state.gomoku) {
      setBoard(state.gomoku.board);
      setCurrentPlayer(state.currentPlayer);
      setWinner(state.winner);
    }
  };

  const checkWin = (board: (Player | null)[][], r: number, c: number, player: Player) => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) count++;
        else break;
      }
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) count++;
        else break;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  const checkDraw = (board: (Player | null)[][]) => {
    return board.every(row => row.every(cell => cell !== null));
  };

  const resetLocalGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer(1);
    setWinner(null);
  };

  const handleRestart = () => {
    if (isOnline && ws) {
      ws.send(JSON.stringify({ type: 'RESTART' }));
    } else {
      resetLocalGame();
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (winner) return;
    if (board[r][c] !== null) return;
    
    if (isOnline) {
      if (currentPlayer !== playerId) return;
      if (ws) {
        ws.send(JSON.stringify({ type: 'MOVE', payload: { r, c } }));
      }
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = currentPlayer;
    setBoard(newBoard);
    
    if (checkWin(newBoard, r, c, currentPlayer)) {
      setWinner(currentPlayer);
    } else if (checkDraw(newBoard)) {
      setWinner('draw');
    } else {
      setCurrentPlayer((currentPlayer % 2) + 1);
    }
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center py-4 md:py-8 px-2 md:px-4 gap-4 md:gap-6">
      {/* Status */}
      <div className="flex justify-center gap-8 w-full max-w-md">
        {[1, 2].map((pId) => {
          const pColor = PLAYER_COLORS[pId as keyof typeof PLAYER_COLORS];
          return (
            <div key={pId} className={`flex flex-col items-center transition-all duration-300 ${currentPlayer === pId ? 'opacity-100 scale-110' : 'opacity-50 scale-90'}`}>
              <div className={`w-10 h-10 rounded-full mb-2 ${pColor.color} shadow-md`}></div>
              <span className={`${pColor.text} font-bold text-[10px] md:text-xs uppercase tracking-widest`}>
                {isOnline && playerId === pId ? `You (P${pId})` : `Player ${pId}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Room ID */}
      {isOnline && roomId && (
        <div className="flex justify-center w-full">
          <button 
            onClick={copyRoomId}
            className="bg-stone-50/80 dark:bg-stone-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-stone-300 dark:border-stone-600 flex items-center gap-2 text-xs font-mono hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
          >
            <span className="text-stone-500 dark:text-stone-400 uppercase tracking-widest">Room</span>
            <span className="font-bold text-stone-800 dark:text-stone-100 text-lg tracking-widest">{roomId}</span>
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-400" />}
          </button>
        </div>
      )}

      {/* Board */}
      <div className="relative w-full max-w-[min(95vw,500px)] aspect-square bg-[#e6d5b8] dark:bg-stone-800 shadow-2xl rounded-lg overflow-hidden border-4 border-stone-800 dark:border-stone-400 p-[2%]">
        {/* Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 p-[2%] pointer-events-none">
          {Array(15 * 15).fill(0).map((_, i) => (
            <div key={i} className="border-[0.5px] border-stone-800/20 dark:border-stone-100/10"></div>
          ))}
        </div>

        {/* Interaction Layer */}
        <div className="relative w-full h-full grid grid-cols-15 grid-rows-15">
          {board.map((row, r) => row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              className={`relative flex items-center justify-center transition-all ${cell ? 'cursor-default' : 'cursor-pointer hover:bg-stone-800/10 dark:hover:bg-stone-100/5'}`}
            >
              <AnimatePresence>
                {cell && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 0.8 }}
                    className={`w-full h-full rounded-full shadow-md ${PLAYER_COLORS[cell as keyof typeof PLAYER_COLORS].color}`}
                  />
                )}
              </AnimatePresence>
            </button>
          )))}
        </div>

        {/* Winner Overlay */}
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-md z-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center p-8"
            >
              <h2 className="text-4xl md:text-6xl font-serif italic text-stone-800 dark:text-stone-100 mb-8 tracking-tighter">
                {winner === 'draw' ? 'Draw!' : `Player ${winner} Wins`}
              </h2>
              
              <div className="flex flex-col gap-3 justify-center">
                <button 
                  onClick={handleRestart}
                  className="px-8 py-4 rounded-xl bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 font-medium hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
                >
                  <RefreshCw size={18} />
                  Play Again
                </button>
                
                <button 
                  onClick={onMenu}
                  className="px-8 py-4 rounded-xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-100 font-medium hover:border-stone-700 dark:hover:border-stone-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Home size={18} />
                  Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Turn Indicator */}
      <div className="text-center h-8">
        {!winner && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${currentPlayer === 1 ? 'bg-stone-800 dark:bg-stone-100' : 'bg-stone-400'} animate-pulse`}></div>
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
                {isOnline ? (
                    currentPlayer === playerId ? "Your Turn" : "Opponent's Turn"
                ) : (
                    `Player ${currentPlayer}'s Turn`
                )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
