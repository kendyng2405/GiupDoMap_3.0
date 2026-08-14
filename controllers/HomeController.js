// controllers/HomeController.js
import { LocationModel } from "../models/LocationModel.js";
import { UserModel } from "../models/UserModel.js";
import { renderView } from "../views/ViewEngine.js";
import { Toast } from "../views/components/Toast.js";

let mapInstance = null;
let markersLayer = [];
let userLocationLayer = null; // track user pin để xóa khi bấm lại

let currentUrgency = "all";
let currentProvince = "";
let currentDistrict = "";

function applyFilters() {
  if (!mapInstance) return;
  let visibleCount = 0;
  markersLayer.forEach(({ marker, loc }) => {
    const matchUrgency = currentUrgency === "all" || loc.urgency === currentUrgency;
    let matchRegion = true;
    if (currentProvince) {
      matchRegion = (loc.address || "").toLowerCase().includes(currentProvince.toLowerCase());
      if (matchRegion && currentDistrict) {
        matchRegion = (loc.address || "").toLowerCase().includes(currentDistrict.toLowerCase());
      }
    }
    const show = matchUrgency && matchRegion;
    show ? marker.addTo(mapInstance) : mapInstance.removeLayer(marker);
    if (show) visibleCount++;
  });
  const badge = document.getElementById("map-count-badge");
  if (badge) badge.textContent = `${visibleCount} địa điểm`;
}

export const HomeController = {
  async show({ user, userData }) {
    renderView("home", { user, userData });
    try {
      const [locations] = await Promise.all([
        LocationModel.findAll(true),
        UserModel.getLeaderboard(5),
      ]);
      _initFilterAndLocate();
      _initMapWhenReady(locations, user, userData);
    } catch (err) {
      console.error("HomeController error:", err);
      Toast.show("Lỗi tải dữ liệu bản đồ.", "error");
    }
  },
};

function _initFilterAndLocate() {
  document.querySelectorAll(".filter-chip").forEach(btn => {
    if (btn.id === "region-filter-btn") return; // Ignore region button for urgency logic

    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip:not(#region-filter-btn)").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentUrgency = btn.dataset.filter;
      applyFilters();
    });
  });

  // Region Filter logic
  let provincesData = null;
  const regionBtn = document.getElementById("region-filter-btn");
  const regionModal = document.getElementById("region-filter-modal");
  const provSelect = document.getElementById("filter-province");
  const distSelect = document.getElementById("filter-district");

  regionBtn?.addEventListener("click", async () => {
    regionModal.style.display = "flex";
    if (!provincesData) {
      try {
        provSelect.innerHTML = '<option value="">Đang tải...</option>';
        const res = await fetch("/public/data/provinces.json");
        provincesData = await res.json();
        provSelect.innerHTML = '<option value="">Tất cả tỉnh thành</option>';
        provincesData.forEach(p => {
          provSelect.innerHTML += `<option value="${p.name}">${p.name}</option>`;
        });
        if (currentProvince) provSelect.value = currentProvince;
      } catch (err) {
        provSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
      }
    } else {
      if (currentProvince) {
        provSelect.value = currentProvince;
        distSelect.innerHTML = '<option value="">Tất cả Phường/Xã/Đặc khu</option>';
        distSelect.disabled = false;
        const prov = provincesData.find(p => p.name === currentProvince);
        if (prov && prov.wards) {
          prov.wards.forEach(wName => {
            distSelect.innerHTML += `<option value="${wName}">${wName}</option>`;
          });
        }
        if (currentDistrict) distSelect.value = currentDistrict;
      }
    }
  });

  provSelect?.addEventListener("change", () => {
    const provName = provSelect.value;
    distSelect.innerHTML = '<option value="">Tất cả Phường/Xã/Đặc khu</option>';
    if (provName) {
      distSelect.disabled = false;
      const prov = provincesData.find(p => p.name === provName);
      if (prov && prov.wards) {
        prov.wards.forEach(wName => {
          distSelect.innerHTML += `<option value="${wName}">${wName}</option>`;
        });
      }
    } else {
      distSelect.disabled = true;
    }
    distSelect.value = "";
  });

  document.getElementById("region-filter-clear")?.addEventListener("click", () => {
    if (provSelect) provSelect.value = "";
    if (distSelect) {
      distSelect.innerHTML = '<option value="">Tất cả Phường/Xã/Đặc khu</option>';
      distSelect.disabled = true;
    }
    currentProvince = "";
    currentDistrict = "";
    regionBtn.classList.remove("active");
    regionBtn.style.background = "var(--bg2)";
    regionBtn.style.color = "inherit";
    regionBtn.style.borderColor = "var(--border)";
    applyFilters();
    regionModal.style.display = "none";
  });

  document.getElementById("region-filter-apply")?.addEventListener("click", () => {
    currentProvince = provSelect.value;
    currentDistrict = distSelect.value;
    if (currentProvince) {
      regionBtn.classList.add("active");
      regionBtn.style.background = "var(--accent)";
      regionBtn.style.color = "white";
      regionBtn.style.borderColor = "var(--accent)";
    } else {
      regionBtn.classList.remove("active");
      regionBtn.style.background = "var(--bg2)";
      regionBtn.style.color = "inherit";
      regionBtn.style.borderColor = "var(--border)";
    }
    applyFilters();
    regionModal.style.display = "none";
  });

  document.getElementById("locate-btn")?.addEventListener("click", () => {
    if (!navigator.geolocation) { Toast.show("Trình duyệt không hỗ trợ định vị.", "error"); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      if (!mapInstance) return;
      // Xóa pin cũ trước khi vẽ pin mới
      if (userLocationLayer) {
        mapInstance.removeLayer(userLocationLayer);
        userLocationLayer = null;
      }
      mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 15, { animate: true });
      userLocationLayer = L.circle([pos.coords.latitude, pos.coords.longitude], {
        radius: 150, color: "#C0392B", fillOpacity: 0.15
      }).addTo(mapInstance);
    }, () => Toast.show("Không thể lấy vị trí.", "error"));
  });
}

