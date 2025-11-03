import { motion } from "framer-motion";

interface TypingIndicatorProps {
  userName?: string;
}

export const TypingIndicator = ({ userName }: TypingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 mb-4"
    >
      <div className="bg-secondary rounded-2xl px-4 py-3 max-w-[70%]">
        <div className="flex items-center gap-1">
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </div>
      </div>
      {userName && (
        <span className="text-xs text-muted-foreground italic">
          {userName} est en train d'écrire...
        </span>
      )}
    </motion.div>
  );
};
