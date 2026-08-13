// controllers/SuggestionController.js
import { SuggestionModel } from "../models/SuggestionModel.js";
import { LocationModel }   from "../models/LocationModel.js";
import { NotificationModel } from "../models/NotificationModel.js";
import { UserModel }       from "../models/UserModel.js";
import { renderView }      from "../views/ViewEngine.js";
import { Toast }           from "../views/components/Toast.js";
import { router }          from "./Router.js";
import { HELP_TYPES, URGENCY } from "../models/LocationModel.js";

export const SuggestionController = {

  // GET /suggest — form đề xuất (member)
  async showForm({ user, userData }) {
    if (!user) { router.navigate("/login"); return; }
    renderView("suggest-form", { userData, helpTypes: HELP_TYPES, urgency: URGENCY });
    await _nextTick();
    _initSuggestionForm(user, userData);
  },

  // GET /admin/suggestions — danh sách chờ duyệt (admin/founder)
  async showList({ userData }) {
    const [pending, approved, rejected, allLocs] = await Promise.all([
      SuggestionModel.findAll("pending"),
      SuggestionModel.findAll("approved"),
      SuggestionModel.findAll("rejected"),
      LocationModel.findAll(),
    ]);

    // Check for nearby duplicates for pending suggestions
    pending.forEach(p => {
      const dists = allLocs.map(loc => _haversine(p.lat, p.lng, loc.lat, loc.lng));
      p.hasNearby = dists.some(d => d <= 0.1); // <= 100m
    });

    renderView("admin-suggestions", { userData, pending, approved, rejected });
    _initSuggestionList(userData);
  },
};

// ── Form đề xuất (member) ─────────────────────────────────
function _initSuggestionForm(user, userData) {
  const mapEl = document.getElementById("suggest-map");
  if (!mapEl) return;

  let pickerMap = L.map("suggest-map", {
    center: [16.047, 108.206], zoom: 6,
  });

  L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    maxZoom: 20,
  }).addTo(pickerMap);

  let pickerMarker = null;
  const latInput = document.getElementById("suggest-lat");
  const lngInput = document.getElementById("suggest-lng");

  function placeMarker(lat, lng) {
    if (pickerMarker) pickerMap.removeLayer(pickerMarker);
    pickerMarker = L.marker([lat, lng], { draggable: true }).addTo(pickerMap);
    latInput.value = lat.toFixed(7);
    lngInput.value = lng.toFixed(7);
    pickerMarker.on("dragend", e => {
      const p = e.target.getLatLng();
      latInput.value = p.lat.toFixed(7);
      lngInput.value = p.lng.toFixed(7);
      _reverseGeocode(p.lat, p.lng, "suggest-address");
    });
  }

  pickerMap.on("click", e => {
    placeMarker(e.latlng.lat, e.latlng.lng);
    _reverseGeocode(e.latlng.lat, e.latlng.lng, "suggest-address");
  });

  document.getElementById("suggest-locate")?.addEventListener("click", () => {
    if (!navigator.geolocation) { Toast.show("Trình duyệt không hỗ trợ định vị.", "error"); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      pickerMap.setView([lat, lng], 16);
      placeMarker(lat, lng);
      _reverseGeocode(lat, lng, "suggest-address");
    }, () => Toast.show("Không thể lấy vị trí.", "error"));
  });

  document.getElementById("suggest-img-input")?.addEventListener("change", function() {
    const file = this.files[0];
    if (!file) return;
    const wrap = document.getElementById("suggest-img-preview");
    if (wrap) { wrap.src = URL.createObjectURL(file); wrap.style.display = "block"; }
  });

  document.getElementById("suggest-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.target.querySelector("[type=submit]");
    const lat = latInput.value;
    const lng = lngInput.value;

    if (!lat || !lng) {
      Toast.show("Vui lòng chọn vị trí trên bản đồ.", "error"); return;
    }

    const imageFile = document.getElementById("suggest-img-input")?.files[0];
    if (!imageFile) {
      Toast.show("Vui lòng upload ảnh địa điểm để dễ xác thực.", "error"); return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang gửi...';

    try {
      const fd = new FormData(e.target);
      const data = {
        title:       fd.get("title"),
        description: fd.get("description"),
        lat, lng,
        address:     fd.get("address"),
        helpTypes:   fd.getAll("helpTypes"),
        urgency:     fd.get("urgency"),
        peopleCount: fd.get("peopleCount"),
        timeFrom:    fd.get("timeFrom"),
        timeTo:      fd.get("timeTo"),
        note:        fd.get("note"),
        submittedBy:   user.uid,
        submitterName: userData?.fullName || "Ẩn danh",
      };

      await SuggestionModel.create(data, imageFile);

      const allUsers = await UserModel.getAll();
      const adminUids = allUsers
        .filter(u => u.role === "admin" || u.role === "founder")
        .map(u => u.uid);

      await NotificationModel.createForMany(adminUids, {
        type:  "new_suggestion",
        title: "Đề xuất địa điểm mới",
        body:  `${userData?.fullName || "Thành viên"} đề xuất: "${data.title}"`,
        link:  "/admin/suggestions",
      });

      Toast.show("Đã gửi đề xuất! Admin sẽ xem xét sớm.");
      router.navigate("/home");
    } catch (err) {
      console.error(err);
      Toast.show("Lỗi gửi đề xuất: " + err.message, "error");
      btn.disabled = false;
      btn.textContent = "Gửi đề xuất";
    }
  });
}

