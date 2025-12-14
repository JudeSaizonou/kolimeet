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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          message: string | null
          price_per_kg: number | null
          status: string
          total_price: number | null
          traveler_id: string
          traveler_notes: string | null
          trip_id: string
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          price_per_kg?: number | null
          status?: string
          total_price?: number | null
          traveler_id: string
          traveler_notes?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          message?: string | null
          price_per_kg?: number | null
          status?: string
          total_price?: number | null
          traveler_id?: string
          traveler_notes?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          delivered_at: string | null
          id: string
          is_read: boolean | null
          message_type: string
          read_at: string | null
          reservation_request_id: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          read_at?: string | null
          reservation_request_id?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          read_at?: string | null
          reservation_request_id?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reservation_request_id_fkey"
            columns: ["reservation_request_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "thread_message_stats"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_bookings: boolean | null
          email_enabled: boolean | null
          email_matches: boolean | null
          email_messages: boolean | null
          id: string
          push_bookings: boolean | null
          push_enabled: boolean | null
          push_matches: boolean | null
          push_messages: boolean | null
          push_reviews: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_bookings?: boolean | null
          email_enabled?: boolean | null
          email_matches?: boolean | null
          email_messages?: boolean | null
          id?: string
          push_bookings?: boolean | null
          push_enabled?: boolean | null
          push_matches?: boolean | null
          push_messages?: boolean | null
          push_reviews?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_bookings?: boolean | null
          email_enabled?: boolean | null
          email_matches?: boolean | null
          email_messages?: boolean | null
          id?: string
          push_bookings?: boolean | null
          push_enabled?: boolean | null
          push_matches?: boolean | null
          push_messages?: boolean | null
          push_reviews?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parcel_matches: {
        Row: {
          created_at: string
          id: string
          match_score: number
          parcel_id: string
          status: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_score: number
          parcel_id: string
          status?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_score?: number
          parcel_id?: string
          status?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcel_matches_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcel_matches_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      parcel_matches_backup_20241126: {
        Row: {
          created_at: string | null
          id: string | null
          match_score: number | null
          parcel_id: string | null
          status: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          match_score?: number | null
          parcel_id?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          match_score?: number | null
          parcel_id?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parcels: {
        Row: {
          created_at: string
          deadline: string
          description: string | null
          from_city: string
          from_country: string
          id: string
          is_anonymous: boolean | null
          photos: string[] | null
          size: string
          status: string
          to_city: string
          to_country: string
          type: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          deadline: string
          description?: string | null
          from_city: string
          from_country: string
          id?: string
          is_anonymous?: boolean | null
          photos?: string[] | null
          size: string
          status?: string
          to_city: string
          to_country: string
          type: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          deadline?: string
          description?: string | null
          from_city?: string
          from_country?: string
          id?: string
          is_anonymous?: boolean | null
          photos?: string[] | null
          size?: string
          status?: string
          to_city?: string
          to_country?: string
          type?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      phone_verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone_e164: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_e164: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_e164?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verification_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      platform_earnings: {
        Row: {
          commission_amount: number
          created_at: string
          currency: string
          earned_at: string
          id: string
          reservation_id: string
          status: string
        }
        Insert: {
          commission_amount: number
          created_at?: string
          currency?: string
          earned_at?: string
          id?: string
          reservation_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          currency?: string
          earned_at?: string
          id?: string
          reservation_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_earnings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          default_anonymous_posting: boolean | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          is_suspended: boolean | null
          is_verified: boolean | null
          onboarding_completed: boolean | null
          phone_e164: string | null
          phone_verified: boolean | null
          rating_avg: number | null
          rating_count: number | null
          referral_count: number | null
          referred_by_count: number | null
          reports_received: number | null
          suspended_until: string | null
          suspension_reason: string | null
          trust_score: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_anonymous_posting?: boolean | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          phone_e164?: string | null
          phone_verified?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          referral_count?: number | null
          referred_by_count?: number | null
          reports_received?: number | null
          suspended_until?: string | null
          suspension_reason?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_anonymous_posting?: boolean | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          phone_e164?: string | null
          phone_verified?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          referral_count?: number | null
          referred_by_count?: number | null
          reports_received?: number | null
          suspended_until?: string | null
          suspension_reason?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          message: string | null
          referred_id: string
          referrer_id: string
          relationship: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          referred_id: string
          referrer_id: string
          relationship?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          referred_id?: string
          referrer_id?: string
          relationship?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      reservation_requests: {
        Row: {
          counter_offer_id: string | null
          created_at: string
          driver_id: string
          id: string
          justification: string | null
          kilos_requested: number
          message_id: string | null
          parent_request_id: string | null
          price_offered: number
          price_per_kg: number | null
          requester_id: string
          status: Database["public"]["Enums"]["reservation_request_status"]
          thread_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          counter_offer_id?: string | null
          created_at?: string
          driver_id: string
          id?: string
          justification?: string | null
          kilos_requested: number
          message_id?: string | null
          parent_request_id?: string | null
          price_offered: number
          price_per_kg?: number | null
          requester_id: string
          status?: Database["public"]["Enums"]["reservation_request_status"]
          thread_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          counter_offer_id?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          justification?: string | null
          kilos_requested?: number
          message_id?: string | null
          parent_request_id?: string | null
          price_offered?: number
          price_per_kg?: number | null
          requester_id?: string
          status?: Database["public"]["Enums"]["reservation_request_status"]
          thread_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_requests_counter_offer_id_fkey"
            columns: ["counter_offer_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reservation_requests_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_parent_request_id_fkey"
            columns: ["parent_request_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reservation_requests_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "thread_message_stats"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "reservation_requests_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          delivery_confirmation_code: string | null
          delivery_confirmed_at: string | null
          escrow_status: string
          id: string
          message: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          payout_processed_at: string | null
          payout_reference: string | null
          platform_commission_amount: number | null
          platform_commission_rate: number | null
          price_per_kg: number
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          traveler_payout_amount: number | null
          trip_id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          delivery_confirmation_code?: string | null
          delivery_confirmed_at?: string | null
          escrow_status?: string
          id?: string
          message?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          payout_processed_at?: string | null
          payout_reference?: string | null
          platform_commission_amount?: number | null
          platform_commission_rate?: number | null
          price_per_kg: number
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          traveler_payout_amount?: number | null
          trip_id: string
          user_id: string
          weight_kg: number
        }
        Update: {
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          delivery_confirmation_code?: string | null
          delivery_confirmed_at?: string | null
          escrow_status?: string
          id?: string
          message?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          payout_processed_at?: string | null
          payout_reference?: string | null
          platform_commission_amount?: number | null
          platform_commission_rate?: number | null
          price_per_kg?: number
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          traveler_payout_amount?: number | null
          trip_id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          target_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          target_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_message_at: string
          other_user_id: string
          related_id: string
          related_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string
          other_user_id: string
          related_id: string
          related_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
          other_user_id?: string
          related_id?: string
          related_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "threads_other_user_id_fkey"
            columns: ["other_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      transaction_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          capacity_available_kg: number
          capacity_kg: number
          created_at: string
          date_departure: string
          from_city: string
          from_country: string
          id: string
          is_anonymous: boolean | null
          notes: string | null
          price_expect: number | null
          status: string
          to_city: string
          to_country: string
          user_id: string
        }
        Insert: {
          capacity_available_kg: number
          capacity_kg: number
          created_at?: string
          date_departure: string
          from_city: string
          from_country: string
          id?: string
          is_anonymous?: boolean | null
          notes?: string | null
          price_expect?: number | null
          status?: string
          to_city: string
          to_country: string
          user_id: string
        }
        Update: {
          capacity_available_kg?: number
          capacity_kg?: number
          created_at?: string
          date_departure?: string
          from_city?: string
          from_country?: string
          id?: string
          is_anonymous?: boolean | null
          notes?: string | null
          price_expect?: number | null
          status?: string
          to_city?: string
          to_country?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      typing_status: {
        Row: {
          id: string
          is_typing: boolean | null
          thread_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_typing?: boolean | null
          thread_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_typing?: boolean | null
          thread_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "thread_message_stats"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "typing_status_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
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
      bookings_with_profiles: {
        Row: {
          accepted_at: string | null
          capacity_available_kg: number | null
          completed_at: string | null
          created_at: string | null
          date_departure: string | null
          from_city: string | null
          from_country: string | null
          id: string | null
          message: string | null
          price_per_kg: number | null
          sender_avatar: string | null
          sender_name: string | null
          sender_rating: number | null
          status: string | null
          to_city: string | null
          to_country: string | null
          total_price: number | null
          traveler_avatar: string | null
          traveler_id: string | null
          traveler_name: string | null
          traveler_notes: string | null
          traveler_rating: number | null
          trip_id: string | null
          updated_at: string | null
          user_id: string | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites_with_details: {
        Row: {
          created_at: string | null
          id: string | null
          item_details: Json | null
          item_id: string | null
          item_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          item_details?: never
          item_id?: string | null
          item_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          item_details?: never
          item_id?: string | null
          item_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      parcel_matches_detailed: {
        Row: {
          capacity_available_kg: number | null
          created_at: string | null
          date_departure: string | null
          deadline: string | null
          id: string | null
          match_score: number | null
          parcel_from_city: string | null
          parcel_from_country: string | null
          parcel_id: string | null
          parcel_to_city: string | null
          parcel_to_country: string | null
          parcel_type: string | null
          parcel_user_id: string | null
          price_expect: number | null
          size: string | null
          status: string | null
          trip_from_city: string | null
          trip_from_country: string | null
          trip_id: string | null
          trip_to_city: string | null
          trip_to_country: string | null
          trip_user_id: string | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_matches_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcel_matches_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_user_id_fkey"
            columns: ["parcel_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["trip_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      thread_message_stats: {
        Row: {
          last_message_at: string | null
          last_message_content: string | null
          thread_id: string | null
          total_messages: number | null
          unread_messages: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_counter_offer: { Args: { p_request_id: string }; Returns: string }
      accept_reservation_request: {
        Args: { p_request_id: string }
        Returns: string
      }
      backfill_parcel_matches: {
        Args: { p_batch_size?: number; p_dry_run?: boolean }
        Returns: Json
      }
      calculate_match_score: {
        Args: { p_parcel_id: string; p_trip_id: string }
        Returns: number
      }
      cancel_reservation_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      cleanup_expired_matches: { Args: never; Returns: undefined }
      cleanup_old_typing_status: { Args: never; Returns: undefined }
      confirm_delivery_and_release_funds: {
        Args: { p_confirmation_code?: string; p_reservation_id: string }
        Returns: Json
      }
      count_favorites: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: number
      }
      count_user_active_requests: {
        Args: { p_user_id?: string }
        Returns: number
      }
      create_counter_offer: {
        Args: {
          p_justification?: string
          p_new_price: number
          p_request_id: string
        }
        Returns: string
      }
      create_reservation_request: {
        Args: {
          p_kilos: number
          p_price: number
          p_thread_id: string
          p_trip_id: string
        }
        Returns: string
      }
      decline_counter_offer: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      decline_reservation_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      generate_parcel_matches: {
        Args: { p_parcel_id: string }
        Returns: undefined
      }
      generate_trip_matches: { Args: { p_trip_id: string }; Returns: undefined }
      get_parcel_top_matches: {
        Args: { p_limit?: number; p_parcel_id: string }
        Returns: {
          capacity_available_kg: number
          date_departure: string
          match_id: string
          match_score: number
          price_expect: number
          traveler_name: string
          traveler_rating: number
          trip_from_city: string
          trip_id: string
          trip_to_city: string
        }[]
      }
      get_recent_notifications: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string
          related_type: string
          title: string
          type: string
        }[]
      }
      get_thread_reservation_requests: {
        Args: { p_thread_id: string }
        Returns: {
          created_at: string
          driver_id: string
          id: string
          justification: string
          kilos_requested: number
          parent_request_id: string
          price_offered: number
          price_per_kg: number
          requester_id: string
          status: Database["public"]["Enums"]["reservation_request_status"]
          trip_id: string
          updated_at: string
        }[]
      }
      get_trip_top_matches: {
        Args: { p_limit?: number; p_trip_id: string }
        Returns: {
          deadline: string
          match_id: string
          match_score: number
          parcel_from_city: string
          parcel_id: string
          parcel_to_city: string
          parcel_type: string
          sender_name: string
          sender_rating: number
          weight_kg: number
        }[]
      }
      get_unread_count_by_thread: {
        Args: { p_user_id: string }
        Returns: {
          thread_id: string
          unread_count: number
        }[]
      }
      get_unread_notifications_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_favorited: {
        Args: { p_item_id: string; p_item_type: string; p_user_id: string }
        Returns: boolean
      }
      is_match_eligible: {
        Args: { p_parcel_id: string; p_trip_id: string }
        Returns: boolean
      }
      is_user_admin: { Args: { user_uuid: string }; Returns: boolean }
      mark_message_as_read: { Args: { message_id: string }; Returns: undefined }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mark_thread_messages_as_read: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: undefined
      }
      refund_reservation: {
        Args: { p_reason?: string; p_reservation_id: string }
        Returns: Json
      }
      remove_all_backfilled_matches: { Args: never; Returns: Json }
      validate_backfill_results: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      reservation_request_status:
        | "pending"
        | "accepted"
        | "declined"
        | "counter_offered"
        | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      reservation_request_status: [
        "pending",
        "accepted",
        "declined",
        "counter_offered",
        "cancelled",
      ],
    },
  },
} as const

// Helper types for common use
export type ReservationRequest = Database["public"]["Tables"]["reservation_requests"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Trip = Database["public"]["Tables"]["trips"]["Row"]
export type Parcel = Database["public"]["Tables"]["parcels"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Thread = Database["public"]["Tables"]["threads"]["Row"]
