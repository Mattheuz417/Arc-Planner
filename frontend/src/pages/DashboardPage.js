import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Calendar, TrendingUp, Target, BookOpen, Coffee, Lightbulb, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [studySuggestion, setStudySuggestion] = useState(null);
  const [completionSimulation, setCompletionSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [takingDayOff, setTakingDayOff] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, suggestionRes, simulationRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/study-suggestion`),
        axios.get(`${API_URL}/dashboard/completion-simulation`)
      ]);
      setStats(statsRes.data);
      setStudySuggestion(suggestionRes.data);
      setCompletionSimulation(simulationRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
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
      fetchDashboardData();
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
                <div className="w-10 h-10 rounded bg-success/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-success" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200">
                  🌴 Folgas Inteligentes
                </h3>
              </div>
              {stats.smart_days_off && (
                <>
                  <div className="mb-4">
                    <p className="font-mono text-3xl text-success mb-1" data-testid="available-days-off">
                      {stats.smart_days_off.available_days_off}
                    </p>
                    <p className="font-sans text-sm text-slate-400 mb-2">
                      {stats.smart_days_off.message}
                    </p>
                    <p className="font-mono text-xs text-slate-500">
                      Folgas usadas: {stats.smart_days_off.days_off_used}
                    </p>
                  </div>
                  <Button
                    onClick={handleTakeDayOff}
                    disabled={takingDayOff || !stats.smart_days_off.can_take_day_off}
                    className={`w-full ${
                      stats.smart_days_off.can_take_day_off
                        ? 'bg-success text-white hover:bg-success/90'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    data-testid="smart-take-day-off-button"
                  >
                    {stats.smart_days_off.can_take_day_off ? '✅ Tirar folga hoje' : '🚫 Sem folgas disponíveis'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Study Suggestion Card */}
        {studySuggestion?.suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8"
          >
            <div className="bg-card border border-primary/30 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-sans font-medium text-lg tracking-tight text-slate-200 mb-2 flex items-center gap-2">
                    📌 Sugestão de estudo de hoje
                  </h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 mb-3">
                    <p className="font-sans text-base text-white mb-1">
                      <span className="font-semibold">Disciplina:</span> {studySuggestion.suggestion.discipline_name}
                    </p>
                    <p className="font-sans text-sm text-slate-400">
                      <span className="font-semibold">Motivo:</span> {studySuggestion.suggestion.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                      <span className="font-mono text-slate-400">
                        {studySuggestion.suggestion.remaining_units} UA restantes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                      <span className="font-mono text-slate-400">
                        {studySuggestion.suggestion.remaining_days} dias restantes
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/disciplines/${studySuggestion.suggestion.discipline_id}`)}
                    className="mt-4 bg-primary text-white hover:bg-primary/90"
                    data-testid="go-to-suggested-discipline"
                  >
                    Ir para disciplina
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Completion Simulation Card */}
        {completionSimulation && (completionSimulation.current_prediction || completionSimulation.scenarios.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6"
          >
            <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-secondary" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-sans font-medium text-lg tracking-tight text-slate-200 mb-1">
                    🔮 Simulação de conclusão
                  </h3>
                  <p className="font-sans text-sm text-slate-400">
                    Previsões baseadas em diferentes ritmos de estudo
                  </p>
                </div>
              </div>

              {completionSimulation.current_prediction && (
                <div className={`rounded-lg p-4 mb-4 ${
                  completionSimulation.current_prediction.on_track 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}>
                  <p className="font-sans text-sm text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">Seu ritmo atual:</span> {completionSimulation.average_productivity} UA/dia
                  </p>
                  <p className="font-sans text-base text-white">
                    Se você continuar nesse ritmo, terminará em{' '}
                    <span className="font-semibold">{completionSimulation.current_prediction.predicted_completion_date}</span>
                  </p>
                  {completionSimulation.warning && (
                    <div className="flex items-center gap-2 mt-3 text-amber-400">
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
                      <span className="font-sans text-sm font-medium">{completionSimulation.warning}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-3">
                  Simulações de ritmo
                </p>
                {completionSimulation.scenarios.map((scenario, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      scenario.on_track
                        ? 'bg-slate-800/50 border border-slate-700'
                        : 'bg-slate-900/50 border border-slate-800'
                    }`}
                    data-testid={`simulation-scenario-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-semibold ${
                        scenario.on_track ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {scenario.scenario}
                      </span>
                      <span className="font-sans text-sm text-slate-400">
                        → conclusão em {scenario.predicted_completion_date}
                      </span>
                    </div>
                    {scenario.on_track && (
                      <span className="text-xs text-emerald-500 font-medium">✓ No prazo</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8">
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