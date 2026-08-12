"use client";

import { useEffect, useRef, useState } from "react";

export function useMeasuredWidth<T extends HTMLElement>(initial = 0) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { ref, width };
}