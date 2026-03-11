import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, BookOpen, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DisciplinesPage = () => {
  const navigate = useNavigate();
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    deadline: ''
  });

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    try {
      const response = await axios.get(`${API_URL}/disciplines`);
      setDisciplines(response.data);
    } catch (error) {
      console.error('Error fetching disciplines:', error);
      toast.error('Erro ao carregar disciplinas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/disciplines`, formData);
      toast.success('Disciplina criada com sucesso!');
      setDialogOpen(false);
      setFormData({ name: '', start_date: '', deadline: '' });
      fetchDisciplines();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar disciplina');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/disciplines/${id}`);
      toast.success('Disciplina deletada com sucesso');
      fetchDisciplines();
    } catch (error) {
      toast.error('Erro ao deletar disciplina');
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
              Disciplinas
            </h1>
            <p className="font-sans text-base text-slate-400">
              Organize seus estudos por disciplinas
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
                data-testid="create-discipline-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="font-sans font-medium text-xl tracking-tight text-slate-200">
                  Criar Nova Disciplina
                </DialogTitle>
                <DialogDescription className="font-sans text-sm text-slate-400">
                  Preencha as informações da disciplina
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                    Nome da Disciplina
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Modelagem de Sistemas"
                    required
                    className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    data-testid="discipline-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="start_date" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                    Data de Início
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    data-testid="discipline-start-date-input"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                    Prazo Final
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                    className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    data-testid="discipline-deadline-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
                  data-testid="discipline-submit-button"
                >
                  Criar Disciplina
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {disciplines.length === 0 ? (
          <EmptyState
            title="Nenhuma disciplina criada"
            description="Crie sua primeira disciplina para começar a organizar seus estudos."
            actionLabel="Criar disciplina"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplines.map((discipline, idx) => (
              <motion.div
                key={discipline.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-card border border-border/50 rounded-lg p-6 shadow-sm hover:border-primary/50 transition-colors duration-300 group"
                data-testid={`discipline-item-${idx}`}
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
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(discipline.id, discipline.name);
                    }}
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                    data-testid={`delete-discipline-${idx}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                    <span className="font-mono text-xs text-slate-500">Início:</span>
                    <span className="font-mono text-xs text-slate-300">
                      {new Date(discipline.start_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                    <span className="font-mono text-xs text-slate-500">Prazo:</span>
                    <span className="font-mono text-xs text-slate-300">
                      {new Date(discipline.deadline).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/disciplines/${discipline.id}`)}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                  data-testid={`view-discipline-${idx}`}
                >
                  Ver detalhes
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default DisciplinesPage;