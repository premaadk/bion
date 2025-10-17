import React from "react";
type Props = { message?: string };
export default function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div className="fixed right-4 top-4 z-50 rounded-xl border bg-white px-4 py-2 shadow">
      <span className="text-sm">{message}</span>
    </div>
  );
}
