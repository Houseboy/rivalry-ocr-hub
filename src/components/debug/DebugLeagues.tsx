import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DebugLeagues = () => {
  const [allLeagues, setAllLeagues] = useState<any[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      
      // Fetch all leagues
      const { data: allData, error: allError } = await supabase
        .from("leagues")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("All leagues:", { allData, allError });

      // Fetch only public leagues
      const { data: publicData, error: publicError } = await supabase
        .from("leagues")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      console.log("Public leagues:", { publicData, publicError });

      setAllLeagues(allData || []);
      setPublicLeagues(publicData || []);
    } catch (error) {
      console.error("Debug error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  if (loading) {
    return <div>Loading debug info...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h3 className="font-bold mb-2">Debug Info</h3>
        <p>All leagues count: {allLeagues.length}</p>
        <p>Public leagues count: {publicLeagues.length}</p>
        <Button onClick={fetchLeagues} className="mt-2">Refresh</Button>
      </Card>

      {allLeagues.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold mb-2">All Leagues:</h3>
          {allLeagues.map((league) => (
            <div key={league.id} className="border-b p-2">
              <p><strong>Name:</strong> {league.name}</p>
              <p><strong>Public:</strong> {league.is_public ? "Yes" : "No"}</p>
              <p><strong>Type:</strong> {league.league_type}</p>
              <p><strong>Team:</strong> {league.selected_team}</p>
            </div>
          ))}
        </Card>
      )}

      {publicLeagues.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold mb-2">Public Leagues:</h3>
          {publicLeagues.map((league) => (
            <div key={league.id} className="border-b p-2">
              <p><strong>Name:</strong> {league.name}</p>
              <p><strong>Public:</strong> {league.is_public ? "Yes" : "No"}</p>
              <p><strong>Type:</strong> {league.league_type}</p>
              <p><strong>Team:</strong> {league.selected_team}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
