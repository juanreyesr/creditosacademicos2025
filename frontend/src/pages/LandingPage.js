import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Shield, Microscope, ParkingCircle, Phone, MapPin, Brain, BookOpen, Users, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { CAMPUS_IMAGES, CAREER_IMAGES, GOOGLE_MAPS_LINK, MAP_IMAGE, PENSUM_IMAGES, buildPublicUrl } from '@/lib/siteContent';

export default function LandingPage() {
  const [pensumOpen, setPensumOpen] = useState(false);
  const [campusOpen, setCampusOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [pensumImages, setPensumImages] = useState(PENSUM_IMAGES);
  const [campusImages, setCampusImages] = useState(CAMPUS_IMAGES);
  const [careerImages, setCareerImages] = useState(CAREER_IMAGES);
  const [careerImageLinks, setCareerImageLinks] = useState({});
  const mapLink = GOOGLE_MAPS_LINK;
  const [selectedPensum, setSelectedPensum] = useState({
    ...PENSUM_IMAGES.psicologia_clinica,
    key: 'psicologia_clinica'
  });

  useEffect(() => {
    const fetchSettings = async () => {
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
        setCareerImageLinks({
          psicologia_clinica: linkMap.career_image_psicologia_clinica || '',
          licenciatura_psicologicas: linkMap.career_image_licenciatura_psicologicas || ''
        });
      } catch (error) {
        console.error(error);
      }
    };

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
      }
    };

    const refreshContent = () => {
      setPensumImages({ ...PENSUM_IMAGES });
      setCareerImages({ ...CAREER_IMAGES });
      setCacheBuster(Date.now());
      setSelectedPensum((prev) => PENSUM_IMAGES[prev?.key] || PENSUM_IMAGES.psicologia_clinica);
      fetchSettings();
      fetchCampusGallery();
    };

    window.addEventListener('assets-updated', refreshContent);
    fetchSettings();
    fetchCampusGallery();
    return () => window.removeEventListener('assets-updated', refreshContent);
  }, []);

  const withCacheBust = (url) => `${url}${url.includes('?') ? '&' : '?'}v=${cacheBuster}`;
  const resolveCareerImage = (key) => careerImageLinks[key] || careerImages[key]?.src || '';

  const handlePensumOpen = (key) => {
    setSelectedPensum({ ...pensumImages[key], key });
    setPensumOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://customer-assets.emergentagent.com/job_psych-coordinator/artifacts/easr21va_20181124_101457.jpg"
            alt="Campus UPANA Chimaltenango"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" data-testid="hero-title">
            Estudia Psicología en UPANA
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Campus Chimaltenango - Formando profesionales con excelencia académica y valores
          </p>
          <Button 
            size="lg" 
            className="bg-secondary hover:bg-secondary/90 text-white h-14 px-10 rounded-full text-lg shadow-2xl hover:shadow-xl transition-all duration-300"
            data-testid="cta-register-button"
            onClick={() => window.open('https://inscripciones.upana.edu.gt', '_blank')}
          >
            Inscríbete Hoy
          </Button>
        </div>
      </section>

      {/* Campus Benefits */}
      <section className="py-16 md:py-24 container mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" data-testid="benefits-title">
          ¿Por qué estudiar en Campus Chimaltenango?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1" data-testid="benefit-building">
            <CardHeader>
              <Building2 className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Edificio Propio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Instalaciones modernas y completamente equipadas para tu formación profesional.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1" data-testid="benefit-security">
            <CardHeader>
              <Shield className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Seguridad 24/7</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Tu tranquilidad es nuestra prioridad con vigilancia permanente.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1" data-testid="benefit-labs">
            <CardHeader>
              <Microscope className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Laboratorios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Acceso permanente a laboratorios especializados para prácticas.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1" data-testid="benefit-parking">
            <CardHeader>
              <ParkingCircle className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Parque Gratuito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Estacionamiento sin costo para todos nuestros estudiantes.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 md:col-span-2" data-testid="benefit-contact">
            <CardHeader>
              <Phone className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Contacto Directo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Comunícate con nosotros fácilmente:</p>
              <div className="space-y-2">
                <p className="font-medium">📞 Teléfono: 78394716</p>
                <p className="font-medium">💬 WhatsApp Coordinador: 41850352</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 md:col-span-3" data-testid="benefit-location">
            <CardHeader>
              <MapPin className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">3 ave. de las flores 7-62 zona 1, Chimaltenango</p>
              <div className="flex flex-col md:flex-row gap-3">
                <Button
                  variant="outline"
                  className="w-full md:w-auto border-primary text-primary hover:bg-primary/10"
                  onClick={() => setMapOpen(true)}
                  data-testid="location-map-button"
                >
                  Ver mapa
                </Button>
                <Button
                  className="w-full md:w-auto bg-secondary text-white hover:bg-secondary/90"
                  onClick={() => window.open(mapLink, '_blank')}
                  data-testid="location-link-button"
                >
                  Abrir en Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            className="bg-primary text-white hover:bg-primary/90 h-12 px-8 rounded-full shadow-lg"
            onClick={() => setCampusOpen(true)}
            data-testid="campus-gallery-button"
          >
            Conoce nuestro campus
          </Button>
        </div>
      </section>

      {/* Careers Section */}
      <section className="py-16 md:py-24 bg-gradient-to-tr from-secondary/10 to-primary/5">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" data-testid="careers-title">
            Nuestras Carreras
          </h2>
          <p className="text-center text-slate-600 mb-8">
            Elige entre nuestras 2 licenciaturas en psicología, campus Chimaltenango.
          </p>

          <Tabs defaultValue="psicologia_clinica" className="w-full" data-testid="careers-tabs">
            <TabsList className="flex w-full max-w-2xl mx-auto flex-col gap-3 bg-transparent p-0 h-auto mb-8">
              <TabsTrigger
                value="psicologia_clinica"
                className="w-full whitespace-normal py-3 text-base text-center rounded-2xl bg-white/80 shadow-sm data-[state=active]:bg-white"
                data-testid="tab-psicologia-clinica"
              >
                Psicología clínica y consejería social
              </TabsTrigger>
              <TabsTrigger
                value="licenciatura"
                className="w-full whitespace-normal py-3 text-base text-center rounded-2xl bg-white/80 shadow-sm data-[state=active]:bg-white"
                data-testid="tab-licenciatura"
              >
                Licenciatura en Ciencias Psicológicas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="psicologia_clinica">
              <Card className="max-w-4xl mx-auto relative overflow-hidden bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-xl" data-testid="career-card-clinica">
                <CardHeader>
                  <Brain className="w-16 h-16 text-primary mb-4" />
                  <CardTitle className="text-3xl">Psicología Clínica y Consejería Social</CardTitle>
                  <CardDescription className="text-lg">Plan Sábado - 5 años</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Inversión
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">Inscripción</p>
                        <p className="text-2xl font-bold text-primary">Q.500</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">Mensualidad</p>
                        <p className="text-2xl font-bold text-primary">Q.660</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">Carné</p>
                        <p className="text-2xl font-bold text-primary">Q.100</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">PIAA</p>
                        <p className="text-2xl font-bold text-secondary">Gratis</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Campo Laboral
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      Hospitales, clínicas privadas, instituciones educativas, programas de prevención, 
                      centros de rehabilitación, consultorios psicológicos, proyectos sociales, atención 
                      clínica, consejería social y programas de apoyo comunitario.
                    </p>
                  </div>

                  <img
                    src={withCacheBust(resolveCareerImage('psicologia_clinica'))}
                    alt={careerImages.psicologia_clinica?.alt || 'Psicología Clínica'}
                    className="w-full h-64 object-cover rounded-xl"
                  />

                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10 h-12 rounded-full"
                    onClick={() => handlePensumOpen('psicologia_clinica')}
                    data-testid="pensum-clinica-button"
                  >
                    Mostrar pensum
                  </Button>

                  <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-primary/20 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary">Para inscribirte lo único que necesitas es:</h3>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start gap-3">
                        <span className="text-secondary font-bold">✓</span>
                        <span className="text-slate-700">CUI (DPI o partida de nacimiento)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary font-bold">✓</span>
                        <span className="text-slate-700">Nombre completo</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary font-bold">✓</span>
                        <span className="text-slate-700">Llenar formulario de inscripción (Físico o en línea)</span>
                      </li>
                    </ul>
                    <Button
                      className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 rounded-full text-lg shadow-lg"
                      onClick={() => window.open('https://inscripciones.upana.edu.gt', '_blank')}
                      data-testid="inscribe-clinica-button"
                    >
                      Inscríbete Hoy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="licenciatura">
              <Card className="max-w-4xl mx-auto relative overflow-hidden bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-xl" data-testid="career-card-licenciatura">
                <CardHeader>
                  <BookOpen className="w-16 h-16 text-primary mb-4" />
                  <CardTitle className="text-3xl">Licenciatura en Ciencias Psicológicas</CardTitle>
                  <CardDescription className="text-lg">Plan Diario - 4 años</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Inversión
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">Inscripción</p>
                        <p className="text-2xl font-bold text-primary">Q.500</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">Mensualidad</p>
                        <p className="text-2xl font-bold text-primary">Q.570</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">Carné</p>
                        <p className="text-2xl font-bold text-primary">Q.100</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm text-slate-600">PIAA</p>
                        <p className="text-2xl font-bold text-secondary">Gratis</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Campo Laboral
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      Investigación, docencia, consultoría organizacional, recursos humanos, desarrollo 
                      comunitario y atención psicológica general.
                    </p>
                  </div>

                  <img
                    src={withCacheBust(resolveCareerImage('licenciatura_psicologicas'))}
                    alt={careerImages.licenciatura_psicologicas?.alt || 'Licenciatura Ciencias Psicológicas'}
                    className="w-full h-64 object-cover rounded-xl"
                  />

                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10 h-12 rounded-full"
                    onClick={() => handlePensumOpen('licenciatura_psicologicas')}
                    data-testid="pensum-licenciatura-button"
                  >
                    Mostrar pensum
                  </Button>

                  <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-primary/20 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary">Para inscribirte lo único que necesitas es:</h3>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start gap-3">
                        <span className="text-secondary font-bold">✓</span>
                        <span className="text-slate-700">CUI (DPI o partida de nacimiento)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary font-bold">✓</span>
                        <span className="text-slate-700">Nombre completo</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-secondary font-bold">✓</span>
                        <span className="text-slate-700">Llenar formulario de inscripción (Físico o en línea)</span>
                      </li>
                    </ul>
                    <Button
                      className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 rounded-full text-lg shadow-lg"
                      onClick={() => window.open('https://inscripciones.upana.edu.gt', '_blank')}
                      data-testid="inscribe-licenciatura-button"
                    >
                      Inscríbete Hoy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para Iniciar tu Carrera?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Visita nuestra página de inscripciones y da el primer paso hacia tu futuro profesional
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 h-14 px-10 rounded-full text-lg shadow-2xl"
            onClick={() => window.open('https://inscripciones.upana.edu.gt', '_blank')}
            data-testid="cta-inscription-button"
          >
            Ir a Inscripciones
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-slate-400">© 2026 Universidad Panamericana - Campus Chimaltenango</p>
              <p className="text-sm text-slate-400">Sistema de Gestión de Leads</p>
            </div>
            <div className="flex gap-6 items-center">
              <a 
                href="/admin/login" 
                className="text-sm text-slate-400 hover:text-white transition-colors"
                data-testid="admin-access-link"
              >
                Acceso Administrador
              </a>
              <div className="text-sm text-slate-400">
                <p>Tel: 78394716</p>
                <p>WhatsApp: 41850352</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={pensumOpen} onOpenChange={setPensumOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pensum de Estudios - {selectedPensum?.title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <img
              src={withCacheBust(selectedPensum?.src || '')}
              alt={selectedPensum?.alt}
              className="w-full h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={campusOpen} onOpenChange={setCampusOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Conoce nuestro campus</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campusImages.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-xl border border-slate-200">
                <img src={withCacheBust(image.src)} alt={image.alt} className="w-full h-56 object-cover" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Mapa del campus</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <img src={withCacheBust(MAP_IMAGE.src)} alt={MAP_IMAGE.alt} className="w-full h-auto" />
          </div>
          <Button
            className="w-full bg-secondary text-white hover:bg-secondary/90"
            onClick={() => window.open(mapLink, '_blank')}
          >
            Abrir en Google Maps
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
