import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface Match {
  result: "win" | "draw" | "loss";
  userScore: number;
  rivalScore: number;
  platform: string;
  date: string;
}

interface PerformanceTrendsProps {
  matches: Match[];
}

export const PerformanceTrends = ({ matches }: PerformanceTrendsProps) => {
  if (matches.length === 0) {
    return (
      <div className="mb-8 animate-fade-in delay-300">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Performance Trends
        </h2>
        <Card className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Play more matches to see your performance trends
          </p>
        </Card>
      </div>
    );
  }

  // Last 10 matches form
  const last10 = matches.slice(0, 10).reverse();
  const formData = last10.map((match, index) => ({
    match: `M${index + 1}`,
    result: match.result === "win" ? 3 : match.result === "draw" ? 1 : 0,
    fill: match.result === "win" ? "hsl(var(--success))" : match.result === "draw" ? "hsl(var(--draw))" : "hsl(var(--destructive))"
  }));

  // Platform distribution
  const fifaMatches = matches.filter(m => m.platform === "FIFA").length;
  const efootballMatches = matches.filter(m => m.platform === "eFootball").length;
  const platformData = [
    { name: "FIFA", value: fifaMatches, fill: "hsl(var(--primary))" },
    { name: "eFootball", value: efootballMatches, fill: "hsl(var(--accent))" }
  ];

  // Goals per game
  const goalsData = matches.slice(0, 10).reverse().map((match, index) => ({
    match: `M${index + 1}`,
    scored: match.userScore,
    conceded: match.rivalScore
  }));

  return (
    <div className="mb-8 animate-fade-in delay-300">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary" />
        Performance Trends
      </h2>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Recent Form</TabsTrigger>
          <TabsTrigger value="platform">Platform Split</TabsTrigger>
          <TabsTrigger value="goals">Goals Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Last 10 Matches</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="match" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => {
                    if (value === 3) return ["Win", "Result"];
                    if (value === 1) return ["Draw", "Result"];
                    return ["Loss", "Result"];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="result" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Goals Per Game (Last 10)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={goalsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="match" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="scored" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  name="Scored"
                />
                <Line 
                  type="monotone" 
                  dataKey="conceded" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name="Conceded"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
