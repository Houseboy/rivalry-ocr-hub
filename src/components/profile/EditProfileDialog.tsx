import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentData: {
    username?: string;
    avatarUrl?: string;
    favoriteTeam?: string;
    playstyle?: string;
  };
  onSave: (data: any) => void;
}

const playstyles = ["Attacking", "Balanced", "Defensive", "Possession", "Counter-Attack"];
const popularTeams = [
  "Real Madrid", "Barcelona", "Manchester United", "Liverpool", "Bayern Munich",
  "Juventus", "PSG", "Manchester City", "Chelsea", "Arsenal"
];

export const EditProfileDialog = ({
  open,
  onOpenChange,
  currentData,
  onSave,
}: EditProfileDialogProps) => {
  const [formData, setFormData] = useState(currentData);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your gaming identity and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username || ""}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="Enter your username"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team">Favorite Team</Label>
            <Select
              value={formData.favoriteTeam}
              onValueChange={(value) =>
                setFormData({ ...formData, favoriteTeam: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your favorite team" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {popularTeams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="playstyle">Playstyle</Label>
            <Select
              value={formData.playstyle}
              onValueChange={(value) =>
                setFormData({ ...formData, playstyle: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your playstyle" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {playstyles.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
