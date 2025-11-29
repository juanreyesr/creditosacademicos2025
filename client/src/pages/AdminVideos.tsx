import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO } from "@/const";
import { 
  ArrowLeft, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Play,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminVideos() {
  const params = useParams();
  const cursoId = parseInt(params.id as string);
  const [, setLocation] = useLocation();
  const { agremiado, isLoading: authLoading } = useAgremiadoAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<any>(null);

  const { data: curso } = trpc.cursos.getById.useQuery({ id: cursoId });
  const { data: videos, isLoading: videosLoading, refetch } = trpc.videos.getByCurso.useQuery({ cursoId });

  const createMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Video creado exitosamente");
      setDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.videos.update.useMutation({
    onSuccess: () => {
      toast.success("Video actualizado exitosamente");
      setDialogOpen(false);
      setEditingVideo(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      toast.success("Video eliminado exitosamente");
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleActivoMutation = trpc.videos.toggleActivo.useMutation({
    onSuccess: () => {
      toast.success("Estado del video actualizado");
      refetch();
    },
  });

  const reorderMutation = trpc.videos.reorder.useMutation({
    onSuccess: () => {
      toast.success("Orden actualizado");
      refetch();
    },
  });

  useEffect(() => {
    if (!authLoading && !agremiado) {
      setLocation("/login");
    } else if (agremiado && agremiado.role !== "superadministrador" && agremiado.role !== "administrador") {
      setLocation("/dashboard");
      toast.error("No tienes permisos para acceder a esta página");
    }
  }, [agremiado, authLoading, setLocation]);

  if (authLoading || !agremiado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      cursoId,
      titulo: formData.get("titulo") as string,
      descripcion: formData.get("descripcion") as string || undefined,
      youtubeUrl: formData.get("youtubeUrl") as string,
      duracionMinutos: parseInt(formData.get("duracionMinutos") as string) || undefined,
      orden: parseInt(formData.get("orden") as string) || 1,
    };

    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (video: any) => {
    setEditingVideo(video);
    setDialogOpen(true);
  };

  const handleDelete = (video: any) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      deleteMutation.mutate({ id: videoToDelete.id });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVideo(null);
  };

  const handleReorder = (videoId: number, direction: "up" | "down") => {
    if (!videos) return;
    
    const currentIndex = videos.findIndex((v: any) => v.id === videoId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= videos.length) return;
    
    reorderMutation.mutate({
      videoId,
      newOrden: videos[newIndex].orden,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/cursos">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold">Gestión de Videos</h1>
                <p className="text-sm text-muted-foreground">{curso?.titulo || "Cargando..."}</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingVideo(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Video
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingVideo ? "Editar Video" : "Agregar Nuevo Video"}</DialogTitle>
                  <DialogDescription>
                    Complete los datos del video de YouTube
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título del Video *</Label>
                    <Input
                      id="titulo"
                      name="titulo"
                      defaultValue={editingVideo?.titulo}
                      required
                      placeholder="Ej: Introducción al tema"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">URL de YouTube *</Label>
                    <Input
                      id="youtubeUrl"
                      name="youtubeUrl"
                      defaultValue={editingVideo?.youtubeVideoId ? `https://www.youtube.com/watch?v=${editingVideo.youtubeVideoId}` : ""}
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Puede ser formato: youtube.com/watch?v=ID o youtu.be/ID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      name="descripcion"
                      defaultValue={editingVideo?.descripcion}
                      rows={3}
                      placeholder="Descripción breve del contenido del video"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duracionMinutos">Duración (minutos)</Label>
                      <Input
                        id="duracionMinutos"
                        name="duracionMinutos"
                        type="number"
                        defaultValue={editingVideo?.duracionSegundos ? Math.round(editingVideo.duracionSegundos / 60) : ""}
                        placeholder="45"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orden">Orden</Label>
                      <Input
                        id="orden"
                        name="orden"
                        type="number"
                        defaultValue={editingVideo?.orden || (videos?.length || 0) + 1}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingVideo ? "Actualizar" : "Crear"} Video
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {videosLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="space-y-4">
            {videos.map((video: any, index: number) => (
              <Card key={video.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {video.orden}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{video.titulo}</h3>
                          {video.descripcion && (
                            <p className="text-sm text-muted-foreground mt-1">{video.descripcion}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>🎬 YouTube</span>
                            {video.duracionSegundos && <span>⏱️ {Math.round(video.duracionSegundos / 60)} min</span>}
                            <Badge variant={video.activo ? "default" : "secondary"}>
                              {video.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeVideoId}`, "_blank")}
                            title="Ver en YouTube"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleReorder(video.id, "up")}
                            disabled={index === 0 || reorderMutation.isPending}
                            title="Subir"
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleReorder(video.id, "down")}
                            disabled={index === videos.length - 1 || reorderMutation.isPending}
                            title="Bajar"
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant={video.activo ? "default" : "secondary"}
                            onClick={() => toggleActivoMutation.mutate({ id: video.id, activo: !video.activo })}
                            title={video.activo ? "Desactivar" : "Activar"}
                          >
                            {video.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(video)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDelete(video)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>No hay videos registrados</CardTitle>
              <CardDescription>Agrega el primer video para este curso</CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar video?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el video "{videoToDelete?.titulo}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
