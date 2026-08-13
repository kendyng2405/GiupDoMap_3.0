// controllers/ProfileController.js
import { UserModel, RANKS } from "../models/UserModel.js";
import { renderView } from "../views/ViewEngine.js";
import { Toast } from "../views/components/Toast.js";
import { router } from "./Router.js";

export const ProfileController = {
  async show({ user, userData }) {
    if (!user) { router.navigate("/login"); return; }
    const leaderboard = await UserModel.getLeaderboard(10);
    const myRank = leaderboard.findIndex(u => u.uid === user.uid) + 1;
    renderView("profile", { user, userData, leaderboard, myRank, ranks: RANKS });
    _initProfileForm(user, userData);
  },
};

function _initProfileForm(user, userData) {
  // ── Avatar upload ────────────────────────────────────────
  const avatarInput = document.getElementById("avatar-input");
  const avatarPreview = document.getElementById("avatar-preview");
  const avatarEditBtn = document.getElementById("avatar-edit-btn");

  avatarEditBtn?.addEventListener("click", () => avatarInput?.click());

  avatarInput?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      Toast.show("Ảnh tối đa 3MB.", "error"); return;
    }
    // Preview ngay lập tức
    const reader = new FileReader();
    reader.onload = ev => {
      if (avatarPreview) {
        avatarPreview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      }
    };
    reader.readAsDataURL(file);

    // Upload lên Firebase Storage
    const btn = avatarEditBtn;
    if (btn) { btn.disabled = true; btn.textContent = "Đang tải..."; }
    try {
      const url = await UserModel.uploadAvatar(user.uid, file);
      Toast.show("Đã cập nhật ảnh đại diện!");
      // Cập nhật navbar avatar
      const navAv = document.getElementById("nav-avatar");
      if (navAv) {
        navAv.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      }
    } catch (err) {
      console.error(err);
      Toast.show("Lỗi tải ảnh lên. Kiểm tra Storage rules.", "error");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Đổi ảnh"; }
    }
  });

  // ── Cập nhật hồ sơ ───────────────────────────────────────
  document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("[type=submit]");
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    try {
      const fullName = e.target.fullName.value.trim();
      const phone    = e.target.phone.value.trim();
      if (!fullName) { Toast.show("Vui lòng nhập họ tên.", "error"); return; }
      await UserModel.updateProfile(user.uid, { fullName, phone });
      Toast.show("Đã cập nhật hồ sơ!");
      router.navigate("/profile");
    } catch { Toast.show("Lỗi cập nhật.", "error"); }
    finally { btn.disabled = false; btn.textContent = "Lưu thay đổi"; }
  });

  // ── Đổi email — FIX: cần nhập mật khẩu hiện tại ─────────
  document.getElementById("email-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn      = e.target.querySelector("[type=submit]");
    const newEmail = e.target.newEmail.value.trim();
    const curPw    = e.target.currentPassword.value;

    if (!newEmail) { Toast.show("Vui lòng nhập email mới.", "error"); return; }
    if (!curPw)    { Toast.show("Vui lòng nhập mật khẩu hiện tại.", "error"); return; }

    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    try {
      await UserModel.changeEmail(curPw, newEmail);
      await UserModel.update(user.uid, { email: newEmail });
      Toast.show("Đã gửi link xác thực tới email mới. Vui lòng kiểm tra hộp thư.");
      e.target.reset();
    } catch (err) {
      console.error(err);
      const msgs = {
        "auth/email-already-in-use":  "Email này đã được sử dụng.",
        "auth/requires-recent-login": "Cần đăng nhập lại trước khi đổi email.",
        "auth/wrong-password":        "Mật khẩu hiện tại không đúng.",
        "auth/invalid-credential":    "Mật khẩu hiện tại không đúng.",
        "auth/invalid-email":         "Email không hợp lệ.",
      };
      Toast.show(msgs[err.code] || "Lỗi đổi email: " + err.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Cập nhật email";
    }
  });
}
