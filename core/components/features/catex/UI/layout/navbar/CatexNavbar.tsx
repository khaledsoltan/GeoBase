import React, { useState, useEffect, useRef } from "react";
import { emitAction } from "@/core/lib/catex/handlers/actionHandlers";
import { useLanguage } from "@/core/lib/catex/language/useLanguage";
import { watchCartCount } from "@/core/lib/catex/handlers/cartHandlers";
import actionsConfig from "@/core/lib/config/actions.json";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./CatexNavbar.css";
import { watchLanguage } from "@/core/lib/catex";

interface MenuItem {
  i18n?: string;
  label?: string;
  action?: number;
  divider?: boolean;
  items?: MenuItem[];
}

interface MenuConfig {
  i18n?: string;
  label?: string;
  items: MenuItem[];
}

const menus = actionsConfig as Record<string, any>;

const topMenus = [
  { key: "data" },
  { key: "view" },
  { key: "tools" },
];

function resolveLabel(item: MenuItem, t: (id: string) => string): string {
  if (item.i18n) return t(item.i18n);
  if (item.label) return item.label;
  return "";
}

function DropdownMenu({
  items,
  onAction,
  t,
  isRoot = false,
}: {
  items: MenuItem[];
  onAction: () => void;
  t: (id: string) => string;
  isRoot?: boolean;
}) {
  return (
    <div
      className={`catex-dd ${isRoot ? "catex-dd-root" : "catex-dd-sub"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (item.divider) {
          return <div key={i} className="catex-dd-divider" />;
        }
        if (item.items) {
          return <SubmenuItem key={i} item={item} onAction={onAction} t={t} />;
        }
        return (
          <div
            key={i}
            className="catex-dd-item"
            onClick={(e) => {
              e.stopPropagation();
              if (item.action) {
                emitAction(item.action);
                onAction();
              }
            }}
          >
            <span className="catex-dd-item-label">{resolveLabel(item, t)}</span>
          </div>
        );
      })}
    </div>
  );
}

function SubmenuItem({
  item,
  onAction,
  t,
}: {
  item: MenuItem;
  onAction: () => void;
  t: (id: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="catex-dd-submenu"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div
        className={`catex-dd-item catex-dd-item-parent ${open ? "catex-dd-item-open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <span className="catex-dd-item-label">{resolveLabel(item, t)}</span>
        <span className="catex-dd-arrow">▶</span>
      </div>
      {open && item.items && (
        <DropdownMenu items={item.items} onAction={onAction} t={t} />
      )}
    </div>
  );
}

// --- Navbar ---
const CatexNavbar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const { t, lang, switchLanguage, isRTL } = useLanguage();

  useEffect(() => {
    watchLanguage((detectedLang) => {
        if (detectedLang !== lang) {
        switchLanguage(detectedLang);
        }
    });
    watchCartCount((count) => setCartCount(count));

    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);





  const closeMenus = () => setActiveMenu(null);

  const handleNavClick = (key: string) => {
    setActiveMenu(activeMenu === key ? null : key);
  };

  const handleSearchClick = () => {
    setSearchOpen(!searchOpen);
    emitAction(menus.search.action);
  };

  const handleCartClick = () => {
    emitAction(menus.cart.action);
  };

  const handleUserClick = () => {
    setActiveMenu(activeMenu === "user" ? null : "user");
  };
    const nextLang = lang === "en" ? "AR" : "EN";

    const handleLangSwitch = () => {
    const next = lang === "en" ? "ar" : "en";
    switchLanguage(next);
    // Also trigger original app's lang button
    const origBtn = document.querySelector("#navbar-lang-switch-button") as HTMLElement;
    if (origBtn) origBtn.click();
};

  return (
    <div ref={navRef} className="catex-navbar-wrapper" dir={isRTL ? "rtl" : "ltr"}>
      <nav className="catex-navbar">
        <div className="catex-navbar-highlight" />

        {/* Logo */}
        <div className="catex-navbar-logo">
          <div className="catex-navbar-logo-icon">
            <i className="fa-solid fa-earth-americas" />
          </div>
        </div>

        {/* Center nav */}
        <div className="catex-navbar-spacer" />
        <div className="catex-navbar-menu">
          {topMenus.map((menu) => {
            const config = menus[menu.key] as MenuConfig;
            const label = config.i18n ? t(config.i18n) : config.label || menu.key;
            return (
              <div key={menu.key} className="catex-navbar-menu-item">
                <div
                  className={`catex-navbar-item ${activeMenu === menu.key ? "active" : ""}`}
                  onClick={() => handleNavClick(menu.key)}
                >
                  {label}
                  <i className="fa-solid fa-chevron-down catex-navbar-chevron" />
                </div>
                {activeMenu === menu.key && config?.items && (
                  <DropdownMenu items={config.items} onAction={closeMenus} t={t} isRoot />
                )}
              </div>
            );
          })}
        </div>
        <div className="catex-navbar-spacer" />

        {/* Right */}
        <div className="catex-navbar-right">
         {/* Language toggle */}
            <div className="catex-navbar-icon-btn catex-navbar-lang-btn" onClick={handleLangSwitch}>
            <span className="catex-navbar-lang">{nextLang}</span>
            </div>

          {/* Search */}
          <div
            className={`catex-navbar-icon-btn ${searchOpen ? "active" : ""}`}
            onClick={handleSearchClick}
          >
            <i className="fa-solid fa-magnifying-glass" />
          </div>

          {/* Cart */}
          <div
            className="catex-navbar-icon-btn catex-navbar-cart"
            onClick={handleCartClick}
          >
            <i className="fa-solid fa-cart-shopping" />
            {cartCount > 0 && (
              <span className="catex-navbar-badge">{cartCount}</span>
            )}
          </div>

          <div className="catex-navbar-divider" />

          {/* User */}
          <div className="catex-navbar-menu-item">
            <div
              className={`catex-navbar-user ${activeMenu === "user" ? "active" : ""}`}
              onClick={handleUserClick}
            >
              <div className="catex-navbar-user-avatar">
                <i className="fa-solid fa-user" />
              </div>
              <span className="catex-navbar-user-name">
                {(menus.user as MenuConfig).i18n
                  ? t((menus.user as MenuConfig).i18n!)
                  : "admin"}
              </span>
              <i className="fa-solid fa-chevron-down catex-navbar-chevron" />
            </div>
            {activeMenu === "user" && (menus.user as MenuConfig)?.items && (
              <DropdownMenu
                items={(menus.user as MenuConfig).items}
                onAction={closeMenus}
                t={t}
                isRoot
              />
            )}
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      {searchOpen && (
        <div className="catex-search-bar">
          <div className="catex-search-input-wrapper">
            <i className="fa-solid fa-magnifying-glass catex-search-icon" />
            <input
              type="text"
              className="catex-search-input"
              placeholder={t("general.search")}
              autoFocus
            />
            <button className="catex-search-btn">{t("general.search")}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatexNavbar;