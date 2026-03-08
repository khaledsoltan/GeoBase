# UI Events Integration Guide

This document explains how the host application can control the Catex geoprocessing panel using UI events.

## Overview

The Catex extension listens for UI events from the host application and performs corresponding actions. This allows the host application to control the geoprocessing panel programmatically.

## Supported Events

### 1. GEOPROCESSING_SERVERS (2011)
Opens the geoprocessing panel and shows the servers/tools view.

**Example:**
```javascript
window.dispatchEvent(new CustomEvent('ui:event', {
  detail: {
    action: 2011, // GEOPROCESSING_SERVERS
    parameters: {}
  }
}));
```

**Result:**
- Geoprocessing panel opens
- Category is set to "Geoprocessing"
- Shows list of geoprocessing tools

---

### 2. GEOPROCESSING_ADD_JOB (2012)
Opens the geoprocessing panel and optionally selects a specific tool.

**Example (no specific tool):**
```javascript
window.dispatchEvent(new CustomEvent('ui:event', {
  detail: {
    action: 2012, // GEOPROCESSING_ADD_JOB
    parameters: {}
  }
}));
```

**Example (with specific tool):**
```javascript
window.dispatchEvent(new CustomEvent('ui:event', {
  detail: {
    action: 2012, // GEOPROCESSING_ADD_JOB
    parameters: {
      toolId: 'buffer', // or 'intersect', 'union', 'clip', 'dissolve'
      toolName: 'Buffer Analysis'
    }
  }
}));
```

**Result:**
- Geoprocessing panel opens
- If toolId is provided, that tool is automatically selected
- Tool click event is dispatched back to host app

---

### 3. GEOPROCESSING_LIST_JOBS (2013)
Opens the geoprocessing panel and shows the jobs list view.

**Example:**
```javascript
window.dispatchEvent(new CustomEvent('ui:event', {
  detail: {
    action: 2013, // GEOPROCESSING_LIST_JOBS
    parameters: {}
  }
}));
```

**Result:**
- Geoprocessing panel opens
- Category is set to "Jobs"
- Shows jobs list view

---

## Alternative Event Format

You can also use the `catex:host:event` format:

```javascript
window.dispatchEvent(new CustomEvent('catex:host:event', {
  detail: {
    action: 2011,
    parameters: {}
  }
}));
```

Both formats are supported and work identically.

---

## Bidirectional Communication

### Host App → Catex (Control Panel)
Use the events above to control the panel.

### Catex → Host App (Dispatch Actions)
The Catex panel also dispatches events back to the host application when users interact with it:

**Listen for events from Catex:**
```javascript
window.addEventListener('catex:ui:event', (event) => {
  const { action, parameters } = event.detail;

  switch(action) {
    case 2011: // GEOPROCESSING_SERVERS
      console.log('User opened geoprocessing servers view');
      // Fetch and display server data
      break;

    case 2012: // GEOPROCESSING_ADD_JOB
      console.log('User wants to add a job:', parameters);
      // Open job creation dialog
      break;

    case 2013: // GEOPROCESSING_LIST_JOBS
      console.log('User opened jobs list');
      // Fetch and display jobs
      break;
  }
});
```

---

## Complete Integration Example

```javascript
// Host application code

// 1. Listen for events from Catex
window.addEventListener('catex:ui:event', handleCatexEvent);

function handleCatexEvent(event) {
  const { action, parameters } = event.detail;

  switch(action) {
    case 2011: // GEOPROCESSING_SERVERS
      fetchGeoprocessingServers();
      break;

    case 2012: // GEOPROCESSING_ADD_JOB
      openJobCreationDialog(parameters?.toolId);
      break;

    case 2013: // GEOPROCESSING_LIST_JOBS
      fetchAndDisplayJobs();
      break;
  }
}

// 2. Programmatically control the Catex panel
function openGeoprocessingPanel() {
  window.dispatchEvent(new CustomEvent('ui:event', {
    detail: {
      action: 2011,
      parameters: {}
    }
  }));
}

function openJobsList() {
  window.dispatchEvent(new CustomEvent('ui:event', {
    detail: {
      action: 2013,
      parameters: {}
    }
  }));
}

function createBufferJob() {
  window.dispatchEvent(new CustomEvent('ui:event', {
    detail: {
      action: 2012,
      parameters: {
        toolId: 'buffer'
      }
    }
  }));
}
```

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Host Application                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Dispatches ui:event
                              │ (action: 2011, 2012, or 2013)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Catex UI Event Handler                     │
│                  (uiEventHandler.ts)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Dispatches internal events
                              │ (catex:geoprocessing:*)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Geoprocessing Panel                         │
│              (GeoprocessingPanel.tsx)                        │
│                                                              │
│  - Opens panel                                               │
│  - Sets category (Jobs/Geoprocessing)                       │
│  - Selects tools                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ User interacts with panel
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Dispatches catex:ui:event                   │
│                  back to Host Application                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Available Tools

When using `GEOPROCESSING_ADD_JOB`, you can specify these tool IDs:

- `buffer` - Create buffer zones around features
- `intersect` - Find overlapping areas between layers
- `union` - Combine multiple features into one
- `clip` - Extract features within a boundary
- `dissolve` - Merge adjacent features with same attributes

---

## Testing

### Test in Browser Console

```javascript
// Open geoprocessing tools
window.dispatchEvent(new CustomEvent('ui:event', {
  detail: { action: 2011 }
}));

// Open jobs list
window.dispatchEvent(new CustomEvent('ui:event', {
  detail: { action: 2013 }
}));

// Select buffer tool
window.dispatchEvent(new CustomEvent('ui:event', {
  detail: {
    action: 2012,
    parameters: { toolId: 'buffer' }
  }
}));
```

---

## Event Constants

For TypeScript projects, import the event types:

```typescript
import { UI_EVENT_TYPE } from './core/components/features/catex/types/UIEventTypes';

window.dispatchEvent(new CustomEvent('ui:event', {
  detail: {
    action: UI_EVENT_TYPE.GEOPROCESSING_SERVERS,
    parameters: {}
  }
}));
```
