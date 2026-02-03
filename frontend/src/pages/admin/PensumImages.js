import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { PENSUM_IMAGES, STORAGE_BUCKET } from '@/lib/siteContent';
import { supabase } from '@/lib/supabaseClient';

export default function PensumImages() {
  const navigate = useNavigate();
  const [pensumImages, setPensumImages] = useState(PENSUM_IMAGES);
  const [uploading, setUploading] = useState({});

  const handleFileChange = async (key, file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const { path } = pensumImages[key];
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        upsert: true,
        cacheControl: '0'
      });
      if (error) throw error;
      const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      setPensumImages((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          src: publicUrl
        }
      }));
      window.dispatchEvent(new Event('assets-updated'));
      toast.success('Pensum actualizado en Supabase.');
    } catch (error) {
      toast.error('No se pudo subir la imagen.');
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
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
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imágenes de pensum</CardTitle>
              <CardDescription>Sube o reemplaza los pensum de cada carrera.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(pensumImages).map(([key, pensum]) => (
                <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border rounded-xl p-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-2">{pensum.title}</p>
                    <img src={pensum.src} alt={pensum.alt} className="w-full h-auto rounded-lg border" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Subir nueva imagen (Supabase)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFileChange(key, event.target.files?.[0])}
                        className="w-full text-sm"
                        data-testid={`pensum-file-${key}`}
                        disabled={uploading[key]}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Se guarda en el bucket <span className="font-semibold">{STORAGE_BUCKET}</span> bajo{' '}
                        <span className="font-semibold">{pensum.path}</span>.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Button className="w-full" disabled data-testid="pensum-save-button">
                <ImagePlus className="w-4 h-4 mr-2" /> Guardado automático
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
