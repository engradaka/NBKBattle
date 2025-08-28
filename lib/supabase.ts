import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return sessionStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(key, value)
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(key)
        }
      }
    },
    persistSession: true
  }
})

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          description_ar: string | null
          description_en: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          description_ar?: string | null
          description_en?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          description_ar?: string | null
          description_en?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          category_id: string
          question_ar: string
          question_en: string
          answer_ar: string
          answer_en: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          question_ar: string
          question_en: string
          answer_ar: string
          answer_en: string
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          question_ar?: string
          question_en?: string
          answer_ar?: string
          answer_en?: string
          points?: number
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          team1_name: string
          team2_name: string
          team1_score: number
          team2_score: number
          current_team: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          team1_name: string
          team2_name: string
          team1_score?: number
          team2_score?: number
          current_team?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          team1_name?: string
          team2_name?: string
          team1_score?: number
          team2_score?: number
          current_team?: number
          status?: string
          created_at?: string
        }
      }
    }
  }
}
