export function hideOnOpen(selectors: string[]): void {
  const observer = new MutationObserver(() => {
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.visibility !== "hidden") {
          htmlEl.style.visibility = "hidden";
          htmlEl.style.height = "0";
          htmlEl.style.overflow = "hidden";
          htmlEl.style.position = "absolute";
          htmlEl.style.pointerEvents = "none";
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });
}