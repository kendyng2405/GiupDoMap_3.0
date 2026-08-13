// controllers/AuthController.js
import { auth } from "../models/firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { UserModel } from "../models/UserModel.js";
import { router } from "./Router.js";
import { renderView } from "../views/ViewEngine.js";
import { Toast } from "../views/components/Toast.js";

export const AuthController = {
  async showLogin({ user }) {
    if (user) { router.navigate("/home"); return; }
    renderView("login");
    await _nextTick();
    const form = document.getElementById("login-form");
    // Form không còn trong DOM nghĩa là một render mới đã thay thế → bỏ qua
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      const email = form.querySelector("[name=email]")?.value?.trim();
      const password = form.querySelector("[name=password]")?.value;
      if (!email || !password) { Toast.show("Vui lòng điền đầy đủ thông tin.", "error"); return; }
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang đăng nhập...';
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.navigate("/home");
        Toast.show("Chào mừng trở lại!");
      } catch (err) {
        console.error("Login error:", err.code, err.message);
        let msg = "Đăng nhập thất bại.";
        if (["auth/wrong-password","auth/user-not-found","auth/invalid-credential","auth/invalid-email"].includes(err.code))
          msg = "Email hoặc mật khẩu không đúng!";
        else if (err.code === "auth/too-many-requests") msg = "Quá nhiều lần thử, xin vui lòng thử lại sau.";
        else if (err.code === "auth/network-request-failed") msg = "Lỗi mạng, kiểm tra kết nối.";
        Toast.show(msg, "error");
        btn.disabled = false; btn.textContent = "Đăng Nhập";
      }
    });
  },

  async showRegister({ user }) {
    if (user) { router.navigate("/home"); return; }
    renderView("register");
    await _nextTick();
    const form = document.getElementById("register-form");
    if (!form) return;
    form.querySelector("[name=password]")?.addEventListener("input", function() {
      const v = this.value;
      const score = [v.length>=6,v.length>=10,/[A-Z]/.test(v),/[0-9]/.test(v),/[^a-zA-Z0-9]/.test(v)].filter(Boolean).length;
      const fill = document.getElementById("pwd-bar-fill");
      const colors = ["#EF4444","#F97316","#EAB308","#10B981","#22C55E"];
      if (fill) { fill.style.width=(score*20)+"%"; fill.style.background=colors[score-1]||"transparent"; }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      const fullName = form.querySelector("[name=fullName]")?.value?.trim();
      const phone    = form.querySelector("[name=phone]")?.value?.trim();
      const email    = form.querySelector("[name=email]")?.value?.trim();
      const password = form.querySelector("[name=password]")?.value;
      if (!fullName || !phone || !email || !password) { Toast.show("Vui lòng điền đầy đủ thông tin.", "error"); return; }
      if (password.length < 6) { Toast.show("Mật Khẩu phải có ít nhất 6 ký tự.", "error"); return; }
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang tạo tài khoản...';
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });
        await UserModel.create(cred.user.uid, { email, fullName, phone });
        sendEmailVerification(cred.user).catch(() => {});
        router.navigate("/home");
        Toast.show("Tạo tài khoản thành công!");
      } catch (err) {
        console.error("Register error:", err.code, err.message);
        let msg = "Đăng ký thất bại.";
        if (err.code === "auth/email-already-in-use") msg = "Email này đã được sử dụng.";
        else if (err.code === "auth/invalid-email")   msg = "Email không hợp lệ.";
        else if (err.code === "auth/weak-password")   msg = "Mật khẩu quá yếu.";
        else if (err.code === "auth/network-request-failed") msg = "Lỗi mạng.";
        Toast.show(msg, "error");
        btn.disabled = false; btn.textContent = "Tạo tài khoản";
      }
    });
  },

  async showForgotPassword({ user }) {
    if (user) { router.navigate("/home"); return; }
    renderView("forgot-password");
    await _nextTick();
    const form = document.getElementById("forgot-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      const email = form.querySelector("[name=email]")?.value?.trim();
      if (!email) { Toast.show("Vui long nhap email.", "error"); return; }
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang gửi...';
      try {
        await sendPasswordResetEmail(auth, email);
        Toast.show("Email đặt lại mật khẩu đã được gửi!");
        form.reset();
      } catch (err) {
        Toast.show("Không thể gửi email, vui lòng kiểm tra lại địa chỉ.", "error");
      } finally {
        btn.disabled = false; btn.textContent = "Gửi email đặt lại";
      }
    });
  },

  async logout() {
    await signOut(auth).catch(console.error);
    router.navigate("/home");
    Toast.show("Đã đăng xuất.");
  },
};

function _nextTick() {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}
