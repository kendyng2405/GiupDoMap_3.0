// views/components/Toast.js
export const Toast = {
  show(message, type = "success", duration = 4000) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0">
        ${type === "error"
          ? `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`
          : `<polyline points="20 6 9 17 4 12"/>`}
      </svg>
      <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "toastOut .35s ease forwards";
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },
};
