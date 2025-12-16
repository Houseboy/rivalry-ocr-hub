import { useState, useEffect } from "react";
import { Bell, Reply, Send, X, Heart, Flame, HandMetal, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  actor_id: string;
  match_id?: string;
  post_id?: string;
  type: "comment" | "reaction" | "follow" | "post_reaction" | "post_comment";
  content?: string;
  reaction_type?: string;
  is_read: boolean;
  created_at: string;
  actor_username?: string;
  actor_avatar?: string;
}

const reactionIcons: { [key: string]: any } = {
  like: Heart,
  fire: Flame,
  clap: HandMetal,
  trophy: Trophy,
};

export const NotificationsBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data: notificationsData, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    // Fetch actor profiles
    const actorIds = [...new Set(notificationsData.map((n) => n.actor_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", actorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const enrichedNotifications: Notification[] = notificationsData.map((n) => ({
      ...n,
      type: n.type as "comment" | "reaction" | "follow" | "post_reaction" | "post_comment",
      actor_username: profileMap.get(n.actor_id)?.username || "Someone",
      actor_avatar: profileMap.get(n.actor_id)?.avatar_url,
    }));

    setNotifications(enrichedNotifications);
    setUnreadCount(enrichedNotifications.filter((n) => !n.is_read).length);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendReply = async (notificationId: string) => {
    if (!replyText.trim() || !user) return;
    
    setSendingReply(true);
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Create a comment reply to the original match/post
      if (notification.match_id) {
        const { error } = await supabase
          .from("match_comments")
          .insert({
            match_id: notification.match_id,
            user_id: user.id,
            content: replyText.trim(),
          });
        
        if (error) throw error;
      } else if (notification.post_id) {
        const { error } = await supabase
          .from("post_comments")
          .insert({
            post_id: notification.post_id,
            user_id: user.id,
            content: replyText.trim(),
          });
        
        if (error) throw error;
      }

      // Send notification to the original actor
      await supabase
        .from("notifications")
        .insert({
          user_id: notification.actor_id,
          actor_id: user.id,
          type: "comment",
          content: replyText.trim(),
          match_id: notification.match_id,
          post_id: notification.post_id,
          is_read: false,
        });

      toast.success("Reply sent successfully!");
      setReplyText("");
      setReplyingTo(null);
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error(error.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setOpen(false);
    
    if (notification.type === "follow") {
      navigate(`/profile?userId=${notification.actor_id}`);
    } else if (notification.match_id) {
      navigate(`/analytics?matchId=${notification.match_id}`);
    } else if (notification.post_id) {
      navigate(`/`); // Navigate to home feed
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getNotificationText = (notification: Notification) => {
    if (notification.type === "follow") {
      return (
        <>
          <span className="font-semibold">{notification.actor_username}</span>{" "}
          started following you{" "}
          <UserPlus className="inline w-4 h-4 ml-1" />
        </>
      );
    } else if (notification.type === "comment") {
      return (
        <>
          <span className="font-semibold">{notification.actor_username}</span>{" "}
          commented on your match: "{notification.content?.substring(0, 50)}
          {notification.content && notification.content.length > 50 ? "..." : ""}"
        </>
      );
    } else if (notification.type === "post_comment") {
      return (
        <>
          <span className="font-semibold">{notification.actor_username}</span>{" "}
          commented on your post: "{notification.content?.substring(0, 50)}
          {notification.content && notification.content.length > 50 ? "..." : ""}"
        </>
      );
    } else if (notification.type === "post_reaction") {
      const ReactionIcon = reactionIcons[notification.reaction_type || "like"];
      return (
        <>
          <span className="font-semibold">{notification.actor_username}</span>{" "}
          reacted to your post{" "}
          {ReactionIcon && <ReactionIcon className="inline w-4 h-4 ml-1" />}
        </>
      );
    } else {
      const ReactionIcon = reactionIcons[notification.reaction_type || "like"];
      return (
        <>
          <span className="font-semibold">{notification.actor_username}</span>{" "}
          reacted to your match{" "}
          {ReactionIcon && <ReactionIcon className="inline w-4 h-4 ml-1" />}
        </>
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[450px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "transition-all duration-200",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={notification.actor_avatar} />
                        <AvatarFallback className="text-xs">
                          {notification.actor_username?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">
                          {getNotificationText(notification)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                        
                        {/* Reply Section */}
                        {(notification.type === "comment" || notification.type === "post_comment") && (
                          <div className="mt-3 space-y-2">
                            {replyingTo === notification.id ? (
                              <div className="flex gap-2">
                                <Input
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type your reply..."
                                  className="flex-1 h-8 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      setReplyingTo(null);
                                      setReplyText("");
                                    } else if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      sendReply(notification.id);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => sendReply(notification.id)}
                                  disabled={!replyText.trim() || sendingReply}
                                  className="h-8 px-2"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                  className="h-8 px-2"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(notification.id);
                                  setReplyText("");
                                }}
                                className="text-xs h-7 px-2 gap-1"
                              >
                                <Reply className="w-3 h-3" />
                                Reply
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNotificationClick(notification)}
                        className="text-xs h-7 px-2"
                      >
                        View
                      </Button>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs h-7 px-2"
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
