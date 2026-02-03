import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImagePlus, Link2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { CAREER_DATA } from '@/lib/careerData';
import { CAREER_IMAGES, STORAGE_BUCKET } from '@/lib/siteContent';
import { supabase } from '@/lib/supabaseClient';

const careerOptions = [
  { value: 'psicologia_clinica', label: 'Psicología Clínica y Consejería Social' },
  { value: 'licenciatura_psicologicas', label: 'Licenciatura en Ciencias Psicológicas' }
];

export default function CareerContent() {
  const navigate = useNavigate();
  const [selectedCareer, setSelectedCareer] = useState('psicologia_clinica');
  const [careerImages, setCareerImages] = useState(CAREER_IMAGES);
  const [imageLinks, setImageLinks] = useState({
    psicologia_clinica: '',
    licenciatura_psicologicas: ''
  });
  const [uploading, setUploading] = useState({});
  const [savingLink, setSavingLink] = useState(false);
  const [formState, setFormState] = useState({
    name: CAREER_DATA.psicologia_clinica.name,
    plan: CAREER_DATA.psicologia_clinica.plan,
    duration: CAREER_DATA.psicologia_clinica.duration,
    field: CAREER_DATA.psicologia_clinica.field,
    description: CAREER_DATA.psicologia_clinica.description
  });

  useEffect(() => {
    const fetchImageLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key,value')
          .in('key', ['career_image_psicologia_clinica', 'career_image_licenciatura_psicologicas']);
        if (error) throw error;
        const linkMap = (data || []).reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        setImageLinks({
          psicologia_clinica: linkMap.career_image_psicologia_clinica || '',
          licenciatura_psicologicas: linkMap.career_image_licenciatura_psicologicas || ''
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchImageLinks();
  }, []);

  const handleCareerChange = (value) => {
    setSelectedCareer(value);
    const data = CAREER_DATA[value];
    setFormState({
      name: data.name,
      plan: data.plan,
      duration: data.duration,
      field: data.field,
      description: data.description
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (key, file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const { path } = careerImages[key];
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        upsert: true,
        cacheControl: '0'
      });
      if (error) throw error;
      const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      setCareerImages((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          src: publicUrl
        }
      }));
      window.dispatchEvent(new Event('assets-updated'));
      toast.success('Imagen de carrera actualizada en Supabase.');
    } catch (error) {
      toast.error('No se pudo subir la imagen de la carrera.');
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleLinkChange = (event) => {
    const { value } = event.target;
    setImageLinks((prev) => ({ ...prev, [selectedCareer]: value }));
  };

  const handleUseUploadedImage = async () => {
    setImageLinks((prev) => ({ ...prev, [selectedCareer]: '' }));
    await handleSaveLink('');
  };

  const handleSaveLink = async (overrideValue) => {
    setSavingLink(true);
    const rawValue = overrideValue !== undefined ? overrideValue : imageLinks[selectedCareer];
    const trimmedLink = rawValue?.trim() || '';
    const settingKey =
      selectedCareer === 'psicologia_clinica'
        ? 'career_image_psicologia_clinica'
        : 'career_image_licenciatura_psicologicas';

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .update({ value: trimmedLink })
        .eq('key', settingKey)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase.from('site_settings').insert([
          {
            key: settingKey,
            value: trimmedLink
          }
        ]);
        if (insertError) throw insertError;
      }
      window.dispatchEvent(new Event('assets-updated'));
      toast.success('Enlace de imagen actualizado.');
    } catch (error) {
      toast.error('No se pudo guardar el enlace de la imagen.');
      console.error(error);
    } finally {
      setSavingLink(false);
    }
  };

  const handleSave = () => {
    toast.success('Contenido actualizado. (Los cambios se guardan en esta sesión)');
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
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editar contenidos de carreras</CardTitle>
              <CardDescription>Actualiza textos y descripciones visibles en la página pública.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Carrera</label>
                <select
                  value={selectedCareer}
                  onChange={(event) => handleCareerChange(event.target.value)}
                  className="w-full h-11 rounded-lg border px-3"
                  data-testid="career-content-select"
                >
                  {careerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Fotografía de la carrera</p>
                    <p className="text-xs text-slate-500">
                      Puedes subir una imagen al bucket o usar un enlace externo.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <img
                      src={imageLinks[selectedCareer] || careerImages[selectedCareer]?.src}
                      alt={careerImages[selectedCareer]?.alt || 'Imagen de la carrera'}
                      className="w-full h-48 rounded-xl object-cover border"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Subir nueva imagen (Supabase)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleImageUpload(selectedCareer, event.target.files?.[0])}
                        className="w-full text-sm"
                        data-testid={`career-image-file-${selectedCareer}`}
                        disabled={uploading[selectedCareer]}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Se guarda en el bucket <span className="font-semibold">{STORAGE_BUCKET}</span> bajo{' '}
                        <span className="font-semibold">{careerImages[selectedCareer]?.path}</span>.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Enlace externo</label>
                      <div className="relative">
                        <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="https://..."
                          value={imageLinks[selectedCareer]}
                          onChange={handleLinkChange}
                          className="w-full h-11 rounded-lg border px-10"
                          data-testid={`career-image-link-${selectedCareer}`}
                        />
                      </div>
                      <div className="mt-3 flex flex-col sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleUseUploadedImage}
                          data-testid={`career-image-reset-${selectedCareer}`}
                        >
                          <ImagePlus className="w-4 h-4 mr-2" /> Usar imagen subida
                        </Button>
                        <Button
                          type="button"
                          className="w-full"
                          onClick={handleSaveLink}
                          disabled={savingLink}
                          data-testid={`career-image-save-${selectedCareer}`}
                        >
                          <Save className="w-4 h-4 mr-2" /> Guardar enlace
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nombre de la carrera</label>
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className="w-full h-11 rounded-lg border px-3"
                  data-testid="career-content-name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Modalidad / Plan</label>
                  <input
                    name="plan"
                    value={formState.plan}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg border px-3"
                    data-testid="career-content-plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duración</label>
                  <input
                    name="duration"
                    value={formState.duration}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg border px-3"
                    data-testid="career-content-duration"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleChange}
                  className="w-full min-h-[120px] rounded-lg border px-3 py-2"
                  data-testid="career-content-description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Campo laboral</label>
                <textarea
                  name="field"
                  value={formState.field}
                  onChange={handleChange}
                  className="w-full min-h-[120px] rounded-lg border px-3 py-2"
                  data-testid="career-content-field"
                />
              </div>

              <Button className="w-full" onClick={handleSave} data-testid="career-content-save">
                <Save className="w-4 h-4 mr-2" /> Guardar cambios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
