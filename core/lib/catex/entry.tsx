import React from "react";
import { createRoot } from "react-dom/client";
import { catexRegistry } from "@/core/lib/catex/registry";
import { onMouseClick } from "@/core/lib/catex/handlers/mapHandlers";
import { removeElements } from "@/core/lib/catex/handlers/domHandlers";
import { hideOnOpen  } from "@/core/lib/catex/handlers/visibilityHandlers";
import removeConfig from "./../config/removeElements.json";
import hideConfig from  "./../config/hideElements.json";
import * as Components from "@/core/components/features/catex";
import CatexNavbar from "@/core/components/features/catex/UI/layout/CatexSidebar/CatexSidebar";
import CatexSidebar from "@/core/components/features/catex/UI/layout/CatexSidebar/CatexSidebar";


// Remove elements
removeElements(removeConfig.remove);

// Hide elements when they appear
hideOnOpen(hideConfig.hide);


const navMount = document.createElement("div");
navMount.id = "catex-navbar-root";
document.body.prepend(navMount);
createRoot(navMount).render(<CatexNavbar />);

const sideMount = document.createElement("div");
sideMount.id = "catex-sidebar-root";
document.body.appendChild(sideMount);
createRoot(sideMount).render(<CatexSidebar />);


// Register generic handler
catexRegistry.on("map", "onMouseClick", (event, callback) => {
  onMouseClick(event, (data) => {
    window.dispatchEvent(new CustomEvent("catex:map:click", { detail: data }));
  });
});

catexRegistry.install();

// Auto-mount all components
const container = document.createElement("div");
container.id = "catex-root";
document.body.appendChild(container);




const root = createRoot(container);
const componentList = Object.entries(Components).filter(
  ([, val]) => typeof val === "function"
);

root.render(
  React.createElement(
    "div",
    null,
    componentList.map(([name, Comp]) =>
      React.createElement(Comp as React.FC, { key: name })
    )
  )
);

