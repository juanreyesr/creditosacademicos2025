import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserCog, UserPlus, Brain, BookOpen, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

const COLORS = ['#003DA5', '#E91E8C', '#64748b', '#10b981'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('upana_user');
    if (!user) {
      navigate('/admin/login');
      return;
    }
    fetchMetrics();
  }, [navigate]);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, status, career_interest, created_at');

      if (error) {
        throw error;
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const byStatus = data.reduce(
        (acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        },
        { nuevo: 0, contactado: 0, en_proceso: 0, inscrito: 0 }
      );

      const byCareer = data.reduce(
        (acc, lead) => {
          acc[lead.career_interest] = (acc[lead.career_interest] || 0) + 1;
          return acc;
        },
        { psicologia_clinica: 0, licenciatura_psicologicas: 0 }
      );

      const newLeads7Days = data.filter((lead) => {
        if (!lead.created_at) return false;
        return new Date(lead.created_at) >= sevenDaysAgo;
      }).length;

      setMetrics({
        total_leads: data.length,
        new_leads_7days: newLeads7Days,
        contacted: byStatus.contactado || 0,
        in_process: byStatus.en_proceso || 0,
        enrolled: byStatus.inscrito || 0,
        by_career: byCareer,
        by_status: byStatus
      });
    } catch (error) {
      toast.error('Error al cargar métricas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem('upana_user');
    navigate('/admin/login');
    toast.success('Sesión cerrada');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const statusData = metrics ? [
    { name: 'Nuevos', value: metrics.by_status.nuevo, color: '#003DA5' },
    { name: 'Contactados', value: metrics.by_status.contactado, color: '#E91E8C' },
    { name: 'En Proceso', value: metrics.by_status.en_proceso, color: '#64748b' },
    { name: 'Inscritos', value: metrics.by_status.inscrito, color: '#10b981' }
  ] : [];

  const careerData = metrics ? [
    { name: 'Psicología Clínica', value: metrics.by_career.psicologia_clinica },
    { name: 'Lic. Ciencias Psicológicas', value: metrics.by_career.licenciatura_psicologicas }
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary" data-testid="dashboard-title">UPANA Lead Manager</h1>
            <p className="text-sm text-slate-600">Panel de Administración</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/leads')}
              data-testid="nav-leads-button"
            >
              Gestionar Leads
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/import')}
              data-testid="nav-import-button"
            >
              Importar
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/reports')}
              data-testid="nav-reports-button"
            >
              Informes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/careers')}
              data-testid="nav-careers-button"
            >
              Editar Carreras
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/pensum')}
              data-testid="nav-pensum-button"
            >
              Imágenes de Pensum
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/campus')}
              data-testid="nav-campus-button"
            >
              Fotos de Campus
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" data-testid="metric-total-leads">
            <CardHeader className="p-0 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600">Total Leads</p>
                  <CardTitle className="text-3xl font-bold text-primary">{metrics?.total_leads || 0}</CardTitle>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" data-testid="metric-new-leads">
            <CardHeader className="p-0 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600">Nuevos (7 días)</p>
                  <CardTitle className="text-3xl font-bold text-secondary">{metrics?.new_leads_7days || 0}</CardTitle>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" data-testid="metric-in-process">
            <CardHeader className="p-0 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600">En Proceso</p>
                  <CardTitle className="text-3xl font-bold text-slate-700">{metrics?.in_process || 0}</CardTitle>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" data-testid="metric-enrolled">
            <CardHeader className="p-0 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600">Inscritos</p>
                  <CardTitle className="text-3xl font-bold text-green-600">{metrics?.enrolled || 0}</CardTitle>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <Card className="bg-white rounded-xl shadow-sm" data-testid="chart-status">
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Career Distribution */}
          <Card className="bg-white rounded-xl shadow-sm" data-testid="chart-careers">
            <CardHeader>
              <CardTitle>Leads por Carrera</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={careerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#003DA5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Career Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border-2 border-blue-100" data-testid="career-card-clinica">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-xl">Psicología Clínica</CardTitle>
                  <p className="text-sm text-slate-600">Plan Sábado - 5 años</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary mb-2">{metrics?.by_career.psicologia_clinica || 0} leads</p>
              <p className="text-sm text-slate-600">Interesados en esta carrera</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-white rounded-xl shadow-sm border-2 border-pink-100" data-testid="career-card-licenciatura">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-secondary" />
                <div>
                  <CardTitle className="text-xl">Lic. Ciencias Psicológicas</CardTitle>
                  <p className="text-sm text-slate-600">Plan Diario - 4 años</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-secondary mb-2">{metrics?.by_career.licenciatura_psicologicas || 0} leads</p>
              <p className="text-sm text-slate-600">Interesados en esta carrera</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