function _initMapWhenReady(locations, user, userData) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const mapEl = document.getElementById("map");
      if (!mapEl) {
        setTimeout(() => _initMapWhenReady(locations, user, userData), 200);
        return;
      }
      if (typeof L === "undefined") {
        Toast.show("Lỗi tải bản đồ. Vui lòng tải lại trang.", "error");
        return;
      }
      if (mapInstance) {
        try { mapInstance.off(); mapInstance.remove(); } catch(e) {}
        mapInstance = null;
        markersLayer = [];
        userLocationLayer = null;
      }
      mapInstance = L.map(mapEl, {
        center: [16.047079, 108.206230],
        zoom: 6,
        zoomControl: false,
        preferCanvas: true,
      });
      L.control.zoom({ position: "topright" }).addTo(mapInstance);
      L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
        maxZoom: 20,
      }).addTo(mapInstance);
      mapInstance.invalidateSize();
      markersLayer = [];
      _plotMarkers(locations, user, userData);
      
      // Apply any existing filters (e.g. if returning from another page)
      applyFilters();

      if (locations.length > 0 && markersLayer.length > 0) {
        try {
          const group = L.featureGroup(markersLayer.map(m => m.marker));
          if (group.getBounds().isValid()) mapInstance.fitBounds(group.getBounds().pad(0.3));
        } catch(e) {}
      }
    }, 100);
  });
}

