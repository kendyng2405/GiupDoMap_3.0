// controllers/NotificationController.js
import { NotificationModel } from "../models/NotificationModel.js";
import { router } from "./Router.js";
import { Toast }  from "../views/components/Toast.js";

let _panel   = null;
let _uid     = null;
let _notifs  = [];
let _polling = null;

export const NotificationController = {

  async init(uid) {
    _uid = uid;
    await this.refresh();
    // Poll mỗi 30s để cập nhật badge
    clearInterval(_polling);
    _polling = setInterval(() => this.refresh(), 30000);
  },

  stop() {
    clearInterval(_polling);
    _uid = null;
  },

  async refresh() {
    if (!_uid) return;
    try {
      _notifs = await NotificationModel.getForUser(_uid, 30);
      _updateBadge();
      if (_panel && _panel.style.display !== "none") _renderPanel();
    } catch(e) {}
  },

  toggle() {
    if (!_panel) _buildPanel();
    const isOpen = _panel.style.display !== "none";
    if (isOpen) {
      _panel.style.display = "none";
    } else {
      _panel.style.display = "flex";
      _renderPanel();
      // Mark all read sau 1s
      setTimeout(async () => {
        if (_uid) await NotificationModel.markAllRead(_uid);
        _notifs.forEach(n => n.read = true);
        _updateBadge();
      }, 1000);
    }
  },

  close() {
    if (_panel) _panel.style.display = "none";
  },
};

function _updateBadge() {
  const badge = document.getElementById("notif-badge");
  const bottomBadge = document.getElementById("bottom-notif-badge");
  const unread = _notifs.filter(n => !n.read).length;
  const text = unread > 99 ? "99+" : unread;
  
  if (badge) {
    if (unread > 0) {
      badge.textContent = text;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  if (bottomBadge) {
    if (unread > 0) {
      bottomBadge.textContent = text;
      bottomBadge.style.display = "flex";
    } else {
      bottomBadge.style.display = "none";
    }
  }
}

function _buildPanel() {
  _panel = document.createElement("div");
  _panel.id = "notif-panel";
  _panel.style.cssText = `
    display:none; position:fixed; top:66px; right:12px; z-index:1200;
    width:340px; max-width:calc(100vw - 24px);
    background:var(--card); border:1px solid var(--border);
    border-radius:var(--radius-lg); box-shadow:var(--shadow-xl);
    flex-direction:column; overflow:hidden;
    animation:fadeUp .2s ease;
  `;
  _panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border);">
      <span style="font-weight:700;font-size:.9rem;">Thông báo</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="notif-mark-all" style="font-size:.72rem;color:var(--accent);background:none;border:none;cursor:pointer;font-family:inherit;">Đánh dấu đã đọc</button>
        <button id="notif-close-btn" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.2rem;line-height:1;">×</button>
      </div>
    </div>
    <div id="notif-list" style="overflow-y:auto;max-height:420px;"></div>
  `;
  document.body.appendChild(_panel);

  document.getElementById("notif-close-btn").onclick = () => NotificationController.close();
  document.getElementById("notif-mark-all").onclick  = async () => {
    if (_uid) await NotificationModel.markAllRead(_uid);
    _notifs.forEach(n => n.read = true);
    _updateBadge();
    _renderPanel();
  };

  // Click outside
  document.addEventListener("click", e => {
    if (!_panel) return;
    if (!_panel.contains(e.target) && !e.target.closest("#notif-bell")) {
      NotificationController.close();
    }
  });

  // Click on notification item → navigate
  _panel.addEventListener("click", e => {
    const item = e.target.closest(".notif-item[data-link]");
    if (!item) return;
    const link = item.dataset.link;
    NotificationController.close();
    if (link) router.navigate(link);
  });
}

function _renderPanel() {
  const list = document.getElementById("notif-list");
  if (!list) return;

  if (_notifs.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:36px 16px;color:var(--text-muted);font-size:.85rem;">
        <div style="font-size:2rem;margin-bottom:8px;">🔔</div>
        Chưa có thông báo nào
      </div>`;
    return;
  }

  const icons = {
    new_suggestion:      "📍",
    suggestion_approved: "✅",
    suggestion_rejected: "❌",
    warning:             "⚠️",
    system:              "🔔",
  };

  list.innerHTML = _notifs.map(n => {
    const icon = icons[n.type] || "🔔";
    const time = n.createdAt?.toDate
      ? _timeAgo(n.createdAt.toDate())
      : "";
    return `
      <div class="notif-item ${n.read ? "" : "notif-item--unread"}"
           data-id="${n.id}" data-link="${n.link || ""}"
           style="display:flex;align-items:flex-start;gap:10px;padding:12px 16px;
                  border-bottom:1px solid var(--border);cursor:pointer;
                  transition:background .15s;
                  background:${n.read ? "transparent" : "rgba(184,50,40,.04)"};">
        <div style="font-size:1.3rem;flex-shrink:0;margin-top:1px;">${icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.82rem;font-weight:${n.read ? "500" : "700"};color:var(--text);margin-bottom:2px;">${n.title}</div>
          <div style="font-size:.77rem;color:var(--text2);line-height:1.5;">${n.body}</div>
          <div style="font-size:.68rem;color:var(--text-muted);margin-top:4px;">${time}</div>
        </div>
        ${!n.read ? `<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:5px;"></div>` : ""}
      </div>`;
  }).join("");
}

function _timeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)    return "Vừa xong";
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}
