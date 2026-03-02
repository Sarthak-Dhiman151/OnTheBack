import { motion } from 'motion/react';
import { Grid3x3 } from 'lucide-react';

interface GameHubProps {
  onSelectGame: (gameId: string) => void;
}

export default function GameHub({ onSelectGame }: GameHubProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20"
      >
        <h1 className="text-5xl md:text-8xl font-serif italic text-stone-800 dark:text-stone-100 mb-4 tracking-tighter">
          Paper Games
        </h1>
        <p className="text-xl md:text-2xl text-stone-500 dark:text-stone-400 font-hand rotate-[-2deg]">
          Classics reimagined.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        <motion.button
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectGame('dots-and-boxes')}
          className="group relative bg-stone-50 dark:bg-stone-800 p-8 rounded-3xl border-2 border-stone-200 dark:border-stone-600 shadow-sm hover:shadow-xl hover:border-stone-700 dark:hover:border-stone-400 transition-all flex flex-col items-center text-center aspect-[4/5] justify-center"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-10 dark:opacity-5 rounded-3xl pointer-events-none bg-repeat"></div>
          
          <div className="w-24 h-24 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-8 group-hover:bg-amber-600 group-hover:text-white dark:group-hover:bg-amber-500 transition-colors duration-300 shadow-inner">
            <Grid3x3 size={48} strokeWidth={1.5} />
          </div>
          
          <h3 className="font-serif italic text-3xl text-stone-800 dark:text-stone-100 mb-3 group-hover:scale-105 transition-transform">
            Dots & Boxes
          </h3>
          <p className="text-sm font-mono text-stone-500 dark:text-stone-400 uppercase tracking-widest leading-relaxed max-w-[200px]">
            Claim boxes by connecting dots. Strategy required.
          </p>
          
          <div className="mt-8 px-4 py-2 rounded-full bg-stone-200 dark:bg-stone-700 text-xs font-bold text-stone-500 dark:text-stone-300 uppercase tracking-widest group-hover:bg-stone-800 dark:group-hover:bg-stone-100 group-hover:text-stone-50 dark:group-hover:text-stone-800 transition-colors">
            Play Now
          </div>
        </motion.button>

        {/* Placeholder for future games */}
        <motion.div
          className="relative bg-stone-100/50 dark:bg-stone-800/50 p-8 rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-600 flex flex-col items-center text-center aspect-[4/5] justify-center opacity-60"
        >
          <div className="w-24 h-24 rounded-2xl bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 flex items-center justify-center mb-8">
            <span className="text-4xl font-serif italic">?</span>
          </div>
          <h3 className="font-serif italic text-2xl text-stone-500 dark:text-stone-400 mb-2">
            Coming Soon
          </h3>
          <p className="text-xs font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            More games on the way
          </p>
        </motion.div>
      </div>
    </div>
  );
}