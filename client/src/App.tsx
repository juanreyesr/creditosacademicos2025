import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cursos from "./pages/Cursos";
import CursoDetalle from "./pages/CursoDetalle";
import Admin from "./pages/Admin";
import Evaluacion from "./pages/Evaluacion";
import Diplomas from "./pages/Diplomas";
import AdminCursos from "./pages/AdminCursos";
import AdminVideos from "./pages/AdminVideos";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/cursos" component={Cursos} />
      <Route path="/curso/:id" component={CursoDetalle} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/cursos" component={AdminCursos} />
      <Route path="/admin/cursos/:id/videos" component={AdminVideos} />
      <Route path="/evaluacion/:id" component={Evaluacion} />
      <Route path="/diplomas" component={Diplomas} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
