import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      receipts: {
        Row: {
          id: string;
          user_id: string | null;
          image_url: string;
          extracted_text: string | null;
          merchant_name: string | null;
          total_amount: number | null;
          date_detected: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          image_url: string;
          extracted_text?: string | null;
          merchant_name?: string | null;
          total_amount?: number | null;
          date_detected?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          image_url?: string;
          extracted_text?: string | null;
          merchant_name?: string | null;
          total_amount?: number | null;
          date_detected?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          extracted_text: string | null;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          extracted_text?: string | null;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          extracted_text?: string | null;
          image_url?: string;
          created_at?: string;
        };
      };
    };
  };
};