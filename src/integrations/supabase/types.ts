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
      badges: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          icon_emoji: string | null
          id: string
          name: string
          points_required: number | null
          rarity: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          name: string
          points_required?: number | null
          rarity?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          name?: string
          points_required?: number | null
          rarity?: string | null
        }
        Relationships: []
      }
      business_metrics: {
        Row: {
          avg_ticket: number | null
          cac: number | null
          capacity_used: number | null
          channel_roi: Json | null
          conversion_rate: number | null
          created_at: string | null
          engagement_rate: number | null
          error_rate: number | null
          id: string
          leads_generated: number | null
          lifetime_value: number | null
          metric_date: string
          notes: string | null
          nps_score: number | null
          operational_costs: number | null
          orders_count: number | null
          product_margins: Json | null
          production_time: number | null
          repeat_rate: number | null
          revenue: number | null
          reviews_avg: number | null
          reviews_count: number | null
          satisfaction_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_ticket?: number | null
          cac?: number | null
          capacity_used?: number | null
          channel_roi?: Json | null
          conversion_rate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          error_rate?: number | null
          id?: string
          leads_generated?: number | null
          lifetime_value?: number | null
          metric_date?: string
          notes?: string | null
          nps_score?: number | null
          operational_costs?: number | null
          orders_count?: number | null
          product_margins?: Json | null
          production_time?: number | null
          repeat_rate?: number | null
          revenue?: number | null
          reviews_avg?: number | null
          reviews_count?: number | null
          satisfaction_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_ticket?: number | null
          cac?: number | null
          capacity_used?: number | null
          channel_roi?: Json | null
          conversion_rate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          error_rate?: number | null
          id?: string
          leads_generated?: number | null
          lifetime_value?: number | null
          metric_date?: string
          notes?: string | null
          nps_score?: number | null
          operational_costs?: number | null
          orders_count?: number | null
          product_margins?: Json | null
          production_time?: number | null
          repeat_rate?: number | null
          revenue?: number | null
          reviews_avg?: number | null
          reviews_count?: number | null
          satisfaction_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_mappings: {
        Row: {
          calendar_id: string
          created_at: string | null
          google_event_id: string
          id: string
          task_schedule_id: string | null
          user_id: string | null
        }
        Insert: {
          calendar_id: string
          created_at?: string | null
          google_event_id: string
          id?: string
          task_schedule_id?: string | null
          user_id?: string | null
        }
        Update: {
          calendar_id?: string
          created_at?: string | null
          google_event_id?: string
          id?: string
          task_schedule_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_mappings_task_schedule_id_fkey"
            columns: ["task_schedule_id"]
            isOneToOne: false
            referencedRelation: "task_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_mappings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_balance: {
        Row: {
          balance: number
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          notes: string | null
        }
        Insert: {
          balance: number
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          notes?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_balance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_entries: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          recurring_frequency: string | null
          subcategory: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_frequency?: string | null
          subcategory?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_frequency?: string | null
          subcategory?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_metrics: {
        Row: {
          arr: number | null
          avg_order_value: number | null
          burn_rate: number | null
          cac: number | null
          calculated_at: string | null
          customer_count: number | null
          gross_margin: number | null
          id: string
          ltv: number | null
          ltv_cac_ratio: number | null
          margin_percentage: number | null
          month: string
          mrr: number | null
          net_margin: number | null
          new_customers: number | null
          runway_months: number | null
          total_expenses: number | null
          total_revenue: number | null
        }
        Insert: {
          arr?: number | null
          avg_order_value?: number | null
          burn_rate?: number | null
          cac?: number | null
          calculated_at?: string | null
          customer_count?: number | null
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          ltv_cac_ratio?: number | null
          margin_percentage?: number | null
          month: string
          mrr?: number | null
          net_margin?: number | null
          new_customers?: number | null
          runway_months?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
        }
        Update: {
          arr?: number | null
          avg_order_value?: number | null
          burn_rate?: number | null
          cac?: number | null
          calculated_at?: string | null
          customer_count?: number | null
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          ltv_cac_ratio?: number | null
          margin_percentage?: number | null
          month?: string
          mrr?: number | null
          net_margin?: number | null
          new_customers?: number | null
          runway_months?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          refresh_token: string
          token_expiry: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token: string
          token_expiry: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token?: string
          token_expiry?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          metric_type: string
          objective_id: string
          start_value: number | null
          status: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metric_type: string
          objective_id: string
          start_value?: number | null
          status?: string
          target_value: number
          title: string
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metric_type?: string
          objective_id?: string
          start_value?: number | null
          status?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "okr_financial_summary"
            referencedColumns: ["objective_id"]
          },
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "okrs_with_progress"
            referencedColumns: ["objective_id"]
          },
        ]
      }
      marketing_spend: {
        Row: {
          amount: number
          channel: string
          conversions: number | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          leads_generated: number | null
          notes: string | null
          revenue_generated: number | null
        }
        Insert: {
          amount: number
          channel: string
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          leads_generated?: number | null
          notes?: string | null
          revenue_generated?: number | null
        }
        Update: {
          amount?: number
          channel?: string
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          leads_generated?: number | null
          notes?: string | null
          revenue_generated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_spend_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          budget_allocated: number | null
          cost_savings: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          owner_user_id: string | null
          phase: number | null
          quarter: string
          revenue_impact: number | null
          status: string
          target_date: string | null
          title: string
          updated_at: string | null
          year: number
        }
        Insert: {
          budget_allocated?: number | null
          cost_savings?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          owner_user_id?: string | null
          phase?: number | null
          quarter: string
          revenue_impact?: number | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string | null
          year: number
        }
        Update: {
          budget_allocated?: number | null
          cost_savings?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          owner_user_id?: string | null
          phase?: number | null
          quarter?: string
          revenue_impact?: number | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_evidences: {
        Row: {
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          okr_update_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          okr_update_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          okr_update_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "okr_evidences_okr_update_id_fkey"
            columns: ["okr_update_id"]
            isOneToOne: false
            referencedRelation: "okr_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_evidences_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_task_links: {
        Row: {
          contribution_weight: number | null
          created_at: string | null
          id: string
          key_result_id: string
          task_id: string
        }
        Insert: {
          contribution_weight?: number | null
          created_at?: string | null
          id?: string
          key_result_id: string
          task_id: string
        }
        Update: {
          contribution_weight?: number | null
          created_at?: string | null
          id?: string
          key_result_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "okr_task_links_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_task_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_updates: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          key_result_id: string
          new_value: number
          previous_value: number | null
          updated_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          key_result_id: string
          new_value: number
          previous_value?: number | null
          updated_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          key_result_id?: string
          new_value?: number
          previous_value?: number | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "okr_updates_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          created_at: string | null
          id: string
          points: number
          reason: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points: number
          reason?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          reason?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_entries: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          customer_type: string | null
          date: string
          id: string
          notes: string | null
          payment_method: string | null
          product_category: string
          product_name: string | null
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_type?: string | null
          date: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_category: string
          product_name?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_type?: string | null
          date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_category?: string
          product_name?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_change_suggestions: {
        Row: {
          created_at: string | null
          id: string
          priority_score: number | null
          processed_at: string | null
          reason: string | null
          status: string | null
          suggested_date: string
          suggested_end: string
          suggested_start: string
          task_id: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          priority_score?: number | null
          processed_at?: string | null
          reason?: string | null
          status?: string | null
          suggested_date: string
          suggested_end: string
          suggested_start: string
          task_id: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          priority_score?: number | null
          processed_at?: string | null
          reason?: string | null
          status?: string | null
          suggested_date?: string
          suggested_end?: string
          suggested_start?: string
          task_id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_change_suggestions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_change_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          current_phase: number
          id: string
          is_week_locked: boolean | null
          updated_at: string | null
          week_deadline: string
          week_start: string
        }
        Insert: {
          current_phase?: number
          id?: string
          is_week_locked?: boolean | null
          updated_at?: string | null
          week_deadline?: string
          week_start?: string
        }
        Update: {
          current_phase?: number
          id?: string
          is_week_locked?: boolean | null
          updated_at?: string | null
          week_deadline?: string
          week_start?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          ai_questions: Json | null
          collaborator_feedback: Json | null
          completed_at: string | null
          completed_by_user: boolean | null
          id: string
          impact_measurement: Json | null
          leader_evaluation: Json | null
          leader_feedback: Json | null
          task_id: string
          task_metrics: Json | null
          user_id: string
          user_insights: Json | null
          validated_by_leader: boolean | null
        }
        Insert: {
          ai_questions?: Json | null
          collaborator_feedback?: Json | null
          completed_at?: string | null
          completed_by_user?: boolean | null
          id?: string
          impact_measurement?: Json | null
          leader_evaluation?: Json | null
          leader_feedback?: Json | null
          task_id: string
          task_metrics?: Json | null
          user_id: string
          user_insights?: Json | null
          validated_by_leader?: boolean | null
        }
        Update: {
          ai_questions?: Json | null
          collaborator_feedback?: Json | null
          completed_at?: string | null
          completed_by_user?: boolean | null
          id?: string
          impact_measurement?: Json | null
          leader_evaluation?: Json | null
          leader_feedback?: Json | null
          task_id?: string
          task_metrics?: Json | null
          user_id?: string
          user_insights?: Json | null
          validated_by_leader?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_financial_impact: {
        Row: {
          completion_id: string | null
          cost_incurred: number | null
          created_at: string | null
          id: string
          notes: string | null
          revenue_generated: number | null
          roi_percentage: number | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          completion_id?: string | null
          cost_incurred?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          revenue_generated?: number | null
          roi_percentage?: number | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          completion_id?: string | null
          cost_incurred?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          revenue_generated?: number | null
          roi_percentage?: number | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_financial_impact_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "task_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_financial_impact_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_schedule: {
        Row: {
          accepted_at: string | null
          collaborator_user_id: string | null
          created_at: string | null
          id: string
          is_collaborative: boolean | null
          scheduled_date: string
          scheduled_end: string
          scheduled_start: string
          status: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string | null
          week_start: string
        }
        Insert: {
          accepted_at?: string | null
          collaborator_user_id?: string | null
          created_at?: string | null
          id?: string
          is_collaborative?: boolean | null
          scheduled_date: string
          scheduled_end: string
          scheduled_start: string
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          week_start: string
        }
        Update: {
          accepted_at?: string | null
          collaborator_user_id?: string | null
          created_at?: string | null
          id?: string
          is_collaborative?: boolean | null
          scheduled_date?: string
          scheduled_end?: string
          scheduled_start?: string
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_schedule_collaborator_user_id_fkey"
            columns: ["collaborator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_schedule_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_swaps: {
        Row: {
          created_at: string
          id: string
          leader_comment: string | null
          mode: string
          new_description: string | null
          new_title: string
          old_title: string
          task_id: string
          user_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          leader_comment?: string | null
          mode: string
          new_description?: string | null
          new_title: string
          old_title: string
          task_id: string
          user_id: string
          week_number: number
        }
        Update: {
          created_at?: string
          id?: string
          leader_comment?: string | null
          mode?: string
          new_description?: string | null
          new_title?: string
          old_title?: string
          task_id?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_swaps_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_swaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_cost: number | null
          area: string | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          id: string
          leader_id: string | null
          order_index: number
          phase: number
          title: string
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          area?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          leader_id?: string | null
          order_index?: number
          phase: number
          title: string
          user_id: string
        }
        Update: {
          actual_cost?: number | null
          area?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          leader_id?: string | null
          order_index?: number
          phase?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          best_streak: number | null
          created_at: string | null
          current_streak: number | null
          id: string
          perfect_weeks: number | null
          tasks_completed_total: number | null
          tasks_validated_total: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          best_streak?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          perfect_weeks?: number | null
          tasks_completed_total?: number | null
          tasks_validated_total?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          best_streak?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          perfect_weeks?: number | null
          tasks_completed_total?: number | null
          tasks_validated_total?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_weekly_availability: {
        Row: {
          created_at: string | null
          friday_available: boolean | null
          friday_end: string | null
          friday_start: string | null
          id: string
          monday_available: boolean | null
          monday_end: string | null
          monday_start: string | null
          preferred_hours_per_day: number | null
          preferred_time_of_day: string | null
          saturday_available: boolean | null
          saturday_end: string | null
          saturday_start: string | null
          submitted_at: string | null
          sunday_available: boolean | null
          sunday_end: string | null
          sunday_start: string | null
          thursday_available: boolean | null
          thursday_end: string | null
          thursday_start: string | null
          tuesday_available: boolean | null
          tuesday_end: string | null
          tuesday_start: string | null
          user_id: string | null
          wednesday_available: boolean | null
          wednesday_end: string | null
          wednesday_start: string | null
          week_start: string
        }
        Insert: {
          created_at?: string | null
          friday_available?: boolean | null
          friday_end?: string | null
          friday_start?: string | null
          id?: string
          monday_available?: boolean | null
          monday_end?: string | null
          monday_start?: string | null
          preferred_hours_per_day?: number | null
          preferred_time_of_day?: string | null
          saturday_available?: boolean | null
          saturday_end?: string | null
          saturday_start?: string | null
          submitted_at?: string | null
          sunday_available?: boolean | null
          sunday_end?: string | null
          sunday_start?: string | null
          thursday_available?: boolean | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_available?: boolean | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          user_id?: string | null
          wednesday_available?: boolean | null
          wednesday_end?: string | null
          wednesday_start?: string | null
          week_start: string
        }
        Update: {
          created_at?: string | null
          friday_available?: boolean | null
          friday_end?: string | null
          friday_start?: string | null
          id?: string
          monday_available?: boolean | null
          monday_end?: string | null
          monday_start?: string | null
          preferred_hours_per_day?: number | null
          preferred_time_of_day?: string | null
          saturday_available?: boolean | null
          saturday_end?: string | null
          saturday_start?: string | null
          submitted_at?: string | null
          sunday_available?: boolean | null
          sunday_end?: string | null
          sunday_start?: string | null
          thursday_available?: boolean | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_available?: boolean | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          user_id?: string | null
          wednesday_available?: boolean | null
          wednesday_end?: string | null
          wednesday_start?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_weekly_data: {
        Row: {
          created_at: string | null
          id: string
          mode: string
          task_limit: number
          user_id: string
          week_deadline: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode: string
          task_limit: number
          user_id: string
          week_deadline: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string
          task_limit?: number
          user_id?: string
          week_deadline?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          strategic_objectives: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          role: string
          strategic_objectives?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          strategic_objectives?: string | null
          username?: string
        }
        Relationships: []
      }
      week_config: {
        Row: {
          agendas_generated: boolean | null
          all_users_ready: boolean | null
          availability_deadline: string
          created_at: string | null
          generated_at: string | null
          id: string
          ready_count: number | null
          total_users: number | null
          users_pending: string[] | null
          week_start: string
          week_start_time: string
        }
        Insert: {
          agendas_generated?: boolean | null
          all_users_ready?: boolean | null
          availability_deadline: string
          created_at?: string | null
          generated_at?: string | null
          id?: string
          ready_count?: number | null
          total_users?: number | null
          users_pending?: string[] | null
          week_start: string
          week_start_time: string
        }
        Update: {
          agendas_generated?: boolean | null
          all_users_ready?: boolean | null
          availability_deadline?: string
          created_at?: string | null
          generated_at?: string | null
          id?: string
          ready_count?: number | null
          total_users?: number | null
          users_pending?: string[] | null
          week_start?: string
          week_start_time?: string
        }
        Relationships: []
      }
      weekly_schedule_preview: {
        Row: {
          can_suggest_changes: boolean | null
          created_at: string | null
          id: string
          preview_data: Json
          priority_order: number | null
          submitted_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          can_suggest_changes?: boolean | null
          created_at?: string | null
          id?: string
          preview_data: Json
          priority_order?: number | null
          submitted_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          can_suggest_changes?: boolean | null
          created_at?: string | null
          id?: string
          preview_data?: Json
          priority_order?: number | null
          submitted_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_schedule_preview_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      expenses_by_category_current_month: {
        Row: {
          avg_amount: number | null
          category: string | null
          percentage_of_total: number | null
          total_amount: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      marketing_roi_by_channel: {
        Row: {
          cac: number | null
          channel: string | null
          conversion_rate: number | null
          roi_ratio: number | null
          total_conversions: number | null
          total_leads: number | null
          total_revenue: number | null
          total_spend: number | null
        }
        Relationships: []
      }
      okr_financial_summary: {
        Row: {
          budget_allocated: number | null
          cost_savings: number | null
          key_results_count: number | null
          linked_tasks_count: number | null
          objective_id: string | null
          objective_title: string | null
          revenue_impact: number | null
          roi_percentage: number | null
          total_cost_from_tasks: number | null
          total_revenue_from_tasks: number | null
        }
        Relationships: []
      }
      okrs_with_progress: {
        Row: {
          achieved_krs: number | null
          at_risk_krs: number | null
          behind_krs: number | null
          created_at: string | null
          linked_tasks: number | null
          objective_description: string | null
          objective_id: string | null
          objective_progress: number | null
          objective_status: string | null
          objective_title: string | null
          on_track_krs: number | null
          owner_name: string | null
          owner_user_id: string | null
          quarter: string | null
          target_date: string | null
          total_key_results: number | null
          updated_at: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objectives_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_by_product_current_month: {
        Row: {
          avg_price: number | null
          order_count: number | null
          percentage_of_total: number | null
          product_category: string | null
          total_quantity: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_kr_progress: { Args: { kr_id: string }; Returns: number }
      calculate_kr_progress_from_tasks: {
        Args: { kr_id: string }
        Returns: number
      }
      calculate_monthly_metrics: {
        Args: { target_month: string }
        Returns: {
          avg_order_value: number
          customer_count: number
          gross_margin: number
          margin_percentage: number
          new_customers: number
          total_expenses: number
          total_revenue: number
        }[]
      }
      calculate_objective_progress: {
        Args: { obj_id: string }
        Returns: number
      }
      calculate_objective_progress_from_tasks: {
        Args: { obj_id: string }
        Returns: number
      }
      count_user_swaps_for_week: {
        Args: { p_user_id: string; p_week_number: number }
        Returns: number
      }
      get_next_week_start: { Args: never; Returns: string }
      update_financial_metrics: {
        Args: { target_month: string }
        Returns: undefined
      }
      user_completed_availability: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
