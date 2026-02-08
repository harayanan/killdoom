import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_DIR = path.join(process.cwd(), 'data', 'db');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

type Row = Record<string, unknown>;

function readTable(table: string): Row[] {
  ensureDir();
  const fp = path.join(DB_DIR, `${table}.json`);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function writeTable(table: string, rows: Row[]) {
  ensureDir();
  fs.writeFileSync(
    path.join(DB_DIR, `${table}.json`),
    JSON.stringify(rows, null, 2)
  );
}

// Parse select string to extract columns and joins
// e.g. "id, ai_summary, post:posts (id, source, title)"
function parseSelect(selectStr: string) {
  if (!selectStr || selectStr === '*') {
    return { columns: ['*'], joins: [] as { alias: string; table: string; columns: string[] }[] };
  }

  const joins: { alias: string; table: string; columns: string[] }[] = [];

  // Extract join patterns: alias:table (col1, col2, ...)
  const cleaned = selectStr.replace(
    /(\w+):(\w+)\s*\(([^)]+)\)/g,
    (_match, alias: string, table: string, cols: string) => {
      joins.push({
        alias,
        table,
        columns: cols.split(',').map((c) => c.trim()).filter(Boolean),
      });
      return '';
    }
  );

  const columns = cleaned
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  return { columns: columns.length > 0 ? columns : ['*'], joins };
}

function pickColumns(row: Row, columns: string[]): Row {
  if (columns.includes('*') || columns.length === 0) return { ...row };
  const result: Row = {};
  for (const col of columns) {
    if (col in row) result[col] = row[col];
  }
  return result;
}

type FilterOp =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'in'; column: string; values: unknown[] };

class QueryBuilder implements PromiseLike<{ data: unknown; error: unknown }> {
  private _table: string;
  private _op: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private _selectStr = '*';
  private _filters: FilterOp[] = [];
  private _orderBy: { column: string; ascending: boolean } | null = null;
  private _single = false;
  private _payload: Row | null = null;
  private _upsertConflict: string | null = null;
  private _returnSelect: string | null = null;

  constructor(table: string) {
    this._table = table;
  }

  select(columns?: string): QueryBuilder {
    if (this._op === 'insert' || this._op === 'upsert' || this._op === 'update') {
      this._returnSelect = columns || '*';
    } else {
      this._selectStr = columns || '*';
    }
    return this;
  }

