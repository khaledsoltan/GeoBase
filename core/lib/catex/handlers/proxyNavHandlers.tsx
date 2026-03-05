import navConfig from "./../../config/navProxy.json";

function waitForElement(selector: string, timeout = 5000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector) as HTMLElement;
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

export async function triggerOriginalNav(menuKey: string): Promise<void> {
  const selector = (navConfig.nav as Record<string, string>)[menuKey];
  if (!selector) {
    console.warn(`[catex] No nav proxy selector for: ${menuKey}`);
    return;
  }

  // Make header interactable
  const header = document.querySelector(".Workspace-header") as HTMLElement;
  if (header) {
    header.style.pointerEvents = "auto";
  }

  // Wait for element if not yet rendered
  const el = await waitForElement(selector);

  if (el) {
    el.click();
    console.log(`[catex] Clicked: ${menuKey} -> ${selector}`);
  } else {
    console.warn(`[catex] Element not found after waiting: ${selector}`);
  }
}

export function triggerOriginalNavClose(): void {
  document.body.click();
}