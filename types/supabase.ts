export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_premium: boolean
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_type: string | null
          subscription_end_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          subscription_end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          subscription_end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      contexts: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      plots: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      wildflowers: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          priority: string
          context_id: string | null
          plot_id: string | null
          due_date: string | null
          is_mit: boolean | null
          is_completed: boolean | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority: string
          context_id?: string | null
          plot_id?: string | null
          due_date?: string | null
          is_mit?: boolean | null
          is_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          priority?: string
          context_id?: string | null
          plot_id?: string | null
          due_date?: string | null
          is_mit?: boolean | null
          is_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}