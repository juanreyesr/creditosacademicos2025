import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CAMPUS_IMAGES, STORAGE_BUCKET, buildPublicUrl } from '@/lib/siteContent';
import { supabase } from '@/lib/supabaseClient';

export default function CampusPhotos() {
  const navigate = useNavigate();
  const [campusImages, setCampusImages] = useState(CAMPUS_IMAGES);
  const [uploading, setUploading] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampusGallery = async () => {
      try {
        const { data, error } = await supabase
          .from('campus_gallery')
          .select('id,image_path,alt_text,sort_order')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) {
          setCampusImages([...CAMPUS_IMAGES]);
          return;
        }
        setCampusImages(
          data.map((image, index) => ({
            id: image.id,
            src: image.image_path ? buildPublicUrl(image.image_path) : '',
            alt: image.alt_text || `Imagen del campus ${index + 1}`,
            path: image.image_path || '',
            sortOrder: image.sort_order ?? index + 1
          }))
        );
      } catch (error) {
        console.error(error);
        setCampusImages([...CAMPUS_IMAGES]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampusGallery();
  }, []);

  const buildStoragePath = (file) => {
    const extension = file.name.split('.').pop() || 'jpg';
    const id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `campus/${id}.${extension.toLowerCase()}`;
  };

  const uploadCampusImage = async (file) => {
    const path = buildStoragePath(file);
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      upsert: true,
      cacheControl: '0'
    });
    if (error) throw error;
    const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    return { path, publicUrl };
  };

  const handleFileChange = async (id, file) => {
    if (!file) return;
    const image = campusImages.find((entry) => entry.id === id);
    if (!image) return;
    setUploading((prev) => ({ ...prev, [id]: true }));
    try {
      const { path, publicUrl } = await uploadCampusImage(file);
      const { error } = await supabase
        .from('campus_gallery')
        .update({ image_path: path })
        .eq('id', id);
      if (error) throw error;
      if (image.path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([image.path]);
      }
      setCampusImages((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, src: publicUrl, path } : entry))
      );
      window.dispatchEvent(new Event('assets-updated'));
      toast.success('Foto de campus actualizada en Supabase.');
    } catch (error) {
      toast.error(`No se pudo subir la imagen. ${error?.message || ''}`.trim());
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleAddImage = async (file) => {
    if (!file) return;
    const tempId = `new-${Date.now()}`;
    setUploading((prev) => ({ ...prev, [tempId]: true }));
    try {
      const { path, publicUrl } = await uploadCampusImage(file);
      const nextOrder =
        campusImages.length > 0
          ? Math.max(...campusImages.map((entry) => entry.sortOrder || 0)) + 1
          : 1;
      const { data, error } = await supabase
        .from('campus_gallery')
        .insert([{ image_path: path, alt_text: 'Imagen del campus', sort_order: nextOrder }])
        .select('id,image_path,alt_text,sort_order')
        .single();
      if (error) throw error;
      setCampusImages((prev) => [
        ...prev,
        {
          id: data.id,
          src: data.image_path ? buildPublicUrl(data.image_path) : publicUrl,
          alt: data.alt_text || 'Imagen del campus',
          path: data.image_path || path,
          sortOrder: data.sort_order ?? nextOrder
        }
      ]);
      window.dispatchEvent(new Event('assets-updated'));
      toast.success('Nueva foto de campus agregada.');
    } catch (error) {
      toast.error(`No se pudo agregar la imagen. ${error?.message || ''}`.trim());
      console.error(error);
    } finally {
      setUploading((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
    }
  };

  const handleDelete = async (id) => {
    const image = campusImages.find((entry) => entry.id === id);
    if (!image) return;
    setUploading((prev) => ({ ...prev, [id]: true }));
    try {
      const { error } = await supabase.from('campus_gallery').delete().eq('id', id);
      if (error) throw error;
      if (image.path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([image.path]);
      }
      setCampusImages((prev) => prev.filter((entry) => entry.id !== id));
      window.dispatchEvent(new Event('assets-updated'));
      toast.success('Imagen eliminada.');
    } catch (error) {
      toast.error(`No se pudo eliminar la imagen. ${error?.message || ''}`.trim());
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSeedDefaults = async () => {
    setUploading((prev) => ({ ...prev, seed: true }));
    try {
      const { data: existing, error: existingError } = await supabase
        .from('campus_gallery')
        .select('id')
        .limit(1);
      if (existingError) throw existingError;
      if (existing && existing.length > 0) {
        toast.message('Ya existen imágenes cargadas.');
        return;
      }
      const payload = CAMPUS_IMAGES.map((image, index) => ({
        image_path: image.path,
        alt_text: image.alt,
        sort_order: index + 1
      }));
      const { error } = await supabase.from('campus_gallery').insert(payload);
      if (error) throw error;
      setCampusImages([...CAMPUS_IMAGES].map((image, index) => ({ ...image, sortOrder: index + 1 })));
      window.dispatchEvent(new Event('assets-updated'));
      toast.success('Imágenes actuales registradas en Supabase.');
    } catch (error) {
      toast.error(`No se pudo registrar las imágenes. ${error?.message || ''}`.trim());
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, seed: false }));
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
              <CardTitle>Galería del campus</CardTitle>
              <CardDescription>Administra las fotografías que se muestran en el botón "Conoce nuestro campus".</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 rounded-xl border border-dashed border-slate-200 p-4">
                <p className="text-sm text-slate-600 font-medium">Agregar nueva foto</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleAddImage(event.target.files?.[0])}
                  className="w-full text-sm"
                  disabled={uploading.seed}
                  data-testid="campus-add-file"
                />
                <p className="text-xs text-slate-500">
                  Las nuevas imágenes se guardan en Supabase con un nombre único para evitar cacheo.
                </p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleSeedDefaults}
                  disabled={uploading.seed || loading}
                  data-testid="campus-seed-button"
                >
                  <ImagePlus className="w-4 h-4 mr-2" /> Registrar imágenes actuales
                </Button>
                <p className="text-xs text-slate-500">
                  Usa este botón una sola vez si todavía no has creado registros en Supabase.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {campusImages.map((image) => (
                  <div key={image.id} className="rounded-xl border p-3 space-y-3">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-36 object-cover rounded-lg"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFileChange(image.id, event.target.files?.[0])}
                      className="w-full text-sm"
                      data-testid={`campus-file-${image.id}`}
                      disabled={uploading[image.id]}
                    />
                    {image.path && (
                      <p className="text-xs text-slate-500">
                        Se guarda en el bucket <span className="font-semibold">{STORAGE_BUCKET}</span> bajo{' '}
                        <span className="font-semibold">{image.path}</span>.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDelete(image.id)}
                      disabled={uploading[image.id]}
                      data-testid={`campus-delete-${image.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="w-full" disabled data-testid="campus-save-button">
                <ImagePlus className="w-4 h-4 mr-2" /> Guardado automático
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
