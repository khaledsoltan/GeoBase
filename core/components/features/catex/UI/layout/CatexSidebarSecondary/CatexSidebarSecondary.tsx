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
  const [open, setOpen] = useState(false);
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

  const handleToggle = () => {
    if (open) setActivePlugin(null);
    setOpen(!open);
  };

  const handlePluginClick = (plugin: PluginItem) => {
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
      <div
        className={`catex-sidebar-toggle ${open ? "active" : ""}`}
        onClick={handleToggle}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
      </div>

      {open && (
        <div className="catex-sidebar-plugins">
          {plugins.map((plugin, i) => (
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
      )}

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
