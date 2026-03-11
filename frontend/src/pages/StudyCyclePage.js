import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, GripVertical, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const StudyCyclePage = () => {
  const [cycle, setCycle] = useState(null);
  const [cycleItems, setCycleItems] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addDisciplineDialogOpen, setAddDisciplineDialogOpen] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('');
  const [completingToday, setCompletingToday] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cycleRes, disciplinesRes] = await Promise.all([
        axios.get(`${API_URL}/study-cycle`),
        axios.get(`${API_URL}/disciplines`)
      ]);

      const cycleData = cycleRes.data;
      setCycle(cycleData);
      setDisciplines(disciplinesRes.data);

      if (cycleData) {
        const itemsRes = await axios.get(`${API_URL}/study-cycle/${cycleData.id}/items`);
        setCycleItems(itemsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/study-cycle`, { name: cycleName });
      toast.success('Ciclo criado com sucesso!');
      setCreateDialogOpen(false);
      setCycleName('');
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar ciclo');
    }
  };

  const handleAddDiscipline = async (e) => {
    e.preventDefault();
    if (!selectedDisciplineId) return;

    try {
      await axios.post(`${API_URL}/study-cycle/${cycle.id}/items`, {
        discipline_id: selectedDisciplineId
      });
      toast.success('Disciplina adicionada ao ciclo!');
      setAddDisciplineDialogOpen(false);
      setSelectedDisciplineId('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao adicionar disciplina');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Tem certeza que deseja remover esta disciplina do ciclo?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/study-cycle/${cycle.id}/items/${itemId}`);
      toast.success('Disciplina removida do ciclo');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover disciplina');
    }
  };

  const handleDeleteCycle = async () => {
    if (!window.confirm('Tem certeza que deseja deletar o ciclo de estudos?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/study-cycle/${cycle.id}`);
      toast.success('Ciclo deletado com sucesso');
      setCycle(null);
      setCycleItems([]);
    } catch (error) {
      toast.error('Erro ao deletar ciclo');
    }
  };

  const handleCompleteToday = async () => {
    setCompletingToday(true);
    try {
      const response = await axios.post(`${API_URL}/study-cycle/${cycle.id}/complete-today`);
      toast.success(response.data.message);
      toast.info(`Próxima disciplina: ${response.data.next_discipline}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao completar estudo de hoje');
    } finally {
      setCompletingToday(false);
    }
  };

  const handleMoveUp = async (item, index) => {
    if (index === 0) return;

    const newItems = [...cycleItems];
    [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];

    try {
      await axios.post(`${API_URL}/study-cycle/${cycle.id}/reorder`, {
        item_ids: newItems.map(i => i.id)
      });
      setCycleItems(newItems);
      toast.success('Ciclo reordenado');
    } catch (error) {
      toast.error('Erro ao reordenar');
      fetchData();
    }
  };

  const handleMoveDown = async (item, index) => {
    if (index === cycleItems.length - 1) return;

    const newItems = [...cycleItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

    try {
      await axios.post(`${API_URL}/study-cycle/${cycle.id}/reorder`, {
        item_ids: newItems.map(i => i.id)
      });
      setCycleItems(newItems);
      toast.success('Ciclo reordenado');
    } catch (error) {
      toast.error('Erro ao reordenar');
      fetchData();
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
              🔄 Ciclo de Estudos
            </h1>
            <p className="font-sans text-base text-slate-400">
              Alterne entre disciplinas seguindo um ciclo personalizado
            </p>
          </div>

          {!cycle ? (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="create-cycle-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Ciclo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="font-sans font-medium text-xl tracking-tight text-slate-200">
                    Criar Ciclo de Estudos
                  </DialogTitle>
                  <DialogDescription className="font-sans text-sm text-slate-400">
                    Dê um nome ao seu ciclo de estudos
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCycle} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="cycle-name" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                      Nome do Ciclo
                    </Label>
                    <Input
                      id="cycle-name"
                      value={cycleName}
                      onChange={(e) => setCycleName(e.target.value)}
                      placeholder="Ex: Ciclo Semanal"
                      required
                      className="bg-slate-950/50 border-slate-800 focus:border-primary"
                      data-testid="cycle-name-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    data-testid="cycle-submit-button"
                  >
                    Criar Ciclo
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              onClick={handleDeleteCycle}
              variant="ghost"
              className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
              data-testid="delete-cycle-button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Ciclo
            </Button>
          )}
        </div>

        {cycle && (
          <div className="space-y-6">
            {/* Current Discipline Card */}
            {cycleItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-card border border-primary/30 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Disciplina de Hoje
                    </p>
                    <h2 className="font-sans font-semibold text-2xl tracking-tight text-white mb-1">
                      {cycleItems[0].discipline_name}
                    </h2>
                    <p className="font-sans text-sm text-slate-400">
                      Ao concluir, avança para: {cycleItems[1]?.discipline_name || cycleItems[0]?.discipline_name}
                    </p>
                  </div>
                  <Button
                    onClick={handleCompleteToday}
                    disabled={completingToday}
                    className="bg-success text-white hover:bg-success/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                    data-testid="complete-today-button"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Estudo concluído hoje
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Cycle Items List */}
            <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200">
                  Disciplinas no Ciclo
                </h3>
                <Dialog open={addDisciplineDialogOpen} onOpenChange={setAddDisciplineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary text-white hover:bg-primary/90"
                      data-testid="add-discipline-to-cycle-button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Disciplina
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border/50">
                    <DialogHeader>
                      <DialogTitle className="font-sans font-medium text-xl tracking-tight text-slate-200">
                        Adicionar ao Ciclo
                      </DialogTitle>
                      <DialogDescription className="font-sans text-sm text-slate-400">
                        Escolha uma disciplina para adicionar ao ciclo
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddDiscipline} className="space-y-4 mt-4">
                      <div>
                        <Label className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                          Disciplina
                        </Label>
                        <Select value={selectedDisciplineId} onValueChange={setSelectedDisciplineId}>
                          <SelectTrigger className="bg-slate-950/50 border-slate-800">
                            <SelectValue placeholder="Selecione uma disciplina" />
                          </SelectTrigger>
                          <SelectContent>
                            {disciplines.filter(d => !cycleItems.find(i => i.discipline_id === d.id)).map(discipline => (
                              <SelectItem key={discipline.id} value={discipline.id}>
                                {discipline.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary text-white hover:bg-primary/90"
                        data-testid="add-discipline-submit-button"
                      >
                        Adicionar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {cycleItems.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="font-sans text-base text-slate-400">
                    Adicione disciplinas ao ciclo para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cycleItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        item.is_current
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                      data-testid={`cycle-item-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveUp(item, index)}
                          disabled={index === 0}
                          className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(item, index)}
                          disabled={index === cycleItems.length - 1}
                          className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-mono text-sm text-slate-500 w-8">
                          {index + 1}.
                        </span>
                        <GripVertical className="w-4 h-4 text-slate-600" />
                        <span className={`font-sans text-base ${
                          item.is_current ? 'text-white font-semibold' : 'text-slate-300'
                        }`}>
                          {item.discipline_name}
                        </span>
                        {item.is_current && (
                          <span className="font-mono text-xs text-primary">← Atual</span>
                        )}
                      </div>

                      <Button
                        onClick={() => handleRemoveItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        data-testid={`remove-item-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="font-sans text-sm text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Como funciona:</span> Clique em "Estudo concluído hoje" para avançar para a próxima disciplina. Quando chegar ao fim do ciclo, ele reinicia automaticamente. Dias de folga NÃO avançam o ciclo.
              </p>
            </div>
          </div>
        )}

        {!cycle && (
          <div className="bg-card border border-border/50 rounded-lg p-12 text-center">
            <RefreshCw className="w-16 h-16 text-slate-600 mx-auto mb-6" />
            <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200 mb-3">
              Nenhum ciclo criado
            </h3>
            <p className="font-sans text-base text-slate-400 mb-6 max-w-md mx-auto">
              Crie um ciclo de estudos para alternar automaticamente entre suas disciplinas a cada dia
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Ciclo
            </Button>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default StudyCyclePage;
