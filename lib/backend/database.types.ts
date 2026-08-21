export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: "agent" | "admin" | "super_admin"
          full_name: string
          email: string
          phone: string | null
          title: string
          initials: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>
      }
      agents: {
        Row: {
          id: string
          user_id: string
          agent_code: string | null
          status: "pending" | "active" | "suspended"
          commercial_channel: "retail_partner" | "direct_sales" | "third_party" | null
          verified: boolean
          member_since: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["agents"]["Row"]> & { user_id: string }
        Update: Partial<Database["public"]["Tables"]["agents"]["Row"]>
      }
      channels: {
        Row: { id: string; name: string; code: string; active: boolean }
        Insert: Partial<Database["public"]["Tables"]["channels"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["channels"]["Row"]>
      }
      business_sectors: {
        Row: { id: string; name: string; code: string; active: boolean }
        Insert: Partial<Database["public"]["Tables"]["business_sectors"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["business_sectors"]["Row"]>
      }
      document_types: {
        Row: {
          code: string
          name: string
          required: boolean
          allowed_mime: string[]
          max_size_bytes: number
          sort_order: number
        }
        Insert: Database["public"]["Tables"]["document_types"]["Row"]
        Update: Partial<Database["public"]["Tables"]["document_types"]["Row"]>
      }
      applications: {
        Row: {
          id: string
          agent_id: string
          application_number: string | null
          status: Database["public"]["Enums"]["app_status"]
          channel_id: string | null
          sector_id: string | null
          agent_name: string | null
          business_name: string | null
          phone: string | null
          email: string | null
          id_type: string | null
          id_number: string | null
          issued_place: string | null
          issued_date: string | null
          expire_date: string | null
          gender: string | null
          country: string
          province: string | null
          district: string | null
          ward: string | null
          street: string | null
          house_number: string | null
          lat: number | null
          lng: number | null
          location_accuracy: number | null
          location_captured_at: string | null
          channel_parent_type: string | null
          channel_parent_name: string | null
          channel_manager_type: string | null
          channel_manager_name: string | null
          channel_type: string | null
          tin_number: string | null
          notes: string | null
          admin_notes: string | null
          fields_complete: number
          fields_total: number
          submitted_at: string | null
          reviewed_at: string | null
          completed_at: string | null
          rejection_reason: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["applications"]["Row"]> & { agent_id: string }
        Update: Partial<Database["public"]["Tables"]["applications"]["Row"]>
      }
      documents: {
        Row: {
          id: string
          application_id: string
          document_type: string
          status: Database["public"]["Enums"]["document_status"]
          storage_key: string | null
          original_name: string | null
          mime_type: string | null
          file_size: number | null
          file_extension: string | null
          rejection_reason: string | null
          admin_uploaded: boolean
          verified_by: string | null
          verified_at: string | null
          uploaded_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          application_id: string
          document_type: string
        }
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>
      }
      deposit_records: {
        Row: {
          id: string
          application_id: string
          amount: number
          currency: string
          status: Database["public"]["Enums"]["deposit_status"]
          reference: string | null
          proof_document_id: string | null
          verified_by: string | null
          verified_at: string | null
          verification_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["deposit_records"]["Row"]> & { application_id: string }
        Update: Partial<Database["public"]["Tables"]["deposit_records"]["Row"]>
      }
      status_history: {
        Row: {
          id: string
          application_id: string
          old_status: Database["public"]["Enums"]["app_status"] | null
          new_status: Database["public"]["Enums"]["app_status"]
          changed_by: string | null
          note: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["status_history"]["Row"]> & {
          application_id: string
          new_status: Database["public"]["Enums"]["app_status"]
        }
        Update: Partial<Database["public"]["Tables"]["status_history"]["Row"]>
      }
      correction_requests: {
        Row: {
          id: string
          application_id: string
          requested_by: string
          summary: string
          resolved_at: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["correction_requests"]["Row"]> & {
          application_id: string
          requested_by: string
          summary: string
        }
        Update: Partial<Database["public"]["Tables"]["correction_requests"]["Row"]>
      }
      correction_items: {
        Row: {
          id: string
          correction_request_id: string
          kind: "field" | "document"
          target: string
          reason: string
          resolved_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["correction_items"]["Row"], "id" | "resolved_at"> & {
          id?: string
          resolved_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["correction_items"]["Row"]>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          category: Database["public"]["Enums"]["notification_category"]
          title: string
          message: string
          entity_type: string | null
          entity_id: string | null
          read_at: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string
          category: Database["public"]["Enums"]["notification_category"]
          title: string
          message: string
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          actor_role: string | null
          category: Database["public"]["Enums"]["audit_category"]
          severity: Database["public"]["Enums"]["audit_severity"]
          action: string
          detail: string
          entity_type: string | null
          entity_id: string | null
          target: string | null
          ip_address: string | null
          metadata: Json
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          category: Database["public"]["Enums"]["audit_category"]
          action: string
        }
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>
      }
    }
    Views: Record<string, never>
    Functions: {
      bootstrap_application: { Args: { p_agent_id: string }; Returns: string }
      submit_application: { Args: { p_application_id: string }; Returns: Database["public"]["Tables"]["applications"]["Row"] }
      emit_notification: {
        Args: {
          p_user_id: string
          p_category: Database["public"]["Enums"]["notification_category"]
          p_title: string
          p_message: string
          p_entity_type?: string
          p_entity_id?: string
        }
        Returns: string
      }
      write_audit: {
        Args: {
          p_category: Database["public"]["Enums"]["audit_category"]
          p_action: string
          p_detail: string
          p_severity?: Database["public"]["Enums"]["audit_severity"]
          p_entity_type?: string
          p_entity_id?: string
          p_target?: string
          p_ip?: string
          p_metadata?: Json
        }
        Returns: string
      }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      current_agent_id: { Args: Record<string, never>; Returns: string }
    }
    Enums: {
      user_role: "agent" | "admin" | "super_admin"
      agent_lifecycle: "pending" | "active" | "suspended"
      commercial_channel: "retail_partner" | "direct_sales" | "third_party"
      app_status: "DRAFT" | "SUBMITTED" | "PENDING_REVIEW" | "IN_PROGRESS" | "NEEDS_CORRECTION" | "COMPLETED" | "REJECTED"
      deposit_status: "PENDING" | "SUBMITTED" | "CLEARED" | "REJECTED" | "AWAITING_PROOF"
      document_status: "missing" | "unverified" | "verified" | "rejected"
      notification_category: "application" | "document" | "deposit" | "system"
      audit_category: "Application" | "Document" | "Agent" | "System" | "Security"
      audit_severity: "info" | "warning" | "critical"
    }
  }
}
