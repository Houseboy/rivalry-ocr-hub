import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Smile } from "lucide-react";
import EmojiPickerReact from "emoji-picker-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button" className="h-8 w-8">
          <Smile className="w-4 h-4 text-muted-foreground hover:text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" side="top" align="start">
        <EmojiPickerReact onEmojiClick={handleEmojiClick} />
      </PopoverContent>
    </Popover>
  );
};
