// controllers/AuthController.js
import { auth } from "../models/firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
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
    
    document.getElementById("btn-google-login")?.addEventListener("click", function() {
      _handleGoogleSignIn(this);
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
      const confirmPassword = form.querySelector("[name=confirmPassword]")?.value;
      const agreePolicy = form.querySelector("[name=agreePolicy]")?.checked;
      if (!fullName || !phone || !email || !password || !confirmPassword) { Toast.show("Vui lòng điền đầy đủ thông tin.", "error"); return; }
      if (!agreePolicy) { Toast.show("Vui lòng đồng ý với Điều khoản sử dụng.", "error"); return; }
      if (password !== confirmPassword) { Toast.show("Mật khẩu xác nhận không khớp.", "error"); return; }
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

    document.getElementById("btn-google-register")?.addEventListener("click", function() {
      _handleGoogleSignIn(this);
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

// Helper: Wait for next tick so DOM is ready
function _nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function _handleGoogleSignIn(btn) {
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang kết nối...';
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // Check if user exists in our DB, if not create them
    const existing = await UserModel.findById(user.uid);
    if (!existing) {
      await UserModel.create(user.uid, {
        email: user.email,
        fullName: user.displayName || "Google User",
        phone: user.phoneNumber || "",
      });
    }
    router.navigate("/home");
    Toast.show("Đăng nhập Google thành công!");
  } catch (error) {
    console.error("Google Auth error:", error.code, error.message);
    Toast.show("Đăng nhập bằng Google thất bại.", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="margin-right:8px"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Tiếp tục với Google
      `;
    }
  }
}
