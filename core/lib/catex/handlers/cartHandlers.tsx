export function watchCartCount(callback: (count: number) => void): void {
  const update = () => {
    const counter = document.querySelector(".shopping-cart-counter");
    if (counter) {
      const text = counter.textContent?.trim() || "0";
      const count = parseInt(text, 10) || 0;
      callback(count);
    }
  };

  // Initial check
  update();

  // Watch for changes
  const observer = new MutationObserver(update);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}