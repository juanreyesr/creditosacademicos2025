import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO } from "@/const";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  Clock, 
  FileText,
  Award,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CursoDetalle() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/curso/:id");
  const cursoId = params?.id ? parseInt(params.id) : null;
  
  const { agremiado, isLoading: authLoading } = useAgremiadoAuth();
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const { data: cursoData, isLoading: cursoLoading } = trpc.cursos.getWithProgress.useQuery(
    { cursoId: cursoId! },
    { enabled: !!cursoId && !!agremiado }
  );

  const { data: evaluacionData } = trpc.evaluaciones.getByCurso.useQuery(
    { cursoId: cursoId! },
    { enabled: !!cursoId && !!agremiado }
  );

  useEffect(() => {
    if (!authLoading && !agremiado) {
      setLocation("/login");
    }
  }, [agremiado, authLoading, setLocation]);

  useEffect(() => {
    if (cursoData?.videos && cursoData.videos.length > 0 && !selectedVideoId) {
      setSelectedVideoId(cursoData.videos[0].id);
    }
  }, [cursoData, selectedVideoId]);

  if (authLoading || !agremiado || cursoLoading || !cursoData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { curso, progreso, videos } = cursoData;
  const selectedVideo = videos.find(v => v.id === selectedVideoId);
  const porcentajeCompletado = progreso?.porcentajeCompletado || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/cursos">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
            <div className="flex-1">
              <h1 className="text-lg font-bold line-clamp-1">{curso.titulo}</h1>
              <p className="text-sm text-muted-foreground">Progreso: {porcentajeCompletado}%</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                {selectedVideo ? (
                  <div className="aspect-video bg-black">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${selectedVideo.youtubeVideoId}`}
                      title={selectedVideo.titulo}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Play className="h-24 w-24 text-white opacity-50" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Info */}
            {selectedVideo && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedVideo.titulo}</CardTitle>
                  {selectedVideo.descripcion && (
                    <CardDescription>{selectedVideo.descripcion}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            )}

            {/* Course Info Tabs */}
            <Tabs defaultValue="descripcion">
              <TabsList className="w-full">
                <TabsTrigger value="descripcion" className="flex-1">Descripción</TabsTrigger>
                <TabsTrigger value="contenido" className="flex-1">Contenido</TabsTrigger>
                {evaluacionData && (
                  <TabsTrigger value="evaluacion" className="flex-1">Evaluación</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="descripcion">
                <Card>
                  <CardHeader>
                    <CardTitle>Acerca de este curso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{curso.descripcion}</p>
                    
                    <div className="flex flex-wrap gap-4">
                      {curso.duracionMinutos && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {Math.floor(curso.duracionMinutos / 60)}h {curso.duracionMinutos % 60}m
                          </span>
                        </div>
                      )}
                      {curso.nivel && (
                        <Badge variant="outline">
                          {curso.nivel === "basico" ? "Básico" : curso.nivel === "intermedio" ? "Intermedio" : "Avanzado"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contenido">
                <Card>
                  <CardHeader>
                    <CardTitle>Contenido del curso</CardTitle>
                    <CardDescription>{videos.length} videos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {videos.map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => setSelectedVideoId(video.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            selectedVideoId === video.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium line-clamp-1">{video.titulo}</h4>
                              {video.descripcion && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {video.descripcion}
                                </p>
                              )}
                              {video.duracionSegundos && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Math.floor(video.duracionSegundos / 60)} minutos
                                </p>
                              )}
                            </div>
                            {selectedVideoId === video.id && (
                              <Play className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {evaluacionData && (
                <TabsContent value="evaluacion">
                  <Card>
                    <CardHeader>
                      <CardTitle>{evaluacionData.evaluacion.titulo}</CardTitle>
                      <CardDescription>{evaluacionData.evaluacion.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Puntaje mínimo</p>
                          <p className="text-2xl font-bold">{evaluacionData.evaluacion.puntajeMinimo}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Intentos restantes</p>
                          <p className="text-2xl font-bold">{evaluacionData.intentosRestantes}</p>
                        </div>
                      </div>

                      {evaluacionData.intentos.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Historial de intentos</h4>
                          {evaluacionData.intentos.map((intento) => (
                            <div
                              key={intento.id}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div>
                                <p className="font-medium">Intento {intento.numeroIntento}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(intento.fechaIntento).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">{intento.puntajeObtenido}%</p>
                                {intento.aprobado ? (
                                  <Badge className="bg-green-500">Aprobado</Badge>
                                ) : (
                                  <Badge variant="destructive">Reprobado</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {evaluacionData.intentosRestantes > 0 ? (
                        <Link href={`/evaluacion/${evaluacionData.evaluacion.id}`}>
                          <Button className="w-full" size="lg">
                            <FileText className="mr-2 h-4 w-4" />
                            Realizar Evaluación
                          </Button>
                        </Link>
                      ) : (
                        <p className="text-center text-muted-foreground">
                          Has agotado todos los intentos disponibles
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar - Progress & Actions */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tu Progreso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completado</span>
                    <span className="text-sm font-bold">{porcentajeCompletado}%</span>
                  </div>
                  <Progress value={porcentajeCompletado} className="h-2" />
                </div>

                {progreso?.completado ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Curso completado</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Completa todos los videos y aprueba la evaluación
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/diplomas">
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="mr-2 h-4 w-4" />
                    Ver Mis Diplomas
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Catálogo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
