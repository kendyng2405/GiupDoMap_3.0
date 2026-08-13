// controllers/AdminController.js
import { LocationModel, HELP_TYPES, URGENCY } from "../models/LocationModel.js";
import { UserModel }          from "../models/UserModel.js";
import { NotificationModel }  from "../models/NotificationModel.js";
import { renderView }         from "../views/ViewEngine.js";
import { Toast }              from "../views/components/Toast.js";
import { router }             from "./Router.js";

export const AdminController = {
  async dashboard({ userData }) {
    const [locations, members] = await Promise.all([
      LocationModel.findAll(false),
      UserModel.getLeaderboard(50),
    ]);
    renderView("admin-dashboard", {
      userData, locations, members,
      stats: {
        total:    locations.length,
        active:   locations.filter(l => l.isActive).length,
        critical: locations.filter(l => l.urgency === "critical").length,
        members:  members.length,
      }
    });
    _initDashboardEvents(locations);
  },



  async showCreate({ userData }) {
    renderView("admin-location-form", { userData, location: null, helpTypes: HELP_TYPES, urgency: URGENCY });
    await _nextTick();
    _initMapPicker(null, null);
    _initLocationForm(null, userData);
  },

  async showEdit({ userData, params }) {
    const location = await LocationModel.findById(params.id);
    if (!location) {
      Toast.show("Không tìm thấy địa điểm.", "error");
      router.navigate("/admin/dashboard");
      return;
    }
    renderView("admin-location-form", { userData, location, helpTypes: HELP_TYPES, urgency: URGENCY });
    await _nextTick();
    _initMapPicker(location.lat, location.lng);
    _initLocationForm(location, userData);
  },

  async showUsers({ userData }) {
    if (userData?.role !== "founder") {
      router.navigate("/admin/dashboard");
      return;
    }
    const users = await UserModel.getAll();
    renderView("admin-users", { userData, users });
    _initUserManagement(userData);
  },
};

// ── Dashboard ─────────────────────────────────────────────
function _initDashboardEvents(locations) {
  document.getElementById("loc-search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".loc-row").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  document.getElementById("locations-tbody")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id     = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "toggle") {
      const loc = locations.find(l => l.id === id);
      if (!loc) return;
      await LocationModel.toggleActive(id, !loc.isActive);
      Toast.show(`Đã ${loc.isActive ? "ẩn" : "hiện"} địa điểm.`);
      router.navigate("/admin/dashboard");
    }
    if (action === "delete") {
      if (!confirm("Xác nhận xóa địa điểm này?")) return;
      await LocationModel.delete(id);
      Toast.show("Đã xóa địa điểm.");
      router.navigate("/admin/dashboard");
    }
  });
}

