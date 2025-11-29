import { trpc } from "@/lib/trpc";

export function useAgremiadoAuth() {
  const { data: agremiado, isLoading, error, refetch } = trpc.auth.getCurrentAgremiado.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    agremiado,
    isLoading,
    error,
    isAuthenticated: !!agremiado,
    logout,
    refetch,
  };
}
