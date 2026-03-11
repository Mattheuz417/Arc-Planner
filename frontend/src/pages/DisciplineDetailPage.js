import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, ArrowLeft, Trash2, Edit2, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DisciplineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discipline, setDiscipline] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [trackName, setTrackName] = useState('');
  const [unitCount, setUnitCount] = useState(5);

  useEffect(() => {
    fetchDisciplineData();
  }, [id]);

  const fetchDisciplineData = async () => {
    try {
      const [disciplineRes, tracksRes] = await Promise.all([
        axios.get(`${API_URL}/disciplines/${id}`),
        axios.get(`${API_URL}/disciplines/${id}/tracks`)
      ]);

      setDiscipline(disciplineRes.data);

      const tracksWithUnits = await Promise.all(
        tracksRes.data.map(async (track) => {
          const unitsRes = await axios.get(`${API_URL}/tracks/${track.id}/units`);
          return { ...track, units: unitsRes.data };
        })
      );

      setTracks(tracksWithUnits);
    } catch (error) {
      console.error('Error fetching discipline data:', error);
      toast.error('Erro ao carregar dados da disciplina');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/disciplines/${id}/tracks`, { name: trackName });
      toast.success('Trilha criada com sucesso!');
      setTrackDialogOpen(false);
      setTrackName('');
      fetchDisciplineData();
    } catch (error) {
      toast.error('Erro ao criar trilha');
    }
  };

  const handleCreateUnits = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tracks/${selectedTrackId}/units`, { count: unitCount });
      toast.success(`${unitCount} unidades criadas com sucesso!`);
      setUnitDialogOpen(false);
      setUnitCount(5);
      fetchDisciplineData();
    } catch (error) {
      toast.error('Erro ao criar unidades');
    }
  };

  const handleDeleteTrack = async (trackId, trackName) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${trackName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/tracks/${trackId}`);
      toast.success('Trilha deletada com sucesso');
      fetchDisciplineData();
    } catch (error) {
      toast.error('Erro ao deletar trilha');
    }
  };

  const handleToggleUnit = async (unitId) => {
    try {
      await axios.patch(`${API_URL}/units/${unitId}/toggle`);
      fetchDisciplineData();
    } catch (error) {
      toast.error('Erro ao atualizar unidade');
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

  const totalUnits = tracks.reduce((sum, track) => sum + track.units.length, 0);
  const completedUnits = tracks.reduce((sum, track) => sum + track.units.filter(u => u.completed).length, 0);
  const progressPercentage = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6">
          <Button
            onClick={() => navigate('/disciplines')}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-800 mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="font-sans font-semibold text-4xl tracking-tight text-white mb-4">
            {discipline?.name}
          </h1>
          
          <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans font-medium text-lg tracking-tight text-slate-200">
                Progresso Geral
              </h3>
              <span className="font-mono text-xl text-primary">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 mb-4" data-testid="discipline-progress-bar" />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-1">Total</p>
                <p className="font-mono text-xl text-slate-300">{totalUnits} UA</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-1">Completas</p>
                <p className="font-mono text-xl text-success">{completedUnits} UA</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-1">Restantes</p>
                <p className="font-mono text-xl text-slate-300">{totalUnits - completedUnits} UA</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-sans font-medium text-2xl tracking-tight text-slate-100">
            Trilhas de Aprendizado
          </h2>
          <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
                data-testid="create-track-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Trilha
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="font-sans font-medium text-xl tracking-tight text-slate-200">
                  Criar Nova Trilha
                </DialogTitle>
                <DialogDescription className="font-sans text-sm text-slate-400">
                  Dê um nome para a trilha de aprendizado
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTrack} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="track-name" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                    Nome da Trilha
                  </Label>
                  <Input
                    id="track-name"
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    placeholder="Ex: Modelagem de Sistemas"
                    required
                    className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    data-testid="track-name-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
                  data-testid="track-submit-button"
                >
                  Criar Trilha
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {tracks.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-lg p-12 text-center">
            <p className="font-sans text-base text-slate-400 mb-4">
              Nenhuma trilha criada. Crie sua primeira trilha para começar.
            </p>
            <Button
              onClick={() => setTrackDialogOpen(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira trilha
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {tracks.map((track, idx) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-card border border-border/50 rounded-lg p-6 shadow-sm"
                data-testid={`track-${idx}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-slate-500" />
                    <h3 className="font-sans font-medium text-xl tracking-tight text-slate-200">
                      {track.name}
                    </h3>
                    <span className="font-mono text-sm text-slate-500">
                      {track.units.filter(u => u.completed).length}/{track.units.length} UA
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedTrackId(track.id);
                        setUnitDialogOpen(true);
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-800"
                      data-testid={`add-units-${idx}`}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar UAs
                    </Button>
                    <Button
                      onClick={() => handleDeleteTrack(track.id, track.name)}
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                      data-testid={`delete-track-${idx}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {track.units.length === 0 ? (
                  <p className="font-sans text-sm text-slate-400 py-4">
                    Nenhuma unidade criada. Clique em "Adicionar UAs" para começar.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {track.units.map((unit) => (
                      <div
                        key={unit.id}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded border transition-all cursor-pointer ${
                          unit.completed
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => handleToggleUnit(unit.id)}
                        data-testid={`unit-${unit.number}`}
                      >
                        <Checkbox
                          checked={unit.completed}
                          className="pointer-events-none"
                        />
                        <span className="font-mono text-sm">UA {unit.number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
          <DialogContent className="bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="font-sans font-medium text-xl tracking-tight text-slate-200">
                Adicionar Unidades de Aprendizado
              </DialogTitle>
              <DialogDescription className="font-sans text-sm text-slate-400">
                Quantas UAs deseja adicionar?
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUnits} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="unit-count" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                  Número de UAs
                </Label>
                <Input
                  id="unit-count"
                  type="number"
                  min="1"
                  max="100"
                  value={unitCount}
                  onChange={(e) => setUnitCount(parseInt(e.target.value))}
                  required
                  className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  data-testid="unit-count-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
                data-testid="unit-submit-button"
              >
                Adicionar {unitCount} UAs
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default DisciplineDetailPage;