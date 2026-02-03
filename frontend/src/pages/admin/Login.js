import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error('No se encontró el usuario');
      }

      localStorage.setItem('upana_user', JSON.stringify({ email: data.user.email }));
      toast.success('Login exitoso');
      navigate('/admin/dashboard');
    } catch (error) {
      let message = 'Error al iniciar sesión';

      if (error?.message?.includes('Invalid API key')) {
        message = 'API key inválida. Verifica REACT_APP_SUPABASE_ANON_KEY en Vercel.';
      } else if (error?.message?.includes('Invalid login credentials')) {
        message = 'Credenciales inválidas o el usuario no tiene contraseña asignada.';
      } else if (error?.message?.includes('Email not confirmed')) {
        message = 'Debes confirmar tu correo en Supabase antes de iniciar sesión.';
      } else if (error?.message?.includes('Email logins are disabled')) {
        message = 'El acceso por correo está deshabilitado en Supabase.';
      } else if (error?.message) {
        message = error.message;
      }

      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md" data-testid="login-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">UPANA Lead Manager</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="block text-sm font-medium mb-2">Correo Electrónico</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="tu@email.com"
                className="h-11"
                data-testid="input-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                className="h-11"
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 h-11"
              data-testid="submit-button"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