// ── User management (Founder only) ───────────────────────
function _initUserManagement(currentUserData) {
  // Search
  document.getElementById("user-search")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".user-row").forEach(row => {
      row.style.display = (row.dataset.search || "").toLowerCase().includes(q) ? "" : "none";
    });
  });

  // Role change
  document.getElementById("users-tbody")?.addEventListener("change", async e => {
    const sel = e.target.closest(".role-select");
    if (!sel) return;
    const uid  = sel.dataset.uid;
    const role = sel.value;
    if (uid === currentUserData?.uid) {
      Toast.show("Không thể thay đổi vai trò của chính mình.", "error");
      sel.value = currentUserData.role;
      return;
    }
    try {
      await UserModel.setRole(uid, role);
      Toast.show("Đã cập nhật vai trò.");
    } catch (err) {
      Toast.show("Lỗi cập nhật vai trò: " + err.message, "error");
    }
  });

  // Buttons: Edit / Warn / Delete
  document.getElementById("users-tbody")?.addEventListener("click", async e => {
    // Edit
    const editBtn = e.target.closest(".edit-user-btn");
    if (editBtn) {
      document.getElementById("edit-uid").value      = editBtn.dataset.uid;
      document.getElementById("edit-fullname").value = editBtn.dataset.name;
      document.getElementById("edit-email").value    = editBtn.dataset.email;
      document.getElementById("edit-phone").value    = editBtn.dataset.phone;
      document.getElementById("edit-points").value   = editBtn.dataset.points || "0";
      document.getElementById("edit-user-modal").style.display = "flex";
      return;
    }

    // Warn
    const warnBtn = e.target.closest(".warn-user-btn");
    if (warnBtn) {
      _openWarnModal(warnBtn.dataset.uid, warnBtn.dataset.name);
      return;
    }

    // FIX #8: Delete — gọi UserModel.deleteUser thay vì deleteUserDoc
    // để xóa cả Auth account lẫn Firestore doc qua Cloud Function
    const delBtn = e.target.closest(".delete-user-btn");
    if (delBtn) {
      const uid  = delBtn.dataset.uid;
      const name = delBtn.dataset.name;
      if (uid === currentUserData?.uid) {
        Toast.show("Không thể xóa tài khoản của chính mình.", "error");
        return;
      }
      if (!confirm(`Xác nhận xóa tài khoản "${name}"?\n(Xóa hoàn toàn, user không thể đăng nhập lại)`)) return;
      try {
        await UserModel.deleteUser(uid);
        delBtn.closest("tr").remove();
        Toast.show("Đã xóa người dùng.");
      } catch (err) {
        Toast.show("Lỗi xóa người dùng: " + err.message, "error");
      }
    }
  });

  // Modal close
  const closeModal = () => {
    document.getElementById("edit-user-modal").style.display = "none";
  };
  document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);
  document.getElementById("modal-cancel-btn")?.addEventListener("click", closeModal);
  document.getElementById("edit-user-modal")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Edit form submit — bao gồm cập nhật điểm
  document.getElementById("edit-user-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const btn      = e.target.querySelector("[type=submit]");
    const uid      = e.target.uid.value;
    const fullName = e.target.fullName.value.trim();
    const phone    = e.target.phone.value.trim();
    const points   = parseInt(e.target.points?.value) || 0;
    btn.disabled   = true;
    try {
      await UserModel.update(uid, { fullName, phone, points });

      // Cập nhật lại row trên UI
      const editBtnEl = document.querySelector(`.edit-user-btn[data-uid="${uid}"]`);
      if (editBtnEl) {
        const row     = editBtnEl.closest("tr");
        const nameDiv = row?.querySelector("td:first-child div > div > div:first-child");
        if (nameDiv) nameDiv.textContent = fullName;
        editBtnEl.dataset.name   = fullName;
        editBtnEl.dataset.phone  = phone;
        editBtnEl.dataset.points = points;
        // Cập nhật cột điểm
        const ptCell = row?.querySelector("td:nth-child(4)");
        if (ptCell) ptCell.textContent = points;
        row.dataset.search = fullName + " " + row.querySelector("td:nth-child(2)")?.textContent;
      }
      Toast.show("Đã cập nhật thông tin.");
      closeModal();
    } catch (err) {
      Toast.show("Lỗi cập nhật: " + err.message, "error");
    }
    btn.disabled = false;
  });
}