// ── Admin list ────────────────────────────────────────────
function _initSuggestionList(currentUserData) {
  document.querySelectorAll(".sug-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sug-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".sug-panel").forEach(p => p.style.display = "none");
      tab.classList.add("active");
      const panel = document.getElementById("panel-" + tab.dataset.tab);
      if (panel) panel.style.display = "block";
    });
  });

  document.getElementById("suggestions-wrap")?.addEventListener("click", async e => {
    const approveBtn = e.target.closest(".btn-approve");
    const rejectBtn  = e.target.closest(".btn-reject");
    const deleteBtn  = e.target.closest(".btn-sug-delete");
    const checkBtn   = e.target.closest(".btn-check-nearby");
    const editBtn    = e.target.closest(".btn-edit-sug");
    const aiBtn      = e.target.closest(".btn-ai-check");
    const userLink   = e.target.closest(".view-user-info");

    // Xem thông tin người dùng
    if (userLink) {
      const uid = userLink.dataset.uid;
      try {
        const u = await UserModel.findById(uid);
        if (u) {
          const rankName = u.rank?.name || 'Đồng Lòng';
          document.getElementById('global-user-info').innerHTML = `
            <p style="margin-bottom:8px;"><strong>Tên:</strong> ${u.fullName || 'Ẩn danh'}</p>
            <p style="margin-bottom:8px;"><strong>Email:</strong> ${u.email || 'N/A'}</p>
            <p style="margin-bottom:8px;"><strong>Số điện thoại:</strong> ${u.phone || 'N/A'}</p>
            <p style="margin-bottom:8px;"><strong>Cấp bậc:</strong> <span style="font-weight:600;color:var(--accent);">${rankName}</span></p>
            <p style="margin-bottom:8px;"><strong>Điểm uy tín:</strong> <span style="font-weight:bold;">${u.points || 0}</span></p>
          `;
          document.getElementById('global-user-modal').style.display = 'flex';
        }
      } catch(err) {
        Toast.show("Không thể lấy thông tin người dùng", "error");
      }
      return;
    }

    // Edit Suggestion
    if (editBtn) {
      const id = editBtn.dataset.id;
      const title = decodeURIComponent(editBtn.dataset.title || "");
      const desc = decodeURIComponent(editBtn.dataset.desc || "");
      const aiHint = decodeURIComponent(editBtn.dataset.ai || "");

      document.getElementById("edit-sug-id").value = id;
      document.getElementById("edit-sug-title").value = title;
      document.getElementById("edit-sug-desc").value = desc;

      const aiHintEl = document.getElementById("edit-sug-ai-hint");
      if (aiHint) {
        aiHintEl.innerHTML = "<strong>Gợi ý từ AI:</strong> " + aiHint;
        aiHintEl.style.display = "block";
      } else {
        aiHintEl.style.display = "none";
      }

      document.getElementById("modal-edit-sug").style.display = "flex";
      return;
    }

    // (AI btn removed)


    // FIX: Kiểm tra trùng lặp — mở map xem vị trí gần
    if (checkBtn) {
      const lat   = parseFloat(checkBtn.dataset.lat);
      const lng   = parseFloat(checkBtn.dataset.lng);
      const title = checkBtn.dataset.title;
      await _openNearbyModal(lat, lng, title);
      return;
    }

    if (approveBtn) {
      const id = approveBtn.dataset.id;
      if (!confirm("Xét duyệt và thêm địa điểm này lên bản đồ?")) return;
      approveBtn.disabled = true;
      approveBtn.innerHTML = '<span class="spinner"></span>';
      try {
        const sug = await SuggestionModel.findById(id);
        if (!sug) { Toast.show("Không tìm thấy đề xuất.", "error"); return; }

        await LocationModel.create({
          title:       sug.title,
          description: sug.description,
          lat:         sug.lat,
          lng:         sug.lng,
          address:     sug.address,
          helpTypes:   sug.helpTypes,
          urgency:     sug.urgency,
          peopleCount: sug.peopleCount,
          timeFrom:    sug.timeFrom,
          timeTo:      sug.timeTo,
          note:        sug.note,
          imageUrl:    sug.imageUrl,
          createdBy:   currentUserData?.uid,
        });

        await SuggestionModel.approve(id, currentUserData?.uid);

        await NotificationModel.create({
          toUid: sug.submittedBy,
          type:  "suggestion_approved",
          title: "Đề xuất được duyệt!",
          body:  `Địa điểm "${sug.title}" đã được thêm lên bản đồ.`,
          link:  "/home",
        });

        Toast.show("Đã duyệt và thêm địa điểm lên bản đồ!");
        router.navigate("/admin/suggestions");
      } catch (err) {
        Toast.show("Lỗi: " + err.message, "error");
        approveBtn.disabled = false;
        approveBtn.textContent = "Duyệt";
      }
      return;
    }

    if (rejectBtn) {
      const id    = rejectBtn.dataset.id;
      const title = rejectBtn.dataset.title;
      const toUid = rejectBtn.dataset.uid;
      const aiReason = rejectBtn.dataset.aiReason || "";
      _openRejectModal(id, title, toUid, currentUserData, aiReason);
      return;
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm("Xóa đề xuất này?")) return;
      await SuggestionModel.delete(id);
      deleteBtn.closest("tr")?.remove();
      deleteBtn.closest(".sug-row")?.remove(); // also remove card if exists
      Toast.show("Đã xóa đề xuất.");
    }
  });

  // Filter by Date logic
  document.querySelectorAll(".filter-date").forEach(input => {
    input.addEventListener("change", e => {
      const panelId = e.target.dataset.panel;
      const selectedDate = e.target.value; // YYYY-MM-DD
      const panel = document.getElementById("panel-" + panelId);
      if (!panel) return;
      const rows = panel.querySelectorAll(".sug-row");
      
      if (!selectedDate) {
        rows.forEach(r => r.style.display = "block");
        return;
      }
      
      rows.forEach(r => {
        if (r.dataset.isodate === selectedDate) {
          r.style.display = "block";
        } else {
          r.style.display = "none";
        }
      });
    });
  });

  // Save Edited Suggestion
  document.getElementById("btn-save-edit-sug")?.addEventListener("click", async () => {
    const id = document.getElementById("edit-sug-id").value;
    const title = document.getElementById("edit-sug-title").value.trim();
    const desc = document.getElementById("edit-sug-desc").value.trim();

    if (!title || !desc) {
      Toast.show("Vui lòng nhập đủ tiêu đề và mô tả", "error");
      return;
    }

    const btn = document.getElementById("btn-save-edit-sug");
    btn.disabled = true;
    btn.textContent = "Đang lưu...";

    try {
      await SuggestionModel.update(id, { title, description: desc });
      document.getElementById("modal-edit-sug").style.display = "none";
      Toast.show("Cập nhật đề xuất thành công!");
      router.navigate("/admin/suggestions"); // reload the page
    } catch(err) {
      Toast.show("Lỗi cập nhật: " + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Lưu thay đổi";
    }
  });

  // Run AI Moderation automatically for pending suggestions
  _runAutoModeration();
}

