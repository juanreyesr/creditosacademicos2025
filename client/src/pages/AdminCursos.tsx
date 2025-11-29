import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO } from "@/const";
import { 
  ArrowLeft, 
  Plus,
  Edit,
  Trash2,
  Video,
  FileQuestion,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCursos() {
  const [, setLocation] = useLocation();
  const { agremiado, isLoading: authLoading } = useAgremiadoAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cursoToDelete, setCursoToDelete] = useState<any>(null);

  const { data: cursos, isLoading: cursosLoading, refetch } = trpc.cursos.getAll.useQuery();
  const { data: categorias } = trpc.categorias.getAll.useQuery();

  const createMutation = trpc.cursos.create.useMutation({
    onSuccess: () => {
      toast.success("Curso creado exitosamente");
      setDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.cursos.update.useMutation({
    onSuccess: () => {
      toast.success("Curso actualizado exitosamente");
      setDialogOpen(false);
      setEditingCurso(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.cursos.delete.useMutation({
    onSuccess: () => {
      toast.success("Curso eliminado exitosamente");
      setDeleteDialogOpen(false);
      setCursoToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleActivoMutation = trpc.cursos.toggleActivo.useMutation({
    onSuccess: () => {
      toast.success("Estado del curso actualizado");
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
      titulo: formData.get("titulo") as string,
      descripcion: formData.get("descripcion") as string,
      categoriaId: parseInt(formData.get("categoriaId") as string),
      duracionMinutos: parseInt(formData.get("duracionMinutos") as string) || undefined,
      nivel: formData.get("nivel") as "basico" | "intermedio" | "avanzado",
      orden: parseInt(formData.get("orden") as string) || 1,
    };

    if (editingCurso) {
      updateMutation.mutate({ id: editingCurso.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (curso: any) => {
    setEditingCurso(curso);
    setDialogOpen(true);
  };

  const handleDelete = (curso: any) => {
    setCursoToDelete(curso);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (cursoToDelete) {
      deleteMutation.mutate({ id: cursoToDelete.id });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCurso(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold">Gestión de Cursos</h1>
                <p className="text-sm text-muted-foreground">Administrar contenido educativo</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCurso(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Curso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCurso ? "Editar Curso" : "Crear Nuevo Curso"}</DialogTitle>
                  <DialogDescription>
                    Complete los datos del curso
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título del Curso *</Label>
                    <Input
                      id="titulo"
                      name="titulo"
                      defaultValue={editingCurso?.titulo}
                      required
                      placeholder="Ej: Introducción a la Terapia Cognitivo-Conductual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción *</Label>
                    <Textarea
                      id="descripcion"
                      name="descripcion"
                      defaultValue={editingCurso?.descripcion}
                      required
                      rows={4}
                      placeholder="Describe el contenido y objetivos del curso"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoriaId">Categoría *</Label>
                      <Select name="categoriaId" defaultValue={editingCurso?.categoriaId?.toString()} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias?.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nivel">Nivel *</Label>
                      <Select name="nivel" defaultValue={editingCurso?.nivel || "basico"} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="intermedio">Intermedio</SelectItem>
                          <SelectItem value="avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duracionMinutos">Duración (minutos)</Label>
                      <Input
                        id="duracionMinutos"
                        name="duracionMinutos"
                        type="number"
                        defaultValue={editingCurso?.duracionMinutos}
                        placeholder="120"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orden">Orden</Label>
                      <Input
                        id="orden"
                        name="orden"
                        type="number"
                        defaultValue={editingCurso?.orden || 1}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingCurso ? "Actualizar" : "Crear"} Curso
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {cursosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : cursos && cursos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso: any) => (
              <Card key={curso.id} className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="icon"
                      variant={curso.activo ? "default" : "secondary"}
                      className="h-8 w-8"
                      onClick={() => toggleActivoMutation.mutate({ id: curso.id, activo: !curso.activo })}
                    >
                      {curso.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  <h3 className="text-white font-bold text-center px-4 line-clamp-2">{curso.titulo}</h3>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{curso.titulo}</CardTitle>
                    <Badge variant={curso.activo ? "default" : "secondary"}>
                      {curso.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{curso.descripcion}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nivel:</span>
                    <Badge variant="outline" className="capitalize">{curso.nivel}</Badge>
                  </div>

                  {curso.duracionMinutos && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duración:</span>
                      <span>{Math.floor(curso.duracionMinutos / 60)}h {curso.duracionMinutos % 60}m</span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(curso)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/cursos/${curso.id}/videos`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Video className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/cursos/${curso.id}/evaluacion`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <FileQuestion className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(curso)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>No hay cursos registrados</CardTitle>
              <CardDescription>Crea el primer curso para comenzar</CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar curso?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el curso "{cursoToDelete?.titulo}" y todo su contenido asociado (videos, evaluaciones, etc.).
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
