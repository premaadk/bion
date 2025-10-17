import React from "react";

type Props = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
};
export default function FormInput({ label, name, type = "text", value, onChange, error, placeholder }: Props) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
