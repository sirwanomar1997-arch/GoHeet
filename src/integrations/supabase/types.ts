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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          id: string
          name: string
          props: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          props?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          props?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      avatar_generation_logs: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      capture_sessions: {
        Row: {
          consumed_at: string | null
          device_kind: string | null
          id: string
          started_at: string
          status: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          device_kind?: string | null
          id?: string
          started_at?: string
          status?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          device_kind?: string | null
          id?: string
          started_at?: string
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          moment_id: string
          parent_id: string | null
          status: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          moment_id: string
          parent_id?: string | null
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          moment_id?: string
          parent_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_profile_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          requester_id: string
          status: string
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          requester_id: string
          status?: string
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          requester_id?: string
          status?: string
          updated_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          moment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          reason: string | null
          report_id: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          reason?: string | null
          report_id?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          report_id?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_views: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          moment_id: string
          qualified: boolean
          view_day: string
          viewer_id: string | null
          watched_ms: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          moment_id: string
          qualified?: boolean
          view_day?: string
          viewer_id?: string | null
          watched_ms?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          moment_id?: string
          qualified?: boolean
          view_day?: string
          viewer_id?: string | null
          watched_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "moment_views_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          author_id: string
          caption: string | null
          capture_session_id: string | null
          captured_at: string
          comment_count: number
          created_at: string
          deleted_at: string | null
          duration_ms: number | null
          id: string
          kind: string
          like_count: number
          location_label: string | null
          media_path: string
          moderation_state: string
          music_offset_ms: number
          music_track_id: string | null
          music_volume: number
          original_audio_volume: number
          overlay: Json | null
          save_count: number
          status: string
          style_filter: string | null
          thumbnail_path: string | null
          view_count: number
        }
        Insert: {
          author_id: string
          caption?: string | null
          capture_session_id?: string | null
          captured_at?: string
          comment_count?: number
          created_at?: string
          deleted_at?: string | null
          duration_ms?: number | null
          id?: string
          kind?: string
          like_count?: number
          location_label?: string | null
          media_path: string
          moderation_state?: string
          music_offset_ms?: number
          music_track_id?: string | null
          music_volume?: number
          original_audio_volume?: number
          overlay?: Json | null
          save_count?: number
          status?: string
          style_filter?: string | null
          thumbnail_path?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string
          caption?: string | null
          capture_session_id?: string | null
          captured_at?: string
          comment_count?: number
          created_at?: string
          deleted_at?: string | null
          duration_ms?: number | null
          id?: string
          kind?: string
          like_count?: number
          location_label?: string | null
          media_path?: string
          moderation_state?: string
          music_offset_ms?: number
          music_track_id?: string | null
          music_volume?: number
          original_audio_volume?: number
          overlay?: Json | null
          save_count?: number
          status?: string
          style_filter?: string | null
          thumbnail_path?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "moments_author_profile_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_capture_session_id_fkey"
            columns: ["capture_session_id"]
            isOneToOne: false
            referencedRelation: "capture_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_music_track_id_fkey"
            columns: ["music_track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      music_tracks: {
        Row: {
          active: boolean
          artist: string
          artwork_url: string | null
          attribution_text: string | null
          audio_path: string
          created_at: string
          duration_ms: number | null
          genres: string[]
          id: string
          license_ends_at: string | null
          license_id: string | null
          license_scope: string | null
          license_starts_at: string | null
          mood: string | null
          provider: string
          provider_track_id: string | null
          status: string
          territories: string[]
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          artist: string
          artwork_url?: string | null
          attribution_text?: string | null
          audio_path: string
          created_at?: string
          duration_ms?: number | null
          genres?: string[]
          id?: string
          license_ends_at?: string | null
          license_id?: string | null
          license_scope?: string | null
          license_starts_at?: string | null
          mood?: string | null
          provider?: string
          provider_track_id?: string | null
          status?: string
          territories?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          artist?: string
          artwork_url?: string | null
          attribution_text?: string | null
          audio_path?: string
          created_at?: string
          duration_ms?: number | null
          genres?: string[]
          id?: string
          license_ends_at?: string | null
          license_id?: string | null
          license_scope?: string | null
          license_starts_at?: string | null
          mood?: string | null
          provider?: string
          provider_track_id?: string | null
          status?: string
          territories?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          moment_id: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          moment_id?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          moment_id?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_profile_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          id: string
          policy_key: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          policy_key: string
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          id?: string
          policy_key?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          birth_date: string
          created_at: string
          user_id: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_comments: string
          allow_messages: string
          avatar_url: string | null
          banned_at: string | null
          bio: string | null
          created_at: string
          deleted_at: string | null
          deletion_requested_at: string | null
          discoverable: boolean
          display_name: string | null
          follower_count: number
          following_count: number
          id: string
          is_private: boolean
          moment_count: number
          show_following: boolean
          show_likes: boolean
          show_saves: boolean
          social_links: Json
          suspended_until: string | null
          total_likes: number
          total_views: number
          updated_at: string
          username: string
        }
        Insert: {
          allow_comments?: string
          allow_messages?: string
          avatar_url?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_requested_at?: string | null
          discoverable?: boolean
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id: string
          is_private?: boolean
          moment_count?: number
          show_following?: boolean
          show_likes?: boolean
          show_saves?: boolean
          social_links?: Json
          suspended_until?: string | null
          total_likes?: number
          total_views?: number
          updated_at?: string
          username: string
        }
        Update: {
          allow_comments?: string
          allow_messages?: string
          avatar_url?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_requested_at?: string | null
          discoverable?: boolean
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          is_private?: boolean
          moment_count?: number
          show_following?: boolean
          show_likes?: boolean
          show_saves?: boolean
          social_links?: Json
          suspended_until?: string | null
          total_likes?: number
          total_views?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: string
          created_at: string
          details: string | null
          id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: string | null
          id?: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: string | null
          id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      saves: {
        Row: {
          created_at: string
          id: string
          moment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      username_taken: { Args: { _username: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "support"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "support"],
    },
  },
} as const
