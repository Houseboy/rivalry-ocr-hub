import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Redirect to the home page after successful authentication
          navigate('/');
        } else {
          // If no session, redirect to login
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        toast({
          title: 'Authentication Error',
          description: 'There was an error signing in. Please try again.',
          variant: 'destructive',
        });
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  return null;
}
