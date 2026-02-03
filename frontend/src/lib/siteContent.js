import { supabase } from '@/lib/supabaseClient';

export const STORAGE_BUCKET = 'site-assets';
export const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/GA4NmhTPbUFmdARf9';

export const buildPublicUrl = (path) =>
  supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;

export const PENSUM_IMAGES = {
  psicologia_clinica: {
    title: 'Psicología Clínica y Consejería Social',
    path: 'pensum/pensum-psicologia-clinica.png',
    src: buildPublicUrl('pensum/pensum-psicologia-clinica.png'),
    alt: 'Pensum de Psicología Clínica y Consejería Social'
  },
  licenciatura_psicologicas: {
    title: 'Licenciatura en Ciencias Psicológicas',
    path: 'pensum/pensum-ciencias-psicologicas.png',
    src: buildPublicUrl('pensum/pensum-ciencias-psicologicas.png'),
    alt: 'Pensum de Licenciatura en Ciencias Psicológicas'
  }
};

export const CAMPUS_IMAGES = [
  {
    id: 'campus-hero',
    path: 'campus/campus-hero.jpg',
    src: buildPublicUrl('campus/campus-hero.jpg'),
    alt: 'Entrada principal del Campus UPANA Chimaltenango'
  },
  {
    id: 'campus-biblioteca',
    path: 'campus/campus-biblioteca.jpg',
    src: buildPublicUrl('campus/campus-biblioteca.jpg'),
    alt: 'Biblioteca y áreas de estudio del campus'
  },
  {
    id: 'campus-areas-verdes',
    path: 'campus/campus-areas-verdes.jpg',
    src: buildPublicUrl('campus/campus-areas-verdes.jpg'),
    alt: 'Áreas verdes y espacios abiertos del campus'
  }
];

export const CAREER_IMAGES = {
  psicologia_clinica: {
    title: 'Psicología Clínica y Consejería Social',
    path: 'careers/psicologia-clinica.jpg',
    src: buildPublicUrl('careers/psicologia-clinica.jpg'),
    alt: 'Estudiantes en Psicología Clínica y Consejería Social'
  },
  licenciatura_psicologicas: {
    title: 'Licenciatura en Ciencias Psicológicas',
    path: 'careers/licenciatura-ciencias-psicologicas.jpg',
    src: buildPublicUrl('careers/licenciatura-ciencias-psicologicas.jpg'),
    alt: 'Estudiantes en Licenciatura en Ciencias Psicológicas'
  }
};

export const MAP_IMAGE = {
  path: 'mapa.jpg',
  src: buildPublicUrl('mapa.jpg'),
  alt: 'Mapa del Campus UPANA Chimaltenango'
};
