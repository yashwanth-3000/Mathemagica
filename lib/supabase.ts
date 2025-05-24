import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ezyegawsnfnpqzduhxtz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eWVnYXdzbmZucHF6ZHVoeHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODc4MTYsImV4cCI6MjA2MzY2MzgxNn0.GCen6FWVo4Gt_Bj00WDLhMCGhThNmla0VySscteuyU0'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types (generated from your schema)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      book_images: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          image_description: string | null
          image_name: string | null
          image_order: number | null
          image_size: number | null
          image_type: string | null
          image_url: string
          updated_at: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          image_description?: string | null
          image_name?: string | null
          image_order?: number | null
          image_size?: number | null
          image_type?: string | null
          image_url: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          image_description?: string | null
          image_name?: string | null
          image_order?: number | null
          image_size?: number | null
          image_type?: string | null
          image_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_images_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          book_progress: number | null
          created_at: string | null
          id: string
          images: Json | null
          metadata: Json | null
          status: string | null
          story_content: string
          title: string
          updated_at: string | null
        }
        Insert: {
          book_progress?: number | null
          created_at?: string | null
          id?: string
          images?: Json | null
          metadata?: Json | null
          status?: string | null
          story_content: string
          title: string
          updated_at?: string | null
        }
        Update: {
          book_progress?: number | null
          created_at?: string | null
          id?: string
          images?: Json | null
          metadata?: Json | null
          status?: string | null
          story_content?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Book = Database['public']['Tables']['books']['Row']
export type BookInsert = Database['public']['Tables']['books']['Insert']
export type BookUpdate = Database['public']['Tables']['books']['Update']

export type BookImage = Database['public']['Tables']['book_images']['Row']
export type BookImageInsert = Database['public']['Tables']['book_images']['Insert']
export type BookImageUpdate = Database['public']['Tables']['book_images']['Update'] 