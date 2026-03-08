import React, { useState, useEffect } from "react";
import { useLanguage } from "@/core/lib/catex/language/useLanguage";
import { UI_EVENT_TYPE, UIEventInterface } from "@/core/components/features/catex/types/UIEventTypes";
import "./GeoprocessingPanel.css";

const GeoprocessingPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"jobs" | "geoprocessing">("geoprocessing");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const { t, isRTL } = useLanguage();

  // Listen for geoprocessing button click
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      // Dispatch GEOPROCESSING_SERVERS event when panel opens
      dispatchUIEvent({
        action: UI_EVENT_TYPE.GEOPROCESSING_SERVERS,
      });
    };

    window.addEventListener("catex:geoprocessing:open", handleOpen);
    return () => window.removeEventListener("catex:geoprocessing:open", handleOpen);
  }, []);

  // Listen for reset event
  useEffect(() => {
    const handleReset = () => setIsOpen(false);
    window.addEventListener("catex:sidebar:resetActive", handleReset);
    return () => window.removeEventListener("catex:sidebar:resetActive", handleReset);
  }, []);

  // Listen for category change events from UI event handler
  useEffect(() => {
    const handleSetCategory = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { category } = customEvent.detail || {};
      if (category) {
        console.log("[Geoprocessing] Setting category from UI event:", category);
        setSelectedCategory(category);
      }
    };

    window.addEventListener("catex:geoprocessing:setCategory", handleSetCategory);
    return () => window.removeEventListener("catex:geoprocessing:setCategory", handleSetCategory);
  }, []);

  // Listen for tool selection events from UI event handler
  useEffect(() => {
    const handleSelectTool = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { toolId } = customEvent.detail || {};
      if (toolId) {
        console.log("[Geoprocessing] Tool selected from UI event:", toolId);
        handleToolClick(toolId);
      }
    };

    window.addEventListener("catex:geoprocessing:selectTool", handleSelectTool);
    return () => window.removeEventListener("catex:geoprocessing:selectTool", handleSelectTool);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("catex:sidebar:resetActive"));
  };

  // Dispatch UI event to host application
  const dispatchUIEvent = (event: UIEventInterface) => {
    console.log(`[Geoprocessing] Dispatching UI event:`, event);
    window.dispatchEvent(
      new CustomEvent("catex:ui:event", {
        detail: event,
      })
    );
  };

  // Handle category change
  const handleCategoryChange = (category: "jobs" | "geoprocessing") => {
    setSelectedCategory(category);

    if (category === "jobs") {
      // Dispatch GEOPROCESSING_LIST_JOBS event
      dispatchUIEvent({
        action: UI_EVENT_TYPE.GEOPROCESSING_LIST_JOBS,
      });
    } else if (category === "geoprocessing") {
      // Dispatch GEOPROCESSING_SERVERS event
      dispatchUIEvent({
        action: UI_EVENT_TYPE.GEOPROCESSING_SERVERS,
      });
    }
  };

  const handleToolClick = (toolId: string) => {
    console.log(`[Geoprocessing] Tool clicked: ${toolId}`);

    // Dispatch GEOPROCESSING_ADD_JOB event with tool parameters
    dispatchUIEvent({
      action: UI_EVENT_TYPE.GEOPROCESSING_ADD_JOB,
      parameters: {
        toolId,
        toolName: toolId,
      },
    });
  };

  // Execute selected action
  const handleExecuteAction = () => {
    if (!selectedAction) {
      console.warn("[Geoprocessing] No action selected");
      return;
    }

    console.log(`[Geoprocessing] Executing action: ${selectedAction}`);

    // Dispatch GEOPROCESSING_ADD_JOB event with selected action
    dispatchUIEvent({
      action: UI_EVENT_TYPE.GEOPROCESSING_ADD_JOB,
      parameters: {
        toolId: selectedAction,
        toolName: selectedAction,
      },
    });
  };

  const tools = [
    {
      id: "buffer",
      icon: "fa-circle-notch",
      nameKey: "geoprocessing.buffer",
      descKey: "geoprocessing.bufferDesc",
    },
    {
      id: "intersect",
      icon: "fa-object-group",
      nameKey: "geoprocessing.intersect",
      descKey: "geoprocessing.intersectDesc",
    },
    {
      id: "union",
      icon: "fa-layer-group",
      nameKey: "geoprocessing.union",
      descKey: "geoprocessing.unionDesc",
    },
    {
      id: "clip",
      icon: "fa-cut",
      nameKey: "geoprocessing.clip",
      descKey: "geoprocessing.clipDesc",
    },
    {
      id: "dissolve",
      icon: "fa-compress",
      nameKey: "geoprocessing.dissolve",
      descKey: "geoprocessing.dissolveDesc",
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="catex-geoprocessing-overlay" onClick={handleClose} />

      {/* Panel */}
      <div className={`catex-geoprocessing-panel ${isOpen ? "visible" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="catex-geoprocessing-header">
          <button
            className="catex-geoprocessing-close"
            onClick={handleClose}
            title={t("general.close")}
            aria-label={t("general.close")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
              fill="currentColor"
            >
              <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
            </svg>
          </button>
          <h4 className="catex-geoprocessing-title">
            {t("plugin.geoprocessing")}
          </h4>
        </div>

        {/* Body */}
        <div className="catex-geoprocessing-body">
          {/* Category Dropdown */}
          <div className="catex-geoprocessing-category">
            <label htmlFor="category-select">{t("geoprocessing.category")}:</label>
            <select
              id="category-select"
              className="catex-geoprocessing-select"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as "jobs" | "geoprocessing")}
            >
              <option value="geoprocessing">{t("geoprocessing.geoprocessing")}</option>
              <option value="jobs">{t("geoprocessing.jobs")}</option>
            </select>
          </div>

          {/* Content based on selected category */}
          {selectedCategory === "geoprocessing" && (
            <div className="catex-geoprocessing-section">
              <h3>{t("geoprocessing.tools")}</h3>

              {/* Action Selector */}
              <div className="catex-geoprocessing-action-selector">
                <label htmlFor="action-select">{t("geoprocessing.selectAction")}:</label>
                <select
                  id="action-select"
                  className="catex-geoprocessing-select"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  <option value="">{t("geoprocessing.chooseAction")}</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {t(tool.nameKey)}
                    </option>
                  ))}
                </select>
                <button
                  className="catex-geoprocessing-execute-btn"
                  onClick={handleExecuteAction}
                  disabled={!selectedAction}
                >
                  <i className="fa-solid fa-play" />
                  {t("geoprocessing.execute")}
                </button>
              </div>

              {/* Tools List (for reference) */}
              <div className="catex-geoprocessing-tools">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`catex-geoprocessing-tool ${selectedAction === tool.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAction(tool.id)}
                  >
                    <i className={`fa-solid ${tool.icon} catex-geoprocessing-tool-icon`} />
                    <div className="catex-geoprocessing-tool-content">
                      <p className="catex-geoprocessing-tool-name">
                        {t(tool.nameKey)}
                      </p>
                      <p className="catex-geoprocessing-tool-desc">
                        {t(tool.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCategory === "jobs" && (
            <div className="catex-geoprocessing-section">
              <h3>{t("geoprocessing.jobsList")}</h3>
              <div className="catex-geoprocessing-jobs">
                <p className="catex-geoprocessing-empty">{t("geoprocessing.noJobs")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GeoprocessingPanel;