// ── Cảnh báo người dùng ──────────────────────────────────
function _openWarnModal(uid, name) {
  let modal = document.getElementById("warn-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "warn-modal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3>Cảnh báo thành viên</h3>
          <button class="modal-close" id="warn-modal-close">&times;</button>
        </div>
        <div style="padding:20px;">
          <p style="font-size:.85rem;color:var(--text2);margin-bottom:14px;">
            Gửi cảnh báo tới: <strong id="warn-user-name"></strong>
          </p>
          <div class="form-group">
            <label>Lý do cảnh báo <span style="color:var(--accent)">*</span></label>
            <textarea id="warn-reason" class="form-control" rows="3"
              placeholder="Ví dụ: Đề xuất địa điểm không chính xác nhiều lần..."></textarea>
          </div>
          <div style="display:flex;gap:10px;margin-top:4px;">
            <button id="warn-confirm-btn" class="btn btn--sm" style="flex:1;background:#F59E0B;color:white;">
              Gửi cảnh báo
            </button>
            <button id="warn-cancel-btn" class="btn btn--ghost">Hủy</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  document.getElementById("warn-user-name").textContent = name;
  document.getElementById("warn-reason").value = "";
  modal.style.display = "flex";

  const close = () => { modal.style.display = "none"; };
  document.getElementById("warn-modal-close").onclick = close;
  document.getElementById("warn-cancel-btn").onclick  = close;
  modal.onclick = e => { if (e.target === modal) close(); };

  // FIX: clone button để xóa toàn bộ event listener cũ,
  // tránh trường hợp gửi nhầm uid của member trước đó
  const oldBtn = document.getElementById("warn-confirm-btn");
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  newBtn.onclick = async () => {
    const reason = document.getElementById("warn-reason").value.trim();
    if (!reason) { Toast.show("Vui lòng nhập lý do cảnh báo.", "error"); return; }
    newBtn.disabled = true;
    newBtn.innerHTML = '<span class="spinner"></span>';
    try {
      await NotificationModel.create({
        toUid: uid,
        type:  "warning",
        title: "Cảnh báo từ quản trị viên",
        body:  reason,
        link:  "/home",
      });
      Toast.show(`Đã gửi cảnh báo tới ${name}.`);
      close();
    } catch (err) {
      Toast.show("Lỗi gửi cảnh báo: " + err.message, "error");
    }
    newBtn.disabled = false;
    newBtn.textContent = "Gửi cảnh báo";
  };
}

// ── Map picker ────────────────────────────────────────────
let pickerMap = null, pickerMarker = null;

function _initMapPicker(lat, lng) {
  const el = document.getElementById("map-picker");
  if (!el) return;
  if (pickerMap) {
    try { pickerMap.off(); pickerMap.remove(); } catch(e) {}
    pickerMap = null; pickerMarker = null;
  }
  pickerMap = L.map("map-picker", {
    center: [lat || 16.047, lng || 108.206],
    zoom: lat ? 15 : 6,
  });
  L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    maxZoom: 20,
  }).addTo(pickerMap);
  if (lat && lng) _placePickerMarker(lat, lng);
  pickerMap.on("click", e => {
    _placePickerMarker(e.latlng.lat, e.latlng.lng);
    _reverseGeocode(e.latlng.lat, e.latlng.lng);
  });
  document.getElementById("picker-locate")?.addEventListener("click", () => {
    if (!navigator.geolocation) { Toast.show("Trình duyệt không hỗ trợ định vị.", "error"); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      pickerMap.setView([pos.coords.latitude, pos.coords.longitude], 16);
      _placePickerMarker(pos.coords.latitude, pos.coords.longitude);
      _reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    }, () => Toast.show("Không thể lấy vị trí.", "error"));
  });
}

function _placePickerMarker(lat, lng) {
  if (pickerMarker) pickerMap.removeLayer(pickerMarker);
  pickerMarker = L.marker([lat, lng]).addTo(pickerMap);
  const latEl = document.getElementById("input-lat");
  const lngEl = document.getElementById("input-lng");
  if (latEl) latEl.value = lat.toFixed(7);
  if (lngEl) lngEl.value = lng.toFixed(7);
}

async function _reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
      { headers: { "Accept-Language": "vi" } }
    );
    const data = await res.json();
    const el   = document.getElementById("input-address");
    if (el && data.display_name) el.value = data.display_name;
  } catch(e) {}
}

function _initLocationForm(location, userData) {
  document.getElementById("img-file-input")?.addEventListener("change", function() {
    const file = this.files[0];
    if (!file) return;
    const wrap = document.getElementById("img-preview-wrap");
    const prev = document.getElementById("img-preview");
    if (wrap && prev) {
      prev.src = URL.createObjectURL(file);
      wrap.style.display = "block";
    }
  });

  document.getElementById("location-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("[type=submit]");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang lưu...';
    try {
      const fd        = new FormData(e.target);
      const imageFile = document.getElementById("img-file-input")?.files[0] || null;
      const data = {
        title:            fd.get("title"),
        description:      fd.get("description"),
        lat:              fd.get("lat"),
        lng:              fd.get("lng"),
        address:          fd.get("address"),
        note:             fd.get("note"),
        helpTypes:        fd.getAll("helpTypes"),
        urgency:          fd.get("urgency"),
        peopleCount:      fd.get("peopleCount"),
        timeFrom:         fd.get("timeFrom"),
        timeTo:           fd.get("timeTo"),
        existingImageUrl: location?.imageUrl || null,
        createdBy:        userData?.uid,
      };
      if (!data.lat || !data.lng) {
        Toast.show("Vui lòng chọn vị trí trên bản đồ.", "error");
        btn.disabled = false;
        btn.textContent = location ? "Lưu thay đổi" : "Thêm địa điểm";
        return;
      }
      if (location) {
        await LocationModel.update(location.id, data, imageFile);
        Toast.show("Đã cập nhật địa điểm!");
      } else {
        await LocationModel.create(data, imageFile);
        Toast.show("Đã thêm địa điểm mới!");
      }
      router.navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      Toast.show("Lỗi lưu địa điểm: " + err.message, "error");
      btn.disabled = false;
      btn.textContent = location ? "Lưu thay đổi" : "Thêm địa điểm";
    }
  });
}

function _nextTick() {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));
}
