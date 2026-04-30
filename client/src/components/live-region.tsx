"use client";

import { useAccessibility } from "@/providers/accessibility-provider";

export function LiveRegion() {
  const { liveMessage } = useAccessibility();

  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only">
      {liveMessage}
    </div>
  );
}
