import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Calendar, TrendingUp, Target, BookOpen, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [takingDayOff, setTakingDayOff] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeDayOff = async () => {
    setTakingDayOff(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post(`${API_URL}/days-off`, { date: today });
      toast.success('Folga registrada com sucesso!');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao registrar folga');
    } finally {
      setTakingDayOff(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (stats?.total_disciplines === 0) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Nenhuma disciplina criada"
          description="Comece criando sua primeira disciplina para começar a organizar seus estudos com foco e consistência."
          actionLabel="Criar primeira disciplina"
          onAction={() => navigate('/disciplines')}
        />
      </DashboardLayout>
    );
  }

  const progressPercentage = stats.total_units > 0
    ? Math.round((stats.completed_units / stats.total_units) * 100)
    : 0;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-sans font-semibold text-4xl tracking-tight text-white mb-2">
              Painel
            </h1>
            <p className="font-sans text-base text-slate-400">
              Visão geral do seu progresso
            </p>
          </div>
          <Button
            onClick={handleTakeDayOff}
            disabled={takingDayOff}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            data-testid="take-day-off-button"
          >
            <Coffee className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Tirar folga hoje
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 md:col-span-8">
            <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200">
                  Progresso Total
                </h3>
                <span className="font-mono text-2xl text-primary">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3 mb-4" data-testid="total-progress-bar" />
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-1">Total UA</p>
                  <p className="font-mono text-2xl text-slate-300" data-testid="total-units-stat">{stats.total_units}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-1">Completadas</p>
                  <p className="font-mono text-2xl text-success" data-testid="completed-units-stat">{stats.completed_units}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-1">Restantes</p>
                  <p className="font-mono text-2xl text-slate-300" data-testid="remaining-units-stat">{stats.remaining_units}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200">
                  Folgas
                </h3>
              </div>
              <p className="font-mono text-3xl text-slate-300 mb-2" data-testid="days-off-stat">{stats.days_off_count}</p>
              <p className="font-sans text-sm text-slate-400">dias de descanso</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-medium text-2xl tracking-tight text-slate-100">
              Suas Disciplinas
            </h2>
            <Button
              onClick={() => navigate('/disciplines')}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              data-testid="view-all-disciplines-button"
            >
              Ver todas
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.disciplines.map((discipline, idx) => {
              const disciplineProgress = discipline.total_units > 0
                ? Math.round((discipline.completed_units / discipline.total_units) * 100)
                : 0;

              return (
                <motion.div
                  key={discipline.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-card border border-border/50 rounded-lg p-6 shadow-sm hover:border-primary/50 transition-colors duration-300 cursor-pointer"
                  onClick={() => navigate(`/disciplines/${discipline.id}`)}
                  data-testid={`discipline-card-${idx}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-sans font-medium text-lg tracking-tight text-slate-200">
                          {discipline.name}
                        </h3>
                        <p className="font-mono text-xs text-slate-500">
                          {new Date(discipline.deadline).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-primary">{disciplineProgress}%</span>
                  </div>

                  <Progress value={disciplineProgress} className="h-2 mb-4" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                      <div>
                        <p className="font-mono text-xs text-slate-500">Ritmo</p>
                        <p className="font-mono text-sm text-slate-300">{discipline.study_pace} UA/dia</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                      <div>
                        <p className="font-mono text-xs text-slate-500">Restantes</p>
                        <p className="font-mono text-sm text-slate-300">{discipline.remaining_days} dias</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DashboardPage;