import React from "react";

type Props = {
  selected: number[];
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
  allIds: number[];
};
export default function BulkSelect({ selected, onToggle, onToggleAll, allIds }: Props) {
  const all = selected.length === allIds.length && allIds.length > 0;
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={all}
        onChange={() => onToggleAll(all ? [] : allIds)}
        className="size-4"
      />
      <span className="text-sm">{selected.length} terpilih</span>
    </div>
  );
}
