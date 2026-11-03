// Tipos manuais do schema (supabase/migrations/20260727000001_init_schema.sql).
// Quando houver um projeto Supabase real, substituir por:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type FuelType = "gasolina" | "etanol" | "diesel";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          must_change_password: boolean;
          active_session_id: string | null;
          fuel_type: FuelType;
          fuel_price: number;
          access_expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      car_models_catalog: {
        Row: {
          id: string;
          brand: string;
          model: string;
          year_from: number;
          year_to: number;
          fuel_type: FuelType;
          consumption_combined_kml: number;
          source: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["car_models_catalog"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["car_models_catalog"]["Row"]>;
        Relationships: [];
      };
      user_cars: {
        Row: {
          id: string;
          user_id: string;
          catalog_id: string | null;
          brand: string;
          model: string;
          year: number;
          consumption_kml: number;
          maintenance_cost_per_km: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_cars"]["Row"]> & {
          user_id: string;
          brand: string;
          model: string;
          year: number;
          consumption_kml: number;
        };
        Update: Partial<Database["public"]["Tables"]["user_cars"]["Row"]>;
        Relationships: [];
      };
      rides: {
        Row: {
          id: string;
          user_id: string;
          car_id: string;
          value_received: number;
          km_driven: number;
          fuel_price_snapshot: number;
          consumption_kml_snapshot: number;
          maintenance_cost_per_km_snapshot: number;
          fuel_cost: number;
          maintenance_cost: number;
          net_profit: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rides"]["Row"]> & {
          user_id: string;
          car_id: string;
          value_received: number;
          km_driven: number;
          fuel_price_snapshot: number;
          consumption_kml_snapshot: number;
          maintenance_cost_per_km_snapshot: number;
          fuel_cost: number;
          maintenance_cost: number;
          net_profit: number;
        };
        Update: Partial<Database["public"]["Tables"]["rides"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
