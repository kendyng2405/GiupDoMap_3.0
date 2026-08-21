// controllers/Router.js — MVC2 Front Controller (History API routing)
import { auth } from "../models/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { UserModel } from "../models/UserModel.js";

class Router {
  constructor() {
    this.routes = {};
    this.currentUser = null;
    this.currentUserData = null;
    this._authReady = false;
    this._authReadyResolve = null;
    this.authReady = new Promise(r => this._authReadyResolve = r);
    this._renderGen = 0; // ← guard chống race condition
  }

  register(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  async init() {
    // Xử lý redirect từ 404.html (GitHub Pages SPA trick)
    // 404.html đẩy path vào sessionStorage, ta restore lại
    const redirect = sessionStorage.getItem("spa_redirect");
    if (redirect) {
      sessionStorage.removeItem("spa_redirect");
      const url = new URL(redirect);
      const path = url.pathname + url.search + url.hash;
      window.history.replaceState(null, "", path);
    }

    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        try {
          this.currentUserData = await UserModel.findById(user.uid);
          if (this.currentUserData && this.currentUserData.agreedToPolicy === false) {
            document.getElementById("policy-modal").style.display = "flex";
          } else {
            const modal = document.getElementById("policy-modal");
            if (modal) modal.style.display = "none";
          }
        } catch(e) {
          this.currentUserData = null;
        }
      } else {
        this.currentUserData = null;
        const modal = document.getElementById("policy-modal");
        if (modal) modal.style.display = "none";
      }
      this._updateNavbar();
      if (!this._authReady) {
        this._authReady = true;
        this._authReadyResolve();
      } else {
        this._renderCurrent();
      }
    });

    // Lắng nghe nút Back/Forward của trình duyệt
    window.addEventListener("popstate", () => this._renderCurrent());

    // Intercept tất cả click vào <a href="/...">
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      // Chỉ handle internal links bắt đầu bằng "/"
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      // Bỏ qua link mở tab mới
      if (a.target === "_blank") return;
      
      // Nếu user chưa đồng ý policy và đang ở modal chặn, thì không cho phép navigate bằng click internal links
      if (this.currentUserData && this.currentUserData.agreedToPolicy === false) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      this.navigate(href);
    });

    // Lắng nghe nút đồng ý policy
    document.getElementById("btn-agree-policy")?.addEventListener("click", async (e) => {
      if (!this.currentUser) return;
      const btn = e.target;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang xử lý...';
      try {
        await UserModel.update(this.currentUser.uid, { agreedToPolicy: true });
        this.currentUserData.agreedToPolicy = true;
        document.getElementById("policy-modal").style.display = "none";
      } catch (err) {
        console.error("Error accepting policy:", err);
        btn.disabled = false;
        btn.textContent = "Tôi đã đọc và đồng ý";
      }
    });

    await this.authReady;
    this._updateNavbar();
    this._renderCurrent();
  }

  navigate(path) {
    if (window.location.pathname === path) {
      this._renderCurrent();
    } else {
      window.history.pushState(null, "", path);
      this._renderCurrent();
    }
  }

  _getCurrentPath() {
    const path = window.location.pathname;
    // Fallback: nếu ở root thì về /home
    if (path === "/" || path === "") return "/home";
    return path;
  }

  async _renderCurrent() {
    const gen = ++this._renderGen; // mỗi lần render lấy một số thế hệ mới

    const path = this._getCurrentPath();
    let handler = this.routes[path];
    let params = {};

    if (!handler) {
      for (const [route, h] of Object.entries(this.routes)) {
        if (route.includes(":")) {
          const regex = new RegExp("^" + route.replace(/:[^/]+/g, "([^/]+)") + "$");
          const match = path.match(regex);
          if (match) {
            handler = h;
            const keys = [...route.matchAll(/:([^/]+)/g)].map(m => m[1]);
            keys.forEach((k, i) => params[k] = match[i + 1]);
            break;
          }
        }
      }
    }

    if (!handler) {
      const app = document.getElementById("app");
      if (app) app.innerHTML = `<div style="text-align:center;padding:120px 24px;">
        <h1 style="font-family:'Playfair Display',serif;font-size:5rem;color:var(--border);">404</h1>
        <p style="margin-bottom:24px;color:var(--text-muted);">Trang không tìm thấy</p>
        <a href="/home" class="btn btn--primary">Về bản đồ</a>
      </div>`;
      return;
    }

    // Nếu trong lúc chờ đã có render mới hơn được gọi → huỷ cái này
    if (gen !== this._renderGen) return;

    document.querySelectorAll("[data-nav]").forEach(el => {
      el.classList.toggle("active", el.dataset.nav === path);
    });

    await handler({ user: this.currentUser, userData: this.currentUserData, params });
  }

  _updateNavbar() {
    if (typeof window._updateNavbarUser === "function") {
      window._updateNavbarUser(this.currentUserData);
    }
  }

  requireAuth(handler) {
    return async (ctx) => {
      if (!ctx.user) { this.navigate("/login"); return; }
      await handler(ctx);
    };
  }

  requireAdmin(handler) {
    return async (ctx) => {
      if (!ctx.user) { this.navigate("/login"); return; }
      if (ctx.userData?.role !== "admin" && ctx.userData?.role !== "founder") {
        this.navigate("/home"); return;
      }
      await handler(ctx);
    };
  }

  requireFounder(handler) {
    return async (ctx) => {
      if (!ctx.user) { this.navigate("/login"); return; }
      if (ctx.userData?.role !== "founder") { this.navigate("/home"); return; }
      await handler(ctx);
    };
  }
}

export const router = new Router();
