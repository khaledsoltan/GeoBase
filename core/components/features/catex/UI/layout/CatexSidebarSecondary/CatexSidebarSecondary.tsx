import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { emitAction } from "@/core/lib/catex/handlers/actionHandlers";
import { clickElement, clickToggleByText } from "@/core/lib/catex/handlers/domProxyHandlers";
import { useLanguage } from "@/core/lib/catex/language/useLanguage";
import sidebarConfig from "@/core/lib/config/sidebarSecondary.json";
import "./CatexSidebarSecondary.css";

interface PluginItem {
  id: string;
  icon: string;
  i18n: string;
  action?: number;
  selector?: string;
  toggle?: string;
}

const plugins = sidebarConfig.plugins as PluginItem[];

function Tooltip({ text, anchorRect, isRTL }: {
  text: string;
  anchorRect: DOMRect;
  isRTL: boolean;
}) {
  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.top + anchorRect.height / 2,
    transform: "translateY(-50%)",
    background: "#0F4D28",
    color: "#fff",
    padding: "5px 12px",
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    whiteSpace: "nowrap",
    zIndex: 99999,
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    pointerEvents: "none",
  };

  if (isRTL) {
    // In RTL, sidebar is on left, tooltip on right
    style.left = anchorRect.right + 8;
  } else {
    // In LTR, sidebar is on right, tooltip on left
    style.right = window.innerWidth - anchorRect.left + 8;
  }

  return createPortal(<div style={style}>{text}</div>, document.body);
}

