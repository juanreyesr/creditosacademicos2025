import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_LOGO } from "@/const";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Award,
  Loader2,
} from "lucide-react";

export default function Evaluacion() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/evaluacion/:id");
  const evaluacionId = params?.id ? parseInt(params.id) : null;
  
  const { agremiado, isLoading: authLoading } = useAgremiadoAuth();
  const [respuestas, setRespuestas] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [resultado, setResultado] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: evaluacionData, isLoading: evaluacionLoading } = trpc.evaluaciones.getByCurso.useQuery(
    { cursoId: evaluacionId! },
    { enabled: !!evaluacionId && !!agremiado }
  );

  const { data: preguntas, isLoading: preguntasLoading, refetch: refetchPreguntas } = trpc.evaluaciones.getPreguntas.useQuery(
    { evaluacionId: evaluacionId! },
    { enabled: !!evaluacionId && !!agremiado && !resultado }
  );

  const submitMutation = trpc.evaluaciones.submitRespuestas.useMutation({
    onSuccess: (data) => {
      setResultado(data);
      setSubmitting(false);
    },
    onError: (error) => {
      alert(error.message);
      setSubmitting(false);
    },
  });

  useEffect(() => {
    if (!authLoading && !agremiado) {
      setLocation("/login");
    }
  }, [agremiado, authLoading, setLocation]);

  if (authLoading || !agremiado || evaluacionLoading || preguntasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!evaluacionData || !preguntas) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Evaluación no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = () => {
    if (Object.keys(respuestas).length < preguntas.length) {
      alert("Por favor responda todas las preguntas antes de enviar");
      return;
    }

    setSubmitting(true);
    
    const respuestasArray = preguntas.map(p => ({
      preguntaId: p.id,
      respuesta: respuestas[p.id],
    }));

    submitMutation.mutate({
      evaluacionId: evaluacionId!,
      respuestas: respuestasArray,
    });
  };

  const handleRetry = () => {
    setResultado(null);
    setRespuestas({});
    refetchPreguntas();
  };

  const progreso = (Object.keys(respuestas).length / preguntas.length) * 100;

  // Resultado View
  if (resultado) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="container py-4">
            <div className="flex items-center gap-4">
              <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
              <h1 className="text-lg font-bold">Resultado de Evaluación</h1>
            </div>
          </div>
        </header>

        <main className="container py-8 max-w-2xl">
          <Card className={resultado.aprobado ? "border-green-500" : "border-red-500"}>
            <CardHeader className="text-center">
              {resultado.aprobado ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-green-600">¡Felicitaciones!</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Has aprobado la evaluación
                    </CardDescription>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-red-600">No Aprobado</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Necesitas mejorar tu puntaje
                    </CardDescription>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Puntaje Obtenido</p>
                  <p className="text-3xl font-bold">{resultado.puntajeObtenido}%</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Respuestas Correctas</p>
                  <p className="text-3xl font-bold">{resultado.correctas}/{resultado.total}</p>
                </div>
              </div>

              {resultado.aprobado && (
                <Alert className="border-green-200 bg-green-50">
                  <Award className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Tu diploma se ha generado automáticamente y está disponible en la sección "Mis Diplomas"
                  </AlertDescription>
                </Alert>
              )}

              {!resultado.aprobado && evaluacionData.intentosRestantes > 1 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tienes {evaluacionData.intentosRestantes - 1} intentos restantes. 
                    Debes esperar {evaluacionData.evaluacion.tiempoEsperaHoras} horas antes del siguiente intento.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Link href="/diplomas" className="flex-1">
                  <Button className="w-full" variant={resultado.aprobado ? "default" : "outline"}>
                    <Award className="mr-2 h-4 w-4" />
                    Ver Diplomas
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full" variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Evaluación View
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={APP_LOGO} alt="Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-lg font-bold">{evaluacionData.evaluacion.titulo}</h1>
                <p className="text-sm text-muted-foreground">
                  {preguntas.length} preguntas • Puntaje mínimo: {evaluacionData.evaluacion.puntajeMinimo}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progreso</p>
              <p className="text-lg font-bold">{Object.keys(respuestas).length}/{preguntas.length}</p>
            </div>
          </div>
          <Progress value={progreso} className="mt-4 h-2" />
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="space-y-6">
          {preguntas.map((pregunta, index) => (
            <Card key={pregunta.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {index + 1}. {pregunta.textoPregunta}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={respuestas[pregunta.id]}
                  onValueChange={(value) => {
                    setRespuestas(prev => ({
                      ...prev,
                      [pregunta.id]: value as "A" | "B" | "C" | "D",
                    }));
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="A" id={`${pregunta.id}-A`} />
                    <Label htmlFor={`${pregunta.id}-A`} className="flex-1 cursor-pointer">
                      A) {pregunta.opcionA}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="B" id={`${pregunta.id}-B`} />
                    <Label htmlFor={`${pregunta.id}-B`} className="flex-1 cursor-pointer">
                      B) {pregunta.opcionB}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="C" id={`${pregunta.id}-C`} />
                    <Label htmlFor={`${pregunta.id}-C`} className="flex-1 cursor-pointer">
                      C) {pregunta.opcionC}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="D" id={`${pregunta.id}-D`} />
                    <Label htmlFor={`${pregunta.id}-D`} className="flex-1 cursor-pointer">
                      D) {pregunta.opcionD}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          <Card className="sticky bottom-4 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {Object.keys(respuestas).length === preguntas.length
                      ? "¡Todas las preguntas respondidas!"
                      : `Faltan ${preguntas.length - Object.keys(respuestas).length} preguntas`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Intentos restantes: {evaluacionData.intentosRestantes}
                  </p>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={Object.keys(respuestas).length < preguntas.length || submitting}
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Evaluación"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
