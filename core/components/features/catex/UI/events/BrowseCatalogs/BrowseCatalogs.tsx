import React, { useState, useEffect } from "react";
import { useLanguage } from "@/core/lib/catex/language/useLanguage";
import "./BrowseCatalogs.css";

interface BrowseCatalogsProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrowseCatalogs: React.FC<BrowseCatalogsProps> = ({ isOpen, onClose }) => {
  const { t, isRTL } = useLanguage();
  const [catalogs, setCatalogs] = useState<any[]>([]);

  useEffect(() => {
    // Here you can fetch catalogs from an API or local state
    // For now, we'll keep it empty and fetch on demand
    if (isOpen) {
      fetchCatalogs();
    }
  }, [isOpen]);

  const fetchCatalogs = async () => {
    try {
      // Replace with your actual API endpoint
      // const response = await fetch('/api/catalogs');
      // const data = await response.json();
      // setCatalogs(data);

      // Placeholder - replace with actual data
      setCatalogs([]);
    } catch (error) {
      console.error("Failed to fetch catalogs:", error);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="catex-browse-catalogs-overlay" onClick={onClose} />
      )}

      {/* Sliding Panel */}
      <div
        className={`catex-sliding-panel ${isOpen ? "visible" : ""} ${
          isRTL ? "rtl" : "ltr"
        }`}
      >
        {/* Header */}
        <div className="catex-sliding-panel-header">
          <button
            className="catex-close-button"
            onClick={onClose}
            title={t("general.close")}
            aria-label={t("general.close")}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="times"
              className="svg-inline--fa fa-times"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
            >
              <path
                fill="currentColor"
                d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
              ></path>
            </svg>
          </button>
          <h4 className="catex-sliding-panel-title">
            {t("tools.browseCatalogs")}
          </h4>
        </div>

        {/* Body */}
        <div className="catex-sliding-panel-body">
          {catalogs.length === 0 ? (
            <div className="catex-catalogs-empty">
              <p>{t("general.loading")}</p>
            </div>
          ) : (
            <div className="catex-catalogs-list">
              {catalogs.map((catalog, idx) => (
                <div key={idx} className="catex-catalog-item">
                  {catalog.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BrowseCatalogs;
