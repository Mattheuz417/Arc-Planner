import React from 'react';
import { Button } from './ui/button';
import { BookOpen, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4"
      data-testid="empty-state"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <BookOpen className="w-8 h-8 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200 mb-2">
        {title}
      </h3>
      <p className="font-sans text-base text-slate-400 mb-8 text-center max-w-md">
        {description}
      </p>
      {onAction && (
        <Button
          onClick={onAction}
          className="h-10 px-4 py-2 bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
          data-testid="empty-state-action-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};