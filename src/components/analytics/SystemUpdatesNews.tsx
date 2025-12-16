import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Sparkles, Zap, Wrench, TrendingUp, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface SystemUpdate {
  id: string;
  title: string;
  summary: string;
  detailed_description: string;
  update_type: string;
  what_was_done: string;
  why_it_was_done: string;
  how_it_improves: string;
  created_at: string;
}

const updateTypeConfig: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  daily: { icon: Clock, color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Daily Update" },
  weekly: { icon: TrendingUp, color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "Weekly Update" },
  general: { icon: Newspaper, color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "General" },
  feature: { icon: Sparkles, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "New Feature" },
  improvement: { icon: Zap, color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Improvement" },
  fix: { icon: Wrench, color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Bug Fix" },
};

export const SystemUpdatesNews = () => {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('system_updates')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-3" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Updates Yet</h3>
        <p className="text-muted-foreground">
          System updates and news will appear here. Stay tuned!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">System News & Updates</h2>
        <Badge variant="outline" className="ml-auto">
          {updates.length} updates
        </Badge>
      </div>

      {updates.map((update, index) => {
        const config = updateTypeConfig[update.update_type] || updateTypeConfig.general;
        const IconComponent = config.icon;
        const isExpanded = expandedId === update.id;

        return (
          <Card 
            key={update.id} 
            className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                    <IconComponent className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{update.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(update.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`shrink-0 ${config.color}`}>
                  {config.label}
                </Badge>
              </div>

              {/* Summary */}
              <p className="text-muted-foreground leading-relaxed">
                {update.summary}
              </p>
            </div>

            {/* Expandable Details */}
            <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                {/* Detailed Description */}
                <div>
                  <h4 className="font-medium text-sm text-primary mb-2">📋 Details</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {update.detailed_description}
                  </p>
                </div>

                {/* What Was Done */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-emerald-400 mb-2">✅ What Was Done</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {update.what_was_done}
                  </p>
                </div>

                {/* Why It Was Done */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-amber-400 mb-2">💡 Why This Change</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {update.why_it_was_done}
                  </p>
                </div>

                {/* How It Improves */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-blue-400 mb-2">🚀 How It Improves Your Experience</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {update.how_it_improves}
                  </p>
                </div>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              className="w-full rounded-t-none border-t border-border h-10 gap-2"
              onClick={() => toggleExpand(update.id)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Read Full Details
                </>
              )}
            </Button>
          </Card>
        );
      })}
    </div>
  );
};
