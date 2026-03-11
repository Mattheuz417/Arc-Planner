import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, BookOpen, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background noise-bg">
      <nav className="backdrop-blur-md bg-slate-900/80 border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-sans font-semibold text-base sm:text-lg tracking-tight text-white">Arc Planner</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800 text-sm"
                data-testid="nav-login-button"
              >
                Entrar
              </Button>
              <Button
                onClick={() => navigate('/register')}
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-sm"
                data-testid="nav-register-button"
              >
                Criar conta
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-12 sm:pt-16 md:pt-24 pb-16 sm:pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-sans font-semibold text-5xl sm:text-6xl tracking-tight text-white mb-6">
                Estude com foco.
                <br />
                <span className="text-primary">Sem distrações.</span>
              </h1>
              <p className="font-sans text-lg text-slate-400 mb-8 leading-relaxed">
                Arc Planner é um sistema de planejamento de estudos minimalista que ajuda você a organizar disciplinas, trilhas de aprendizado e unidades de estudo. Sem ruído visual, apenas progresso.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate('/register')}
                  className="h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-base active:scale-95 transition-all"
                  data-testid="hero-register-button"
                >
                  Começar agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-lg overflow-hidden border border-border/50 shadow-xl shadow-black/20">
                <img
                  src="https://images.unsplash.com/photo-1574081105756-3c8d8ed70198?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZGVzayUyMHNldHVwJTIwZGFyayUyMG1vZGV8ZW58MHx8fHwxNzczMjU2ODY2fDA&ixlib=rb-4.1.0&q=85"
                  alt="Workspace minimalista"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-sans font-semibold text-4xl tracking-tight text-white mb-4">
              Ferramentas para foco total
            </h2>
            <p className="font-sans text-lg text-slate-400">
              Tudo que você precisa para estudar com consistência
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Disciplinas & Trilhas',
                description: 'Organize seus estudos em disciplinas e trilhas de aprendizado. Divida em unidades de estudo (UA) e acompanhe seu progresso.'
              },
              {
                icon: TrendingUp,
                title: 'Cálculo automático de ritmo',
                description: 'O sistema calcula automaticamente quantas UAs você precisa completar por dia para atingir seus prazos.'
              },
              {
                icon: Target,
                title: 'Interface minimalista',
                description: 'Design focado em reduzir distrações e estimulação de dopamina. Apenas você e seus estudos.'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-card border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200 mb-3">
                  {feature.title}
                </h3>
                <p className="font-sans text-base text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-sans font-semibold text-4xl tracking-tight text-white mb-6">
              Comece a estudar com foco hoje
            </h2>
            <p className="font-sans text-lg text-slate-400 mb-8">
              Sem distrações. Sem ruído. Apenas progresso.
            </p>
            <Button
              onClick={() => navigate('/register')}
              className="h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-base active:scale-95 transition-all"
              data-testid="cta-register-button"
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs text-slate-500 text-center">
            © 2026 Arc Planner. Feito com foco.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;