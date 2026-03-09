import React, { useState, useEffect } from "react";
import authHandler from "@/core/lib/catex/handlers/authHandler";
import keycloakConfig from "@/core/lib/config/keycloak.json";
import "./CatalogBrowser.css";

interface Folder {
  id: string;
  name: string;
  title?: string;
  path: string;
  type?: string;
  children?: Folder[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface FolderResponse {
  results?: Folder[];
  data?: Folder[];
}

interface CatalogBrowserProps {
  onClose: () => void;
  onSelectData?: (dataId: string) => void;
}

export default function CatalogBrowser({ onClose, onSelectData }: CatalogBrowserProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    loadRootFolders();
  }, []);

  const loadRootFolders = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${keycloakConfig.apiBaseUrl}/folder/detailed?foldersOnly=true&page=1&pageSize=65536`;
      const response = await authHandler.fetch<FolderResponse>(url);

      if (response.results) {
        setFolders(response.results);
      }
    } catch (err) {
      console.error("Error loading folders:", err);
      setError("Failed to load folders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadChildFolders = async (parentId: string): Promise<Folder[]> => {
    try {
      const url = `${keycloakConfig.apiBaseUrl}/data/filter?pageSize=50&page=1&sortBy=creationTime&sortOrder=DESC&rsqlQuery=parent==${parentId}`;
      const response = await authHandler.fetch<FolderResponse>(url);

      return response.data || [];
    } catch (err) {
      console.error("Error loading child folders:", err);
      return [];
    }
  };

  const toggleFolder = async (folderId: string, folderPath: string[]) => {
    // Find and toggle the folder
    const updateFolder = (items: Folder[], path: string[], index: number): Folder[] => {
      return items.map((folder) => {
        if (folder.id === path[index]) {
          if (index === path.length - 1) {
            // This is the folder to toggle
            const newExpanded = !folder.isExpanded;

            if (newExpanded && !folder.children) {
              // Load children
              folder.isLoading = true;
              loadChildFolders(folder.id).then((children) => {
                setFolders((prevFolders) => {
                  const updated = updateFolderChildren(prevFolders, path, children);
                  return updated;
                });
              });
            }

            return { ...folder, isExpanded: newExpanded };
          } else {
            // Continue down the path
            return {
              ...folder,
              children: folder.children ? updateFolder(folder.children, path, index + 1) : [],
            };
          }
        }
        return folder;
      });
    };

    const updateFolderChildren = (items: Folder[], path: string[], children: Folder[]): Folder[] => {
      return items.map((folder) => {
        if (folder.id === path[path.length - 1]) {
          return { ...folder, children, isLoading: false, isExpanded: true };
        } else if (path.includes(folder.id) && folder.children) {
          return {
            ...folder,
            children: updateFolderChildren(folder.children, path, children),
          };
        }
        return folder;
      });
    };

    setFolders((prevFolders) => updateFolder(prevFolders, folderPath, 0));
  };

  const handleFolderClick = (folder: Folder, path: string[]) => {
    setSelectedFolder(folder.id);

    if (folder.type && folder.type !== "folder") {
      // This is a data item, not a folder
      if (onSelectData) {
        onSelectData(folder.id);
      }
    } else {
      // This is a folder, toggle expand/collapse
      toggleFolder(folder.id, path);
    }
  };

  const renderFolder = (folder: Folder, path: string[] = [], level: number = 0): React.ReactNode => {
    const currentPath = [...path, folder.id];
    const isFolder = !folder.type || folder.type === "folder";
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolder === folder.id;

    return (
      <div key={folder.id} className="catex-catalog-folder-item">
        <div
          className={`catex-catalog-folder-row ${isSelected ? "selected" : ""}`}
          style={{ paddingLeft: `${level * 20 + 10}px` }}
          onClick={() => handleFolderClick(folder, currentPath)}
        >
          {isFolder && (
            <i
              className={`fa-solid ${
                folder.isLoading
                  ? "fa-spinner fa-spin"
                  : folder.isExpanded
                  ? "fa-chevron-down"
                  : "fa-chevron-right"
              } catex-catalog-chevron`}
            />
          )}
          <i
            className={`fa-solid ${
              isFolder ? "fa-folder" : "fa-file-image"
            } catex-catalog-icon`}
          />
          <span className="catex-catalog-folder-name">{folder.title || folder.name}</span>
        </div>

        {isFolder && folder.isExpanded && hasChildren && (
          <div className="catex-catalog-folder-children">
            {folder.children!.map((child) => renderFolder(child, currentPath, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="catex-catalog-browser">
      <div className="catex-catalog-header">
        <h3 className="catex-catalog-title">Browse Catalogs</h3>
        <button className="catex-catalog-close" onClick={onClose}>
          <i className="fa-solid fa-times" />
        </button>
      </div>

      <div className="catex-catalog-content">
        <div className="catex-catalog-tree-header">
          <h4>Catalogs Tree</h4>
        </div>

        <div className="catex-catalog-tree">
          {loading ? (
            <div className="catex-catalog-loading">
              <i className="fa-solid fa-spinner fa-spin" />
              <span>Loading folders...</span>
            </div>
          ) : error ? (
            <div className="catex-catalog-error">
              <i className="fa-solid fa-exclamation-triangle" />
              <span>{error}</span>
              <button onClick={loadRootFolders}>Retry</button>
            </div>
          ) : (
            folders.map((folder) => renderFolder(folder))
          )}
        </div>
      </div>
    </div>
  );
}