async function _runAutoModeration() {
  const panel = document.getElementById("panel-pending");
  if (!panel) return;
  const cards = panel.querySelectorAll(".sug-row");
  
  for (let card of cards) {
    const id = card.dataset.id;
    const title = decodeURIComponent(card.dataset.title || "");
    const desc = decodeURIComponent(card.dataset.desc || "");
    const resDiv = document.getElementById("ai-result-" + id);
    const rejectBtn = card.querySelector(".btn-reject");
    
    if (!resDiv || resDiv.dataset.processed === "true") continue;
    
    const text = title + "\\n\\n" + desc;
    resDiv.style.display = "block";
    
    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      resDiv.dataset.processed = "true";
      
      if (data.error) {
        resDiv.style.background = "rgba(239,68,68,.08)";
        resDiv.style.border = "1px solid #DC2626";
        resDiv.style.color = "#DC2626";
        resDiv.innerHTML = `<strong>Lỗi AI:</strong> ${data.error}`;
        continue;
      }
      
      let recommendation = data.recommendation || "N/A";
      let isRejected = recommendation.toLowerCase().includes("từ chối");
      let isSafe = data.isSafe;
      
      let color = (!isSafe || isRejected) ? "#DC2626" : "#16A34A";
      let bg = (!isSafe || isRejected) ? "rgba(239,68,68,.08)" : "rgba(34,197,94,.08)";
      
      resDiv.style.background = bg;
      resDiv.style.border = "1px solid " + color;
      resDiv.style.color = color;
      resDiv.innerHTML = `<strong>Đánh giá AI:</strong> ${recommendation}<br><em style="display:block;margin-top:4px;">${data.reasoning || "Không có lý do chi tiết"}</em>`;
      
      if (data.suggestedEdit) {
        resDiv.innerHTML += `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed ${color}50;font-size:0.8rem;"><strong>Gợi ý sửa đổi:</strong> ${data.suggestedEdit}</div>`;
      }
      
      if (!isSafe && rejectBtn) {
        rejectBtn.dataset.aiReason = data.reasoning || "";
      }

      // Save the AI result to Firebase so we don't have to fetch it again
      SuggestionModel.updateAiResult(id, {
        isSafe: data.isSafe,
        recommendation: data.recommendation,
        reasoning: data.reasoning,
        suggestedEdit: data.suggestedEdit || null,
        processedAt: new Date().toISOString()
      }).catch(err => console.warn("Failed to save AI result", err));

    } catch(err) {
      resDiv.dataset.processed = "true";
      resDiv.style.background = "rgba(239,68,68,.08)";
      resDiv.style.border = "1px solid #DC2626";
      resDiv.style.color = "#DC2626";
      resDiv.innerHTML = `<strong>Lỗi phân tích AI:</strong> ${err.message}`;
    }
  }
}

