export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          name: string;
          address: string;
          access_instructions: string | null;
          status: "active" | "maintenance" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          access_instructions?: string | null;
          status?: "active" | "maintenance" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          access_instructions?: string | null;
          status?: "active" | "maintenance" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          property_id: string;
          external_id: string | null;
          check_in_at: string;
          check_out_at: string;
          guest_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          external_id?: string | null;
          check_in_at: string;
          check_out_at: string;
          guest_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          external_id?: string | null;
          check_in_at?: string;
          check_out_at?: string;
          guest_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          role: "manager" | "cleaner" | "supplier";
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "manager" | "cleaner" | "supplier";
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "manager" | "cleaner" | "supplier";
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cleaning_tasks: {
        Row: {
          id: string;
          property_id: string;
          booking_id: string | null;
          cleaner_id: string | null;
          scheduled_date: string;
          status: "unassigned" | "assigned" | "in_progress" | "completed" | "issue_reported";
          notes: string | null;
          started_at: string | null;
          completed_at: string | null;
          estimated_duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          booking_id?: string | null;
          cleaner_id?: string | null;
          scheduled_date: string;
          status?: "unassigned" | "assigned" | "in_progress" | "completed" | "issue_reported";
          notes?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          estimated_duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          booking_id?: string | null;
          cleaner_id?: string | null;
          scheduled_date?: string;
          status?: "unassigned" | "assigned" | "in_progress" | "completed" | "issue_reported";
          notes?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          estimated_duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      checklist_templates: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          name: string;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          name?: string;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      checklist_completions: {
        Row: {
          id: string;
          task_id: string;
          template_id: string;
          completed_items: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          template_id: string;
          completed_items?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          template_id?: string;
          completed_items?: Json;
          created_at?: string;
        };
      };
      task_photos: {
        Row: {
          id: string;
          task_id: string;
          photo_url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          photo_url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          photo_url?: string;
          caption?: string | null;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          property_id: string;
          task_id: string | null;
          reported_by: string;
          title: string;
          description: string | null;
          severity: "low" | "medium" | "high" | "critical";
          status: "open" | "in_progress" | "resolved" | "closed";
          photo_url: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          task_id?: string | null;
          reported_by: string;
          title: string;
          description?: string | null;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          photo_url?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          task_id?: string | null;
          reported_by?: string;
          title?: string;
          description?: string | null;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          photo_url?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: "consumable" | "linen" | "maintenance" | "amenity";
          unit: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: "consumable" | "linen" | "maintenance" | "amenity";
          unit?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: "consumable" | "linen" | "maintenance" | "amenity";
          unit?: string;
          created_at?: string;
        };
      };
      property_inventory: {
        Row: {
          property_id: string;
          item_id: string;
          current_quantity: number;
          minimum_threshold: number;
          last_restocked_at: string | null;
        };
        Insert: {
          property_id: string;
          item_id: string;
          current_quantity?: number;
          minimum_threshold?: number;
          last_restocked_at?: string | null;
        };
        Update: {
          property_id?: string;
          item_id?: string;
          current_quantity?: number;
          minimum_threshold?: number;
          last_restocked_at?: string | null;
        };
      };
      supply_orders: {
        Row: {
          id: string;
          property_id: string;
          supplier_id: string | null;
          task_id: string | null;
          status: "pending" | "dispatched" | "delivered" | "disputed";
          order_date: string;
          fulfillment_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          supplier_id?: string | null;
          task_id?: string | null;
          status?: "pending" | "dispatched" | "delivered" | "disputed";
          order_date?: string;
          fulfillment_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          supplier_id?: string | null;
          task_id?: string | null;
          status?: "pending" | "dispatched" | "delivered" | "disputed";
          order_date?: string;
          fulfillment_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_line_items: {
        Row: {
          id: string;
          order_id: string;
          item_id: string;
          quantity_requested: number;
          quantity_delivered: number | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_id: string;
          quantity_requested: number;
          quantity_delivered?: number | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_id?: string;
          quantity_requested?: number;
          quantity_delivered?: number | null;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          property_id: string | null;
          booking_id: string | null;
          topic: string;
          status: "open" | "resolved";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          booking_id?: string | null;
          topic: string;
          status?: "open" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          booking_id?: string | null;
          topic?: string;
          status?: "open" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          attachment_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          attachment_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          attachment_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
