import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EmojiPicker } from "@/components/feed/EmojiPicker";

export const VideoUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    setCaption((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const validateVideo = async (file: File): Promise<boolean> => {
    // Check file type
    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid format",
        description: "Please upload MP4, MOV, or WEBM files only.",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video must be under 50MB.",
        variant: "destructive",
      });
      return false;
    }

    // Check duration
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          toast({
            title: "Video too long",
            description: "Video must be 60 seconds or less.",
            variant: "destructive",
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = await validateVideo(file);
    if (isValid) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !caption.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a video and add a caption.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload video to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("video-uploads")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("video-uploads")
        .getPublicUrl(fileName);

      // Create post record
      const { error: postError } = await supabase.from("posts" as any).insert({
        user_id: user.id,
        type: "video",
        url: urlData.publicUrl,
        caption: caption.trim(),
        tags: [],
      } as any);

      if (postError) throw postError;

      toast({
        title: "Video uploaded!",
        description: "Your highlight video has been posted to the feed.",
      });

      // Reset form
      setSelectedFile(null);
      setCaption("");
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setCaption("");
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
      <h3 className="text-xl font-semibold mb-4">Upload Highlight Video</h3>

      <div className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>{selectedFile ? selectedFile.name : "Choose video file"}</span>
          </label>
        </div>

        {/* Video Preview */}
        {previewUrl && (
          <div className="relative">
            <video
              src={previewUrl}
              controls
              className="w-full rounded-lg max-h-[300px]"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80"
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Caption Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Caption</label>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Describe your highlight... (e.g., 'Amazing free kick goal in the 90th minute!')"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px] pr-10"
              disabled={uploading}
            />
            <div className="absolute bottom-2 right-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>
        </div>

        {/* Info Message */}
        <p className="text-sm text-muted-foreground">
          🏟️ Upload only match-related highlight videos (max 1 minute). Keep it FIFA/eFootball focused.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !caption.trim() || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Video"
            )}
          </Button>
          {selectedFile && (
            <Button variant="outline" onClick={handleCancel} disabled={uploading}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
