import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Home, Copy, Check, X, Circle } from 'lucide-react';
import { GameState, Player } from '../shared/types';

interface TicTacToeGameProps {
  onComplete: () => void;
  onMenu: () => void;
  isOnline?: boolean;
  roomId?: string;
  playerId?: Player;
  initialState?: GameState;
  ws?: WebSocket | null;
  theme?: 'light' | 'dark';
}

const PLAYER_COLORS = {
    1: { name: 'Blue', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', icon: X },
    2: { name: 'Red', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500', icon: Circle },
};

export default function TicTacToeGame({ 
  onComplete, 
  onMenu,
  isOnline = false,
  roomId,
  playerId,
  initialState,
  ws,
  theme = 'light'
}: TicTacToeGameProps) {
  const [board, setBoard] = useState<(Player | null)[][]>(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialState) {
      applyState(initialState);
    }
  }, [initialState]);

  const applyState = (state: GameState) => {
    if (state.ticTacToe) {
      setBoard(state.ticTacToe.board);
      setCurrentPlayer(state.currentPlayer);
      setWinner(state.winner);
    }
  };

  const checkWin = (board: (Player | null)[][], r: number, c: number, player: Player) => {
    // Check row
    if (board[r].every(cell => cell === player)) return true;
    // Check column
    if (board.every(row => row[c] === player)) return true;
    // Check diagonals
    if (r === c && board.every((row, i) => row[i] === player)) return true;
    if (r + c === 2 && board.every((row, i) => row[2 - i] === player)) return true;
    return false;
  };

  const checkDraw = (board: (Player | null)[][]) => {
    return board.every(row => row.every(cell => cell !== null));
  };

  const resetLocalGame = () => {
    setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
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

    // Local play logic
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
          const Icon = pColor.icon;
          return (
            <div key={pId} className={`flex flex-col items-center transition-all duration-300 ${currentPlayer === pId ? 'opacity-100 scale-110' : 'opacity-50 scale-90'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${currentPlayer === pId ? 'bg-stone-200 dark:bg-stone-700 shadow-inner' : ''}`}>
                <Icon size={32} className={pColor.color} />
              </div>
              <span className={`${pColor.color} font-bold text-[10px] md:text-xs uppercase tracking-widest`}>
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
      <div className="relative w-full max-w-[min(90vw,400px)] aspect-square bg-stone-50 dark:bg-stone-900 shadow-xl rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-stone-700 dark:border-stone-400 p-4 grid grid-cols-3 grid-rows-3 gap-4">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>
        
        {board.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => handleCellClick(r, c)}
            className={`relative flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all group ${cell ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <AnimatePresence>
              {cell && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-full h-full flex items-center justify-center p-4"
                >
                  {cell === 1 ? (
                    <X size="100%" className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
                  ) : (
                    <Circle size="100%" className="text-red-600 dark:text-red-400" strokeWidth={3} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )))}

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
            <div className={`w-2 h-2 rounded-full ${currentPlayer === 1 ? 'bg-blue-500' : 'bg-red-500'} animate-pulse`}></div>
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
