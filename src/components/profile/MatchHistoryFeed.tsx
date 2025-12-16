import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchCard } from "@/components/MatchCard";
import { Filter, History } from "lucide-react";

interface Match {
  id?: string;
  userScore: number;
  rivalScore: number;
  rivalName: string;
  platform: string;
  date: string;
  result: "win" | "draw" | "loss";
  screenshotUrl?: string;
}

interface MatchHistoryFeedProps {
  matches: Match[];
  onDeleteMatch?: (id: string) => void;
  showDeleteButtons?: boolean;
}

export const MatchHistoryFeed = ({ matches, onDeleteMatch, showDeleteButtons = false }: MatchHistoryFeedProps) => {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");

  const filteredMatches = matches.filter((match) => {
    const platformMatch =
      platformFilter === "all" || match.platform === platformFilter;
    const resultMatch = resultFilter === "all" || match.result === resultFilter;
    return platformMatch && resultMatch;
  });

  return (
    <div className="mb-8 animate-fade-in delay-500 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl xs:text-2xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 xs:w-6 xs:h-6 text-primary" />
          Match History
        </h2>
        <Badge variant="outline" className="text-xs xs:text-sm">
          {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
        </Badge>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Filters</span>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="FIFA">FIFA</SelectItem>
              <SelectItem value="eFootball">eFootball</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Results" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="win">Wins</SelectItem>
              <SelectItem value="draw">Draws</SelectItem>
              <SelectItem value="loss">Losses</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="mt-0.5 xs:mt-0"
            onClick={() => {
              setPlatformFilter("all");
              setResultFilter("all");
            }}
          >
            <span className="text-xs sm:text-sm">Reset Filters</span>
          </Button>
        </div>
      </Card>

      {/* Match Cards */}
      {filteredMatches.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <History className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm sm:text-base text-muted-foreground">
            No matches found with the selected filters
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredMatches.map((match, index) => (
            <MatchCard 
              key={match.id || index} 
              {...match} 
              onDelete={onDeleteMatch}
              showDeleteButton={showDeleteButtons}
            />
          ))}
        </div>
      )}
    </div>
  );
};
