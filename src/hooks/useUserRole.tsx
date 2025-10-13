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
      
      console.log('User roles loaded:', data);
      return data.map(r => r.role);
    },
    enabled: !!user?.id,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  const isAdmin = roles?.includes('admin') ?? false;
  const isModerator = roles?.includes('moderator') ?? false;

  return {
    roles: roles ?? [],
    isAdmin,
    isModerator,
    isLoading,
  };
}
