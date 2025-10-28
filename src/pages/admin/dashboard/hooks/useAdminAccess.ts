import { useUserRole } from "@/hooks/useUserRole";

interface UseAdminAccessReturn {
  isAdmin: boolean;
  roles: string[];
  loading: boolean;
}

export const useAdminAccess = (): UseAdminAccessReturn => {
  const { isAdmin, roles, isLoading } = useUserRole();

  return {
    isAdmin,
    roles,
    loading: isLoading,
  };
};
