import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DatabaseTest = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults = [];

    // Test 1: Check auth status
    testResults.push({
      test: "Auth Status",
      status: user ? "Authenticated" : "Not Authenticated",
      details: user ? `User ID: ${user.id}` : "No user found"
    });

    try {
      // Test 2: Basic connection test
      const { data: connectionTest, error: connectionError } = await supabase
        .from("leagues")
        .select("count")
        .limit(1);

      testResults.push({
        test: "Database Connection",
        status: connectionError ? "Failed" : "Success",
        details: connectionError ? connectionError.message : "Connected successfully"
      });

      // Test 3: Count all leagues
      const { data: allCount, error: allCountError } = await supabase
        .from("leagues")
        .select("*", { count: "exact", head: true });

      testResults.push({
        test: "Count All Leagues",
        status: allCountError ? "Failed" : "Success",
        details: allCountError ? allCountError.message : `Total: ${allCount || 0} leagues`
      });

      // Test 4: Count public leagues
      const { data: publicCount, error: publicCountError } = await supabase
        .from("leagues")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true);

      testResults.push({
        test: "Count Public Leagues",
        status: publicCountError ? "Failed" : "Success",
        details: publicCountError ? publicCountError.message : `Public: ${publicCount || 0} leagues`
      });

      // Test 5: Try to fetch actual public league data
      const { data: publicLeagues, error: publicLeaguesError } = await supabase
        .from("leagues")
        .select("id, name, is_public, league_type")
        .eq("is_public", true)
        .limit(3);

      testResults.push({
        test: "Fetch Public League Data",
        status: publicLeaguesError ? "Failed" : "Success",
        details: publicLeaguesError 
          ? publicLeaguesError.message 
          : `Found ${publicLeagues?.length || 0} public leagues`
      });

      if (publicLeagues && publicLeagues.length > 0) {
        testResults.push({
          test: "Sample Public League",
          status: "Success",
          details: JSON.stringify(publicLeagues[0], null, 2)
        });
      }

      // Test 6: Check RLS policy
      if (user) {
        const { data: userLeagues, error: userLeaguesError } = await supabase
          .from("leagues")
          .select("id, name, is_public, host_id")
          .or(`is_public.eq.true,host_id.eq.${user.id}`);

        testResults.push({
          test: "User Access (Public + Host)",
          status: userLeaguesError ? "Failed" : "Success",
          details: userLeaguesError 
            ? userLeaguesError.message 
            : `User can see ${userLeagues?.length || 0} leagues`
        });
      }

    } catch (error: any) {
      testResults.push({
        test: "Unexpected Error",
        status: "Failed",
        details: error.message
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, [user]);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Database Connection Test</h3>
        <Button onClick={runTests} disabled={loading} size="sm">
          {loading ? "Testing..." : "Refresh Tests"}
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${
              result.status === "Success" 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-sm">{result.test}</h4>
              <span className={`text-xs px-2 py-1 rounded ${
                result.status === "Success" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
              {result.details}
            </p>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <p className="text-gray-500 text-center py-4">No test results yet</p>
      )}
    </Card>
  );
};
