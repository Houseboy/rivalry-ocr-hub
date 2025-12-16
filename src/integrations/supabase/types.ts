export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          description: string | null
          earned_at: string | null
          icon: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      league_fixtures: {
        Row: {
          away_team: string
          away_user_id: string
          created_at: string
          gameweek: number
          home_team: string
          home_user_id: string
          id: string
          league_id: string
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          away_team: string
          away_user_id: string
          created_at?: string
          gameweek?: number
          home_team: string
          home_user_id: string
          id?: string
          league_id: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          away_team?: string
          away_user_id?: string
          created_at?: string
          gameweek?: number
          home_team?: string
          home_user_id?: string
          id?: string
          league_id?: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_fixtures_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          id: string
          joined_at: string | null
          league_id: string
          team: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          league_id: string
          team?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          league_id?: string
          team?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_results: {
        Row: {
          away_score: number
          away_user_id: string
          created_at: string
          fixture_id: string
          home_score: number
          home_user_id: string
          id: string
          league_id: string
          played_at: string
          screenshot_url: string | null
          verified: boolean
        }
        Insert: {
          away_score?: number
          away_user_id: string
          created_at?: string
          fixture_id: string
          home_score?: number
          home_user_id: string
          id?: string
          league_id: string
          played_at?: string
          screenshot_url?: string | null
          verified?: boolean
        }
        Update: {
          away_score?: number
          away_user_id?: string
          created_at?: string
          fixture_id?: string
          home_score?: number
          home_user_id?: string
          id?: string
          league_id?: string
          played_at?: string
          screenshot_url?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "league_results_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "league_fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_results_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          current_phase: string | null
          description: string | null
          gameweeks_count: number | null
          host_id: string
          id: string
          is_public: boolean | null
          join_code: string
          league_type: string
          max_participants: number | null
          name: string
          selected_team: string
          tournament_mode: string | null
        }
        Insert: {
          created_at?: string | null
          current_phase?: string | null
          description?: string | null
          gameweeks_count?: number | null
          host_id: string
          id?: string
          is_public?: boolean | null
          join_code: string
          league_type: string
          max_participants?: number | null
          name: string
          selected_team: string
          tournament_mode?: string | null
        }
        Update: {
          created_at?: string | null
          current_phase?: string | null
          description?: string | null
          gameweeks_count?: number | null
          host_id?: string
          id?: string
          is_public?: boolean | null
          join_code?: string
          league_type?: string
          max_participants?: number | null
          name?: string
          selected_team?: string
          tournament_mode?: string | null
        }
        Relationships: []
      }
      match_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_comments_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_reactions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_reactions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          corner_kicks: number | null
          created_at: string
          crosses: number | null
          fouls: number | null
          free_kicks: number | null
          id: string
          interceptions: number | null
          match_date: string
          offsides: number | null
          passes: number | null
          platform: string
          possession: number | null
          result: string
          rival_corner_kicks: number | null
          rival_crosses: number | null
          rival_fouls: number | null
          rival_free_kicks: number | null
          rival_interceptions: number | null
          rival_name: string
          rival_offsides: number | null
          rival_passes: number | null
          rival_possession: number | null
          rival_saves: number | null
          rival_score: number
          rival_shots_on_target: number | null
          rival_successful_passes: number | null
          rival_tackles: number | null
          rival_total_shots: number | null
          saves: number | null
          screenshot_url: string | null
          shots_on_target: number | null
          successful_passes: number | null
          tackles: number | null
          total_shots: number | null
          user_id: string
          user_score: number
        }
        Insert: {
          corner_kicks?: number | null
          created_at?: string
          crosses?: number | null
          fouls?: number | null
          free_kicks?: number | null
          id?: string
          interceptions?: number | null
          match_date?: string
          offsides?: number | null
          passes?: number | null
          platform: string
          possession?: number | null
          result: string
          rival_corner_kicks?: number | null
          rival_crosses?: number | null
          rival_fouls?: number | null
          rival_free_kicks?: number | null
          rival_interceptions?: number | null
          rival_name: string
          rival_offsides?: number | null
          rival_passes?: number | null
          rival_possession?: number | null
          rival_saves?: number | null
          rival_score: number
          rival_shots_on_target?: number | null
          rival_successful_passes?: number | null
          rival_tackles?: number | null
          rival_total_shots?: number | null
          saves?: number | null
          screenshot_url?: string | null
          shots_on_target?: number | null
          successful_passes?: number | null
          tackles?: number | null
          total_shots?: number | null
          user_id: string
          user_score: number
        }
        Update: {
          corner_kicks?: number | null
          created_at?: string
          crosses?: number | null
          fouls?: number | null
          free_kicks?: number | null
          id?: string
          interceptions?: number | null
          match_date?: string
          offsides?: number | null
          passes?: number | null
          platform?: string
          possession?: number | null
          result?: string
          rival_corner_kicks?: number | null
          rival_crosses?: number | null
          rival_fouls?: number | null
          rival_free_kicks?: number | null
          rival_interceptions?: number | null
          rival_name?: string
          rival_offsides?: number | null
          rival_passes?: number | null
          rival_possession?: number | null
          rival_saves?: number | null
          rival_score?: number
          rival_shots_on_target?: number | null
          rival_successful_passes?: number | null
          rival_tackles?: number | null
          rival_total_shots?: number | null
          saves?: number | null
          screenshot_url?: string | null
          shots_on_target?: number | null
          successful_passes?: number | null
          tackles?: number | null
          total_shots?: number | null
          user_id?: string
          user_score?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          content: string | null
          created_at: string
          id: string
          is_read: boolean
          match_id: string | null
          post_id: string | null
          reaction_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          match_id?: string | null
          post_id?: string | null
          reaction_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          match_id?: string | null
          post_id?: string | null
          reaction_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          caption: string
          created_at: string
          id: string
          tags: Json | null
          type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          caption: string
          created_at?: string
          id?: string
          tags?: Json | null
          type: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          tags?: Json | null
          type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          favorite_team: string | null
          id: string
          playstyle: string | null
          privacy_public: boolean | null
          rank_points: number | null
          theme_preference: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          favorite_team?: string | null
          id: string
          playstyle?: string | null
          privacy_public?: boolean | null
          rank_points?: number | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          favorite_team?: string | null
          id?: string
          playstyle?: string | null
          privacy_public?: boolean | null
          rank_points?: number | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      squads: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          platform: string
          squad_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          platform: string
          squad_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          platform?: string
          squad_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_updates: {
        Row: {
          created_at: string
          detailed_description: string
          how_it_improves: string
          id: string
          is_published: boolean | null
          summary: string
          title: string
          update_type: string
          updated_at: string
          what_was_done: string
          why_it_was_done: string
        }
        Insert: {
          created_at?: string
          detailed_description: string
          how_it_improves: string
          id?: string
          is_published?: boolean | null
          summary: string
          title: string
          update_type: string
          updated_at?: string
          what_was_done: string
          why_it_was_done: string
        }
        Update: {
          created_at?: string
          detailed_description?: string
          how_it_improves?: string
          id?: string
          is_published?: boolean | null
          summary?: string
          title?: string
          update_type?: string
          updated_at?: string
          what_was_done?: string
          why_it_was_done?: string
        }
        Relationships: []
      }
      tournament_brackets: {
        Row: {
          away_score: number | null
          away_team: string | null
          away_user_id: string | null
          created_at: string
          group_name: string | null
          home_score: number | null
          home_team: string | null
          home_user_id: string | null
          id: string
          league_id: string
          match_number: number
          round: string
          status: string
          winner_user_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team?: string | null
          away_user_id?: string | null
          created_at?: string
          group_name?: string | null
          home_score?: number | null
          home_team?: string | null
          home_user_id?: string | null
          id?: string
          league_id: string
          match_number?: number
          round: string
          status?: string
          winner_user_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team?: string | null
          away_user_id?: string | null
          created_at?: string
          group_name?: string | null
          home_score?: number | null
          home_team?: string | null
          home_user_id?: string | null
          id?: string
          league_id?: string
          match_number?: number
          round?: string
          status?: string
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_brackets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      league_standings: {
        Row: {
          avatar_url: string | null
          draws: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          league_id: string | null
          losses: number | null
          played: number | null
          points: number | null
          team: string | null
          user_id: string | null
          username: string | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      rivalry_stats: {
        Row: {
          draws: number | null
          last_played: string | null
          losses: number | null
          rival_name: string | null
          total_matches: number | null
          user_id: string | null
          win_rate: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_league_member: {
        Args: { _league_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
