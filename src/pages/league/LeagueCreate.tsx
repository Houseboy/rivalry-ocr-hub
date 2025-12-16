import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";

const generateJoinCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const LeagueCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { leagueType, leagueName, selectedTeam } = location.state || {};

  const [formData, setFormData] = useState({
    name: leagueName ? `${leagueName} League` : "",
    description: "",
    isPublic: true,
    joinCode: generateJoinCode()
  });

  useEffect(() => {
    if (!leagueType || !selectedTeam) {
      navigate("/league/host");
    }
  }, [leagueType, selectedTeam, navigate]);

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to create a league");
      return;
    }

    setLoading(true);
    try {
      // Create the league
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .insert({
          host_id: user.id,
          name: formData.name,
          description: formData.description || null,
          join_code: formData.joinCode,
          league_type: leagueType,
          selected_team: selectedTeam,
          is_public: formData.isPublic
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // Add host as first member
      const { error: memberError } = await supabase
        .from("league_members")
        .insert({
          league_id: league.id,
          user_id: user.id,
          team: selectedTeam
        });

      if (memberError) throw memberError;

      toast.success("League created successfully!");
      navigate(`/league/${league.id}`);
    } catch (error: any) {
      console.error("Error creating league:", error);
      if (error.code === "23505") {
        // Unique constraint violation - regenerate join code
        setFormData(prev => ({ ...prev, joinCode: generateJoinCode() }));
        toast.error("Join code already exists. A new one has been generated.");
      } else {
        toast.error(error.message || "Failed to create league");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!leagueType || !selectedTeam) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pt-20">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Create Your League
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Team Display */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-1">Your Team</p>
                <p className="font-semibold text-lg">{selectedTeam}</p>
                <p className="text-xs text-muted-foreground">{leagueName}</p>
              </div>

              {/* League Name */}
              <div className="space-y-2">
                <Label htmlFor="name">League Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter league name"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your league..."
                  rows={3}
                />
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div>
                  <Label htmlFor="public" className="cursor-pointer">Public League</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.isPublic 
                      ? "Anyone can find and request to join" 
                      : "Only joinable with the code"}
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
              </div>

              {/* Join Code */}
              <div className="space-y-2">
                <Label>Join Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.joinCode}
                    readOnly
                    className="font-mono text-lg tracking-widest text-center"
                  />
                  <CopyButton 
                    text={formData.joinCode}
                    variant="outline"
                    size="icon"
                    iconOnly={true}
                    successMessage="Join code copied!"
                    className="shrink-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with friends so they can join your league
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating..." : "Create League"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeagueCreate;
