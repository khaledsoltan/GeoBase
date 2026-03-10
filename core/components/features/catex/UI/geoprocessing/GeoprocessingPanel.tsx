import React, { useState, useEffect } from "react";
import { useLanguage } from "@/core/lib/catex/language/useLanguage";
import { UI_EVENT_TYPE, UIEventInterface } from "@/core/components/features/catex/types/UIEventTypes";
import authHandler from "@/core/lib/catex/handlers/authHandler";
import keycloakConfig from "@/core/lib/config/keycloak.json";
import {
  getServersUrl,
  getProcessesUrl,
  getProcessDetailsUrl,
  getProcessExecutionUrl,
  getWmsPreviewUrl,
} from "@/core/lib/config/geoprocessing.config";
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
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<GeoprocessingProcess | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState(0);
  const [panelView, setPanelView] = useState<"tools" | "form" | "catalog">("tools");
  const [showCatalogBrowser, setShowCatalogBrowser] = useState(false);
  const [activeInputField, setActiveInputField] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderChildren, setFolderChildren] = useState<Map<string, any[]>>(new Map());
  const { t, isRTL } = useLanguage();

  // Helper function to translate field names
  const translateFieldName = (fieldName: string): string => {
    // Convert field name to camelCase key
    const key = fieldName
      .replace(/\s+/g, "")
      .replace(/^./, (char) => char.toLowerCase());
    const translationKey = `geoprocessing.field.${key}`;
    const translated = t(translationKey);
    // Return translation if it exists, otherwise return original
    return translated !== translationKey ? translated : fieldName;
  };

  // Helper function to translate field descriptions
  const translateFieldDesc = (fieldName: string, originalDesc?: string): string => {
    const key = fieldName
      .replace(/\s+/g, "")
      .replace(/^./, (char) => char.toLowerCase());
    const translationKey = `geoprocessing.field.${key}Desc`;
    const translated = t(translationKey);
    // Return translation if it exists, otherwise return original description
    return translated !== translationKey ? translated : (originalDesc || "");
  };


  // Fetch detailed process information including inputs and outputs
  const fetchProcessDetails = async (processId: string): Promise<GeoprocessingProcess | null> => {
    try {
      console.log("[Geoprocessing] Fetching process details for:", processId);
      const url = getProcessDetailsUrl(processId);
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
      setLoadingProcesses(true);
      const url = getProcessesUrl();
      console.log("[Geoprocessing] Fetching processes from:", url);
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
    } finally {
      setLoadingProcesses(false);
    }
  };

  // Fetch geoprocessing servers info
  const fetchGeoprocessingServers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getServersUrl());
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

  // Load folders for catalog browser
  const loadFolders = async (parentId: string | null = null) => {
    try {
      setLoadingFolders(true);

      let url: string;
      let response: any;
      let items: any[] = [];

      if (parentId === null) {
        // Load root folders
        url = `${keycloakConfig.apiBaseUrl}/folder/detailed?foldersOnly=true&page=1&pageSize=65536`;
        console.log("[Catalog] Loading root folders from:", url);
        response = await authHandler.fetch<any>(url);
        items = response.results || [];
        console.log("[Catalog] Root folders loaded:", items.length);
        setFolders(items);
      } else {
        // Load child folders/files - get ALL items (folders and files)
        url = `${keycloakConfig.apiBaseUrl}/data/filter?pageSize=100&page=1&sortBy=creationTime&sortOrder=DESC&rsqlQuery=parent==${parentId}`;
        console.log("[Catalog] Loading child items for parent:", parentId, "from:", url);
        response = await authHandler.fetch<any>(url);
        items = response.data || [];
        console.log("[Catalog] Child items loaded:", items.length);

        // Log first item structure to debug
        if (items.length > 0) {
          console.log("[Catalog] Sample item structure:", {
            id: items[0].id,
            name: items[0].name,
            title: items[0].title,
            type: items[0].type,
            dataType: items[0].dataType,
            folder: items[0].folder,
            isFolder: items[0].isFolder,
            allKeys: Object.keys(items[0])
          });
        }

        // Store children in the map
        setFolderChildren(prev => {
          const newMap = new Map(prev);
          newMap.set(parentId, items);
          return newMap;
        });
      }
    } catch (err) {
      console.error("[Catalog] Error loading folders:", err);
      if (parentId === null) {
        setFolders([]);
      }
    } finally {
      setLoadingFolders(false);
    }
  };

  // Toggle folder expansion
  const toggleFolderExpansion = async (folderId: string) => {
    const isExpanded = expandedFolders.has(folderId);

    if (isExpanded) {
      // Collapse folder
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    } else {
      // Expand folder
      setExpandedFolders(prev => new Set(prev).add(folderId));

      // Load children if not already loaded
      if (!folderChildren.has(folderId)) {
        await loadFolders(folderId);
      }
    }
  };

  // Check if item is a folder
  const isItemFolder = (item: any): boolean => {
    return (
      item.type === "folder" ||
      item.type === "FOLDER" ||
      item.dataType === "folder" ||
      item.dataType === "FOLDER" ||
      item.folder === true ||
      item.isFolder === true ||
      (!item.dataType && !item.type) ||
      (item.dataType === null && item.type === null)
    );
  };

  // Render tree item recursively
  const renderTreeItem = (item: any, depth: number = 0): JSX.Element[] => {
    const isFolder = isItemFolder(item);
    const itemName = item.name || item.title || item.id || "Unnamed";
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = folderChildren.has(item.id);
    const children = hasChildren ? folderChildren.get(item.id) || [] : [];

    const elements: JSX.Element[] = [];

    // Render the item itself
    elements.push(
      <div
        key={item.id}
        className="catex-geoprocessing-catalog-item"
        style={{ paddingLeft: `${depth * 20 + 16}px` }}
      >
        {isFolder && (
          <i
            className={`fa-solid ${isExpanded ? "fa-chevron-down" : "fa-chevron-right"} catex-geoprocessing-catalog-expand-icon`}
            onClick={() => toggleFolderExpansion(item.id)}
          />
        )}
        {!isFolder && <span className="catex-geoprocessing-catalog-spacer" />}
        <i
          className={`fa-solid ${isFolder ? "fa-folder" : "fa-file-image"}`}
          onClick={() => {
            if (isFolder) {
              toggleFolderExpansion(item.id);
            } else {
              selectFile(item);
            }
          }}
        />
        <span
          className="catex-geoprocessing-catalog-item-name"
          onClick={() => {
            if (isFolder) {
              toggleFolderExpansion(item.id);
            } else {
              selectFile(item);
            }
          }}
        >
          {itemName}
        </span>
        {!isFolder && (
          <button
            className="catex-geoprocessing-catalog-preview-btn"
            onClick={(e) => {
              e.stopPropagation();
              previewFileOnMap(item);
            }}
            title={t("geoprocessing.previewOnMap") || "Preview on map"}
          >
            <i className="fa-solid fa-eye" />
          </button>
        )}
      </div>
    );

    // Render children if expanded
    if (isFolder && isExpanded && hasChildren) {
      children.forEach(child => {
        elements.push(...renderTreeItem(child, depth + 1));
      });
    }

    return elements;
  };

  // Navigate into a folder
  const navigateToFolder = (folder: any) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name || folder.title }]);
    loadFolders(folder.id);
  };

  // Navigate back to parent folder
  const navigateBack = () => {
    if (folderPath.length === 0) {
      // Already at root, go back to form view
      setPanelView("form");
      return;
    }

    if (folderPath.length === 1) {
      // Go back to root
      setCurrentFolderId(null);
      setFolderPath([]);
      loadFolders(null);
    } else {
      // Go back to parent folder
      const newPath = folderPath.slice(0, -1);
      const parentFolder = newPath[newPath.length - 1];
      setCurrentFolderId(parentFolder.id);
      setFolderPath(newPath);
      loadFolders(parentFolder.id);
    }
  };

  // Select a file (not folder)
  const selectFile = (item: any) => {
    if (activeInputField) {
      // Use the file path or ID
      const filePath = item.filePath || item.id;
      handleFormChange(activeInputField, filePath);
    }
    setPanelView("form");
    setActiveInputField(null);
    setCurrentFolderId(null);
    setFolderPath([]);
  };

  // Preview file on map (WMS)
  const previewFileOnMap = async (item: any) => {
    try {
      console.log("[Catalog] Previewing file on map:", item);
      console.log("[Catalog] Item ID:", item.id);

      // Check if catex.workspace is available
      if (!window.catex?.workspace?.emitCommand) {
        console.error("[Catalog] catex.workspace.emitCommand not available");
        alert("Preview feature is only available when running in Catalog Explorer");
        return;
      }

      const itemName = item.name || item.title || item.id || "Preview";

      // Construct WMS URL using Apollo proxy: http://localhost:3002/apollo/ogc/wms/preview_data_{id}
      const wmsUrl = getWmsPreviewUrl(item.id);

      console.log("[Catalog] WMS URL (via Apollo proxy):", wmsUrl);

      // Get layer name from GetCapabilities
      const getCapabilitiesUrl = `${wmsUrl}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`;
      console.log("[Catalog] Fetching GetCapabilities from:", getCapabilitiesUrl);

      // Fetch GetCapabilities to get layer name
      let layerName = `preview_data_${item.id}`;
      try {
        const capResponse = await fetch(getCapabilitiesUrl);
        if (capResponse.ok) {
          const capText = await capResponse.text();
          console.log("[Catalog] GetCapabilities response received");

          // Try to extract layer name from XML
          const layerMatch = capText.match(/<Layer[^>]*>[\s\S]*?<Name>(.*?)<\/Name>/);
          if (layerMatch && layerMatch[1]) {
            layerName = layerMatch[1];
            console.log("[Catalog] Extracted layer name:", layerName);
          }
        }
      } catch (err) {
        console.warn("[Catalog] Could not fetch GetCapabilities, using default layer name:", err);
      }

      // Create WMS layer command
      const command = {
        action: 10,
        parameters: {
          action: "WMSLayer",
          autozoom: true,
          layer: {
            label: itemName,
            visible: true,
            selectable: false,
            editable: false
          },
          model: {
            baseURL: wmsUrl,
            layers: [layerName],
            version: "1.3.0",
            transparent: true,
            format: "image/png",
            reference: "EPSG:3857",
            useProxy: false,
            credentials: false,
            requestHeaders: {},
            requestParameters: {}
          }
        }
      };

      console.log("[Catalog] Dispatching WMS command:", JSON.stringify(command, null, 2));

      // Dispatch command to host application
      window.catex.workspace.emitCommand(command);
      console.log("[Catalog] WMS layer added to map:", itemName);

    } catch (error) {
      console.error("[Catalog] Error previewing file:", error);
      alert(t("geoprocessing.previewError") || "Error previewing file on map");
    }
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
        alert(t("geoprocessing.submitError").replace("{error}", result.error));
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
      alert(t("geoprocessing.submitSuccess").replace("{jobId}", result.jobId || ""));

      // Close the form
      setSelectedProcess(null);
      setFormValues({});
    } catch (error) {
      console.error("[Geoprocessing] Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : t("geoprocessing.unknownError");
      alert(t("geoprocessing.submitError").replace("{error}", errorMessage));
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
      console.log("[Geoprocessing] Executing job:", {
        processId,
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
      const executeUrl = getProcessExecutionUrl(processId);
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

              {loadingProcesses ? (
                <div className="catex-geoprocessing-loader">
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "24px", color: "#1B6B3A" }} />
                  <p>{t("geoprocessing.loadingProcesses")}</p>
                </div>
              ) : processes.length > 0 ? (
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
                <p className="catex-geoprocessing-empty">{t("geoprocessing.noProcesses")}</p>
              )}
            </div>
          )}

          {/* FORM VIEW */}
          {panelView === "form" && selectedProcess && (
            <div className="catex-geoprocessing-form-view">
              {/* Back Button */}
              <div className="catex-geoprocessing-form-back-container">
                <button
                  className="catex-geoprocessing-form-back-button"
                  onClick={handleBackToTools}
                  disabled={submitting}
                >
                  <i className="fa-solid fa-arrow-left" />
                  <span>{t("general.back")}</span>
                </button>
                <h3 className="catex-geoprocessing-form-tool-title">
                  {translateFieldName(selectedProcess.title || selectedProcess.id)}
                </h3>
              </div>

              {/* Form Description */}
              {selectedProcess.description && (
                <div className="catex-geoprocessing-form-description-panel">
                  <p>
                    {(() => {
                      const translationKeys = PROCESS_TRANSLATION_MAP[selectedProcess.id];
                      return translationKeys ? t(translationKeys.desc) : selectedProcess.description;
                    })()}
                  </p>
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
                                {translateFieldName(input.title || inputName)}
                                {input.minOccurs ? <span className="required">*</span> : ""}
                              </label>
                              {(input.description || translateFieldDesc(input.title || inputName, input.description)) && (
                                <p className="catex-geoprocessing-panel-form-field-desc">
                                  {translateFieldDesc(input.title || inputName, input.description)}
                                </p>
                              )}

                              {/* Text Input */}
                              {inputType === "text" && (
                                <input
                                  id={inputName}
                                  type="text"
                                  className="catex-geoprocessing-panel-form-input"
                                  placeholder={t("geoprocessing.enterField").replace("{field}", input.title || inputName)}
                                  value={currentValue}
                                  onChange={(e) => handleFormChange(inputName, e.target.value)}
                                  required={input.minOccurs ? true : false}
                                  dir={isRTL ? "rtl" : "ltr"}
                                />
                              )}

                              {/* Number Input */}
                              {inputType === "number" && (
                                <input
                                  id={inputName}
                                  type="number"
                                  className="catex-geoprocessing-panel-form-input"
                                  placeholder={t("geoprocessing.enterField").replace("{field}", input.title || inputName)}
                                  value={currentValue}
                                  onChange={(e) => handleFormChange(inputName, e.target.value)}
                                  required={input.minOccurs ? true : false}
                                  step="any"
                                  dir={isRTL ? "rtl" : "ltr"}
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
                                  dir={isRTL ? "rtl" : "ltr"}
                                >
                                  <option value="">{t("geoprocessing.selectOption")}</option>
                                  {enumOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* File Input */}
                              {inputType === "file" && (
                                <div className="catex-geoprocessing-file-input-group">
                                  <input
                                    id={inputName}
                                    type="text"
                                    className="catex-geoprocessing-panel-form-input catex-geoprocessing-panel-form-file"
                                    value={formValues[inputName] || ""}
                                    placeholder={t("geoprocessing.selectFile")}
                                    readOnly
                                    required={input.minOccurs ? true : false}
                                    dir={isRTL ? "rtl" : "ltr"}
                                  />
                                  <button
                                    type="button"
                                    className="catex-geoprocessing-choose-file-btn"
                                    onClick={() => {
                                      setActiveInputField(inputName);
                                      setPanelView("catalog");
                                      setCurrentFolderId(null);
                                      setFolderPath([]);
                                      loadFolders(null);
                                    }}
                                  >
                                    <i className="fa-solid fa-folder-open" />
                                    <span>{t("geoprocessing.chooseFile")}</span>
                                  </button>
                                </div>
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

          {/* CATALOG VIEW - Tree Structure */}
          {panelView === "catalog" && (
            <div className="catex-geoprocessing-section">
              {/* Back Button */}
              <div className="catex-geoprocessing-form-back-container">
                <button
                  className="catex-geoprocessing-form-back-button"
                  onClick={() => {
                    setPanelView("form");
                    setActiveInputField(null);
                    setExpandedFolders(new Set());
                    setFolderChildren(new Map());
                  }}
                >
                  <i className="fa-solid fa-arrow-left" />
                  <span>{t("general.back")}</span>
                </button>
              </div>

              {/* Catalog Title */}
              <div className="catex-geoprocessing-catalog-header">
                <h3>{t("geoprocessing.browseCatalog") || "Browse Catalog"}</h3>
              </div>

              {loadingFolders && folders.length === 0 ? (
                <div className="catex-geoprocessing-loader">
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "24px", color: "#1B6B3A" }} />
                  <p>{t("general.loading")}...</p>
                </div>
              ) : folders.length === 0 ? (
                <div className="catex-geoprocessing-empty">
                  <p>{t("geoprocessing.noItems") || "No items found"}</p>
                </div>
              ) : (
                <div className="catex-geoprocessing-catalog-tree">
                  {folders.map((item) => renderTreeItem(item, 0))}
                </div>
              )}
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
