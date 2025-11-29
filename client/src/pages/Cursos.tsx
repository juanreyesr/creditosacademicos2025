import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO } from "@/const";
import { Search, Clock, ArrowLeft, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cursos() {
  const [, setLocation] = useLocation();
  const { agremiado, isLoading: authLoading } = useAgremiadoAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);

  const { data: categorias, isLoading: categoriasLoading } = trpc.categorias.getAll.useQuery();
  const { data: allCursos, isLoading: cursosLoading } = trpc.cursos.getAll.useQuery();

  useEffect(() => {
    if (!authLoading && !agremiado) {
      setLocation("/login");
    }
  }, [agremiado, authLoading, setLocation]);

  if (authLoading || !agremiado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter courses
  const filteredCursos = allCursos?.filter(curso => {
    const matchesSearch = !searchQuery || 
      curso.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      curso.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategoria = !selectedCategoria || curso.categoriaId === selectedCategoria;
    
    return matchesSearch && matchesCategoria;
  });

  // Group courses by category
  const cursosPorCategoria = categorias?.map(categoria => ({
    categoria,
    cursos: filteredCursos?.filter(c => c.categoriaId === categoria.id) || [],
  })).filter(group => group.cursos.length > 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-b from-black to-transparent fixed top-0 left-0 right-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
              <h1 className="text-xl font-bold">Catálogo de Cursos</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar cursos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="pt-24 pb-6 bg-gradient-to-b from-transparent to-black/50">
        <div className="container">
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            <Button
              variant={selectedCategoria === null ? "default" : "outline"}
              onClick={() => setSelectedCategoria(null)}
              className={selectedCategoria === null ? "bg-secondary" : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"}
            >
              Todas las Áreas
            </Button>
            {categorias?.map((categoria) => (
              <Button
                key={categoria.id}
                variant={selectedCategoria === categoria.id ? "default" : "outline"}
                onClick={() => setSelectedCategoria(categoria.id)}
                className={selectedCategoria === categoria.id ? "bg-secondary" : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"}
              >
                {categoria.nombre}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid by Category (Netflix Style) */}
      <main className="container py-8 space-y-12">
        {cursosLoading || categoriasLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48 bg-gray-800" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-48 bg-gray-800" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : cursosPorCategoria && cursosPorCategoria.length > 0 ? (
          cursosPorCategoria.map(({ categoria, cursos }) => (
            <div key={categoria.id} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">{categoria.nombre}</h2>
                {categoria.descripcion && (
                  <p className="text-gray-400 text-sm">{categoria.descripcion}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {cursos.map((curso) => (
                  <Link key={curso.id} href={`/curso/${curso.id}`}>
                    <Card className="course-card bg-gray-900 border-gray-800 hover:border-secondary cursor-pointer overflow-hidden group">
                      <div className="aspect-video bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative overflow-hidden">
                        {curso.imagenUrl ? (
                          <img
                            src={curso.imagenUrl}
                            alt={curso.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-4xl font-bold text-white/20">
                            {curso.titulo.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                          <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base line-clamp-2 text-white">
                          {curso.titulo}
                        </CardTitle>
                        {curso.descripcion && (
                          <CardDescription className="line-clamp-2 text-gray-400">
                            {curso.descripcion}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 flex items-center justify-between">
                        {curso.duracionMinutos && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{Math.floor(curso.duracionMinutos / 60)}h {curso.duracionMinutos % 60}m</span>
                          </div>
                        )}
                        {curso.nivel && (
                          <Badge variant="outline" className="text-xs border-gray-700 text-gray-300">
                            {curso.nivel === "basico" ? "Básico" : curso.nivel === "intermedio" ? "Intermedio" : "Avanzado"}
                          </Badge>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No se encontraron cursos</p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="mt-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