// ── Kiểm tra địa điểm gần (FIX #NEW) ─────────────────────
// Tính khoảng cách giữa 2 tọa độ (km) theo công thức Haversine
function _haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let _nearbyMap = null;

async function _openNearbyModal(sugLat, sugLng, sugTitle) {
  // Tạo modal nếu chưa có
  let modal = document.getElementById("nearby-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "nearby-modal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-box" style="max-width:720px;width:95%;">
        <div class="modal-header">
          <h3>Kiểm tra vị trí gần</h3>
          <button class="modal-close" id="nearby-modal-close">&times;</button>
        </div>
        <div style="padding:16px 20px 0;">
          <p id="nearby-sug-title" style="font-size:.85rem;color:var(--text2);margin-bottom:12px;"></p>
          <div id="nearby-map" style="height:340px;border-radius:8px;border:1px solid var(--border);"></div>
          <div id="nearby-list" style="margin-top:14px;margin-bottom:16px;"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById("nearby-modal-close").onclick = () => {
      modal.style.display = "none";
    };
    modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };
  }

  document.getElementById("nearby-sug-title").textContent = `Đề xuất: "${sugTitle}"`;
  modal.style.display = "flex";

  // Khởi tạo lại map mỗi lần mở
  if (_nearbyMap) {
    try { _nearbyMap.off(); _nearbyMap.remove(); } catch(e) {}
    _nearbyMap = null;
  }

  await new Promise(r => setTimeout(r, 80));

  _nearbyMap = L.map("nearby-map", { center: [sugLat, sugLng], zoom: 14 });
  L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  }).addTo(_nearbyMap);

  // Marker đề xuất (đỏ)
  const sugIcon = L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:#EF4444;border:2px solid white;
      box-shadow:0 0 0 3px rgba(239,68,68,.35);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  L.marker([sugLat, sugLng], { icon: sugIcon })
    .addTo(_nearbyMap)
    .bindPopup(`<b style="color:#EF4444">Đề xuất mới</b><br>${sugTitle}`)
    .openPopup();

  // Vẽ vùng tròn bán kính 100m
  L.circle([sugLat, sugLng], {
    radius: 100,
    color: "#EF4444",
    fillColor: "#EF4444",
    fillOpacity: 0.07,
    weight: 1.5,
    dashArray: "5,5",
  }).addTo(_nearbyMap);

  // Load tất cả địa điểm hiện có và tìm những cái gần < 100m
  const listEl = document.getElementById("nearby-list");
  listEl.innerHTML = `<p style="font-size:.8rem;color:var(--text2);">Đang tải địa điểm...</p>`;

  try {
    const locations = await LocationModel.findAll(false);
    const RADIUS_KM = 0.1;
    const nearby = locations
      .map(loc => ({ ...loc, dist: _haversine(sugLat, sugLng, loc.lat, loc.lng) }))
      .filter(loc => loc.dist < RADIUS_KM)
      .sort((a, b) => a.dist - b.dist);

    // Marker xanh cho các địa điểm hiện có
    const existingIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:12px;height:12px;border-radius:50%;
        background:#3B82F6;border:2px solid white;
        box-shadow:0 0 0 3px rgba(59,130,246,.35);
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    locations.forEach(loc => {
      const dist = _haversine(sugLat, sugLng, loc.lat, loc.lng);
      if (dist < 2) { // Hiển thị tất cả địa điểm trong vòng 2km
        L.marker([loc.lat, loc.lng], { icon: existingIcon })
          .addTo(_nearbyMap)
          .bindPopup(`<b>${loc.title}</b><br><span style="font-size:.8rem;color:#6B7280;">${(dist * 1000).toFixed(0)}m</span>`);
      }
    });

    // Hiển thị danh sách cảnh báo
    if (nearby.length === 0) {
      listEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
          background:rgba(34,197,94,.1);border-radius:8px;border:1px solid rgba(34,197,94,.3);">
          <span style="color:#22C55E;font-size:1rem;">✓</span>
          <span style="font-size:.85rem;color:var(--text1);">Không có địa điểm nào trong bán kính 100m. Vị trí này có thể duyệt.</span>
        </div>`;
    } else {
      const rows = nearby.map(loc => `
        <div style="display:flex;justify-content:space-between;align-items:center;
          padding:8px 0;border-bottom:1px solid var(--border);">
          <div>
            <div style="font-size:.85rem;font-weight:600;color:var(--text1);">${loc.title}</div>
            <div style="font-size:.78rem;color:var(--text2);">${loc.address || "Không có địa chỉ"}</div>
          </div>
          <span style="
            font-size:.78rem;font-weight:600;
            padding:3px 10px;border-radius:20px;white-space:nowrap;
            background:${loc.dist < 0.1 ? "rgba(239,68,68,.12)" : "rgba(234,179,8,.12)"};
            color:${loc.dist < 0.1 ? "#EF4444" : "#CA8A04"};
          ">${(loc.dist * 1000).toFixed(0)}m</span>
        </div>`).join("");

      listEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
          background:rgba(239,68,68,.08);border-radius:8px;border:1px solid rgba(239,68,68,.25);
          margin-bottom:12px;">
          <span style="color:#EF4444;font-size:1rem;">⚠</span>
          <span style="font-size:.85rem;color:var(--text1);">
            Phát hiện <strong>${nearby.length}</strong> địa điểm trong bán kính 100m — kiểm tra trùng lặp trước khi duyệt.
          </span>
        </div>
        <div style="font-size:.8rem;font-weight:600;color:var(--text2);margin-bottom:4px;">
          ĐỊA ĐIỂM GẦN NHẤT
        </div>
        ${rows}`;
    }
  } catch(err) {
    listEl.innerHTML = `<p style="font-size:.8rem;color:#EF4444;">Lỗi tải địa điểm: ${err.message}</p>`;
  }
}

