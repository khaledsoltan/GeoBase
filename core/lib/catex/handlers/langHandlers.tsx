export function watchLanguage(callback: (lang: string) => void): void {
  const update = () => {
    // Read from original app's lang button
    const langBtn = document.querySelector("#navbar-lang-switch-button");
    if (langBtn) {
      const text = langBtn.textContent?.trim().toLowerCase() || "";
      if (text.includes("en")) callback("en");
      else if (text.includes("ar") || text.includes("عر")) callback("ar");
    }
  };

  update();

  const observer = new MutationObserver(update);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}