const CatexSidebarSecondary: React.FC = () => {
  const [activePlugin, setActivePlugin] = useState<string | null>(null);
  const [hoveredPlugin, setHoveredPlugin] = useState<string | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const { t, isRTL } = useLanguage();

  // Listen for reset active state event
  useEffect(() => {
    const handleReset = () => setActivePlugin(null);
    window.addEventListener("catex:sidebar:resetActive", handleReset);
    return () => window.removeEventListener("catex:sidebar:resetActive", handleReset);
  }, []);

  // Listen for layer-manager close button clicks
  useEffect(() => {
    const handleCloseClick = () => {
      setActivePlugin(null);
    };

    const closeBtn = document.querySelector("[data-cy='layer-manager'] .close_button");
    if (closeBtn) {
      closeBtn.addEventListener("click", handleCloseClick);
      return () => closeBtn.removeEventListener("click", handleCloseClick);
    }
  }, []);

  // Listen for measurement tabpanel close button clicks
  useEffect(() => {
    const handleMeasurementCloseClick = () => {
      setActivePlugin(null);
      const tabpanel = document.querySelector(".tabpanel") as HTMLElement;
      if (tabpanel) {
        tabpanel.style.display = "none";
      }
    };

    const closeBtnMeasurement = document.querySelector(".tabpanel .close_button");
    if (closeBtnMeasurement) {
      closeBtnMeasurement.addEventListener("click", handleMeasurementCloseClick);
      return () => closeBtnMeasurement.removeEventListener("click", handleMeasurementCloseClick);
    }
  }, []);

  // Clone and move the layer toggle button to sidebar + Apply RTL to layer panel
  useEffect(() => {
    // Apply RTL CSS to layer-manager panel
    let rtlStyleEl = document.getElementById("catex-layer-manager-rtl");
    if (!rtlStyleEl) {
      rtlStyleEl = document.createElement("style");
      rtlStyleEl.id = "catex-layer-manager-rtl";
      document.head.appendChild(rtlStyleEl);
    }

    if (isRTL) {
      rtlStyleEl.textContent = `
        [data-cy='layer-manager'] {
          left: 80px !important;
          right: auto !important;
          top: 120px !important;
        }
      `;
    } else {
      rtlStyleEl.textContent = `
        [data-cy='layer-manager'] {
          right: 80px !important;
          left: auto !important;
          top: 120px !important;
        }
      `;
    }

    // Clone and move the layer toggle button to sidebar
    const originalBtn = document.querySelector(".overlay-modular-container-toggle-button") as HTMLElement;
    const sidebarRoot = document.getElementById("catex-sidebar-secondary-root");

    if (originalBtn && sidebarRoot && !document.getElementById("catex-layer-toggle-clone")) {
      // Clone the button
      const clonedBtn = originalBtn.cloneNode(true) as HTMLElement;
      clonedBtn.id = "catex-layer-toggle-clone";
      clonedBtn.style.cssText = `
        position: absolute !important;
        top: 10px !important;
        ${isRTL ? "left: 10px !important;" : "right: 10px !important;"}
        z-index: 9999 !important;
        cursor: pointer;
      `;

      // Add click handler to cloned button
      clonedBtn.addEventListener("click", () => {
        originalBtn.click();
      });

      sidebarRoot.appendChild(clonedBtn);
    }
  }, [isRTL]);

  const handlePluginClick = (plugin: PluginItem) => {
    // Special handling for layer-manager
    if (plugin.id === "layer-manager") {
      const layerPanel = document.querySelector("[data-cy='layer-manager']") as HTMLElement;

      if (activePlugin === plugin.id) {
        // Hide
        if (layerPanel) {
          layerPanel.classList.remove("catex-layer-show");
        }
        setActivePlugin(null);
      } else {
        // Show
        if (layerPanel) {
          layerPanel.classList.add("catex-layer-show");

          // AGGRESSIVE: Remove ALL blue, force GREEN
          const headerEl = layerPanel.querySelector(".floating-window-header") as HTMLElement;
          const titleEl = layerPanel.querySelector(".floating-window-title") as HTMLElement;

          if (headerEl) {
            // Remove ALL existing styles
            headerEl.setAttribute("style", "");
            // Force GREEN
            headerEl.style.cssText = `
              background: #1B6B3A !important;
              background-color: #1B6B3A !important;
              background-image: none !important;
              border-bottom: 3px solid #B8860B !important;
              padding: 14px 16px !important;
              border-radius: 6px 6px 0 0 !important;
            `;
          }

          if (titleEl) {
            titleEl.setAttribute("style", "");
            titleEl.style.cssText = `
              background: transparent !important;
              background-color: transparent !important;
              color: #1B6B3A !important;
              width: 100% !important;
              text-align: center !important;
              z-index: 9 !important;
              font-weight: 700 !important;
            `;
          }
        }
        setActivePlugin(plugin.id);
      }
      return;
    }

    // Special handling for measurement tools
    if (plugin.id === "measurement") {
      const tabpanel = document.querySelector(".tabpanel") as HTMLElement;

      if (activePlugin === plugin.id) {
        // Hide
        if (tabpanel) {
          tabpanel.style.display = "none";
        }
        setActivePlugin(null);
      } else {
        // Show
        if (tabpanel) {
          tabpanel.style.display = "block";
        }
        setActivePlugin(plugin.id);
      }
      return;
    }

    // Toggle: if clicking the same button, close the dialog
    if (activePlugin === plugin.id) {
      setActivePlugin(null);

      // Find and close any open dialog
      const openDialog = document.querySelector(".SlidingPanel-window.visible, .SlidingPanel-window.left, .SlidingPanel-window.right");
      if (openDialog) {
        const closeBtn = openDialog.querySelector(".close_button") as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
        }
      }
      return;
    }

    setActivePlugin(plugin.id);

    if (plugin.toggle) {
      clickToggleByText(plugin.toggle);
    } else if (plugin.selector) {
      clickElement(plugin.selector);
    } else if (plugin.action) {
      // Emit action normally
      emitAction(plugin.action);
    }
  };

  const handleMouseEnter = (plugin: PluginItem, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredPlugin(plugin.id);
    setHoverRect(rect);
  };

  const handleMouseLeave = () => {
    setHoveredPlugin(null);
    setHoverRect(null);
  };

  return (
    <div className={`catex-sidebar-secondary ${isRTL ? "catex-sidebar-secondary-rtl" : ""}`}>
      <div className="catex-sidebar-plugins">
        {plugins.slice(0, 3).map((plugin, i) => (
          <div
            key={plugin.id}
            className={`catex-sidebar-btn ${activePlugin === plugin.id ? "active" : ""}`}
            onClick={() => handlePluginClick(plugin)}
            onMouseEnter={(e) => handleMouseEnter(plugin, e)}
            onMouseLeave={handleMouseLeave}
            style={{ animationDelay: `${i * 25}ms` }}
          >
            <i className={`fa-solid ${plugin.icon}`} />
          </div>
        ))}
      </div>

      {hoveredPlugin && hoverRect && (
        <Tooltip
          text={t(plugins.find((p) => p.id === hoveredPlugin)?.i18n || "")}
          anchorRect={hoverRect}
          isRTL={isRTL}
        />
      )}
    </div>
  );
};

export default CatexSidebarSecondary;
