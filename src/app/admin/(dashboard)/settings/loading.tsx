import React from "react";

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse font-bengali">
      <div className="space-y-2">
        <div className="h-7 w-52 bg-surface-muted rounded-xl" />
        <div className="h-4 w-80 bg-surface-muted rounded-lg" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((tab) => (
          <div key={tab} className="h-10 w-32 bg-white border border-surface-border rounded-xl" />
        ))}
      </div>
      <div className="bg-white border border-surface-border rounded-3xl p-6 space-y-4">
        <div className="h-6 w-44 bg-surface-muted rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-12 bg-surface-canvas rounded-xl" />
          <div className="h-12 bg-surface-canvas rounded-xl" />
        </div>
        <div className="h-12 w-full bg-surface-canvas rounded-xl" />
      </div>
    </div>
  );
}
