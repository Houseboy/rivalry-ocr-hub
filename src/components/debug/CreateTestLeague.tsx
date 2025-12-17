import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const CreateTestLeague = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const createTestLeague = async () => {
    if (!user) {
      setResult("Please sign in first");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from("leagues")
        .insert({
          host_id: user.id,
          name: "Test Public League",
          description: "This is a test public league for debugging",
          join_code: joinCode,
          league_type: "Premier League",
          selected_team: "Trophy",
          is_public: true
        })
        .select()
        .single();

      if (error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult(`Success! Created league: ${data.name} (ID: ${data.id})`);
        
        // Add the user as a member
        const { error: memberError } = await supabase
          .from("league_members")
          .insert({
            league_id: data.id,
            user_id: user.id
          });

        if (memberError) {
          setResult(`League created but failed to add member: ${memberError.message}`);
        } else {
          setResult(`Success! League created and you're a member. Refresh the page to see it.`);
        }
      }
    } catch (error: any) {
      setResult(`Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Create Test Public League</h3>
      
      {!user ? (
        <p className="text-gray-500">Please sign in to create a test league</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create a test public league to help debug the feed functionality.
          </p>
          
          <Button 
            onClick={createTestLeague} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating..." : "Create Test League"}
          </Button>
          
          {result && (
            <div className={`p-3 rounded-lg text-sm ${
              result.includes("Error") 
                ? "bg-red-50 border border-red-200 text-red-700" 
                : "bg-green-50 border border-green-200 text-green-700"
            }`}>
              {result}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
