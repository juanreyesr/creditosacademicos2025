import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  BookOpen, 
  Video, 
  Award, 
  TrendingUp, 
  LogOut, 
  Search,
  Bell,
  User,
  Settings,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { agremiado, isLoading: authLoading, logout } = useAgremiadoAuth();
  
  const { data: categorias, isLoading: categoriasLoading } = trpc.categorias.getAll.useQuery();
  const { data: progreso, isLoading: progresoLoading } = trpc.progreso.getMyCursos.useQuery(undefined, {
    enabled: !!agremiado,
  });
  const { data: diplomas, isLoading: diplomasLoading } = trpc.diplomas.getMy.useQuery(undefined, {
    enabled: !!agremiado,
  });

  useEffect(() => {
    if (!authLoading && !agremiado) {
      setLocation("/login");
    }
  }, [agremiado, authLoading, setLocation]);

  if (authLoading || !agremiado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const isAdmin = agremiado.role === "superadministrador" || agremiado.role === "administrador";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={APP_LOGO} alt="Logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-primary">{APP_TITLE}</h1>
                <p className="text-sm text-muted-foreground">Capacitación Continua</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="default" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Panel Admin
                  </Button>
                </Link>
              )}
              
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{agremiado.nombreCompleto}</p>
                  <p className="text-xs text-muted-foreground">
                    Colegiado: {agremiado.numeroColegiado}
                  </p>
                </div>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-purple-700 text-white rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-2">
            ¡Bienvenido, {agremiado.nombreCompleto.split(" ")[0]}!
          </h2>
          <p className="text-lg opacity-90">
            Continúa tu desarrollo profesional con nuestros cursos y capacitaciones
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos en Progreso</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {progresoLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {progreso?.filter(p => !p.completado).length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {progresoLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {progreso?.filter(p => p.completado).length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diplomas Obtenidos</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {diplomasLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{diplomas?.length || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/cursos">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Explorar Cursos</CardTitle>
                <CardDescription>Descubre nuevas capacitaciones</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/mis-cursos">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary">
              <CardHeader>
                <Video className="h-8 w-8 text-secondary mb-2" />
                <CardTitle className="text-lg">Mis Cursos</CardTitle>
                <CardDescription>Continúa donde lo dejaste</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/diplomas">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-accent">
              <CardHeader>
                <Award className="h-8 w-8 text-accent mb-2" />
                <CardTitle className="text-lg">Mis Diplomas</CardTitle>
                <CardDescription>Ver certificaciones obtenidas</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {isAdmin && (
            <Link href="/admin">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-600">
                <CardHeader>
                  <User className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Administración</CardTitle>
                  <CardDescription>Panel de control</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>

        {/* Categories Preview */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Áreas de Capacitación</h2>
            <Link href="/cursos">
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Ver Todos
              </Button>
            </Link>
          </div>

          {categoriasLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorias?.slice(0, 6).map((categoria) => (
                <Link key={categoria.id} href={`/cursos?categoria=${categoria.id}`}>
                  <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{categoria.nombre}</CardTitle>
                      {categoria.descripcion && (
                        <CardDescription className="line-clamp-2">
                          {categoria.descripcion}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 Colegio de Psicólogos de Guatemala. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
