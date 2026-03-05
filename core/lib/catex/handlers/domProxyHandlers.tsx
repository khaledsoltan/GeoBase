export function clickElement(selector: string): boolean {
  const el = document.querySelector(selector) as HTMLElement;
  if (el) {
    el.click();
    console.log(`[catex] Clicked: ${selector}`);
    return true;
  }
  console.warn(`[catex] Not found: ${selector}`);
  return false;
}


export function clickToggleByText(text: string): boolean {
  const icons = document.querySelectorAll(".toggle-button .toggle-icon");
  
  // Try exact match first
  for (const icon of icons) {
    if (icon.textContent?.trim() === text) {
      const btn = icon.closest(".toggle-button") as HTMLElement;
      if (btn) {
        btn.click();
        console.log(`[catex] Clicked toggle: ${text}`);
        return true;
      }
    }
  }

  // For 2D/3D — they swap, so try the opposite
  const pairs: Record<string, string> = { "3D": "2D", "2D": "3D" };
  const alt = pairs[text];
  if (alt) {
    for (const icon of icons) {
      if (icon.textContent?.trim() === alt) {
        const btn = icon.closest(".toggle-button") as HTMLElement;
        if (btn) {
          btn.click();
          console.log(`[catex] Clicked toggle (alt): ${alt}`);
          return true;
        }
      }
    }
  }

  console.warn(`[catex] Toggle not found: ${text}`);
  return false;
}