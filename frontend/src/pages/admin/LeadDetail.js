import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, MessageCircle, Save, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { buildMessageForLead } from '@/lib/careerData';

const STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'inscrito', label: 'Inscrito' }
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeadDetail = useCallback(async () => {
    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadError) {
        throw leadError;
      }

      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });

      if (interactionsError) {
        throw interactionsError;
      }

      setLead(leadData);
      setInteractions(interactionsData);
      setNotes(leadData.notes || '');
      setStatus(leadData.status);
    } catch (error) {
      toast.error('Error al cargar lead');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetail();
  }, [fetchLeadDetail]);

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
      toast.success('Lead actualizado');
      fetchLeadDetail();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleGenerateMessage = async (type) => {
    try {
      const messageData = buildMessageForLead(lead, type);

      if (type === 'email') {
        const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(messageData.subject)}&body=${encodeURIComponent(messageData.message)}`;
        window.open(mailtoLink);
      } else if (type === 'whatsapp') {
        window.open(messageData.whatsappLink, '_blank');
      }

      const { error } = await supabase.from('interactions').insert([{
        lead_id: id,
        interaction_type: type,
        message: messageData.message,
        created_at: new Date().toISOString()
      }]);

      if (error) {
        throw error;
      }

      toast.success('Mensaje generado');
      fetchLeadDetail();
    } catch (error) {
      toast.error('Error al generar mensaje');
    }
  };

  const handleCopyWhatsappMessage = async () => {
    try {
      const messageData = buildMessageForLead(lead, 'whatsapp');
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(messageData.message);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = messageData.message;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      const { error } = await supabase.from('interactions').insert([{
        lead_id: id,
        interaction_type: 'whatsapp',
        message: messageData.message,
        created_at: new Date().toISOString()
      }]);

      if (error) {
        throw error;
      }

      toast.success('Mensaje copiado');
      fetchLeadDetail();
    } catch (error) {
      toast.error('Error al copiar mensaje');
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!lead) return <div className="p-8">Lead no encontrado</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate('/admin/leads')} data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card data-testid="lead-info-card">
              <CardHeader>
                <CardTitle>Información del Lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Nombre</p>
                  <p className="text-lg font-semibold">{lead.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="text-lg">{lead.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Teléfono</p>
                  <p className="text-lg">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Carrera de Interés</p>
                  <p className="text-lg">
                    {lead.career_interest && lead.career_interest !== 'sin_definir'
                      ? lead.career_interest === 'psicologia_clinica'
                        ? 'Psicología Clínica'
                        : 'Lic. Ciencias Psicológicas'
                      : 'Sin definir'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="interactions-card">
              <CardHeader>
                <CardTitle>Historial de Interacciones</CardTitle>
              </CardHeader>
              <CardContent>
                {interactions.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Sin interacciones registradas</p>
                ) : (
                  <div className="space-y-4">
                    {interactions.map((interaction) => (
                      <div key={interaction.id} className="border-l-4 border-primary pl-4 py-2" data-testid={`interaction-${interaction.id}`}>
                        <p className="text-sm font-semibold">{interaction.interaction_type}</p>
                        <p className="text-sm text-slate-600">{new Date(interaction.created_at).toLocaleString('es-GT')}</p>
                        {interaction.message && <p className="text-sm mt-2">{interaction.message.substring(0, 100)}...</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card data-testid="actions-card">
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => handleGenerateMessage('email')} data-testid="email-button">
                  <Mail className="w-4 h-4 mr-2" /> Enviar Email
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleGenerateMessage('whatsapp')} data-testid="whatsapp-button">
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button className="w-full" variant="outline" onClick={handleCopyWhatsappMessage} data-testid="copy-whatsapp-button">
                  <Copy className="w-4 h-4 mr-2" /> Copiar mensaje
                </Button>
              </CardContent>
            </Card>

            <Card data-testid="update-card">
              <CardHeader>
                <CardTitle>Actualizar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-11 rounded-lg border px-3" data-testid="status-select">
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notas</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} data-testid="notes-textarea" />
                </div>
                <Button className="w-full" onClick={handleUpdate} data-testid="save-button">
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
