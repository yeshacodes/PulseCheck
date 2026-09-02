/**
 * Hand-maintained to match `supabase/migrations`. If you change a migration,
 * change this too (or regenerate with `npx supabase gen types typescript`).
 *
 * Row shapes are `type` aliases (not `interface`) on purpose: supabase-js's
 * `GenericSchema` constraint requires them to be assignable to
 * `Record<string, unknown>`, which interfaces are not.
 */

export type MonitorStatus = "pending" | "up" | "down";
export type CheckStatus = "up" | "down";
export type IncidentStatus = "active" | "resolved";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  status_page_slug: string;
  created_at: string;
};

export type MonitorRow = {
  id: string;
  user_id: string;
  name: string;
  url: string;
  expected_status: number;
  timeout_ms: number;
  current_status: MonitorStatus;
  last_response_ms: number | null;
  last_checked_at: string | null;
  is_public: boolean;
  created_at: string;
};

export type MonitorCheckRow = {
  id: string;
  monitor_id: string;
  status: CheckStatus;
  status_code: number | null;
  response_ms: number | null;
  error_message: string | null;
  checked_at: string;
};

export type IncidentRow = {
  id: string;
  monitor_id: string;
  started_at: string;
  resolved_at: string | null;
  status: IncidentStatus;
  failure_reason: string | null;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        ProfileRow,
        { id: string; full_name?: string | null; status_page_slug: string; created_at?: string },
        Partial<ProfileRow>
      >;
      monitors: TableDef<
        MonitorRow,
        {
          user_id: string;
          name: string;
          url: string;
          expected_status?: number;
          timeout_ms?: number;
          current_status?: MonitorStatus;
          last_response_ms?: number | null;
          last_checked_at?: string | null;
          is_public?: boolean;
        },
        Partial<Omit<MonitorRow, "id" | "user_id" | "created_at">>
      >;
      monitor_checks: TableDef<
        MonitorCheckRow,
        {
          monitor_id: string;
          status: CheckStatus;
          status_code?: number | null;
          response_ms?: number | null;
          error_message?: string | null;
          checked_at?: string;
        },
        Partial<MonitorCheckRow>
      >;
      incidents: TableDef<
        IncidentRow,
        {
          monitor_id: string;
          started_at: string;
          resolved_at?: string | null;
          status: IncidentStatus;
          failure_reason?: string | null;
        },
        Partial<IncidentRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
