import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipo da base de dados atualizado
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
          categoria: string | null;
          created_at: string;
          updated_at: string;
          iva_dedutivel: boolean;
          valorTotalIVA: number | null;
          is_fatura: boolean; // Campo adicionado
          contar_iva: boolean; // Campo adicionado
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          image_url: string;
          extracted_text?: string | null;
          merchant_name?: string | null;
          total_amount?: number | null;
          date_detected?: string | null;
          categoria?: string | null;
          created_at?: string;
          updated_at?: string;
          iva_dedutivel?: boolean;
          valorTotalIVA?: number | null;
          is_fatura?: boolean; // Campo adicionado
          contar_iva?: boolean; // Campo adicionado
        };
        Update: {
          id?: string;
          user_id?: string | null;
          image_url?: string;
          extracted_text?: string | null;
          merchant_name?: string | null;
          total_amount?: number | null;
          date_detected?: string | null;
          categoria?: string | null;
          created_at?: string;
          updated_at?: string;
          iva_dedutivel?: boolean;
          valorTotalIVA?: number | null;
          is_fatura?: boolean; // Campo adicionado
          contar_iva?: boolean; // Campo adicionado
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
      user_profiles: {
        Row: {
          id: string;
          nif: string | null;
          updated_at: string; // Campo adicionado
        };
        Insert: {
          id: string;
          nif?: string | null;
          updated_at?: string; // Campo adicionado
        };
        Update: {
          id?: string;
          nif?: string | null;
          updated_at?: string; // Campo adicionado
        };
      };
    };
  };
};
