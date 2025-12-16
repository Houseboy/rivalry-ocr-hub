import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Video, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string;
  tags: string[];
  created_at: string;
}

export const GalleryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load gallery",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string, postUrl: string) => {
    try {
      // Delete from storage
      const fileName = postUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("video-uploads").remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from("posts" as any)
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));

      toast({
        title: "Deleted",
        description: "Post removed from gallery",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading gallery...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-12 text-center border-border/50 bg-card/80">
        <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No uploads yet</h3>
        <p className="text-muted-foreground">
          Upload your first highlight video to start building your gallery!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/20 transition-all"
        >
          {/* Media */}
          <div className="relative aspect-video bg-black/5">
            {post.type === "video" ? (
              <>
                <video
                  src={post.url}
                  className="w-full h-full object-cover"
                  controls
                />
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
                  <Video className="w-3 h-3 text-white" />
                  <span className="text-xs text-white">Video</span>
                </div>
              </>
            ) : (
              <>
                <img
                  src={post.url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-white" />
                  <span className="text-xs text-white">Image</span>
                </div>
              </>
            )}
          </div>

          {/* Caption and Actions */}
          <div className="p-4">
            <p className="text-sm mb-2 line-clamp-2">{post.caption}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(post.id, post.url)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
