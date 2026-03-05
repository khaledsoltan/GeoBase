"use client";

import React, { useEffect, useState } from "react";
import "./CatexMapClick.css";

export default function CatexMapClick() {
  const [lastClick, setLastClick] = useState<string>("No clicks yet");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const point = detail?.point;

      // Force primitive values only
      const x = Number(point?.x) || 0;
      const y = Number(point?.y) || 0;
      const z = Number(point?.z) || 0;

      const info = `x: ${x}, y: ${y}, z: ${z}`;

      console.log("Map clicked:", info);
      setLastClick(info);
    };

    window.addEventListener("catex:map:click", handler);
    return () => window.removeEventListener("catex:map:click", handler);
  }, []);

  return (
    <div className="catex-map-click">
      <h2>Map Click Extension</h2>
      <pre>{lastClick}</pre>
    </div>
  );
}