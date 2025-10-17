import React from "react";

type Col<T> = { key: keyof T; label: string };
type Props<T extends Record<string, unknown>> = {
  cols: Col<T>[];
  rows: T[];
  rowKey: (r: T) => React.Key;
  actions?: (r: T) => React.ReactNode;
};
export default function Table<T extends Record<string, unknown>>({ cols, rows, rowKey, actions }: Props<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border p-2">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm">
            {cols.map((c) => (
              <th key={String(c.key)} className="px-3 py-2 font-semibold">{c.label}</th>
            ))}
            {actions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-t">
              {cols.map((c) => (
                <td key={String(c.key)} className="px-3 py-2">{String(r[c.key] ?? "")}</td>
              ))}
              {actions && <td className="px-3 py-2">{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
