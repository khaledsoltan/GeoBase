"use client";


import React from "react";
import * as Components from "@/core/components/features/catex";

export default function CatexPage() {
  const componentList = Object.entries(Components).filter(
    ([, val]) => typeof val === "function"
  );

  return (
    <div>
      <h1>Catex Extensions</h1>
      {componentList.map(([name, Component]) => {
        const Comp = Component as React.FC;
        return (
          <div key={name}>
            <Comp />
          </div>
        );
      })}
    </div>
  );
}