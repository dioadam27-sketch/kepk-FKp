import { motion } from 'motion/react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Memproses...' }: LoadingOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-unair-blue/10 backdrop-blur-md"
    >
      <div className="relative">
        {/* Animated Rings */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-4 border-unair-blue/20 border-t-unair-blue rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-4 border-unair-gold/20 border-b-unair-gold rounded-full"
        />
        
        {/* Center Logo */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img 
            src="https://i.imgur.com/sbVYY1A.png" 
            alt="UNAIR" 
            className="w-10 h-10 object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
      
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-unair-blue font-bold uppercase tracking-[0.2em] text-[10px]"
      >
        {message}
      </motion.p>

      <div className="mt-2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="w-1 h-1 bg-unair-gold rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
}
