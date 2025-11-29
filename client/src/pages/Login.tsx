import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [numeroColegiado, setNumeroColegiado] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.loginAgremiado.useMutation({
    onSuccess: (data) => {
      if (data.agremiado.primerIngreso) {
        setLocation("/cambiar-password");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!numeroColegiado || !password) {
      setError("Por favor complete todos los campos");
      return;
    }

    loginMutation.mutate({ numeroColegiado, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={APP_LOGO} alt="Logo" className="h-24 w-auto" />
          </div>
          <div>
            <CardTitle className="text-3xl">{APP_TITLE}</CardTitle>
            <CardDescription className="text-base mt-2">
              Ingrese con su número de colegiado
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="numeroColegiado">Número de Colegiado</Label>
              <Input
                id="numeroColegiado"
                type="text"
                placeholder="Ej: 12345"
                value={numeroColegiado}
                onChange={(e) => setNumeroColegiado(e.target.value)}
                disabled={loginMutation.isPending}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
              />
            </div>

            <Button
              type="button"
              variant="link"
              className="px-0 text-sm text-secondary hover:text-secondary/80"
              onClick={() => setLocation("/recuperar-password")}
            >
              ¿Olvidó su contraseña?
            </Button>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
