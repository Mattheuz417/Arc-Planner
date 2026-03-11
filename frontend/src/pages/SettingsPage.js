import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-sans font-semibold text-4xl tracking-tight text-white mb-2">
          Configurações
        </h1>
        <p className="font-sans text-base text-slate-400 mb-8">
          Personalize sua experiência no Arc Planner
        </p>

        <div className="bg-card border border-border/50 rounded-lg p-8 text-center">
          <p className="font-sans text-base text-slate-400">
            Configurações em breve...
          </p>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SettingsPage;