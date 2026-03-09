import React, { useState, useEffect } from "react";
import { useLanguage } from "@/core/lib/catex/language/useLanguage";
import { UI_EVENT_TYPE, UIEventInterface } from "@/core/components/features/catex/types/UIEventTypes";
import "./GeoprocessingPanel.css";

interface GeoprocessingServer {
  id: number;
  name: string;
  url: string;
  user: number;
}

interface ProcessInput {
  title?: string;
  description?: string;
  minOccurs?: number;
  maxOccurs?: number;
  schema?: Record<string, unknown>;
  additionalParameters?: Record<string, unknown>;
}

interface GeoprocessingProcess {
  id: string;
  title?: string;
  description?: string;
  version?: string;
  keywords?: string[];
  jobControlOptions?: string[];
  inputs?: Record<string, ProcessInput>;
  outputs?: Record<string, unknown>;
}

// Allowed processes - restrict to specific geoprocessing tools
const ALLOWED_PROCESSES = [
  "ChartToChartChangeDetection",
  "ClassifyFeature",
  "FeatureToFeatureChangeDetection",
  "GeodeticReprojectRaster",
  "GeospatialPDF",
  "MapAspect",
  "Slope",
];

// Translation key and icon mapping for allowed processes
const PROCESS_TRANSLATION_MAP: Record<string, { name: string; desc: string; icon: string }> = {
  "ChartToChartChangeDetection": {
    name: "geoprocessing.chartToChartChangeDetection",
    desc: "geoprocessing.chartToChartChangeDetectionDesc",
    icon: "fa-chart-area",
  },
  "ClassifyFeature": {
    name: "geoprocessing.classifyFeature",
    desc: "geoprocessing.classifyFeatureDesc",
    icon: "fa-tags",
  },
  "FeatureToFeatureChangeDetection": {
    name: "geoprocessing.featureToFeatureChangeDetection",
    desc: "geoprocessing.featureToFeatureChangeDetectionDesc",
    icon: "fa-arrows-alt",
  },
  "GeodeticReprojectRaster": {
    name: "geoprocessing.geodeticReprojectRaster",
    desc: "geoprocessing.geodeticReprojectRasterDesc",
    icon: "fa-globe",
  },
  "GeospatialPDF": {
    name: "geoprocessing.geospatialPDF",
    desc: "geoprocessing.geospatialPDFDesc",
    icon: "fa-file-pdf",
  },
  "MapAspect": {
    name: "geoprocessing.mapAspect",
    desc: "geoprocessing.mapAspectDesc",
    icon: "fa-compass",
  },
  "Slope": {
    name: "geoprocessing.slope",
    desc: "geoprocessing.slopeDesc",
    icon: "fa-mountain",
  },
};

const GeoprocessingPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [serverName, setServerName] = useState<string>("");
  const [serverUrl, setServerUrl] = useState<string>("");
  const [processes, setProcesses] = useState<GeoprocessingProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<GeoprocessingProcess | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState(0);
  const [panelView, setPanelView] = useState<"tools" | "form">("tools");
  const { t, isRTL } = useLanguage();

  // Build proper OGC API URL (handle both with and without /oapi-p)
  const buildOgcUrl = (baseUrl: string, path: string): string => {
    // Remove trailing slash from base URL
    const cleanBase = baseUrl.replace(/\/$/, "");
    // Ensure path starts with /
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    // If base already ends with /oapi-p, don't add it again
    if (cleanBase.endsWith("/oapi-p")) {
      return `${cleanBase}${cleanPath}`;
    }
    // If base doesn't have /oapi-p, add it
    if (!cleanBase.includes("/oapi-p")) {
      return `${cleanBase}/oapi-p${cleanPath}`;
    }
    return `${cleanBase}${cleanPath}`;
  };

  // Fetch detailed process information including inputs and outputs
  const fetchProcessDetails = async (processId: string): Promise<GeoprocessingProcess | null> => {
    try {
      console.log("[Geoprocessing] Fetching process details for:", processId);
      const ogcBaseUrl = "http://192.168.100.50";
      const url = buildOgcUrl(ogcBaseUrl, `/processes/${processId}`);
      console.log("[Geoprocessing] Fetch URL:", url);
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[Geoprocessing] Failed to fetch details for ${processId}, status:`, response.status);
        return null;
      }
      const data = await response.json();
      console.log("[Geoprocessing] Process details received:", {
        id: data.id,
        inputCount: Object.keys(data.inputs || {}).length,
        outputCount: Object.keys(data.outputs || {}).length,
      });

      return {
        id: data.id || processId,
        title: data.title || data.summary,
        description: data.description || data.abstract,
        version: data.version,
        keywords: data.keywords,
        jobControlOptions: data.jobControlOptions,
        inputs: data.inputs || {},
        outputs: data.outputs || {},
      };
    } catch (error) {
      console.error("[Geoprocessing] Error fetching process details for", processId, ":", error);
      return null;
    }
  };

  // Fetch geoprocessing processes/models from server
  const fetchGeoprocessingProcesses = async () => {
    try {
      const ogcBaseUrl = "http://192.168.100.50";
      console.log("[Geoprocessing] Fetching processes from:", ogcBaseUrl);
      const url = buildOgcUrl(ogcBaseUrl, "/processes");
      console.log("[Geoprocessing] Fetch URL:", url);
      const response = await fetch(url);
      const data = await response.json();

      let processList: GeoprocessingProcess[] = [];

      // Handle different API response formats
      if (data.processes && Array.isArray(data.processes)) {
        processList = data.processes;
      } else if (Array.isArray(data)) {
        processList = data;
      } else if (data.content && Array.isArray(data.content)) {
        processList = data.content;
      }

      // Filter to only allowed processes
      const filteredProcesses = processList.filter((process) =>
        ALLOWED_PROCESSES.includes(process.id)
      );

      // Fetch detailed information for each allowed process
      const detailedProcesses = await Promise.all(
        filteredProcesses.map(async (process) => {
          const details = await fetchProcessDetails(process.id);
          return details || process;
        })
      );

      setProcesses(detailedProcesses);
      console.log("[Geoprocessing] Processes loaded:", detailedProcesses.length, "from", processList.length, "total");
    } catch (error) {
      console.error("[Geoprocessing] Error fetching processes:", error);
      setProcesses([]);
    }
  };

  // Fetch geoprocessing servers info
  const fetchGeoprocessingServers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://192.168.100.50/catalogexplorer/api/user/geoprocessing/servers?size=100&page=0&sort=name"
      );
      const data = await response.json();

      if (data.content && data.content.length > 0) {
        const firstServer: GeoprocessingServer = data.content[0];
        setServerName(firstServer.name);
        setServerUrl(firstServer.url);
        console.log("[Geoprocessing] Server loaded:", firstServer.name);
      }
    } catch (error) {
      console.error("[Geoprocessing] Error fetching servers:", error);
      setServerName("Geoprocessing");
    } finally {
      setLoading(false);
    }
  };

  // Listen for geoprocessing button click
  useEffect(() => {
    const handleOpen = async () => {
      setIsOpen(true);
      // Fetch server info and then processes
      await fetchGeoprocessingServers();
      // Also fetch processes from OGC API
      await fetchGeoprocessingProcesses();

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

  const handleToolClick = (toolId: string) => {
    console.log(`[Geoprocessing] Tool clicked: ${toolId}`);
    const process = processes.find((p) => p.id === toolId);
    if (process) {
      setSelectedProcess(process);
      setFormValues({});
      setActiveFormTab(0);
      setPanelView("form");
    }
  };

  const handleBackToTools = () => {
    setPanelView("tools");
    setSelectedProcess(null);
    setFormValues({});
    setActiveFormTab(0);
  };

  const handleFormChange = (inputName: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [inputName]: value,
    }));
  };

  const handleFormSubmit = async () => {
    if (!selectedProcess) return;

    try {
      setSubmitting(true);
      console.log(`[Geoprocessing] Submitting job for process:`, selectedProcess.id, "with values:", formValues);

      // Execute the job via API
      const result = await executeGeoprocessingJob(
        selectedProcess.id,
        selectedProcess.title || selectedProcess.id,
        formValues
      );

      if (result.error) {
        console.error("[Geoprocessing] Job execution failed:", result.error);
        alert(`Error executing job: ${result.error}`);
        return;
      }

      console.log("[Geoprocessing] Job submitted successfully:", result.jobId);

      // Dispatch GEOPROCESSING_ADD_JOB event with job details
      dispatchUIEvent({
        action: UI_EVENT_TYPE.GEOPROCESSING_ADD_JOB,
        parameters: {
          toolId: selectedProcess.id,
          toolName: selectedProcess.title || selectedProcess.id,
          inputs: formValues,
          jobId: result.jobId,
          status: result.status,
        },
      });

      // Show success message
      alert(`Job submitted successfully! Job ID: ${result.jobId}`);

      // Close the form
      setSelectedProcess(null);
      setFormValues({});
    } catch (error) {
      console.error("[Geoprocessing] Error submitting form:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    handleBackToTools();
  };

  // Detect input type based on schema
  const getInputType = (input: ProcessInput): "text" | "number" | "select" | "file" | "textarea" => {
    // Check for enum values (select dropdown)
    if (input.schema?.enum && Array.isArray(input.schema.enum)) {
      return "select";
    }

    // Check for file input (additionalParameters with file filter)
    if (input.additionalParameters?.parameters) {
      const hasFileInfo = input.additionalParameters.parameters.some(
        (param: any) => param.name === "IMAGINE.File" || param.value?.[0]?.FileFilter
      );
      if (hasFileInfo) {
        return "file";
      }
    }

    // Check schema type
    if (input.schema?.type === "number") {
      return "number";
    }

    // Default to text
    return "text";
  };

  // Get enum options for select inputs
  const getEnumOptions = (input: ProcessInput): string[] => {
    return input.schema?.enum ? (Array.isArray(input.schema.enum) ? input.schema.enum : []) : [];
  };

  // Get default value
  const getDefaultValue = (input: ProcessInput): string => {
    const defaultVal = input.schema?.default;
    return defaultVal ? String(defaultVal) : "";
  };

  // Group inputs into logical tabs
  const groupInputsIntoTabs = (inputs: Record<string, ProcessInput>): Array<{
    title: string;
    icon: string;
    fields: Array<[string, ProcessInput]>;
  }> => {
    const tabs: Array<{
      title: string;
      icon: string;
      fields: Array<[string, ProcessInput]>;
    }> = [];

    const inputFiles: Array<[string, ProcessInput]> = [];
    const parameters: Array<[string, ProcessInput]> = [];
    const outputFiles: Array<[string, ProcessInput]> = [];
    const settings: Array<[string, ProcessInput]> = [];

    Object.entries(inputs).forEach(([name, input]) => {
      const lowerName = name.toLowerCase();
      const isFile = getInputType(input) === "file";
      const isOutput = lowerName.includes("out") || lowerName.includes("output");
      const isParam =
        getInputType(input) === "select" || getInputType(input) === "number";

      if (isFile && isOutput) {
        outputFiles.push([name, input]);
      } else if (isFile) {
        inputFiles.push([name, input]);
      } else if (isParam) {
        parameters.push([name, input]);
      } else {
        settings.push([name, input]);
      }
    });

    // Add tabs
    if (inputFiles.length > 0) {
      tabs.push({
        title: "geoprocessing.inputFiles",
        icon: "fa-file-import",
        fields: inputFiles,
      });
    }

    if (parameters.length > 0) {
      tabs.push({
        title: "geoprocessing.parameters",
        icon: "fa-sliders-h",
        fields: parameters,
      });
    }

    if (outputFiles.length > 0) {
      tabs.push({
        title: "geoprocessing.outputFiles",
        icon: "fa-file-export",
        fields: outputFiles,
      });
    }

    if (settings.length > 0) {
      tabs.push({
        title: "geoprocessing.settings",
        icon: "fa-cog",
        fields: settings,
      });
    }

    // If no tabs were created, put everything in one tab
    if (tabs.length === 0) {
      tabs.push({
        title: "geoprocessing.fields",
        icon: "fa-list",
        fields: Object.entries(inputs),
      });
    }

    return tabs;
  };

  // Execute geoprocessing job via OGC API
  const executeGeoprocessingJob = async (
    processId: string,
    processTitle: string,
    inputs: Record<string, string>
  ): Promise<{ jobId?: string; status?: string; error?: string }> => {
    try {
      const ogcBaseUrl = "http://192.168.100.50";

      console.log("[Geoprocessing] Executing job:", {
        processId,
        ogcBaseUrl,
        inputs,
      });

      // Format inputs for OGC API - Processes
      const formattedInputs: Record<string, any> = {};
      Object.entries(inputs).forEach(([key, value]) => {
        if (value) {
          formattedInputs[key] = {
            value: value,
          };
        }
      });

      // Build the execute request URL
      const executeUrl = buildOgcUrl(ogcBaseUrl, `/processes/${processId}/execution`);
      const requestBody = {
        inputs: formattedInputs,
        responseType: "document",
      };

      console.log("[Geoprocessing] Sending request to:", executeUrl);
      console.log("[Geoprocessing] Request body:", requestBody);

      const response = await fetch(executeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          `[Geoprocessing] API Error (${response.status}):`,
          errorData
        );
        return {
          error: `API Error: ${response.status} - ${response.statusText}`,
        };
      }

      const result = await response.json();
      console.log("[Geoprocessing] Job execution response:", result);

      // Extract job ID from response
      const jobId = result.jobID || result.id || result.uuid;

      return {
        jobId,
        status: "submitted",
      };
    } catch (error) {
      console.error("[Geoprocessing] Error executing job:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

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
            {loading ? `${t("plugin.geoprocessing")}...` : serverName || t("plugin.geoprocessing")}
          </h4>
        </div>

        {/* Body */}
        <div className="catex-geoprocessing-body">
          {/* TOOLS VIEW */}
          {panelView === "tools" && (
            <div className="catex-geoprocessing-section">
              <h3>{t("geoprocessing.tools")}</h3>

              {processes.length > 0 ? (
                <div className="catex-geoprocessing-tools">
                  {processes.map((process) => {
                    const translationKeys = PROCESS_TRANSLATION_MAP[process.id];
                    const displayName = translationKeys
                      ? t(translationKeys.name)
                      : process.title || process.id;
                    const displayDesc = translationKeys
                      ? t(translationKeys.desc)
                      : process.description;
                    const iconClass = translationKeys?.icon || "fa-cogs";

                    return (
                      <div
                        key={process.id}
                        className="catex-geoprocessing-tool"
                        onClick={() => handleToolClick(process.id)}
                      >
                        <i className={`fa-solid ${iconClass} catex-geoprocessing-tool-icon`} />
                        <div className="catex-geoprocessing-tool-content">
                          <p className="catex-geoprocessing-tool-name">
                            {displayName}
                          </p>
                          {displayDesc && (
                            <p className="catex-geoprocessing-tool-desc">
                              {displayDesc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="catex-geoprocessing-empty">{t("geoprocessing.noProcesses") || "No processes available"}</p>
              )}
            </div>
          )}

          {/* FORM VIEW */}
          {panelView === "form" && selectedProcess && (
            <div className="catex-geoprocessing-form-view">
              {/* Form Description */}
              {selectedProcess.description && (
                <div className="catex-geoprocessing-form-description-panel">
                  <p>{selectedProcess.description}</p>
                </div>
              )}

              {/* Form Tabs */}
              {selectedProcess.inputs && Object.keys(selectedProcess.inputs).length > 0 && (
                <>
                  {(() => {
                    const tabs = groupInputsIntoTabs(selectedProcess.inputs!);
                    return tabs.length > 1 ? (
                      <div className="catex-geoprocessing-panel-form-tabs">
                        {tabs.map((tab, index) => (
                          <button
                            key={index}
                            className={`catex-geoprocessing-panel-form-tab ${activeFormTab === index ? "active" : ""}`}
                            onClick={() => setActiveFormTab(index)}
                          >
                            <i className={`fa-solid ${tab.icon}`} />
                            <span>{t(tab.title)}</span>
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </>
              )}

              {/* Form Fields */}
              <div className="catex-geoprocessing-panel-form-fields-container">
                {selectedProcess.inputs && Object.keys(selectedProcess.inputs).length > 0 ? (
                  (() => {
                    const tabs = groupInputsIntoTabs(selectedProcess.inputs!);
                    const currentTab = tabs[activeFormTab];

                    return (
                      <div className="catex-geoprocessing-panel-form-fields">
                        {currentTab.fields.map(([inputName, input]) => {
                          const inputType = getInputType(input);
                          const enumOptions = getEnumOptions(input);
                          const defaultValue = getDefaultValue(input);
                          const currentValue = formValues[inputName] || defaultValue || "";

                          return (
                            <div
                              key={inputName}
                              className={`catex-geoprocessing-panel-form-field catex-form-type-${inputType}`}
                            >
                              <label htmlFor={inputName} className="catex-geoprocessing-panel-form-label">
                                {input.title || inputName}
                                {input.minOccurs ? <span className="required">*</span> : ""}
                              </label>
                              {input.description && (
                                <p className="catex-geoprocessing-panel-form-field-desc">
                                  {input.description}
                                </p>
                              )}

                              {/* Text Input */}
                              {inputType === "text" && (
                                <input
                                  id={inputName}
                                  type="text"
                                  className="catex-geoprocessing-panel-form-input"
                                  placeholder={`Enter ${input.title || inputName}`}
                                  value={currentValue}
                                  onChange={(e) => handleFormChange(inputName, e.target.value)}
                                  required={input.minOccurs ? true : false}
                                />
                              )}

                              {/* Number Input */}
                              {inputType === "number" && (
                                <input
                                  id={inputName}
                                  type="number"
                                  className="catex-geoprocessing-panel-form-input"
                                  placeholder={`Enter ${input.title || inputName}`}
                                  value={currentValue}
                                  onChange={(e) => handleFormChange(inputName, e.target.value)}
                                  required={input.minOccurs ? true : false}
                                  step="any"
                                />
                              )}

                              {/* Select/Enum Input */}
                              {inputType === "select" && (
                                <select
                                  id={inputName}
                                  className="catex-geoprocessing-panel-form-input catex-geoprocessing-panel-form-select"
                                  value={currentValue}
                                  onChange={(e) => handleFormChange(inputName, e.target.value)}
                                  required={input.minOccurs ? true : false}
                                >
                                  <option value="">{t("geoprocessing.selectOption") || "Select an option..."}</option>
                                  {enumOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* File Input */}
                              {inputType === "file" && (
                                <input
                                  id={inputName}
                                  type="file"
                                  className="catex-geoprocessing-panel-form-input catex-geoprocessing-panel-form-file"
                                  onChange={(e) => {
                                    const fileName = e.target.files?.[0]?.name || "";
                                    handleFormChange(inputName, fileName);
                                  }}
                                  required={input.minOccurs ? true : false}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  <p className="catex-geoprocessing-empty">{t("geoprocessing.noInputs") || "No inputs required"}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Footer (visible only in form view) */}
      {panelView === "form" && selectedProcess && (
        <div className="catex-geoprocessing-form-footer-panel">
          <button
            className="catex-geoprocessing-panel-form-back"
            onClick={handleBackToTools}
            disabled={submitting}
          >
            <i className="fa-solid fa-arrow-left" />
            {t("general.back") || "Back"}
          </button>
          <button
            className="catex-geoprocessing-panel-form-submit"
            onClick={handleFormSubmit}
            disabled={submitting}
          >
            {submitting ? `${t("general.loading")}...` : t("geoprocessing.execute")}
          </button>
        </div>
      )}
    </>
  );
};

export default GeoprocessingPanel;
