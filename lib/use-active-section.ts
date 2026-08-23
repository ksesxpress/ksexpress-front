"use client";

import { useEffect, useState } from "react";

// Scroll-spy: tracks which of the given section ids is currently in view,
// using a thin observation band just below the sticky navbar. Keeps the
// last active id when none intersect (e.g. scrolling through an unlisted
// section like "Pourquoi KS Express"), instead of flickering to null.
export function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        }

        const current = ids.filter((id) => intersecting.has(id)).pop();
        if (current) setActiveId(current);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
