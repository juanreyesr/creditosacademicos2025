import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';

export default function ImportLeads() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    career_interest: ''
  });
  const [savingManual, setSavingManual] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validExtensions = ['xlsx', 'xls', 'csv'];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (validExtensions.includes(fileExtension)) {
        setFile(selectedFile);
      } else {
        toast.error('Formato de archivo no válido');
      }
    }
  };

  const insertLeadsBatch = async (batch) => {
    const batchWithIds = batch.map((lead) => ({
      id: lead.id || crypto.randomUUID(),
      ...lead
    }));
    let { error } = await supabase.from('leads').insert(batchWithIds);
    if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      const minimalBatch = batchWithIds.map(({ id, name, email, phone, career_interest }) => ({
        id,
        name,
        email,
        phone,
        career_interest
      }));
      ({ error } = await supabase.from('leads').insert(minimalBatch));
    }
    if (error) {
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecciona un archivo');
      return;
    }

    setUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const normalizedRows = rows.map((row) => Object.entries(row).reduce((acc, [key, value]) => {
        acc[String(key).trim().toLowerCase()] = value;
        return acc;
      }, {}));

      if (normalizedRows.length === 0) {
        toast.error('El archivo no contiene registros');
        setUploading(false);
        return;
      }

      const requiredColumns = ['name', 'email', 'phone'];
      const missingColumns = requiredColumns.filter((col) => !Object.keys(normalizedRows[0] || {}).includes(col));
      if (missingColumns.length > 0) {
        toast.error(`El archivo debe contener las columnas: ${requiredColumns.join(', ')}`);
        setUploading(false);
        return;
      }

      const leadsToInsert = normalizedRows.map((row) => ({
        name: String(row.name || '').trim(),
        email: String(row.email || '').trim(),
        phone: String(row.phone || '').trim(),
        career_interest: String(row.career_interest || '').trim() || 'sin_definir',
        status: 'nuevo',
        source: 'excel',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })).filter((lead) => lead.name && lead.email && lead.phone);

      if (leadsToInsert.length === 0) {
        toast.error('No se encontraron filas válidas para importar');
        setUploading(false);
        return;
      }

      const batchSize = 200;
      for (let i = 0; i < leadsToInsert.length; i += batchSize) {
        const batch = leadsToInsert.slice(i, i + batchSize);
        await insertLeadsBatch(batch);
      }

      toast.success(`${leadsToInsert.length} leads importados exitosamente`);
      setFile(null);
      navigate('/admin/leads');
    } catch (error) {
      toast.error('Error al importar');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualForm.name.trim() || !manualForm.email.trim() || !manualForm.phone.trim()) {
      toast.error('Nombre, email y teléfono son obligatorios');
      return;
    }

    setSavingManual(true);

    try {
      const leadPayload = {
        name: manualForm.name.trim(),
        email: manualForm.email.trim(),
        phone: manualForm.phone.trim(),
        career_interest: manualForm.career_interest.trim() || 'sin_definir',
        status: 'nuevo',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await insertLeadsBatch([leadPayload]);

      toast.success('Lead guardado manualmente');
      setManualForm({ name: '', email: '', phone: '', career_interest: '' });
      navigate('/admin/leads');
    } catch (error) {
      toast.error(error?.message || error?.details || 'Error al guardar lead');
      console.error(error);
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card data-testid="import-card">
            <CardHeader>
              <CardTitle>Importar Leads desde Excel/CSV</CardTitle>
              <CardDescription>El archivo debe contener las columnas: name, email, phone (career_interest es opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload" data-testid="file-input" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" className="mb-2" asChild>
                    <span><Upload className="w-4 h-4 mr-2" /> Seleccionar Archivo</span>
                  </Button>
                </label>
                {file && <p className="text-sm text-slate-600 mt-2" data-testid="file-name">{file.name}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Formato Requerido:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <strong>name:</strong> Nombre completo del estudiante</li>
                  <li>• <strong>email:</strong> Correo electrónico</li>
                  <li>• <strong>phone:</strong> Número de teléfono</li>
                  <li>• <strong>career_interest:</strong> psicologia_clinica o licenciatura_psicologicas (opcional)</li>
                </ul>
              </div>

              <Button className="w-full" onClick={handleUpload} disabled={!file || uploading} data-testid="upload-button">
                {uploading ? 'Importando...' : 'Importar Leads'}
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="manual-card">
            <CardHeader>
              <CardTitle>Ingreso Manual</CardTitle>
              <CardDescription>Agrega un lead sin archivo. La carrera de interés es opcional.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre completo</label>
                <Input
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="Nombre del estudiante"
                  className="h-11"
                  data-testid="manual-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Correo electrónico</label>
                <Input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="h-11"
                  data-testid="manual-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <Input
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  placeholder="0000-0000"
                  className="h-11"
                  data-testid="manual-phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Carrera de interés (opcional)</label>
                <select
                  value={manualForm.career_interest}
                  onChange={(e) => setManualForm({ ...manualForm, career_interest: e.target.value })}
                  className="w-full h-11 rounded-lg border px-3"
                  data-testid="manual-career"
                >
                  <option value="">Sin definir</option>
                  <option value="psicologia_clinica">Psicología Clínica</option>
                  <option value="licenciatura_psicologicas">Lic. Ciencias Psicológicas</option>
                </select>
              </div>
              <Button className="w-full" onClick={handleManualSubmit} disabled={savingManual} data-testid="manual-save">
                {savingManual ? 'Guardando...' : 'Guardar Lead'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
