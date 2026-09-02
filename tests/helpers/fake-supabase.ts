/**
 * Tiny in-memory stand-in for the subset of the supabase-js query builder that
 * `recordCheckResult` uses: from().select().eq().order().limit(), from().insert(),
 * and from().update().eq(). Enough to exercise the incident state machine without
 * a database.
 */

type Row = Record<string, unknown>;
export interface FakeStore {
  monitors: Row[];
  monitor_checks: Row[];
  incidents: Row[];
}

class Builder {
  private filters: [string, unknown][] = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private op: "select" | "insert" | "update" = "select";
  private payload: Row | Row[] | null = null;
  private patch: Row | null = null;

  constructor(
    private store: FakeStore,
    private table: keyof FakeStore,
  ) {}

  select() {
    this.op = "select";
    return this;
  }
  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(patch: Row) {
    this.op = "update";
    this.patch = patch;
    return this;
  }
  eq(col: string, value: unknown) {
    this.filters.push([col, value]);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private matching() {
    return this.store[this.table].filter((row) => this.filters.every(([c, v]) => row[c] === v));
  }

  private run() {
    if (this.op === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload!];
      for (const r of rows) {
        this.store[this.table].push({ id: `${this.table}-${this.store[this.table].length + 1}`, ...r });
      }
      return { data: null, error: null };
    }
    if (this.op === "update") {
      for (const row of this.matching()) Object.assign(row, this.patch);
      return { data: null, error: null };
    }
    let rows = this.matching().map((r) => ({ ...r }));
    if (this.orderCol) {
      const col = this.orderCol;
      rows.sort((a, b) => String(a[col]).localeCompare(String(b[col])) * (this.orderAsc ? 1 : -1));
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    return { data: rows, error: null };
  }

  then<T>(onF: (v: { data: unknown; error: null }) => T) {
    return Promise.resolve(this.run()).then(onF);
  }
}

export function makeFakeSupabase(store: FakeStore) {
  return {
    from(table: keyof FakeStore) {
      return new Builder(store, table);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}
