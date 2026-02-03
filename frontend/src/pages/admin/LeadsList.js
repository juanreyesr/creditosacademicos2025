import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Filter, Eye, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

const STATUS_COLORS = {
  nuevo: 'bg-blue-100 text-blue-800',
  contactado: 'bg-purple-100 text-purple-800',
  en_proceso: 'bg-yellow-100 text-yellow-800',
  inscrito: 'bg-green-100 text-green-800'
};

const STATUS_LABELS = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  en_proceso: 'En Proceso',
  inscrito: 'Inscrito'
};

export default function LeadsList() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [careerFilter, setCareerFilter] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setLeads(data);
      setFilteredLeads(data);
    } catch (error) {
      toast.error('Error al cargar leads');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterLeads = useCallback(() => {
    let filtered = [...leads];

    if (search) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (careerFilter) {
      filtered = filtered.filter(lead => lead.career_interest === careerFilter);
    }

    setFilteredLeads(filtered);
  }, [careerFilter, leads, search, statusFilter]);

  useEffect(() => {
    const user = localStorage.getItem('upana_user');
    if (!user) {
      navigate('/admin/login');
      return;
    }
    fetchLeads();
  }, [fetchLeads, navigate]);

  useEffect(() => {
    filterLeads();
  }, [filterLeads]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getCareerName = (career) => {
    if (!career || career === 'sin_definir') {
      return 'Sin definir';
    }
    return career === 'psicologia_clinica'
      ? 'Psicología Clínica'
      : 'Lic. Ciencias Psicológicas';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary" data-testid="page-title">Gestión de Leads</h1>
              <p className="text-sm text-slate-600">{filteredLeads.length} leads encontrados</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
                data-testid="search-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-lg border border-slate-200 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              data-testid="status-filter"
            >
              <option value="">Todos los estados</option>
              <option value="nuevo">Nuevos</option>
              <option value="contactado">Contactados</option>
              <option value="en_proceso">En Proceso</option>
              <option value="inscrito">Inscritos</option>
            </select>

            <select
              value={careerFilter}
              onChange={(e) => setCareerFilter(e.target.value)}
              className="h-11 rounded-lg border border-slate-200 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              data-testid="career-filter"
            >
              <option value="">Todas las carreras</option>
              <option value="psicologia_clinica">Psicología Clínica</option>
              <option value="licenciatura_psicologicas">Lic. Ciencias Psicológicas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="container mx-auto px-4 md:px-8 py-8">
        <Card className="bg-white rounded-xl shadow-sm" data-testid="leads-table-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="leads-table">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700">Nombre</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700">Contacto</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700">Carrera</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700">Estado</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700">Fecha</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-slate-50 transition-colors" data-testid={`lead-row-${lead.id}`}>
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{lead.name}</p>
                        <p className="text-sm text-slate-500">{lead.source === 'web' ? 'Web' : 'Excel'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700">{lead.email}</p>
                        <p className="text-sm text-slate-500">{lead.phone}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700">{getCareerName(lead.career_interest)}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={STATUS_COLORS[lead.status]} data-testid={`badge-${lead.status}`}>
                          {STATUS_LABELS[lead.status]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700">{formatDate(lead.created_at)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/leads/${lead.id}`)}
                            data-testid={`view-button-${lead.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLeads.length === 0 && (
                <div className="text-center py-12" data-testid="no-leads-message">
                  <p className="text-slate-500">No se encontraron leads con los filtros seleccionados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