function _plotMarkers(locations, user, userData) {
  if (!mapInstance) return;
  const urgencyColors = { normal: "#22C55E", urgent: "#EAB308", critical: "#EF4444" };
  const sidebar = document.getElementById("map-sidebar");

  // Inject CSS một lần
  if (!document.getElementById("pulse-style")) {
    const style = document.createElement("style");
    style.id = "pulse-style";
    style.textContent = `
      .marker-dot-wrap {
        position: relative;
        width: 28px; height: 28px;
        cursor: pointer;
      }
      .marker-dot {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 14px; height: 14px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: transform 0.18s cubic-bezier(.34,1.56,.64,1);
        z-index: 2;
      }
      .marker-dot-wrap:hover .marker-dot {
        transform: translate(-50%, -50%) scale(1.35);
      }
      .marker-ring {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) scale(1);
        width: 14px; height: 14px;
        border-radius: 50%;
        opacity: 0;
        animation: dotPulse 2.4s ease-out infinite;
        z-index: 1;
      }
      .marker-ring-2 { animation-delay: 0.8s; }
      .marker-ring-3 { animation-delay: 1.6s; }
      @keyframes dotPulse {
        0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.65; }
        100% { transform: translate(-50%, -50%) scale(3.8); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  locations.forEach(loc => {
    const color = urgencyColors[loc.urgency] || "#22C55E";
    const html = `
      <div class="marker-dot-wrap">
        <div class="marker-dot" style="background:${color}"></div>
        <div class="marker-ring" style="background:${color}"></div>
        <div class="marker-ring marker-ring-2" style="background:${color}"></div>
        <div class="marker-ring marker-ring-3" style="background:${color}"></div>
      </div>`;

    const icon = L.divIcon({
      html, className: "",
      iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16]
    });
    const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(mapInstance);
    marker.on("click", e => {
      L.DomEvent.stopPropagation(e);
      mapInstance.flyTo([loc.lat, loc.lng], 16, { animate: true, duration: 0.8 });
      _openSidebar(loc, user, userData, sidebar);
    });
    markersLayer.push({ marker, loc });
  });

  mapInstance.on("click", () => sidebar?.classList.remove("open"));
}

function _openSidebar(loc, user, userData, sidebar) {
  if (!sidebar) return;

  const HL = {
    food: "Thực phẩm", clothes: "Quần áo", money: "Tiền mặt",
    medical: "Y tế", shelter: "Chỗ ở", other: "Khác",
  };
  const UL = { normal: "Bình thường", urgent: "Khẩn cấp", critical: "Rất khẩn" };
  const uc = { normal: "#22C55E", urgent: "#EAB308", critical: "#EF4444" }[loc.urgency] || "#22C55E";

  const isPriv = userData?.role === "admin" || userData?.role === "founder";
  const actionBtn = user && userData?.role === "member"
    ? `<button class="btn btn--primary btn--full" id="checkin-btn" data-id="${loc.id}">Xác nhận hỗ trợ tại đây</button>`
    : user && isPriv
    ? `<a href="/admin/locations/${loc.id}/edit" class="btn btn--ghost btn--full">Chỉnh sửa địa điểm</a>`
    : `<a href="/login" class="btn btn--primary btn--full">Đăng nhập để hỗ trợ</a>`;

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3 class="sidebar-title">Chi tiết địa điểm</h3>
      <button class="sidebar-close" id="sidebar-close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="urgency-strip" style="background:${uc}"></div>
    ${loc.imageUrl
      ? `<img src="${loc.imageUrl}" class="sidebar-img" alt="${loc.title}" loading="lazy" style="cursor:pointer;" onclick="document.getElementById('global-img-view').src=this.src;document.getElementById('global-img-modal').style.display='flex';">`
      : `<div class="sidebar-img-placeholder">Chưa có ảnh</div>`}
    <h2 class="sidebar-loc-title">${loc.title}</h2>
    <div class="sidebar-badges">
      <span class="badge" style="background:${uc}20;color:${uc};">${UL[loc.urgency] || ""}</span>
      <span class="badge badge--muted">${loc.peopleCount || 1} người</span>
    </div>
    <div class="sidebar-help-types">
      ${(loc.helpTypes || []).map(t => `<span class="chip">${HL[t] || t}</span>`).join("")}
    </div>
    ${loc.description ? `<p class="sidebar-desc">${loc.description}</p>` : ""}
    <div class="sidebar-meta-grid">
      <div class="meta-box">
        <div class="meta-label">Thời gian</div>
        <div class="meta-val">${loc.timeFrom || "?"} — ${loc.timeTo || "?"}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Hỗ trợ</div>
        <div class="meta-val" style="color:var(--accent)">${loc.supportCount || 0} lượt</div>
      </div>
    </div>
    ${loc.address ? `
    <div class="sidebar-address">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
      ${loc.address}
    </div>` : ""}
    ${loc.note ? `<div class="sidebar-note">${loc.note}</div>` : ""}
    <div class="sidebar-actions">
      ${actionBtn}
      <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}" target="_blank" rel="noopener" class="btn btn--gmaps btn--full">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
        Chỉ đường trên Google Maps
      </a>
    </div>`;

  sidebar.classList.add("open");
  document.getElementById("sidebar-close")?.addEventListener("click", () => sidebar.classList.remove("open"));

  document.getElementById("checkin-btn")?.addEventListener("click", async e => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Đang lấy vị trí...';
    if (!navigator.geolocation) {
      Toast.show("Trình duyệt không hỗ trợ định vị.", "error");
      btn.disabled = false; btn.textContent = "Xác nhận hỗ trợ tại đây";
      return;
    }
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const dist = LocationModel.haversineKm(pos.coords.latitude, pos.coords.longitude, loc.lat, loc.lng);
        if (dist > 0.5) {
          Toast.show(`Bạn cách ${Math.round(dist * 1000)}m. Cần đến gần hơn (trong 500m).`, "error");
          btn.disabled = false; btn.textContent = "Xác nhận hỗ trợ tại đây";
          return;
        }
        const result = await UserModel.addSupportedLocation(user.uid, loc.id);
        if (result?.alreadySupported) {
          Toast.show("Bạn đã hỗ trợ địa điểm này rồi!");
          btn.disabled = false; return;
        }
        await LocationModel.incrementSupport(loc.id);
        Toast.show(`Cảm ơn bạn! +1 điểm — Tổng: ${result.points} điểm`);
        btn.textContent = "Đã hỗ trợ";
        btn.style.opacity = "0.6";
      } catch(err) {
        console.error(err);
        Toast.show("Lỗi ghi nhận hỗ trợ.", "error");
        btn.disabled = false; btn.textContent = "Xác nhận hỗ trợ tại đây";
      }
    }, () => {
      Toast.show("Không thể lấy vị trí. Hãy cho phép truy cập vị trí.", "error");
      btn.disabled = false; btn.textContent = "Xác nhận hỗ trợ tại đây";
    });
  });
}
