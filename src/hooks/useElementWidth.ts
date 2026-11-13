"use client";

import { useEffect, useState } from "react";

/**
 * Ukur LEBAR sebuah elemen (px) dan ikut berubah saat layar/kartu berubah ukuran.
 *
 * Cara pakai:
 *   const [ref, width] = useElementWidth<HTMLDivElement>();
 *   return <div ref={ref}>lebarnya {width}px</div>;
 *
 * Sebelum elemen tampil, `width` = 0. Elemen boleh baru muncul belakangan (mis. setelah data dimuat).
 */
export function useElementWidth<TElement extends HTMLElement>() {
  // Elemennya disimpan di state, supaya pengukuran dimulai ulang setiap kali elemennya muncul/berganti.
  const [element, setElement] = useState<TElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;

    // ResizeObserver memanggil fungsi ini setiap kali ukuran elemen berubah.
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return [setElement, width] as const;
}
