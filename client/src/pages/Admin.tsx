import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO } from "@/const";
import { 
  Upload, 
  Download, 
  Users, 
  BookOpen, 
  Award,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { agremiado, isLoading: authLoading } = useAgremiadoAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const { data: stats, isLoading: statsLoading } = trpc.admin.getEstadisticas.useQuery(undefined, {
    enabled: !!agremiado && (agremiado.role === "superadministrador" || agremiado.role === "administrador"),
  });

  const { data: agremiados, isLoading: agremiadosLoading, refetch: refetchAgremiados } = trpc.admin.getAllAgremiados.useQuery(undefined, {
    enabled: !!agremiado && (agremiado.role === "superadministrador" || agremiado.role === "administrador"),
  });
  
  const toggleActivoMutation = trpc.admin.toggleAgremiadoActivo.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado correctamente");
      refetchAgremiados();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const downloadTemplateMutation = trpc.admin.downloadTemplate.useQuery(undefined, {
    enabled: false,
  });

  const importMutation = trpc.admin.importAgremiados.useMutation({
    onSuccess: (data) => {
      setImporting(false);
      setImportResult(data);
      
      if (data.success) {
        toast.success(`Se importaron ${data.imported} agremiados exitosamente`);
        setSelectedFile(null);
      } else {
        toast.error("Hubo errores en la importación");
      }
    },
    onError: (error) => {
      setImporting(false);
      toast.error(error.message);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error("Por favor seleccione un archivo Excel (.xlsx o .xls)");
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Por favor seleccione un archivo");
      return;
    }

    setImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1];
      
      importMutation.mutate({ fileBase64: base64Data });
    };
    
    reader.readAsDataURL(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    const result = await downloadTemplateMutation.refetch();
    
    if (result.data) {
      const blob = new Blob(
        [Buffer.from(result.data.base64, 'base64')],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Plantilla descargada exitosamente");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold">Panel de Administración</h1>
                <p className="text-sm text-muted-foreground">Gestión del Aula Virtual</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="estadisticas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="agremiados">Agremiados</TabsTrigger>
            <TabsTrigger value="importar">Importar Excel</TabsTrigger>
          </TabsList>

          {/* Estadísticas Tab */}
          <TabsContent value="estadisticas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Agremiados</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.totalAgremiados || 0}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.totalCursos || 0}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Diplomas Emitidos</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.totalDiplomas || 0}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.totalCursos || 0}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cursos Populares */}
            {stats?.cursosPopulares && stats.cursosPopulares.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cursos Más Populares</CardTitle>
                  <CardDescription>Los cursos con mayor inscripción</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.cursosPopulares.map((curso: any, index: number) => (
                      <div key={curso.id} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{curso.titulo}</p>
                          <p className="text-sm text-muted-foreground">
                            {curso.inscripciones} inscripciones
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cursos Tab */}
          <TabsContent value="cursos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Cursos</CardTitle>
                <CardDescription>
                  Administrar cursos, videos y evaluaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/cursos">
                  <Button className="w-full" size="lg">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Ir a Gestión de Cursos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agremiados Tab */}
          <TabsContent value="agremiados" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Agremiados</CardTitle>
                <CardDescription>
                  {agremiados?.length || 0} agremiados registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agremiadosLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {agremiados?.map((agr: any) => (
                      <div
                        key={agr.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{agr.nombreCompleto}</p>
                          <p className="text-sm text-muted-foreground">
                            Colegiado: {agr.numeroColegiado} • {agr.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {agr.activo ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              Activo
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              Inactivo
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
                            {agr.role}
                          </span>
                          <Button
                            size="sm"
                            variant={agr.activo ? "destructive" : "default"}
                            onClick={() => toggleActivoMutation.mutate({ id: agr.id, activo: !agr.activo })}
                            disabled={toggleActivoMutation.isPending}
                          >
                            {agr.activo ? (
                              <><UserX className="h-4 w-4 mr-1" /> Desactivar</>
                            ) : (
                              <><UserCheck className="h-4 w-4 mr-1" /> Activar</>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Importar Excel Tab */}
          <TabsContent value="importar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Importar Agremiados desde Excel</CardTitle>
                <CardDescription>
                  Carga un archivo Excel con los datos de los agremiados para importarlos al sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Download Template */}
                <div className="space-y-2">
                  <Label>Paso 1: Descargar Plantilla</Label>
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Plantilla de Excel
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Descarga la plantilla, complétala con los datos de los agremiados y súbela en el siguiente paso
                  </p>
                </div>

                {/* Upload File */}
                <div className="space-y-2">
                  <Label htmlFor="excel-file">Paso 2: Subir Archivo Excel</Label>
                  <div className="flex gap-2">
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      disabled={importing}
                    />
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || importing}
                      className="flex-shrink-0"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Archivo seleccionado: {selectedFile.name}
                    </p>
                  )}
                </div>

                {/* Import Results */}
                {importResult && (
                  <div className="space-y-4">
                    {importResult.success ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          ¡Importación exitosa! Se importaron {importResult.imported} agremiados.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            La importación falló. Por favor revise los errores a continuación.
                          </AlertDescription>
                        </Alert>

                        {importResult.errors && importResult.errors.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Errores de Validación</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {importResult.errors.map((error: any, index: number) => (
                                  <div key={index} className="text-sm p-2 bg-red-50 rounded">
                                    <span className="font-medium">Fila {error.row}:</span>{" "}
                                    {error.message}
                                    {error.value && ` (Valor: "${error.value}")`}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {importResult.duplicates && importResult.duplicates.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Duplicados Encontrados</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {importResult.duplicates.map((dup: string, index: number) => (
                                  <div key={index} className="text-sm p-2 bg-yellow-50 rounded">
                                    {dup}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Instrucciones</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>El archivo Excel debe contener las siguientes columnas:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>Numero Colegiado:</strong> Número único de colegiado</li>
                      <li><strong>Nombre Completo:</strong> Nombre y apellidos del agremiado</li>
                      <li><strong>Email:</strong> Correo electrónico válido</li>
                    </ul>
                    <p className="mt-4 text-muted-foreground">
                      Se generará automáticamente una contraseña temporal para cada agremiado y se enviará por correo electrónico.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
