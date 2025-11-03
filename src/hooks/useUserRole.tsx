import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }
      
      return data?.map(r => r.role) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const isAdmin = roles?.includes('admin') ?? false;
  const isModerator = roles?.includes('user') ?? false; // 'moderator' n'existe pas dans app_role enum

  return {
    roles: roles ?? [],
    isAdmin,
    isModerator,
    isLoading,
  };
}
