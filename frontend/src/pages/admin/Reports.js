import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

export default function Reports() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [careerFilter, setCareerFilter] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format) => {
    setDownloading(true);
    try {
      let query = supabase.from('leads').select('*');
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (careerFilter) {
        query = query.eq('career_interest', careerFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        throw error;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

      if (format === 'excel') {
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'leads_report.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'leads_report.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      toast.success('Informe descargado');
    } catch (error) {
      toast.error('Error al descargar informe');
      console.error(error);
    } finally {
      setDownloading(false);
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
        <div className="max-w-2xl mx-auto">
          <Card data-testid="reports-card">
            <CardHeader>
              <CardTitle>Generar Informes</CardTitle>
              <CardDescription>Descarga informes completos de tus leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Filtrar por Estado</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full h-11 rounded-lg border px-3" data-testid="status-filter">
                  <option value="">Todos</option>
                  <option value="nuevo">Nuevos</option>
                  <option value="contactado">Contactados</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="inscrito">Inscritos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Filtrar por Carrera</label>
                <select value={careerFilter} onChange={(e) => setCareerFilter(e.target.value)} className="w-full h-11 rounded-lg border px-3" data-testid="career-filter">
                  <option value="">Todas</option>
                  <option value="psicologia_clinica">Psicología Clínica</option>
                  <option value="licenciatura_psicologicas">Lic. Ciencias Psicológicas</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button className="w-full" onClick={() => handleDownload('excel')} disabled={downloading} data-testid="download-excel-button">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleDownload('csv')} disabled={downloading} data-testid="download-csv-button">
                  <FileText className="w-4 h-4 mr-2" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
