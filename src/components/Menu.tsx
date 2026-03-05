import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Grid3x3, Grid, LayoutGrid, Settings2, Globe, Users, ChevronRight } from 'lucide-react';
import { GRIDS, GridConfig } from '../data/levels';

interface MenuProps {
  onStart: (config: GridConfig, mode: 'local' | 'online', playerCount: number, roomId?: string) => void;
  gameType: 'dots-and-boxes' | 'tic-tac-toe' | 'gomoku';
}

export default function Menu({ onStart, gameType }: MenuProps) {
  const [customRows, setCustomRows] = useState(4);
  const [customCols, setCustomCols] = useState(4);
  const [showCustom, setShowCustom] = useState(false);
  const [mode, setMode] = useState<'local' | 'online'>('local');
  const [joinCode, setJoinCode] = useState('');
  const [playerCount, setPlayerCount] = useState(2);

  const handleStart = (config: GridConfig) => {
     const finalConfig = { ...config, gameType };
     if (mode === 'online') {
         onStart(finalConfig, 'online', playerCount);
     } else {
         onStart(finalConfig, 'local', playerCount);
     }
  };

  const handleCustomStart = () => {
    handleStart({
      id: 'custom',
      name: `Custom ${customRows}x${customCols}`,
      rows: customRows,
      cols: customCols,
    });
  };
  
  const handleJoin = () => {
      if (joinCode.length === 4) {
          onStart(GRIDS[0], 'online', 2, joinCode);
      }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-4xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl md:text-9xl font-serif italic text-stone-800 dark:text-stone-100 mb-4 tracking-tighter">
          On the Back
        </h1>
        <p className="text-xl md:text-2xl text-stone-500 dark:text-stone-400 font-hand rotate-[-2deg]">
          of a napkin.
        </p>
      </motion.div>

      {/* Mode Switcher */}
      <div className="flex flex-col items-center gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-stone-50 dark:bg-stone-800 p-1 md:p-1.5 rounded-full shadow-sm border border-stone-300 dark:border-stone-600 flex gap-1 md:gap-2">
            <button 
                onClick={() => setMode('local')}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-2 ${
                    mode === 'local' 
                    ? 'bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 shadow-md' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
            >
                <Users size={14} className="md:w-4 md:h-4" />
                Local
            </button>
            <button 
                onClick={() => setMode('online')}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-2 ${
                    mode === 'online' 
                    ? 'bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 shadow-md' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
            >
                <Globe size={14} className="md:w-4 md:h-4" />
                Online
            </button>
        </div>

        {/* Player Count Selector */}
        {gameType === 'dots-and-boxes' && (
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800 px-4 py-2 rounded-full border border-stone-300 dark:border-stone-600 shadow-sm">
                <span className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">Players</span>
                {[2, 3, 4].map(count => (
                    <button
                        key={count}
                        onClick={() => setPlayerCount(count)}
                        className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                            playerCount === count 
                            ? 'bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 shadow-sm' 
                            : 'text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                    >
                        {count}
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="w-full max-w-3xl">
        {mode === 'online' && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-12 bg-stone-50 dark:bg-stone-800 rounded-2xl p-6 border border-stone-300 dark:border-stone-600 shadow-sm"
            >
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4 text-center">Join Existing Game</h3>
                <div className="flex gap-3 max-w-md mx-auto">
                    <input 
                        type="text" 
                        placeholder="CODE" 
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                        className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-600 font-mono text-center text-xl uppercase tracking-[0.2em] focus:border-stone-700 dark:focus:border-stone-300 focus:outline-none transition-colors placeholder:text-stone-400 dark:placeholder:text-stone-600 text-stone-800 dark:text-stone-100"
                    />
                    <button 
                        onClick={handleJoin}
                        disabled={joinCode.length !== 4}
                        className="px-8 py-3 bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors flex items-center gap-2"
                    >
                        Join <ChevronRight size={18} />
                    </button>
                </div>
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-stone-300 dark:border-stone-600"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-stone-50 dark:bg-stone-800 px-2 text-xs font-mono text-stone-500 dark:text-stone-400 uppercase tracking-widest">Or Create New</span>
                    </div>
                </div>
            </motion.div>
        )}

        {gameType === 'dots-and-boxes' ? (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {GRIDS.map((grid, index) => (
                    <motion.button
                        key={grid.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStart(grid)}
                        className="group relative bg-stone-50 dark:bg-stone-800 p-8 rounded-2xl border border-stone-300 dark:border-stone-600 shadow-sm hover:shadow-xl hover:border-stone-700 dark:hover:border-stone-300 transition-all flex flex-col items-center gap-6 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 group-hover:bg-stone-800 dark:group-hover:bg-stone-100 group-hover:text-stone-50 dark:group-hover:text-stone-800 transition-colors duration-300">
                        {index === 0 && <Grid3x3 size={28} />}
                        {index === 1 && <Grid size={28} />}
                        {index === 2 && <LayoutGrid size={28} />}
                        </div>
                        <div>
                        <h3 className="font-serif italic text-2xl text-stone-800 dark:text-stone-100 mb-1">{grid.name.split(' ')[0]}</h3>
                        <p className="text-xs font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider">{grid.rows} × {grid.cols}</p>
                        </div>
                    </motion.button>
                    ))}
                </div>

                {/* Custom Grid Toggle */}
                <div className="w-full">
                    <button 
                    onClick={() => setShowCustom(!showCustom)}
                    className="flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors mx-auto mb-6 text-sm font-medium"
                    >
                    <Settings2 size={16} />
                    {showCustom ? 'Hide Custom Options' : 'Custom Grid Size'}
                    </button>

                    {showCustom && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-2xl p-6 md:p-8 shadow-sm max-w-lg mx-auto"
                    >
                        <div className="flex flex-col items-center gap-6 md:gap-8">
                        <div className="flex items-center gap-6 md:gap-8">
                            <div className="flex flex-col items-center gap-2">
                            <label className="text-[10px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-widest">Rows</label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <button onClick={() => setCustomRows(Math.max(2, customRows - 1))} className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-300 transition-colors">-</button>
                                <span className="font-serif text-xl md:text-2xl w-6 md:w-8 text-center text-stone-800 dark:text-stone-100">{customRows}</span>
                                <button onClick={() => setCustomRows(Math.min(12, customRows + 1))} className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-300 transition-colors">+</button>
                            </div>
                            </div>
                            <span className="text-stone-300 dark:text-stone-600 text-3xl md:text-4xl font-light">×</span>
                            <div className="flex flex-col items-center gap-2">
                            <label className="text-[10px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-widest">Cols</label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <button onClick={() => setCustomCols(Math.max(2, customCols - 1))} className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-300 transition-colors">-</button>
                                <span className="font-serif text-xl md:text-2xl w-6 md:w-8 text-center text-stone-800 dark:text-stone-100">{customCols}</span>
                                <button onClick={() => setCustomCols(Math.min(12, customCols + 1))} className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-300 transition-colors">+</button>
                            </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCustomStart}
                            className="w-full py-4 bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 rounded-xl font-medium hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                        >
                            Start Custom Game
                            <Play size={16} fill="currentColor" />
                        </button>
                        </div>
                    </motion.div>
                    )}
                </div>
            </>
        ) : (
            <div className="flex flex-col items-center">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStart({ id: 'ttt', name: 'Tic Tac Toe', rows: 3, cols: 3 })}
                    className="px-12 py-6 bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-800 rounded-2xl font-bold text-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-4"
                >
                    Start Game
                    <Play size={24} fill="currentColor" />
                </motion.button>
            </div>
        )}
      </div>
    </div>
  );
}