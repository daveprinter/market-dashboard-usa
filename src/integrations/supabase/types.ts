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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string | null
          category: Database["public"]["Enums"]["biz_category"] | null
          created_at: string
          details: Json | null
          id: number
          tx_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          category?: Database["public"]["Enums"]["biz_category"] | null
          created_at?: string
          details?: Json | null
          id?: number
          tx_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          category?: Database["public"]["Enums"]["biz_category"] | null
          created_at?: string
          details?: Json | null
          id?: number
          tx_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          category: Database["public"]["Enums"]["biz_category"]
          commission: number
          completion_status: Database["public"]["Enums"]["done_status"]
          created_at: string
          created_by: string | null
          description: string
          expenses: number
          gross: number
          id: string
          is_demo: boolean
          net: number | null
          payment_status: Database["public"]["Enums"]["pay_status"]
          platform: string
          ref: string
          refunds: number
          source: Database["public"]["Enums"]["record_source"]
          state_code: string
          tx_date: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["biz_category"]
          commission?: number
          completion_status?: Database["public"]["Enums"]["done_status"]
          created_at?: string
          created_by?: string | null
          description?: string
          expenses?: number
          gross?: number
          id?: string
          is_demo?: boolean
          net?: number | null
          payment_status?: Database["public"]["Enums"]["pay_status"]
          platform: string
          ref?: string
          refunds?: number
          source?: Database["public"]["Enums"]["record_source"]
          state_code: string
          tx_date?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["biz_category"]
          commission?: number
          completion_status?: Database["public"]["Enums"]["done_status"]
          created_at?: string
          created_by?: string | null
          description?: string
          expenses?: number
          gross?: number
          id?: string
          is_demo?: boolean
          net?: number | null
          payment_status?: Database["public"]["Enums"]["pay_status"]
          platform?: string
          ref?: string
          refunds?: number
          source?: Database["public"]["Enums"]["record_source"]
          state_code?: string
          tx_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_see_category: {
        Args: { _cat: Database["public"]["Enums"]["biz_category"] }
        Returns: boolean
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "tax_officer"
      biz_category:
        | "marketplace"
        | "event_space"
        | "online"
        | "tax_refund"
        | "tickets"
      done_status: "open" | "in_progress" | "completed" | "cancelled"
      pay_status: "pending" | "paid" | "failed" | "refunded"
      record_source: "manual" | "import" | "api"
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
      app_role: ["admin", "manager", "staff", "tax_officer"],
      biz_category: [
        "marketplace",
        "event_space",
        "online",
        "tax_refund",
        "tickets",
      ],
      done_status: ["open", "in_progress", "completed", "cancelled"],
      pay_status: ["pending", "paid", "failed", "refunded"],
      record_source: ["manual", "import", "api"],
    },
  },
} as const
