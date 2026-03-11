import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(email, password, name);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="font-sans font-semibold text-2xl tracking-tight text-white">Arc Planner</h1>
          </div>
          <h2 className="font-sans font-medium text-xl tracking-tight text-slate-200 mb-2">
            Crie sua conta
          </h2>
          <p className="font-sans text-base text-slate-400">
            Comece a estudar com foco
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-lg p-8 shadow-xl shadow-black/20">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                Nome
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                data-testid="register-name-input"
              />
            </div>

            <div>
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                data-testid="register-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-2 block">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength="6"
                className="bg-slate-950/50 border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                data-testid="register-password-input"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6 h-10 bg-primary text-white hover:bg-primary/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
            data-testid="register-submit-button"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline" data-testid="register-login-link">
              Entrar
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;