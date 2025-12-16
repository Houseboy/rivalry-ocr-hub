import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
  textLabel?: string;
  iconOnly?: boolean;
  successMessage?: string;
  onCopy?: (copied: boolean) => void;
}

export const CopyButton = ({
  text,
  variant = "outline",
  size = "default",
  className,
  showText = false,
  textLabel = "Copy",
  iconOnly = false,
  successMessage = "Copied to clipboard!",
  onCopy,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleCopy = async (e?: React.MouseEvent) => {
    // Prevent event propagation if event is provided
    if (e) {
      e.stopPropagation();
    }

    if (copying) return;

    setCopying(true);
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Copy command failed');
        }
      }

      setCopied(true);
      toast.success(successMessage);
      onCopy?.(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Failed to copy to clipboard");
      onCopy?.(false);
    } finally {
      setCopying(false);
    }
  };

  const getIcon = () => {
    if (copied) {
      return <Check className="w-4 h-4" />;
    }
    return iconOnly ? <Share2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (copied) return "Copied!";
    return textLabel;
  };

  if (iconOnly) {
    return (
      <Button
        variant={variant}
        size="icon"
        className={cn(
          "transition-all duration-200",
          copied && "bg-green-500 hover:bg-green-600 text-white border-green-500",
          copying && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleCopy}
        disabled={copying}
        title={text}
      >
        {getIcon()}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-200",
        copied && "bg-green-500 hover:bg-green-600 text-white border-green-500",
        copying && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleCopy}
      disabled={copying}
    >
      {getIcon()}
      {showText && <span className="ml-2">{getButtonText()}</span>}
    </Button>
  );
};

export default CopyButton;
