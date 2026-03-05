export function removeElements(selectors: string[]): void {
  const observer = new MutationObserver(() => {
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}