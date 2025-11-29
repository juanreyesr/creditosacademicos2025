import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO } from "@/const";
import { 
  ArrowLeft, 
  Download, 
  Award,
  Calendar,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Diplomas() {
  const [, setLocation] = useLocation();
  const { agremiado, isLoading: authLoading } = useAgremiadoAuth();

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleDownload = async (diplomaId: number, cursoTitulo: string) => {
    try {
      toast.info("Generando diploma...");
      
      // In a real implementation, this would call a backend endpoint
      // that generates the PDF and returns it
      // For now, we'll show a message
      toast.success("Diploma generado. La descarga comenzará en breve.");
      
      // TODO: Implement actual PDF generation and download
    } catch (error) {
      toast.error("Error al generar el diploma");
    }
  };

  const handleVerify = (codigoVerificacion: string) => {
    window.open(`/verificar-diploma/${codigoVerificacion}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold">Mis Diplomas</h1>
              <p className="text-sm text-muted-foreground">
                Certificaciones obtenidas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {diplomasLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : diplomas && diplomas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diplomas.map((diploma: any) => (
              <Card key={diploma.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary via-purple-700 to-secondary flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <Award className="h-24 w-24 text-white/20 absolute" />
                  <div className="relative text-center text-white p-6">
                    <h3 className="font-bold text-lg line-clamp-3">{diploma.cursoTitulo}</h3>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{diploma.cursoTitulo}</CardTitle>
                    <Badge variant={diploma.tipo === "aprobacion" ? "default" : "secondary"} className="flex-shrink-0">
                      {diploma.tipo === "aprobacion" ? "Aprobación" : "Participación"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(diploma.fechaEmision).toLocaleDateString('es-GT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Código de Verificación</p>
                    <p className="font-mono text-sm font-medium">{diploma.codigoVerificacion}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(diploma.id, diploma.cursoTitulo)}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify(diploma.codigoVerificacion)}
                      className="w-full"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Verificar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Award className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>
              <CardTitle>Aún no tienes diplomas</CardTitle>
              <CardDescription className="text-base">
                Completa cursos y aprueba las evaluaciones para obtener tus certificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/cursos">
                <Button size="lg">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Explorar Cursos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
