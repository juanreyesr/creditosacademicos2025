import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAgremiadoAuth } from "@/hooks/useAgremiadoAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { agremiado, isLoading } = useAgremiadoAuth();

  useEffect(() => {
    if (!isLoading) {
      if (agremiado) {
        setLocation("/dashboard");
      } else {
        setLocation("/login");
      }
    }
  }, [agremiado, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
