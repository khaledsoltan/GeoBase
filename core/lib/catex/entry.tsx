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
import CatexSidebarSecondary from "@/core/components/features/catex/UI/layout/CatexSidebarSecondary/CatexSidebarSecondary";
import { LanguageSettings } from "@/core/lib/catex/language/LanguageSettings";
import { watchLanguage } from "@/core/lib/catex/handlers/langHandlers";
import "@/core/lib/catex/styles/rtl-support.css";


// Initialize language system
LanguageSettings.setLanguage("ar"); // Default to Arabic

// Watch host app language changes
watchLanguage((lang) => {
  LanguageSettings.setLanguage(lang);
  console.log(`[catex] Language changed to: ${lang}`);
});

// Remove elements
removeElements(removeConfig.remove);

// Hide elements when they appear
hideOnOpen(hideConfig.hide);

// Remove borders from tabpanel-tab-item elements
setTimeout(() => {
  const tabItems = document.querySelectorAll(".tabpanel-tab-item");
  tabItems.forEach((item) => {
    const element = item as HTMLElement;
    element.style.border = "none";
    element.style.borderLeft = "none";
    element.style.borderRight = "none";
    element.style.borderTop = "none";
    element.style.borderBottom = "none";
  });
}, 1000);

// Disable hover effects on buttons - remove pointer-events or CSS
const disableButtonHovers = () => {
  const buttons = document.querySelectorAll("button:not(:disabled), [type=button]:not(:disabled), [type=reset]:not(:disabled), [type=submit]:not(:disabled)");
  buttons.forEach((btn) => {
    const element = btn as HTMLElement;
    element.style.pointerEvents = "auto";
    element.onmouseenter = () => {};
    element.onmouseleave = () => {};
    element.onmouseover = () => {};
    element.onmouseout = () => {};
  });
};

disableButtonHovers();
document.addEventListener("DOMContentLoaded", disableButtonHovers);

const navMount = document.createElement("div");
navMount.id = "catex-navbar-root";
document.body.prepend(navMount);
createRoot(navMount).render(<CatexNavbar />);

const sideMount = document.createElement("div");
sideMount.id = "catex-sidebar-root";
document.body.appendChild(sideMount);
createRoot(sideMount).render(<CatexSidebar />);

const sideMountSecondary = document.createElement("div");
sideMountSecondary.id = "catex-sidebar-secondary-root";
document.body.appendChild(sideMountSecondary);
createRoot(sideMountSecondary).render(<CatexSidebarSecondary />);

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

