import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, MinusCircle, XCircle, Swords } from "lucide-react";

interface HeadToHeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rivalName: string;
  wins: number;
  draws: number;
  losses: number;
  totalMatches: number;
  winRate: number;
}

export const HeadToHeadDialog = ({
  open,
  onOpenChange,
  rivalName,
  wins,
  draws,
  losses,
  totalMatches,
  winRate,
}: HeadToHeadDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Head-to-Head vs {rivalName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-success/10 rounded-lg p-3">
              <Trophy className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold text-success">{wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <MinusCircle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{draws}</p>
              <p className="text-xs text-muted-foreground">Draws</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3">
              <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-bold text-destructive">{losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
          </div>

          {/* Detailed Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stat</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Matches</TableCell>
                <TableCell className="text-right">{totalMatches}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Wins</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    {wins}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Draws</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{draws}</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Losses</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    {losses}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Win Rate</TableCell>
                <TableCell className="text-right">
                  <span className={winRate >= 50 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                    {winRate}%
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Record</TableCell>
                <TableCell className="text-right font-mono">
                  {wins}-{draws}-{losses}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
