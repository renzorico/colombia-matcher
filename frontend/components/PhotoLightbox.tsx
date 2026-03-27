"use client";

import { useEffect } from "react";
import Image from "next/image";

interface PhotoLightboxProps {
  src: string;
  name: string;
  onClose: () => void;
}

export default function PhotoLightbox({ src, name, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={name}
          width={280}
          height={360}
          className="rounded-2xl object-contain bg-white shadow-2xl"
          style={{ maxHeight: "68vh", maxWidth: "min(280px, 82vw)", width: "auto", height: "auto" }}
        />
        <p className="text-white text-base font-bold text-center">{name}</p>
        <button
          onClick={onClose}
          className="text-white/60 text-xs hover:text-white/90 transition-colors"
        >
          Toca afuera o presiona Esc para cerrar
        </button>
      </div>
    </div>
  );
}