function _openRejectModal(sugId, title, submitterUid, currentUserData, aiReason = "") {
  let modal = document.getElementById("reject-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "reject-modal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3>Từ chối đề xuất</h3>
          <button class="modal-close" id="reject-modal-close">&times;</button>
        </div>
        <div style="padding:20px;">
          <p style="font-size:.85rem;color:var(--text2);margin-bottom:14px;">
            Đề xuất: <strong id="reject-sug-title"></strong>
          </p>
          <div class="form-group">
            <label>Lý do từ chối <span style="color:var(--accent)">*</span></label>
            <textarea id="reject-reason" class="form-control" rows="3"
              placeholder="Ví dụ: Ảnh không rõ ràng, vị trí không chính xác..."></textarea>
          </div>
          <div style="display:flex;gap:10px;margin-top:4px;">
            <button id="reject-confirm-btn" class="btn btn--danger" style="flex:1">Xác nhận từ chối</button>
            <button id="reject-cancel-btn" class="btn btn--ghost">Hủy</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  document.getElementById("reject-sug-title").textContent = title;
  document.getElementById("reject-reason").value = aiReason;
  modal.style.display = "flex";

  const close = () => { modal.style.display = "none"; };
  document.getElementById("reject-modal-close").onclick = close;
  document.getElementById("reject-cancel-btn").onclick  = close;
  modal.onclick = e => { if (e.target === modal) close(); };

  const oldBtn = document.getElementById("reject-confirm-btn");
  const newBtn = oldBtn.cloneNode(true);
  newBtn.disabled = false;
  newBtn.textContent = "Xác nhận từ chối";
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  newBtn.onclick = async () => {
    const reason = document.getElementById("reject-reason").value.trim();
    if (!reason) { Toast.show("Vui lòng nhập lý do từ chối.", "error"); return; }
    newBtn.disabled = true;
    newBtn.innerHTML = '<span class="spinner"></span>';
    try {
      await SuggestionModel.reject(sugId, currentUserData?.uid, reason);
      await NotificationModel.create({
        toUid: submitterUid,
        type:  "suggestion_rejected",
        title: "Đề xuất không được duyệt",
        body:  `Đề xuất "${title}" bị từ chối. Lý do: ${reason}`,
        link:  "/home",
      });
      Toast.show("Đã từ chối đề xuất.");
      close();
      router.navigate("/admin/suggestions");
    } catch (err) {
      Toast.show("Lỗi: " + err.message, "error");
      newBtn.disabled = false;
      newBtn.textContent = "Xác nhận từ chối";
    }
  };
}

async function _reverseGeocode(lat, lng, inputId) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
      { headers: { "Accept-Language": "vi" } }
    );
    const data = await res.json();
    const el   = document.getElementById(inputId);
    if (el && data.display_name) el.value = data.display_name;
  } catch(e) {}
}

function _nextTick() {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}
