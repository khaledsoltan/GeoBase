/**
 * UI Event Handler
 * Listens for UI events from host application and triggers corresponding actions
 */

import { UI_EVENT_TYPE } from "@/core/components/features/catex/types/UIEventTypes";

export class UIEventHandler {
  private static instance: UIEventHandler;

  private constructor() {
    this.initialize();
  }

  static getInstance(): UIEventHandler {
    if (!UIEventHandler.instance) {
      UIEventHandler.instance = new UIEventHandler();
    }
    return UIEventHandler.instance;
  }

  private initialize() {
    console.log("[UIEventHandler] Initializing...");

    // Listen for UI events from host application
    window.addEventListener("ui:event", this.handleUIEvent.bind(this));

    // Also listen for custom catex format
    window.addEventListener("catex:host:event", this.handleUIEvent.bind(this));
  }

  private handleUIEvent(event: Event) {
    const customEvent = event as CustomEvent;
    const { action, parameters } = customEvent.detail || {};

    console.log("[UIEventHandler] Received UI event:", {
      action,
      parameters,
      actionName: UI_EVENT_TYPE[action] || "UNKNOWN",
    });

    switch (action) {
      case UI_EVENT_TYPE.GEOPROCESSING_SERVERS:
        this.handleGeoprocessingServers(parameters);
        break;

      case UI_EVENT_TYPE.GEOPROCESSING_ADD_JOB:
        this.handleGeoprocessingAddJob(parameters);
        break;

      case UI_EVENT_TYPE.GEOPROCESSING_LIST_JOBS:
        this.handleGeoprocessingListJobs(parameters);
        break;

      default:
        console.log("[UIEventHandler] Unhandled event:", action);
    }
  }

  /**
   * Handle GEOPROCESSING_SERVERS event (2011)
   * Opens geoprocessing panel and shows servers/tools
   */
  private handleGeoprocessingServers(parameters?: any) {
    console.log("[UIEventHandler] Opening geoprocessing panel (servers view)");

    // Dispatch event to open geoprocessing panel
    window.dispatchEvent(new CustomEvent("catex:geoprocessing:open"));

    // Set category to geoprocessing
    window.dispatchEvent(
      new CustomEvent("catex:geoprocessing:setCategory", {
        detail: { category: "geoprocessing" },
      })
    );
  }

  /**
   * Handle GEOPROCESSING_ADD_JOB event (2012)
   * Opens geoprocessing panel and triggers add job action
   */
  private handleGeoprocessingAddJob(parameters?: any) {
    console.log("[UIEventHandler] Opening geoprocessing panel (add job)", parameters);

    // Dispatch event to open geoprocessing panel
    window.dispatchEvent(new CustomEvent("catex:geoprocessing:open"));

    // If tool ID is provided, select that tool
    if (parameters?.toolId) {
      window.dispatchEvent(
        new CustomEvent("catex:geoprocessing:selectTool", {
          detail: { toolId: parameters.toolId },
        })
      );
    }
  }

  /**
   * Handle GEOPROCESSING_LIST_JOBS event (2013)
   * Opens geoprocessing panel and shows jobs list
   */
  private handleGeoprocessingListJobs(parameters?: any) {
    console.log("[UIEventHandler] Opening geoprocessing panel (jobs view)");

    // Dispatch event to open geoprocessing panel
    window.dispatchEvent(new CustomEvent("catex:geoprocessing:open"));

    // Set category to jobs
    window.dispatchEvent(
      new CustomEvent("catex:geoprocessing:setCategory", {
        detail: { category: "jobs" },
      })
    );
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    console.log("[UIEventHandler] Destroying...");
    window.removeEventListener("ui:event", this.handleUIEvent.bind(this));
    window.removeEventListener("catex:host:event", this.handleUIEvent.bind(this));
  }
}

// Auto-initialize when module loads
export const uiEventHandler = UIEventHandler.getInstance();
