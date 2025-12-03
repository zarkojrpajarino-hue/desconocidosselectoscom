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
      ai_analysis_results: {
        Row: {
          analysis_data: Json
          created_at: string | null
          generated_at: string | null
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          analysis_data: Json
          created_at?: string | null
          generated_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json
          created_at?: string | null
          generated_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_analysis_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_actions: {
        Row: {
          action_type: string
          alert_id: string
          created_at: string | null
          id: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          alert_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          alert_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_actions_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "smart_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "alert_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          alert_template: Json
          check_frequency: string | null
          condition: Json
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          rule_type: string
          source_table: string
          updated_at: string | null
        }
        Insert: {
          alert_template: Json
          check_frequency?: string | null
          condition: Json
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          rule_type: string
          source_table: string
          updated_at?: string | null
        }
        Update: {
          alert_template?: Json
          check_frequency?: string | null
          condition?: Json
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          rule_type?: string
          source_table?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      budget_items: {
        Row: {
          actual_amount: number | null
          budgeted_amount: number | null
          category: string | null
          created_at: string | null
          id: string
          organization_id: string
          period: string | null
          status: string | null
          updated_at: string | null
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          period?: string | null
          status?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          period?: string | null
          status?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "business_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
          organization_id: string | null
        }
        Insert: {
          balance: number
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          notes?: string | null
          organization_id?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_balance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cash_balance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_balance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_forecast: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          id: string
          inflows_breakdown: Json | null
          month: string | null
          net_cash_flow: number | null
          opening_balance: number | null
          organization_id: string
          outflows_breakdown: Json | null
          projected_inflows: number | null
          projected_outflows: number | null
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          id?: string
          inflows_breakdown?: Json | null
          month?: string | null
          net_cash_flow?: number | null
          opening_balance?: number | null
          organization_id: string
          outflows_breakdown?: Json | null
          projected_inflows?: number | null
          projected_outflows?: number | null
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          id?: string
          inflows_breakdown?: Json | null
          month?: string | null
          net_cash_flow?: number | null
          opening_balance?: number | null
          organization_id?: string
          outflows_breakdown?: Json | null
          projected_inflows?: number | null
          projected_outflows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_forecast_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          features: Json | null
          id: string
          last_analyzed_at: string | null
          market_position: string | null
          name: string
          notes: string | null
          organization_id: string
          pricing_info: Json | null
          strengths: string[] | null
          target_audience: string | null
          updated_at: string
          weaknesses: string[] | null
          website: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          last_analyzed_at?: string | null
          market_position?: string | null
          name: string
          notes?: string | null
          organization_id: string
          pricing_info?: Json | null
          strengths?: string[] | null
          target_audience?: string | null
          updated_at?: string
          weaknesses?: string[] | null
          website?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          last_analyzed_at?: string | null
          market_position?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          pricing_info?: Json | null
          strengths?: string[] | null
          target_audience?: string | null
          updated_at?: string
          weaknesses?: string[] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "competitors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_velocity_cache: {
        Row: {
          average_days: number | null
          calculated_at: string | null
          deal_count: number | null
          id: string
          organization_id: string
          stage: string
        }
        Insert: {
          average_days?: number | null
          calculated_at?: string | null
          deal_count?: number | null
          id?: string
          organization_id: string
          stage: string
        }
        Update: {
          average_days?: number | null
          calculated_at?: string | null
          deal_count?: number | null
          id?: string
          organization_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_velocity_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expense_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          runway_months?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_projections: {
        Row: {
          alerts: Json | null
          breakdown: Json | null
          burn_rate: number | null
          calculated_at: string | null
          calculated_cac: number | null
          calculated_ltv: number | null
          confidence_level: number | null
          id: string
          ltv_cac_ratio: number | null
          organization_id: string
          period: string | null
          projected_expenses: number | null
          projected_revenue: number | null
          revenue_from_new_customers: number | null
          revenue_from_pipeline: number | null
          revenue_from_recurring: number | null
          runway_months: number | null
        }
        Insert: {
          alerts?: Json | null
          breakdown?: Json | null
          burn_rate?: number | null
          calculated_at?: string | null
          calculated_cac?: number | null
          calculated_ltv?: number | null
          confidence_level?: number | null
          id?: string
          ltv_cac_ratio?: number | null
          organization_id: string
          period?: string | null
          projected_expenses?: number | null
          projected_revenue?: number | null
          revenue_from_new_customers?: number | null
          revenue_from_pipeline?: number | null
          revenue_from_recurring?: number | null
          runway_months?: number | null
        }
        Update: {
          alerts?: Json | null
          breakdown?: Json | null
          burn_rate?: number | null
          calculated_at?: string | null
          calculated_cac?: number | null
          calculated_ltv?: number | null
          confidence_level?: number | null
          id?: string
          ltv_cac_ratio?: number | null
          organization_id?: string
          period?: string | null
          projected_expenses?: number | null
          projected_revenue?: number | null
          revenue_from_new_customers?: number | null
          revenue_from_pipeline?: number | null
          revenue_from_recurring?: number | null
          runway_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_projections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_ratios_cache: {
        Row: {
          calculated_at: string | null
          cash_conversion_cycle: number | null
          current_ratio: number | null
          debt_to_equity: number | null
          gross_margin: number | null
          id: string
          net_margin: number | null
          operating_margin: number | null
          organization_id: string
          quick_ratio: number | null
          revenue_per_employee: number | null
          roi: number | null
          working_capital_ratio: number | null
        }
        Insert: {
          calculated_at?: string | null
          cash_conversion_cycle?: number | null
          current_ratio?: number | null
          debt_to_equity?: number | null
          gross_margin?: number | null
          id?: string
          net_margin?: number | null
          operating_margin?: number | null
          organization_id: string
          quick_ratio?: number | null
          revenue_per_employee?: number | null
          roi?: number | null
          working_capital_ratio?: number | null
        }
        Update: {
          calculated_at?: string | null
          cash_conversion_cycle?: number | null
          current_ratio?: number | null
          debt_to_equity?: number | null
          gross_margin?: number | null
          id?: string
          net_margin?: number | null
          operating_margin?: number | null
          organization_id?: string
          quick_ratio?: number | null
          revenue_per_employee?: number | null
          roi?: number | null
          working_capital_ratio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ratios_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
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
          auto_update: boolean | null
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          linked_kpi: string | null
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
          auto_update?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          linked_kpi?: string | null
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
          auto_update?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          linked_kpi?: string | null
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
      kpi_benchmarks: {
        Row: {
          average_value: number | null
          id: string
          industry: string | null
          kpi_metric: string | null
          top_10_percentile: number | null
          top_25_percentile: number | null
          updated_at: string | null
        }
        Insert: {
          average_value?: number | null
          id?: string
          industry?: string | null
          kpi_metric?: string | null
          top_10_percentile?: number | null
          top_25_percentile?: number | null
          updated_at?: string | null
        }
        Update: {
          average_value?: number | null
          id?: string
          industry?: string | null
          kpi_metric?: string | null
          top_10_percentile?: number | null
          top_25_percentile?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kpi_change_history: {
        Row: {
          change_percentage: number | null
          changed_at: string | null
          contributing_factors: Json | null
          id: string
          kpi_metric: string
          new_value: number | null
          old_value: number | null
          organization_id: string
        }
        Insert: {
          change_percentage?: number | null
          changed_at?: string | null
          contributing_factors?: Json | null
          id?: string
          kpi_metric: string
          new_value?: number | null
          old_value?: number | null
          organization_id: string
        }
        Update: {
          change_percentage?: number | null
          changed_at?: string | null
          contributing_factors?: Json | null
          id?: string
          kpi_metric?: string
          new_value?: number | null
          old_value?: number | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_change_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_targets: {
        Row: {
          created_at: string | null
          current_value: number | null
          id: string
          kpi_metric: string
          organization_id: string
          period_type: string | null
          target_date: string | null
          target_value: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          kpi_metric: string
          organization_id: string
          period_type?: string | null
          target_date?: string | null
          target_value: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          kpi_metric?: string
          organization_id?: string
          period_type?: string | null
          target_date?: string | null
          target_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_engagement: {
        Row: {
          event_data: Json | null
          event_type: string | null
          id: string
          lead_id: string
          occurred_at: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type?: string | null
          id?: string
          lead_id: string
          occurred_at?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string | null
          id?: string
          lead_id?: string
          occurred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_engagement_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          interaction_type: string
          lead_id: string
          next_steps: string | null
          outcome: string | null
          sentiment: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          interaction_type: string
          lead_id: string
          next_steps?: string | null
          outcome?: string | null
          sentiment?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          interaction_type?: string
          lead_id?: string
          next_steps?: string | null
          outcome?: string | null
          sentiment?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          behavior_score: number | null
          calculated_at: string | null
          classification: string | null
          engagement_score: number | null
          fit_score: number | null
          id: string
          lead_id: string
          next_best_action: string | null
          organization_id: string
          probability_to_close: number | null
          source_score: number | null
          total_score: number | null
          urgency_score: number | null
        }
        Insert: {
          behavior_score?: number | null
          calculated_at?: string | null
          classification?: string | null
          engagement_score?: number | null
          fit_score?: number | null
          id?: string
          lead_id: string
          next_best_action?: string | null
          organization_id: string
          probability_to_close?: number | null
          source_score?: number | null
          total_score?: number | null
          urgency_score?: number | null
        }
        Update: {
          behavior_score?: number | null
          calculated_at?: string | null
          classification?: string | null
          engagement_score?: number | null
          fit_score?: number | null
          id?: string
          lead_id?: string
          next_best_action?: string | null
          organization_id?: string
          probability_to_close?: number | null
          source_score?: number | null
          total_score?: number | null
          urgency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          conversion_date: string | null
          converted_to_customer: boolean | null
          created_at: string | null
          created_by: string | null
          days_in_current_stage: number | null
          email: string | null
          estimated_value: number | null
          expected_revenue: number | null
          id: string
          interested_products: string[] | null
          last_contact_date: string | null
          last_stage_change: string | null
          lead_score: string | null
          lead_type: string | null
          lost_date: string | null
          lost_reason: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          next_action_type: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          pipeline_stage: string | null
          position: string | null
          priority: string
          probability: number | null
          revenue_entry_id: string | null
          source: string | null
          stage: string
          tags: string[] | null
          updated_at: string | null
          won_date: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          conversion_date?: string | null
          converted_to_customer?: boolean | null
          created_at?: string | null
          created_by?: string | null
          days_in_current_stage?: number | null
          email?: string | null
          estimated_value?: number | null
          expected_revenue?: number | null
          id?: string
          interested_products?: string[] | null
          last_contact_date?: string | null
          last_stage_change?: string | null
          lead_score?: string | null
          lead_type?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          name: string
          next_action?: string | null
          next_action_date?: string | null
          next_action_type?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          position?: string | null
          priority?: string
          probability?: number | null
          revenue_entry_id?: string | null
          source?: string | null
          stage?: string
          tags?: string[] | null
          updated_at?: string | null
          won_date?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          conversion_date?: string | null
          converted_to_customer?: boolean | null
          created_at?: string | null
          created_by?: string | null
          days_in_current_stage?: number | null
          email?: string | null
          estimated_value?: number | null
          expected_revenue?: number | null
          id?: string
          interested_products?: string[] | null
          last_contact_date?: string | null
          last_stage_change?: string | null
          lead_score?: string | null
          lead_type?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          next_action_type?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          position?: string | null
          priority?: string
          probability?: number | null
          revenue_entry_id?: string | null
          source?: string | null
          stage?: string
          tags?: string[] | null
          updated_at?: string | null
          won_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_reasons: {
        Row: {
          additional_notes: string | null
          deal_value: number | null
          id: string
          lead_id: string
          lost_at: string | null
          organization_id: string
          reason: string
        }
        Insert: {
          additional_notes?: string | null
          deal_value?: number | null
          id?: string
          lead_id: string
          lost_at?: string | null
          organization_id: string
          reason: string
        }
        Update: {
          additional_notes?: string | null
          deal_value?: number | null
          id?: string
          lead_id?: string
          lost_at?: string | null
          organization_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_reasons_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_reasons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          revenue_generated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_spend_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketing_spend_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_spend_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          organization_id: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
      onboarding_submissions: {
        Row: {
          account_email: string
          account_password_hash: string
          ai_prompt_generated: string | null
          annual_revenue_range: string | null
          business_description: string
          company_name: string
          company_size: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          current_problems: string
          id: string
          industry: string
          kpis_to_measure: Json
          lead_sources: Json
          main_objectives: string
          products_services: Json
          sales_cycle_days: number | null
          sales_process: string
          status: string | null
          target_customers: string
          team_structure: Json
          updated_at: string | null
          user_id: string | null
          value_proposition: string
        }
        Insert: {
          account_email: string
          account_password_hash: string
          ai_prompt_generated?: string | null
          annual_revenue_range?: string | null
          business_description: string
          company_name: string
          company_size: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          current_problems: string
          id?: string
          industry: string
          kpis_to_measure: Json
          lead_sources: Json
          main_objectives: string
          products_services: Json
          sales_cycle_days?: number | null
          sales_process: string
          status?: string | null
          target_customers: string
          team_structure: Json
          updated_at?: string | null
          user_id?: string | null
          value_proposition: string
        }
        Update: {
          account_email?: string
          account_password_hash?: string
          ai_prompt_generated?: string | null
          annual_revenue_range?: string | null
          business_description?: string
          company_name?: string
          company_size?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          current_problems?: string
          id?: string
          industry?: string
          kpis_to_measure?: Json
          lead_sources?: Json
          main_objectives?: string
          products_services?: Json
          sales_cycle_days?: number | null
          sales_process?: string
          status?: string | null
          target_customers?: string
          team_structure?: Json
          updated_at?: string | null
          user_id?: string | null
          value_proposition?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          created_at: string | null
          created_by: string
          custom_slug: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          slug_type: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          custom_slug?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          slug_type?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          custom_slug?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          slug_type?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_analysis_count: number | null
          ai_generation_completed_at: string | null
          ai_generation_error: string | null
          ai_generation_status: string
          annual_revenue_range: string | null
          average_ticket: number | null
          brand_perception: string | null
          budget_constraints: string | null
          business_description: string
          business_model: string | null
          business_type: string | null
          buying_motivations: Json | null
          churn_reasons: Json | null
          company_size: string
          competitive_advantage: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          conversion_rate: number | null
          created_at: string
          current_period_end: string | null
          current_problems: string
          customer_acquisition_channels: Json | null
          customer_pain_points: Json | null
          customer_retention_rate: number | null
          customers_goal_12_months: number | null
          decision_makers: string | null
          founded_year: number | null
          geographic_market: Json | null
          growth_priority: string | null
          icp_criteria: string | null
          id: string
          industry: string
          kpis_to_measure: Json
          last_ai_analysis_at: string | null
          lead_sources: Json
          main_objections: Json | null
          main_objectives: string
          market_growth_rate: string | null
          market_share_goal: number | null
          market_size: string | null
          monthly_leads: number | null
          monthly_marketing_budget: number | null
          name: string
          nps_score: number | null
          plan: string
          pricing_strategy: string | null
          products_services: Json
          purchase_triggers: Json | null
          repurchase_frequency: number | null
          research_process: string | null
          revenue_goal_12_months: number | null
          sales_cycle_days: number | null
          sales_process: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          target_customers: string
          team_structure: Json
          top_competitors: Json | null
          trial_ends_at: string | null
          updated_at: string
          urgency: string | null
          value_proposition: string
        }
        Insert: {
          ai_analysis_count?: number | null
          ai_generation_completed_at?: string | null
          ai_generation_error?: string | null
          ai_generation_status?: string
          annual_revenue_range?: string | null
          average_ticket?: number | null
          brand_perception?: string | null
          budget_constraints?: string | null
          business_description: string
          business_model?: string | null
          business_type?: string | null
          buying_motivations?: Json | null
          churn_reasons?: Json | null
          company_size: string
          competitive_advantage?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          conversion_rate?: number | null
          created_at?: string
          current_period_end?: string | null
          current_problems: string
          customer_acquisition_channels?: Json | null
          customer_pain_points?: Json | null
          customer_retention_rate?: number | null
          customers_goal_12_months?: number | null
          decision_makers?: string | null
          founded_year?: number | null
          geographic_market?: Json | null
          growth_priority?: string | null
          icp_criteria?: string | null
          id?: string
          industry: string
          kpis_to_measure?: Json
          last_ai_analysis_at?: string | null
          lead_sources?: Json
          main_objections?: Json | null
          main_objectives: string
          market_growth_rate?: string | null
          market_share_goal?: number | null
          market_size?: string | null
          monthly_leads?: number | null
          monthly_marketing_budget?: number | null
          name: string
          nps_score?: number | null
          plan?: string
          pricing_strategy?: string | null
          products_services?: Json
          purchase_triggers?: Json | null
          repurchase_frequency?: number | null
          research_process?: string | null
          revenue_goal_12_months?: number | null
          sales_cycle_days?: number | null
          sales_process: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          target_customers: string
          team_structure?: Json
          top_competitors?: Json | null
          trial_ends_at?: string | null
          updated_at?: string
          urgency?: string | null
          value_proposition: string
        }
        Update: {
          ai_analysis_count?: number | null
          ai_generation_completed_at?: string | null
          ai_generation_error?: string | null
          ai_generation_status?: string
          annual_revenue_range?: string | null
          average_ticket?: number | null
          brand_perception?: string | null
          budget_constraints?: string | null
          business_description?: string
          business_model?: string | null
          business_type?: string | null
          buying_motivations?: Json | null
          churn_reasons?: Json | null
          company_size?: string
          competitive_advantage?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          conversion_rate?: number | null
          created_at?: string
          current_period_end?: string | null
          current_problems?: string
          customer_acquisition_channels?: Json | null
          customer_pain_points?: Json | null
          customer_retention_rate?: number | null
          customers_goal_12_months?: number | null
          decision_makers?: string | null
          founded_year?: number | null
          geographic_market?: Json | null
          growth_priority?: string | null
          icp_criteria?: string | null
          id?: string
          industry?: string
          kpis_to_measure?: Json
          last_ai_analysis_at?: string | null
          lead_sources?: Json
          main_objections?: Json | null
          main_objectives?: string
          market_growth_rate?: string | null
          market_share_goal?: number | null
          market_size?: string | null
          monthly_leads?: number | null
          monthly_marketing_budget?: number | null
          name?: string
          nps_score?: number | null
          plan?: string
          pricing_strategy?: string | null
          products_services?: Json
          purchase_triggers?: Json | null
          repurchase_frequency?: number | null
          research_process?: string | null
          revenue_goal_12_months?: number | null
          sales_cycle_days?: number | null
          sales_process?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          target_customers?: string
          team_structure?: Json
          top_competitors?: Json | null
          trial_ends_at?: string | null
          updated_at?: string
          urgency?: string | null
          value_proposition?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          organization_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index: number
          organization_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "revenue_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          created_at: string | null
          id: string
          month: string
          organization_id: string | null
          target_deals: number | null
          target_new_customers: number | null
          target_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          organization_id?: string | null
          target_deals?: number | null
          target_new_customers?: number | null
          target_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          organization_id?: string | null
          target_deals?: number | null
          target_new_customers?: number | null
          target_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
      smart_alerts: {
        Row: {
          action_label: string | null
          action_url: string | null
          actionable: boolean | null
          alert_type: string
          category: string | null
          context: Json | null
          created_at: string | null
          dismissed: boolean | null
          dismissed_at: string | null
          dismissed_by: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          included_in_summary: boolean | null
          message: string
          severity: string
          source: string
          target_role: string | null
          target_user_id: string | null
          title: string
          viewed: boolean | null
          viewed_at: string | null
          week_group: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          actionable?: boolean | null
          alert_type: string
          category?: string | null
          context?: Json | null
          created_at?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          included_in_summary?: boolean | null
          message: string
          severity: string
          source: string
          target_role?: string | null
          target_user_id?: string | null
          title: string
          viewed?: boolean | null
          viewed_at?: string | null
          week_group?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          actionable?: boolean | null
          alert_type?: string
          category?: string | null
          context?: Json | null
          created_at?: string | null
          dismissed?: boolean | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          included_in_summary?: boolean | null
          message?: string
          severity?: string
          source?: string
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          viewed?: boolean | null
          viewed_at?: string | null
          week_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_alerts_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_alerts_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_alerts_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_alerts_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stalled_deals: {
        Row: {
          days_in_stage: number | null
          detected_at: string | null
          excess_days: number | null
          id: string
          lead_id: string
          organization_id: string
          recommended_action: string | null
        }
        Insert: {
          days_in_stage?: number | null
          detected_at?: string | null
          excess_days?: number | null
          id?: string
          lead_id: string
          organization_id: string
          recommended_action?: string | null
        }
        Update: {
          days_in_stage?: number | null
          detected_at?: string | null
          excess_days?: number | null
          id?: string
          lead_id?: string
          organization_id?: string
          recommended_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stalled_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stalled_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_onboardings: {
        Row: {
          acquisition_channels: Json | null
          business_name: string
          capital_needed: number | null
          competitive_advantage: string | null
          competitors: Json | null
          completed_at: string | null
          content_strategy: string | null
          core_features: Json | null
          cost_structure: Json | null
          created_at: string | null
          created_by: string
          critical_hypotheses: Json | null
          current_capital: number | null
          current_step: number | null
          customer_pain_points: string[] | null
          development_timeline_weeks: number | null
          distribution_channels: string[] | null
          estimated_cac: number | null
          estimated_ltv: number | null
          exit_strategy: string | null
          first_100_customers_strategy: string | null
          founders: Json | null
          funding_strategy: string | null
          id: string
          ideal_customer_profile: string | null
          initial_marketing_budget: number | null
          inspiration: string | null
          launch_strategy: string | null
          market_sam: string | null
          market_som: string | null
          market_tam: string | null
          milestones: Json | null
          missing_skills: string[] | null
          monetization_strategy: string | null
          mvp_description: string | null
          organization_id: string
          partnerships_strategy: string | null
          pivot_criteria: string | null
          postlaunch_kpis: string[] | null
          prelaunch_metrics: string[] | null
          pricing_currency: string | null
          pricing_highest_tier: number | null
          pricing_lowest_tier: number | null
          pricing_middle_tier: number | null
          problem_statement: string
          revenue_streams: string[] | null
          runway_goal_months: number | null
          six_month_goal: string | null
          solution_description: string
          status: string | null
          success_definition: string | null
          tagline: string | null
          target_ltv_cac_ratio: number | null
          technical_challenges: string | null
          technology_stack: string[] | null
          three_month_goal: string | null
          twelve_month_goal: string | null
          unique_value_proposition: string | null
          updated_at: string | null
          why_now: string | null
        }
        Insert: {
          acquisition_channels?: Json | null
          business_name: string
          capital_needed?: number | null
          competitive_advantage?: string | null
          competitors?: Json | null
          completed_at?: string | null
          content_strategy?: string | null
          core_features?: Json | null
          cost_structure?: Json | null
          created_at?: string | null
          created_by: string
          critical_hypotheses?: Json | null
          current_capital?: number | null
          current_step?: number | null
          customer_pain_points?: string[] | null
          development_timeline_weeks?: number | null
          distribution_channels?: string[] | null
          estimated_cac?: number | null
          estimated_ltv?: number | null
          exit_strategy?: string | null
          first_100_customers_strategy?: string | null
          founders?: Json | null
          funding_strategy?: string | null
          id?: string
          ideal_customer_profile?: string | null
          initial_marketing_budget?: number | null
          inspiration?: string | null
          launch_strategy?: string | null
          market_sam?: string | null
          market_som?: string | null
          market_tam?: string | null
          milestones?: Json | null
          missing_skills?: string[] | null
          monetization_strategy?: string | null
          mvp_description?: string | null
          organization_id: string
          partnerships_strategy?: string | null
          pivot_criteria?: string | null
          postlaunch_kpis?: string[] | null
          prelaunch_metrics?: string[] | null
          pricing_currency?: string | null
          pricing_highest_tier?: number | null
          pricing_lowest_tier?: number | null
          pricing_middle_tier?: number | null
          problem_statement: string
          revenue_streams?: string[] | null
          runway_goal_months?: number | null
          six_month_goal?: string | null
          solution_description: string
          status?: string | null
          success_definition?: string | null
          tagline?: string | null
          target_ltv_cac_ratio?: number | null
          technical_challenges?: string | null
          technology_stack?: string[] | null
          three_month_goal?: string | null
          twelve_month_goal?: string | null
          unique_value_proposition?: string | null
          updated_at?: string | null
          why_now?: string | null
        }
        Update: {
          acquisition_channels?: Json | null
          business_name?: string
          capital_needed?: number | null
          competitive_advantage?: string | null
          competitors?: Json | null
          completed_at?: string | null
          content_strategy?: string | null
          core_features?: Json | null
          cost_structure?: Json | null
          created_at?: string | null
          created_by?: string
          critical_hypotheses?: Json | null
          current_capital?: number | null
          current_step?: number | null
          customer_pain_points?: string[] | null
          development_timeline_weeks?: number | null
          distribution_channels?: string[] | null
          estimated_cac?: number | null
          estimated_ltv?: number | null
          exit_strategy?: string | null
          first_100_customers_strategy?: string | null
          founders?: Json | null
          funding_strategy?: string | null
          id?: string
          ideal_customer_profile?: string | null
          initial_marketing_budget?: number | null
          inspiration?: string | null
          launch_strategy?: string | null
          market_sam?: string | null
          market_som?: string | null
          market_tam?: string | null
          milestones?: Json | null
          missing_skills?: string[] | null
          monetization_strategy?: string | null
          mvp_description?: string | null
          organization_id?: string
          partnerships_strategy?: string | null
          pivot_criteria?: string | null
          postlaunch_kpis?: string[] | null
          prelaunch_metrics?: string[] | null
          pricing_currency?: string | null
          pricing_highest_tier?: number | null
          pricing_lowest_tier?: number | null
          pricing_middle_tier?: number | null
          problem_statement?: string
          revenue_streams?: string[] | null
          runway_goal_months?: number | null
          six_month_goal?: string | null
          solution_description?: string
          status?: string | null
          success_definition?: string | null
          tagline?: string | null
          target_ltv_cac_ratio?: number | null
          technical_challenges?: string | null
          technology_stack?: string[] | null
          three_month_goal?: string | null
          twelve_month_goal?: string | null
          unique_value_proposition?: string | null
          updated_at?: string | null
          why_now?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_onboardings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_projections: {
        Row: {
          created_at: string | null
          id: string
          initial_capital: number | null
          month_1_revenue: number | null
          month_1_signups: number | null
          month_12_revenue: number | null
          month_12_signups: number | null
          month_3_revenue: number | null
          month_3_signups: number | null
          month_6_revenue: number | null
          month_6_signups: number | null
          monthly_burn_rate: number | null
          onboarding_id: string | null
          organization_id: string
          runway_months: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          initial_capital?: number | null
          month_1_revenue?: number | null
          month_1_signups?: number | null
          month_12_revenue?: number | null
          month_12_signups?: number | null
          month_3_revenue?: number | null
          month_3_signups?: number | null
          month_6_revenue?: number | null
          month_6_signups?: number | null
          monthly_burn_rate?: number | null
          onboarding_id?: string | null
          organization_id: string
          runway_months?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          initial_capital?: number | null
          month_1_revenue?: number | null
          month_1_signups?: number | null
          month_12_revenue?: number | null
          month_12_signups?: number | null
          month_3_revenue?: number | null
          month_3_signups?: number | null
          month_6_revenue?: number | null
          month_6_signups?: number | null
          monthly_burn_rate?: number | null
          onboarding_id?: string | null
          organization_id?: string
          runway_months?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_projections_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "startup_onboardings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_projections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_validation_metrics: {
        Row: {
          created_at: string | null
          current_value: number | null
          id: string
          metric_name: string
          metric_type: string | null
          organization_id: string
          recorded_at: string | null
          target_value: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          metric_name: string
          metric_type?: string | null
          organization_id: string
          recorded_at?: string | null
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          metric_name?: string
          metric_type?: string | null
          organization_id?: string
          recorded_at?: string | null
          target_value?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_validation_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          new_plan: string | null
          new_status: string | null
          organization_id: string | null
          previous_plan: string | null
          previous_status: string | null
          stripe_event_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_plan?: string | null
          new_status?: string | null
          organization_id?: string | null
          previous_plan?: string | null
          previous_status?: string | null
          stripe_event_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_plan?: string | null
          new_status?: string | null
          organization_id?: string | null
          previous_plan?: string | null
          previous_status?: string | null
          stripe_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          task_id?: string
          task_metrics?: Json | null
          user_id?: string
          user_insights?: Json | null
          validated_by_leader?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_schedule_collaborator_user_id_fkey"
            columns: ["collaborator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_schedule_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          phase?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
      tool_contents: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          tool_type: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          tool_type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          tool_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_contents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_email_registry: {
        Row: {
          created_at: string
          email: string
          first_trial_started_at: string
          id: string
          ip_address: string | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_trial_started_at?: string
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_trial_started_at?: string
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_email_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          role_description: string | null
          role_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          role_description?: string | null
          role_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_description?: string | null
          role_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
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
          organization_id: string | null
          role: string
          strategic_objectives: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          organization_id?: string | null
          role: string
          strategic_objectives?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          role?: string
          strategic_objectives?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
          },
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
      crm_global_stats: {
        Row: {
          avg_deal_size: number | null
          hot_leads: number | null
          lost_leads: number | null
          new_leads: number | null
          total_leads: number | null
          total_pipeline_value: number | null
          total_won_value: number | null
          won_leads: number | null
        }
        Relationships: []
      }
      enterprise_lost_reasons_summary: {
        Row: {
          avg_deal_size: number | null
          count: number | null
          organization_id: string | null
          percentage: number | null
          reason: string | null
          total_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_reasons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_pipeline_forecast: {
        Row: {
          avg_deal_size: number | null
          deal_count: number | null
          expected_revenue: number | null
          organization_id: string | null
          stage: string | null
          total_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "user_lead_stats"
            referencedColumns: ["user_id"]
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
      pipeline_overview: {
        Row: {
          avg_probability: number | null
          avg_value: number | null
          count: number | null
          stage: string | null
          total_expected: number | null
          total_value: number | null
        }
        Relationships: []
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
      user_lead_stats: {
        Row: {
          full_name: string | null
          hot_leads: number | null
          role: string | null
          total_leads: number | null
          total_pipeline_value: number | null
          total_won_value: number | null
          user_id: string | null
          won_leads: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_deal_velocity: {
        Args: { org_id: string }
        Returns: {
          average_days: number
          deal_count: number
          stage: string
        }[]
      }
      calculate_kr_progress: { Args: { kr_id: string }; Returns: number }
      calculate_kr_progress_from_tasks: {
        Args: { kr_id: string }
        Returns: number
      }
      calculate_lead_score: { Args: { p_lead_id: string }; Returns: string }
      calculate_lead_score_enterprise: {
        Args: { p_lead_id: string }
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
      can_use_ai_analysis: { Args: { _user_id: string }; Returns: Json }
      can_use_trial: { Args: { user_email: string }; Returns: Json }
      can_user_swap: {
        Args: { p_user_id: string; p_week_number: number }
        Returns: boolean
      }
      check_availability_reminder: { Args: never; Returns: undefined }
      check_badge_proximity: { Args: never; Returns: undefined }
      check_collaborative_tasks: { Args: never; Returns: undefined }
      check_crm_daily_actions: { Args: never; Returns: undefined }
      check_financial_risks: { Args: never; Returns: undefined }
      check_okr_risks: { Args: never; Returns: undefined }
      check_pending_validations: { Args: never; Returns: undefined }
      check_performance_drop: { Args: never; Returns: undefined }
      check_rising_cac: { Args: never; Returns: undefined }
      check_stagnant_opportunities: { Args: never; Returns: undefined }
      check_stale_leads: { Args: never; Returns: undefined }
      check_stale_metrics: { Args: never; Returns: undefined }
      check_streak_at_risk: { Args: never; Returns: undefined }
      check_urgent_tasks: { Args: never; Returns: undefined }
      count_organization_users: { Args: { _org_id: string }; Returns: number }
      count_user_swaps_for_week: {
        Args: { p_user_id: string; p_week_number: number }
        Returns: number
      }
      detect_stalled_deals: {
        Args: { org_id: string }
        Returns: {
          average_for_stage: number
          current_stage: string
          days_in_stage: number
          deal_name: string
          excess_days: number
          lead_id: string
        }[]
      }
      generate_all_smart_alerts: { Args: never; Returns: number }
      get_next_week_start: { Args: never; Returns: string }
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      get_user_swap_limit: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_leader: { Args: { _user_id: string }; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      register_ai_analysis_usage: {
        Args: { _user_id: string }
        Returns: undefined
      }
      register_trial_email: {
        Args: {
          ip_addr?: string
          org_id?: string
          user_agent_param?: string
          user_email: string
          user_id_param?: string
        }
        Returns: Json
      }
      slugify: { Args: { text_input: string }; Returns: string }
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
      app_role:
        | "admin"
        | "marketing"
        | "ventas"
        | "finanzas"
        | "operaciones"
        | "producto"
        | "rrhh"
        | "legal"
        | "soporte"
        | "custom"
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
      app_role: [
        "admin",
        "marketing",
        "ventas",
        "finanzas",
        "operaciones",
        "producto",
        "rrhh",
        "legal",
        "soporte",
        "custom",
      ],
    },
  },
} as const
