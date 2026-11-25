import React from "react";

export default function AdminCouponsLoading() {
  return (
    <div className="space-y-6 animate-pulse font-bengali">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-surface-muted rounded-xl" />
          <div className="h-4 w-72 bg-surface-muted rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-surface-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white border border-surface-border rounded-2xl p-4" />
        ))}
      </div>
      <div className="bg-white border border-surface-border rounded-2xl p-5 space-y-3">
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="h-14 bg-surface-canvas rounded-xl" />
        ))}
      </div>
    </div>
  );
}
