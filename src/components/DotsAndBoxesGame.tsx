import React, { useRef, useEffect, useState } from 'react';
import { GridConfig } from '../shared/types';
import { motion } from 'motion/react';
import { RefreshCw, ArrowRight, Home, Copy, Check } from 'lucide-react';
import { Line, GameState, Player } from '../shared/types';

interface DotsAndBoxesGameProps {
  gridConfig: GridConfig;
  onComplete: () => void;
  onMenu: () => void;
  isOnline?: boolean;
  roomId?: string;
  playerId?: Player;
  initialState?: GameState;
  ws?: WebSocket | null;
  playerCount?: number;
  theme?: 'light' | 'dark';
}

const PLAYER_COLORS = {
    1: { name: 'Blue', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', fill: 'rgba(59, 130, 246, 0.2)', stroke: 'rgba(59, 130, 246, 0.5)' },
    2: { name: 'Red', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500', fill: 'rgba(239, 68, 68, 0.2)', stroke: 'rgba(239, 68, 68, 0.5)' },
    3: { name: 'Green', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500', fill: 'rgba(34, 197, 94, 0.2)', stroke: 'rgba(34, 197, 94, 0.5)' },
    4: { name: 'Orange', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', fill: 'rgba(249, 115, 22, 0.2)', stroke: 'rgba(249, 115, 22, 0.5)' },
};

export default function DotsAndBoxesGame({ 
  gridConfig, 
  onComplete, 
  onMenu,
  isOnline = false,
  roomId,
  playerId,
  initialState,
  ws,
  playerCount = 2,
  theme = 'light'
}: DotsAndBoxesGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Game State
  const [horizontalLines, setHorizontalLines] = useState<boolean[][]>([]);
  const [verticalLines, setVerticalLines] = useState<boolean[][]>([]);
  const [boxes, setBoxes] = useState<(Player | null)[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [hoveredLine, setHoveredLine] = useState<Line | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize Game
  useEffect(() => {
    if (initialState) {
      applyState(initialState);
    } else {
      resetGame();
    }
  }, [gridConfig, initialState, playerCount]);

  const applyState = (state: GameState) => {
    setHorizontalLines(state.horizontalLines);
    setVerticalLines(state.verticalLines);
    setBoxes(state.boxes);
    setCurrentPlayer(state.currentPlayer);
    setScores(state.scores);
    setWinner(state.winner);
  };

  const resetGame = () => {
    setHorizontalLines(Array(gridConfig.rows).fill(null).map(() => Array(gridConfig.cols - 1).fill(false)));
    setVerticalLines(Array(gridConfig.rows - 1).fill(null).map(() => Array(gridConfig.cols).fill(false)));
    setBoxes(Array(gridConfig.rows - 1).fill(null).map(() => Array(gridConfig.cols - 1).fill(null)));
    setCurrentPlayer(1);
    
    const initialScores: Record<number, number> = {};
    for (let i = 1; i <= playerCount; i++) initialScores[i] = 0;
    setScores(initialScores);
    
    setWinner(null);
  };

  const handleRestart = () => {
      if (isOnline && ws) {
          ws.send(JSON.stringify({ type: 'RESTART' }));
      } else {
          resetGame();
      }
  }

  // Handle Resize with Debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          setCanvasSize({ width: clientWidth, height: clientHeight });
        }
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
    };
  }, []);

  // Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = canvasSize.width < 480 ? 20 : 40;
    const availWidth = canvasSize.width - padding * 2;
    const availHeight = canvasSize.height - padding * 2;
    
    const spacingX = availWidth / (gridConfig.cols - 1);
    const spacingY = availHeight / (gridConfig.rows - 1);
    const spacing = Math.min(spacingX, spacingY);

    const gridWidth = spacing * (gridConfig.cols - 1);
    const gridHeight = spacing * (gridConfig.rows - 1);
    const offsetX = (canvasSize.width - gridWidth) / 2;
    const offsetY = (canvasSize.height - gridHeight) / 2;

    const getDotPos = (r: number, c: number) => ({
      x: offsetX + c * spacing,
      y: offsetY + r * spacing
    });

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw Boxes
    if (boxes.some(row => row.some(cell => cell !== null))) {
        boxes.forEach((row, r) => {
        row.forEach((owner, c) => {
            if (owner) {
            const pos = getDotPos(r, c);
            ctx.fillStyle = PLAYER_COLORS[owner as keyof typeof PLAYER_COLORS]?.fill || 'rgba(0,0,0,0.1)';
            ctx.fillRect(pos.x, pos.y, spacing, spacing);
            }
        });
        });
    }

    // Draw Lines
    ctx.lineWidth = 4;
    const lineColor = theme === 'dark' ? '#d6d3d1' : '#44403c'; // stone-300 / stone-700
    const dotColor = theme === 'dark' ? '#d6d3d1' : '#44403c';
    
    ctx.beginPath();
    ctx.strokeStyle = lineColor;

    // Horizontal
    horizontalLines.forEach((row, r) => {
      row.forEach((drawn, c) => {
        if (drawn) {
          const start = getDotPos(r, c);
          const end = getDotPos(r, c + 1);
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
        }
      });
    });

    // Vertical
    verticalLines.forEach((row, r) => {
      row.forEach((drawn, c) => {
        if (drawn) {
          const start = getDotPos(r, c);
          const end = getDotPos(r + 1, c);
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
        }
      });
    });
    ctx.stroke();

    // Draw Hovered Line
    if (hoveredLine && !winner) {
      const isMyTurn = !isOnline || currentPlayer === playerId;
      
      if (isMyTurn) {
        const { r, c, type } = hoveredLine;
        let start, end;
        
        if (type === 'horizontal') {
          start = getDotPos(r, c);
          end = getDotPos(r, c + 1);
        } else {
          start = getDotPos(r, c);
          end = getDotPos(r + 1, c);
        }

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = PLAYER_COLORS[currentPlayer as keyof typeof PLAYER_COLORS]?.stroke || 'rgba(0,0,0,0.5)';
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }

    // Draw Dots
    ctx.beginPath();
    ctx.fillStyle = dotColor;
    for (let r = 0; r < gridConfig.rows; r++) {
      for (let c = 0; c < gridConfig.cols; c++) {
        const pos = getDotPos(r, c);
        ctx.moveTo(pos.x + 6, pos.y);
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      }
    }
    ctx.fill();

  }, [canvasSize, horizontalLines, verticalLines, boxes, hoveredLine, currentPlayer, winner, gridConfig, isOnline, playerId, theme]);

  // Interaction Logic
  const handlePointerMove = (e: React.PointerEvent) => {
    if (winner) return;
    
    if (isOnline && currentPlayer !== playerId) {
        setHoveredLine(null);
        return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = canvasSize.width < 480 ? 20 : 40;
    const availWidth = canvasSize.width - padding * 2;
    const availHeight = canvasSize.height - padding * 2;
    const spacingX = availWidth / (gridConfig.cols - 1);
    const spacingY = availHeight / (gridConfig.rows - 1);
    const spacing = Math.min(spacingX, spacingY);
    const gridWidth = spacing * (gridConfig.cols - 1);
    const gridHeight = spacing * (gridConfig.rows - 1);
    const offsetX = (canvasSize.width - gridWidth) / 2;
    const offsetY = (canvasSize.height - gridHeight) / 2;

    const gridX = (x - offsetX) / spacing;
    const gridY = (y - offsetY) / spacing;

    if (gridX < -0.5 || gridX > gridConfig.cols - 0.5 || gridY < -0.5 || gridY > gridConfig.rows - 0.5) {
      setHoveredLine(null);
      return;
    }

    const cellR = Math.floor(gridY);
    const cellC = Math.floor(gridX);

    const distTop = Math.abs(gridY - cellR);
    const distBottom = Math.abs(gridY - (cellR + 1));
    const distLeft = Math.abs(gridX - cellC);
    const distRight = Math.abs(gridX - (cellC + 1));

    const minDist = Math.min(distTop, distBottom, distLeft, distRight);
    
    const threshold = canvasSize.width < 480 ? 0.4 : 0.3;
    if (minDist > threshold) {
      setHoveredLine(null);
      return;
    }

    let candidate: Line | null = null;

    if (minDist === distTop) {
      candidate = { r: cellR, c: cellC, type: 'horizontal' };
    } else if (minDist === distBottom) {
      candidate = { r: cellR + 1, c: cellC, type: 'horizontal' };
    } else if (minDist === distLeft) {
      candidate = { r: cellR, c: cellC, type: 'vertical' };
    } else {
      candidate = { r: cellR, c: cellC + 1, type: 'vertical' };
    }

    if (candidate.type === 'horizontal') {
      if (candidate.r < 0 || candidate.r >= gridConfig.rows || candidate.c < 0 || candidate.c >= gridConfig.cols - 1) {
        setHoveredLine(null);
        return;
      }
      if (horizontalLines[candidate.r][candidate.c]) {
        setHoveredLine(null);
        return;
      }
    } else {
      if (candidate.r < 0 || candidate.r >= gridConfig.rows - 1 || candidate.c < 0 || candidate.c >= gridConfig.cols) {
        setHoveredLine(null);
        return;
      }
      if (verticalLines[candidate.r][candidate.c]) {
        setHoveredLine(null);
        return;
      }
    }

    setHoveredLine(candidate);
  };

  const handlePointerClick = () => {
    if (!hoveredLine || winner) return;
    
    if (isOnline) {
        if (currentPlayer !== playerId) return;
        if (ws) {
            ws.send(JSON.stringify({ type: 'MOVE', payload: hoveredLine }));
            setHoveredLine(null);
        }
        return;
    }

    const { r, c, type } = hoveredLine;
    let boxCompleted = false;
    const newBoxes = [...boxes.map(row => [...row])];

    if (type === 'horizontal') {
      const newLines = [...horizontalLines.map(row => [...row])];
      newLines[r][c] = true;
      setHorizontalLines(newLines);

      if (r > 0) {
        if (newLines[r-1][c] && verticalLines[r-1][c] && verticalLines[r-1][c+1]) {
          newBoxes[r-1][c] = currentPlayer;
          boxCompleted = true;
        }
      }
      if (r < gridConfig.rows - 1) {
        if (newLines[r+1][c] && verticalLines[r][c] && verticalLines[r][c+1]) {
          newBoxes[r][c] = currentPlayer;
          boxCompleted = true;
        }
      }
    } else {
      const newLines = [...verticalLines.map(row => [...row])];
      newLines[r][c] = true;
      setVerticalLines(newLines);

      if (c > 0) {
        if (newLines[r][c-1] && horizontalLines[r][c-1] && horizontalLines[r+1][c-1]) {
          newBoxes[r][c-1] = currentPlayer;
          boxCompleted = true;
        }
      }
      if (c < gridConfig.cols - 1) {
        if (newLines[r][c+1] && horizontalLines[r][c] && horizontalLines[r+1][c]) {
          newBoxes[r][c] = currentPlayer;
          boxCompleted = true;
        }
      }
    }

    if (boxCompleted) {
      setBoxes(newBoxes);
      let p1Score = 0;
      let p2Score = 0;
      newBoxes.forEach(row => row.forEach(owner => {
        if (owner === 1) p1Score++;
        if (owner === 2) p2Score++;
      }));
      setScores({ 1: p1Score, 2: p2Score });

      const totalBoxes = (gridConfig.rows - 1) * (gridConfig.cols - 1);
      if (p1Score + p2Score === totalBoxes) {
        if (p1Score > p2Score) setWinner(1);
        else if (p2Score > p1Score) setWinner(2);
        else setWinner('draw');
        onComplete();
      }
    } else {
      setCurrentPlayer((currentPlayer % (playerCount || 2)) + 1);
    }
    
    setHoveredLine(null);
  };

  const copyRoomId = () => {
      if (roomId) {
          navigator.clipboard.writeText(roomId);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center py-4 md:py-8 px-2 md:px-4 gap-4 md:gap-6">
      {/* Scoreboard */}
      <div className="flex justify-center gap-4 md:gap-8 w-full max-w-2xl flex-wrap">
        {Array.from({ length: playerCount }).map((_, i) => {
            const pId = i + 1;
            const pColor = PLAYER_COLORS[pId as keyof typeof PLAYER_COLORS];
            return (
                <div key={pId} className={`flex flex-col items-center transition-all duration-300 ${currentPlayer === pId ? 'opacity-100 scale-105 md:scale-110' : 'opacity-50 scale-90'}`}>
                    <span className={`${pColor.color} font-bold text-[10px] md:text-sm uppercase tracking-widest mb-0.5 md:mb-1`}>
                        {isOnline && playerId === pId ? `You (P${pId})` : `Player ${pId}`}
                    </span>
                    <span className="text-3xl md:text-5xl font-serif text-stone-800 dark:text-stone-100">{scores[pId] || 0}</span>
                </div>
            );
        })}
      </div>

      {/* Room ID Display */}
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

      <div 
        ref={containerRef} 
        className="relative w-full max-w-[min(90vw,500px)] aspect-square bg-stone-50 dark:bg-stone-900 shadow-xl rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-stone-700 dark:border-stone-400"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-pointer"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerClick}
          onPointerLeave={() => setHoveredLine(null)}
        />

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
              <h2 className="text-4xl md:text-7xl font-serif italic text-stone-800 dark:text-stone-100 mb-4 tracking-tighter">
                {winner === 'draw' ? 'Draw!' : `Player ${winner} Wins`}
              </h2>
              <div className="text-xl md:text-2xl font-mono text-stone-500 dark:text-stone-400 mb-8 md:mb-12 flex items-center justify-center gap-4">
                <span className={winner === 1 ? "text-blue-600 dark:text-blue-400 font-bold" : ""}>{scores[1]}</span>
                <span className="text-stone-400 dark:text-stone-500">-</span>
                <span className={winner === 2 ? "text-red-600 dark:text-red-400 font-bold" : ""}>{scores[2]}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <button 
                  onClick={handleRestart}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 font-medium hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200 text-sm md:text-base"
                >
                  <RefreshCw size={18} />
                  Play Again
                </button>
                
                <button 
                  onClick={onMenu}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-100 font-medium hover:border-stone-700 dark:hover:border-stone-400 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Home size={18} />
                  Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
      
      <div className="text-center h-8">
        {!winner && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${PLAYER_COLORS[currentPlayer as keyof typeof PLAYER_COLORS]?.bg} animate-pulse`}></div>
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