  eq(column: string, value: unknown): QueryBuilder {
    this._filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, values: unknown[]): QueryBuilder {
    this._filters.push({ type: 'in', column, values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    this._orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  single(): QueryBuilder {
    this._single = true;
    return this;
  }

  insert(payload: Row): QueryBuilder {
    this._op = 'insert';
    this._payload = payload;
    return this;
  }

  upsert(payload: Row, options?: { onConflict?: string }): QueryBuilder {
    this._op = 'upsert';
    this._payload = payload;
    this._upsertConflict = options?.onConflict || null;
    return this;
  }

  update(payload: Row): QueryBuilder {
    this._op = 'update';
    this._payload = payload;
    return this;
  }

  delete(): QueryBuilder {
    this._op = 'delete';
    return this;
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): { data: unknown; error: unknown } {
    try {
      switch (this._op) {
        case 'select':
          return this.execSelect();
        case 'insert':
          return this.execInsert();
        case 'upsert':
          return this.execUpsert();
        case 'update':
          return this.execUpdate();
        case 'delete':
          return this.execDelete();
      }
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : String(err) },
      };
    }
  }

  private applyFilters(rows: Row[]): Row[] {
    let result = rows;
    for (const filter of this._filters) {
      if (filter.type === 'eq') {
        result = result.filter((r) => r[filter.column] === filter.value);
      } else if (filter.type === 'in') {
        result = result.filter((r) => filter.values.includes(r[filter.column]));
      }
    }
    return result;
  }

  private applyOrder(rows: Row[]): Row[] {
    if (!this._orderBy) return rows;
    const { column, ascending } = this._orderBy;
    return [...rows].sort((a, b) => {
      const va = a[column];
      const vb = b[column];
      if (va == null && vb == null) return 0;
      if (va == null) return ascending ? -1 : 1;
      if (vb == null) return ascending ? 1 : -1;
      if (va < vb) return ascending ? -1 : 1;
      if (va > vb) return ascending ? 1 : -1;
      return 0;
    });
  }

  private resolveJoins(rows: Row[], selectStr: string): unknown[] {
    const { columns, joins } = parseSelect(selectStr);

    return rows.map((row) => {
      const result = pickColumns(row, columns);

      for (const join of joins) {
        const fkColumn = `${join.alias}_id`;
        const fkValue = row[fkColumn];
        if (fkValue != null) {
          const joinedTable = readTable(join.table);
          const joinedRow = joinedTable.find((r) => r.id === fkValue);
          result[join.alias] = joinedRow
            ? pickColumns(joinedRow, join.columns)
            : null;
        } else {
          result[join.alias] = null;
        }
      }

      return result;
    });
  }

  private execSelect(): { data: unknown; error: unknown } {
    const rows = readTable(this._table);
    let filtered = this.applyFilters(rows);
    filtered = this.applyOrder(filtered);
    const selected = this.resolveJoins(filtered, this._selectStr);

    if (this._single) {
      return { data: selected[0] || null, error: null };
    }
    return { data: selected, error: null };
  }

  private execInsert(): { data: unknown; error: unknown } {
    const rows = readTable(this._table);
    const newRow: Row = {
      id: randomUUID(),
      ...this._payload,
      created_at: new Date().toISOString(),
    };
    rows.push(newRow);
    writeTable(this._table, rows);

    if (this._returnSelect) {
      const { columns } = parseSelect(this._returnSelect);
      const result = pickColumns(newRow, columns);
      return { data: this._single ? result : [result], error: null };
    }
    return { data: null, error: null };
  }

  private execUpsert(): { data: unknown; error: unknown } {
    const rows = readTable(this._table);
    const conflictKeys = this._upsertConflict
      ?.split(',')
      .map((k) => k.trim()) || ['id'];

    const existingIdx = rows.findIndex((r) =>
      conflictKeys.every((key) => r[key] === this._payload?.[key])
    );

    let affectedRow: Row;

    if (existingIdx >= 0) {
      rows[existingIdx] = {
        ...rows[existingIdx],
        ...this._payload,
        updated_at: new Date().toISOString(),
      };
      affectedRow = rows[existingIdx];
    } else {
      affectedRow = {
        id: randomUUID(),
        ...this._payload,
        created_at: new Date().toISOString(),
      };
      rows.push(affectedRow);
    }

    writeTable(this._table, rows);

    if (this._returnSelect) {
      const { columns } = parseSelect(this._returnSelect);
      const result = pickColumns(affectedRow, columns);
      return { data: this._single ? result : [result], error: null };
    }
    return { data: null, error: null };
  }

  private execUpdate(): { data: unknown; error: unknown } {
    const rows = readTable(this._table);
    const filtered = this.applyFilters(rows);

    for (const row of filtered) {
      const idx = rows.findIndex((r) => r.id === row.id);
      if (idx >= 0) {
        rows[idx] = {
          ...rows[idx],
          ...this._payload,
          updated_at: new Date().toISOString(),
        };
      }
    }

    writeTable(this._table, rows);

    if (this._returnSelect) {
      const updated = this.applyFilters(rows);
      const { columns } = parseSelect(this._returnSelect);
      const result = updated.map((r) => pickColumns(r, columns));
      return { data: this._single ? result[0] || null : result, error: null };
    }
    return { data: null, error: null };
  }

  private execDelete(): { data: unknown; error: unknown } {
    const rows = readTable(this._table);
    const toDelete = this.applyFilters(rows);
    const deleteIds = new Set(toDelete.map((r) => r.id));
    const remaining = rows.filter((r) => !deleteIds.has(r.id));
    writeTable(this._table, remaining);
    return { data: null, error: null };
  }
}

export const localDb = {
  from(table: string) {
    return new QueryBuilder(table);
  },
};
