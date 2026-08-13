// views/ViewEngine.js
import { HELP_TYPES, URGENCY } from "../models/LocationModel.js";
import { RANKS } from "../models/UserModel.js";

const URGENCY_COLOR = {
    normal: "#22C55E",
    urgent: "#EAB308",
    critical: "#EF4444"
};

const URGENCY_LABEL = {
    normal: "Bình thường",
    urgent: "Khẩn cấp",
    critical: "Rất khẩn"
};

const HELP_LABEL = {
    food: "Thực phẩm",
    clothes: "Quần áo",
    money: "Tiền mặt",
    medical: "Y tế",
    shelter: "Chỗ ở",
    other: "Khác"
};

export function renderView(name, data = {}) {
    const app = document.getElementById("app");
    if (!app) return;

    const html = views[name]?.(data) || `<div class="container pt-120"><h1>Không tìm thấy trang</h1></div>`;
    app.innerHTML = html;
}

const views = {
    // ---- TRANG CHỦ (BẢN ĐỒ) ----
    home: ({ user, userData }) => `
        <div class="map-wrap">
            ${!user ? `
                <div class="map-welcome" id="welcome-banner">
                    <h2>Bản đồ từ thiện</h2>
                    <p>Đăng nhập để hỗ trợ và tích lũy điểm</p>
                    <a href="/login" class="btn btn--primary btn--sm">Đăng nhập</a>
                </div>
            ` : ""}
            
            <div class="map-controls">
                <button class="map-ctrl-btn" id="locate-btn" title="Vị trí của tôi">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                    </svg>
                </button>
            </div>
            
            <div id="map"></div>
            
            <div class="map-filter-bar">
                <span class="map-count-badge" id="map-count-badge" style="position:static;background:transparent;border:none;box-shadow:none;padding:4px 6px;font-size:.78rem;color:var(--text-muted);white-space:nowrap;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span id="map-count-badge">0 địa điểm</span>
                </span>
                <div style="width:1px;height:16px;background:var(--border);margin:0 4px;"></div>
                
                <button class="filter-chip active" data-filter="all">Tất cả</button>
                <button class="filter-chip" data-filter="critical"><span class="dot" style="background:#EF4444"></span>Rất khẩn</button>
                <button class="filter-chip" data-filter="urgent"><span class="dot" style="background:#EAB308"></span>Khẩn cấp</button>
                <button class="filter-chip" data-filter="normal"><span class="dot" style="background:#22C55E"></span>Bình thường</button>
            </div>
            
            <div class="map-sidebar" id="map-sidebar"></div>
        </div>
    `,

    // ---- ĐĂNG NHẬP ----
    login: () => `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-brand">
                    <div class="brand-logo"></div>
                    <div>
                        <div class="brand-name">Trái Tim Việt</div>
                        <div class="brand-sub">Bản đồ từ thiện</div>
                    </div>
                </div>
                <h1 class="auth-title">Đăng nhập</h1>
                <p class="auth-sub">Chào mừng trở lại. Tiếp tục hành trình yêu thương.</p>
                
                <form id="login-form" novalidate>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" class="form-control" placeholder="ten@email.com" required>
                    </div>
                    <div class="form-group">
                        <label>Mật khẩu</label>
                        <div class="input-pw-wrap">
                            <input type="password" name="password" class="form-control" placeholder="Nhập mật khẩu" required>
                            <button type="button" class="pw-toggle" onclick="const i=this.previousElementSibling;i.type=i.type==='password'?'text':'password'">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="form-footer-link"><a href="/forgot-password">Quên mật khẩu?</a></div>
                    <button type="submit" class="btn btn--primary btn--full btn--lg">Đăng nhập</button>
                </form>
                
                <div class="auth-divider">hoặc</div>
                <div class="auth-switch">Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></div>
                <div class="auth-back"><a href="/home">&larr; Quay lại bản đồ</a></div>
            </div>
        </div>
    `,

    // ---- ĐĂNG KÝ ----
    register: () => `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-brand">
                    <div class="brand-logo"></div>
                    <div>
                        <div class="brand-name">Trái Tim Việt</div>
                        <div class="brand-sub">Bản đồ từ thiện</div>
                    </div>
                </div>
                <h1 class="auth-title">Tạo tài khoản</h1>
                <p class="auth-sub">Tham gia cộng đồng, bắt đầu hành trình giúp đỡ.</p>
                
                <form id="register-form" novalidate>
                    <div class="form-row">
                        <div class="form-group"><label>Họ và tên</label><input type="text" name="fullName" class="form-control" placeholder="Nguyễn Văn A" required></div>
                        <div class="form-group"><label>Số điện thoại</label><input type="tel" name="phone" class="form-control" placeholder="0912 345 678" required></div>
                    </div>
                    <div class="form-group"><label>Email</label><input type="email" name="email" class="form-control" placeholder="ten@email.com" required></div>
                    <div class="form-group">
                        <label>Mật khẩu</label>
                        <div class="input-pw-wrap">
                            <input type="password" name="password" id="pw-reg" class="form-control" placeholder="Tối thiểu 6 ký tự" required>
                            <button type="button" class="pw-toggle" onclick="const i=this.previousElementSibling;i.type=i.type==='password'?'text':'password'">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div style="height:4px;background:var(--border);border-radius:2px;margin-bottom:16px;overflow:hidden;">
                        <div id="pwd-bar-fill" style="height:100%;width:0;transition:all .3s;"></div>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full btn--lg">Tạo tài khoản</button>
                </form>
                
                <div class="auth-divider">đã có tài khoản?</div>
                <a href="/login" class="btn btn--ghost btn--full">Đăng nhập</a>
                <div class="auth-back"><a href="/home">&larr; Quay lại bản đồ</a></div>
            </div>
        </div>
    `,

    // ---- QUÊN MẬT KHẨU ----
    "forgot-password": () => `
        <div class="auth-page">
            <div class="auth-card">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="width:56px;height:56px;border-radius:50%;background:rgba(184,50,40,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <h1 class="auth-title">Quên mật khẩu</h1>
                    <p class="auth-sub">Nhập email và chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
                </div>
                <form id="forgot-form">
                    <div class="form-group"><label>Email đăng ký</label><input type="email" name="email" class="form-control" placeholder="ten@email.com" required></div>
                    <button type="submit" class="btn btn--primary btn--full btn--lg">Gửi email đặt lại</button>
                </form>
                <div class="auth-back" style="margin-top:20px;"><a href="/login">&larr; Quay lại đăng nhập</a></div>
            </div>
        </div>
    `,

    // ---- HỒ SƠ ----
    profile: ({ user, userData, leaderboard, myRank, ranks = RANKS }) => {
        const isFounder = userData?.role === "founder";
        const isAdmin = userData?.role === "admin";
        const isPriv = isAdmin || isFounder;
        const roleLabel = isFounder ? "Người Sáng Lập" : isAdmin ? "Người Dẫn Lửa" : "Thành viên";
        const roleColor = isFounder ? "#7B2FBE" : isAdmin ? "var(--accent)" : "var(--text-muted)";

        const avatarContent = userData?.photoURL 
            ? `<img src="${userData.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`
            : `<span style="font-size:2rem;font-weight:800;">${(userData?.fullName || "U").charAt(0).toUpperCase()}</span>`;

        return `
            <div class="container pt-120 pb-80">
                <div class="profile-grid">
                    <div>
                        <div class="profile-hero">
                            <div class="profile-avatar-wrap">
                                <div class="profile-avatar" id="avatar-preview">${avatarContent}</div>
                                <button class="avatar-edit-btn" id="avatar-edit-btn" title="Đổi ảnh đại diện">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg> Đổi ảnh
                                </button>
                                <input type="file" id="avatar-input" accept="image/*" style="display:none">
                            </div>
                            <h1>${userData?.fullName || "Người dùng"}</h1>
                            <div class="profile-rank-name" style="color:${isPriv ? roleColor : (userData?.rank?.color || "#CD7F32")}">
                                ${isPriv ? roleLabel : (userData?.rank?.name || "Đồng Lòng")}
                            </div>
                            <div class="profile-role">
                                ${roleLabel} ${myRank && !isPriv ? `&nbsp;&middot;&nbsp; Hạng #${myRank}` : ""}
                            </div>
                        </div>

                        ${!isPriv ? `
                            <div class="rank-card">
                                <div class="rank-pts-row">
                                    <div><div class="rank-label">Tổng điểm</div><div class="rank-pts">${userData?.points || 0}</div></div>
                                    <div><div class="rank-label">Cấp bậc</div><div class="rank-name-sm" style="color:${userData?.rank?.color || "#CD7F32"}">${userData?.rank?.name || "Đồng Lòng"}</div></div>
                                </div>
                                ${userData?.rank?.next ? `
                                    <div class="prog-info">Tiến trình lên <strong>${userData.rank.next.name}</strong> — ${userData.rank.progress}%</div>
                                    <div class="prog-bar"><div class="prog-fill" style="width:${userData.rank.progress}%"></div></div>
                                    <div class="prog-sub">Cần thêm ${userData.rank.pointsToNext} điểm</div>
                                ` : `<div style="text-align:center;color:var(--accent-gold);font-weight:600;padding:10px 0;">Bạn đã đạt cấp bậc cao nhất!</div>`}
                            </div>
                        ` : ""}

                        <!-- Hệ thống cấp bậc -->
                        <div class="card mb-24">
                            <div class="card-header"><h3>Hệ thống cấp bậc thành viên</h3></div>
                            <div class="card-body">
                                ${ranks.map((r, i) => {
                                    const pts = userData?.points || 0;
                                    const achieved = isPriv || pts >= r.minPoints;
                                    const current = !isPriv && userData?.rank?.name === r.name;
                                    return `
                                        <div class="rank-journey-item">
                                            <div class="rj-dot ${achieved ? "achieved" : ""}" style="${achieved ? `background:${r.color}` : ""}">
                                                ${achieved 
                                                    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` 
                                                    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
                                                }
                                            </div>
                                            <div class="rj-info">
                                                <div class="rj-name" style="color:${achieved ? r.color : "var(--text-muted)"}">
                                                    ${r.name} ${current ? `<span class="rj-current">Hiện tại</span>` : ""}
                                                </div>
                                                <div class="rj-pts">Từ ${r.minPoints} điểm</div>
                                            </div>
                                            <div style="font-size:.75rem;font-weight:700;color:${r.color};background:${r.color}20;padding:3px 10px;border-radius:999px;">${r.name}</div>
                                        </div>`;
                                }).join("")}
                            </div>
                        </div>

                        <!-- Chỉnh sửa hồ sơ -->
                        <div class="card">
                            <div class="card-header"><h3>Chỉnh sửa hồ sơ</h3></div>
                            <div class="card-body">
                                <form id="profile-form">
                                    <div class="form-row">
                                        <div class="form-group"><label>Họ và tên</label><input type="text" name="fullName" class="form-control" value="${userData?.fullName || ""}" required></div>
                                        <div class="form-group"><label>Số điện thoại</label><input type="tel" name="phone" class="form-control" value="${userData?.phone || ""}"></div>
                                    </div>
                                    <button type="submit" class="btn btn--primary">Lưu thay đổi</button>
                                </form>

                                <div class="divider">đổi email</div>
                                <p class="form-hint" style="margin-bottom:10px;">Cần nhập mật khẩu hiện tại để xác thực. Email thay đổi sau khi bạn click link xác thực gửi về email mới.</p>
                                
                                <form id="email-form">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Email mới</label>
                                            <input type="email" name="newEmail" class="form-control" placeholder="${userData?.email || ""}" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Mật khẩu hiện tại</label>
                                            <div class="input-pw-wrap">
                                                <input type="password" name="currentPassword" class="form-control" placeholder="Nhập để xác thực" required>
                                                <button type="button" class="pw-toggle" onclick="const i=this.previousElementSibling;i.type=i.type==='password'?'text':'password'">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn--ghost">Cập nhật email</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div>
                        <div class="card sticky-top">
                            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                                <h3>Bảng xếp hạng</h3>
                                <span class="text-muted text-xs">Top 10</span>
                            </div>
                            <div class="card-body" style="padding:8px 16px;">
                                ${leaderboard.map((m, i) => {
                                    const av = m.photoURL 
                                        ? `<img src="${m.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">` 
                                        : (m.fullName || "?").charAt(0).toUpperCase();
                                    return `
                                        <div class="lb-item ${m.uid === user?.uid ? "lb-item--me" : ""}">
                                            <div class="lb-rank ${i === 0 ? "lb-rank--top1" : i === 1 ? "lb-rank--top2" : i === 2 ? "lb-rank--top3" : ""}">${i + 1}</div>
                                            <div class="lb-avatar" style="overflow:hidden">${av}</div>
                                            <div class="lb-info">
                                                <div class="lb-name">${m.fullName || "Ẩn danh"}${m.uid === user?.uid ? ` <span style="font-size:.62rem;color:var(--accent)">(Bạn)</span>` : ""}</div>
                                                <div class="lb-meta">${m.rank?.name || "Đồng Lòng"}</div>
                                            </div>
                                            <div class="lb-pts">${m.points || 0}</div>
                                        </div>`;
                                }).join("") || `<p class="text-muted" style="padding:16px;font-size:.82rem;">Chưa có dữ liệu</p>`}
                            </div>
                        </div>

                        <div class="card" style="margin-top:16px;">
                            <div class="card-body">
                                <div class="info-label">Thông tin tài khoản</div>
                                <div class="info-row" style="align-items:flex-start;">
                                    <span style="flex-shrink:0;padding-top:1px;">Email</span>
                                    <strong style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;display:block;" title="${userData?.email || ""}">${userData?.email || ""}</strong>
                                </div>
                                <div class="info-row"><span>Vai trò</span><strong style="color:${roleColor}">${roleLabel}</strong></div>
                                ${!isPriv ? `<div class="info-row"><span>Hỗ trợ</span><strong>${userData?.supportedLocations?.length || 0} địa điểm</strong></div>` : ""}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ---- ADMIN DASHBOARD ----
    "admin-dashboard": ({ userData, locations, members, stats }) => `
        <div class="admin-layout">
            <aside class="admin-sidebar">${_adminNav("dashboard", userData?.role)}</aside>
            <main class="admin-main">
                <div class="admin-topbar">
                    <div><h1>Bảng điều khiển</h1><p class="text-muted">Quản lý địa điểm và thành viên</p></div>
                    <a href="/admin/locations/new" class="btn btn--primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg> Thêm địa điểm
                    </a>
                </div>

                <div class="stats-grid">
                    ${[
                        ["Tổng địa điểm", stats.total, "var(--accent)"],
                        ["Đang hoạt động", stats.active, "#22C55E"],
                        ["Rất khẩn", stats.critical, "#EF4444"],
                        ["Thành viên", stats.members, "#FFD700"],
                    ].map(([l, v, c]) => `
                        <div class="stat-card">
                            <div class="stat-val" style="color:${c}">${v}</div>
                            <div class="stat-label">${l}</div>
                        </div>
                    `).join("")}
                </div>

                <div class="card">
                    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                        <h3>Danh sách địa điểm</h3>
                        <input id="loc-search" type="text" class="form-control" style="width:220px;" placeholder="Tìm kiếm...">
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="data-table">
                            <thead><tr><th>Tên</th><th>Mức độ</th><th>Người</th><th>Hỗ trợ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                            <tbody id="locations-tbody">
                                ${locations.length === 0 
                                    ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">Chưa có địa điểm nào</td></tr>` 
                                    : locations.map(loc => `
                                        <tr class="loc-row">
                                            <td><div class="td-title"><a href="/location/${loc.id}">${loc.title}</a></div><div class="td-sub">${(loc.address || "").substring(0, 40)}</div></td>
                                            <td><span class="badge" style="background:${URGENCY_COLOR[loc.urgency]}20;color:${URGENCY_COLOR[loc.urgency]}">${URGENCY_LABEL[loc.urgency] || ""}</span></td>
                                            <td>${loc.peopleCount || 1}</td>
                                            <td style="font-weight:700;color:var(--accent)">${loc.supportCount || 0}</td>
                                            <td><span style="font-size:.75rem;font-weight:600;color:${loc.isActive ? "#22C55E" : "var(--text-muted)"}">${loc.isActive ? "Hoạt động" : "Đã ẩn"}</span></td>
                                            <td>
                                                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                                    <a href="/admin/locations/${loc.id}/edit" class="btn btn--ghost btn--sm">Sửa</a>
                                                    <button class="btn btn--ghost btn--sm" data-action="toggle" data-id="${loc.id}">${loc.isActive ? "Ẩn" : "Hiện"}</button>
                                                    <button class="btn btn--danger btn--sm" data-action="delete" data-id="${loc.id}">Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    `,

    // ---- ADMIN FORM (ĐÃ SỬA LỖI ESCAPE) ----
    "admin-location-form": ({ userData, location, helpTypes = HELP_TYPES, urgency = Object.entries(URGENCY_LABEL).map(([value, label]) => ({
        value,
        label,
        color: URGENCY_COLOR[value]
    })) }) => `
        <div class="admin-layout">
            <aside class="admin-sidebar">${_adminNav(location ? "edit" : "new", userData?.role)}</aside>
            <main class="admin-main">
                <div class="admin-topbar">
                    <div>
                        <a href="/admin/dashboard" style="font-size:.82rem;color:var(--text-muted);display:inline-flex;align-items:center;gap:6px;margin-bottom:8px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg> Quay lại
                        </a>
                        <h1>${location ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}</h1>
                    </div>
                </div>

                <form id="location-form">
                    <div class="form-2col">
                        <!-- Cột trái -->
                        <div>
                            <div class="card mb-20">
                                <div class="card-header"><h3>Thông tin cơ bản</h3></div>
                                <div class="card-body">
                                    <div class="form-group"><label>Tên địa điểm *</label><input type="text" name="title" class="form-control" value="${location?.title || ""}" placeholder="VD: Khu vực cầu Thị Nghè" required></div>
                                    <div class="form-group"><label>Mô tả</label><textarea name="description" class="form-control" rows="3" placeholder="Mô tả hoàn cảnh, nhu cầu...">${location?.description || ""}</textarea></div>
                                    <div class="form-group"><label>Ghi chú</label><textarea name="note" class="form-control" rows="2" placeholder="Thông tin lưu ý khi đến hỗ trợ...">${location?.note || ""}</textarea></div>
                                </div>
                            </div>

                            <div class="card mb-20">
                                <div class="card-header"><h3>Loại hỗ trợ cần thiết</h3></div>
                                <div class="card-body">
                                    <div class="help-types-grid">
                                        ${helpTypes.map(t => `
                                            <label class="check-card ${location?.helpTypes?.includes(t.value) ? "checked" : ""}">
                                                <input type="checkbox" name="helpTypes" value="${t.value}" ${location?.helpTypes?.includes(t.value) ? "checked" : ""} onchange="this.closest('.check-card').classList.toggle('checked', this.checked)">
                                                <span>${t.label}</span>
                                            </label>
                                        `).join("")}
                                    </div>
                                </div>
                            </div>

                            <div class="card">
                                <div class="card-header"><h3>Hình ảnh</h3></div>
                                <div class="card-body">
                                    <div id="img-preview-wrap" style="display: ${location?.imageUrl ? 'block' : 'none'}; margin-bottom:12px;">
                                        <img id="img-preview" src="${location?.imageUrl || ""}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;border:1px solid var(--border);">
                                    </div>
                                    <label style="display:flex;align-items:center;gap:8px;padding:10px 16px;border:1.5px dashed var(--border);border-radius:var(--radius);cursor:pointer;font-size:.85rem;color:var(--text-muted);background:var(--bg2);" 
                                           onmouseenter="this.style.borderColor='var(--accent)'" 
                                           onmouseleave="this.style.borderColor='var(--border)'">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="17 8 12 3 7 8"/>
                                            <line x1="12" y1="3" x2="12" y2="15"/>
                                        </svg>
                                        ${location?.imageUrl ? "Thay ảnh mới" : "Chọn ảnh từ thiết bị"}
                                        <input type="file" id="img-file-input" accept="image/*" style="display:none">
                                    </label>
                                    <div class="form-hint" style="margin-top:6px;">Ảnh tối đa 5MB. Hỗ trợ JPG, PNG, WEBP.</div>
                                </div>
                            </div>
                        </div>

                        <!-- Cột phải -->
                        <div>
                            <div class="card mb-20">
                                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                                    <h3>Vị trí trên bản đồ *</h3>
                                    <button type="button" id="picker-locate" class="btn btn--ghost btn--sm">Vị trí của tôi</button>
                                </div>
                                <div class="card-body">
                                    <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:10px;">Bấm vào bản đồ để chọn vị trí</p>
                                    <div id="map-picker" style="height:280px;border-radius:10px;overflow:hidden;border:1.5px solid var(--border);"></div>
                                    <div class="form-row" style="margin-top:10px;">
                                        <div class="form-group" style="margin:0"><label>Vĩ độ</label><input type="text" id="input-lat" name="lat" class="form-control" value="${location?.lat || ""}" placeholder="10.7769" readonly required></div>
                                        <div class="form-group" style="margin:0"><label>Kinh độ</label><input type="text" id="input-lng" name="lng" class="form-control" value="${location?.lng || ""}" placeholder="106.7009" readonly required></div>
                                    </div>
                                </div>
                            </div>

                            <div class="card mb-20">
                                <div class="card-header"><h3>Chi tiết</h3></div>
                                <div class="card-body">
                                    <div class="form-group"><label>Địa chỉ</label><input type="text" id="input-address" name="address" class="form-control" value="${location?.address || ""}" placeholder="Tự động điền khi chọn trên bản đồ"></div>
                                    <div class="form-row">
                                        <div class="form-group"><label>Từ giờ</label><input type="text" name="timeFrom" class="form-control" value="${location?.timeFrom || ""}" placeholder="18:00"></div>
                                        <div class="form-group"><label>Đến giờ</label><input type="text" name="timeTo" class="form-control" value="${location?.timeTo || ""}" placeholder="22:00"></div>
                                    </div>
                                    <div class="form-group"><label>Số người</label><input type="number" name="peopleCount" class="form-control" value="${location?.peopleCount || 1}" min="1"></div>
                                </div>
                            </div>

                            <div class="card mb-20">
                                <div class="card-header"><h3>Mức độ khẩn cấp</h3></div>
                                <div class="card-body">
                                    ${urgency.map(u => `
                                        <label class="radio-card ${(location?.urgency || "normal") === u.value ? "checked" : ""}">
                                            <input type="radio" name="urgency" value="${u.value}" ${(location?.urgency || "normal") === u.value ? "checked" : ""} 
                                                   onchange="document.querySelectorAll('.radio-card').forEach(c=>c.classList.remove('checked'));this.closest('.radio-card').classList.add('checked')">
                                            <span class="radio-dot" style="background:${u.color}"></span>
                                            <span>${u.label}</span>
                                        </label>
                                    `).join("")}
                                </div>
                            </div>

                            <div style="display:flex;gap:12px;">
                                <button type="submit" class="btn btn--primary btn--lg" style="flex:1">${location ? "Lưu thay đổi" : "Thêm địa điểm"}</button>
                                <a href="/admin/dashboard" class="btn btn--ghost btn--lg">Hủy</a>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    `,

    // ---- ADMIN USERS (Founder only) ----
    "admin-users": ({ userData, users }) => `
        <div class="admin-layout">
            <aside class="admin-sidebar">${_adminNav("users", userData?.role)}</aside>
            <main class="admin-main">
                <div class="admin-topbar">
                    <div>
                        <h1>Quản lý người dùng</h1>
                        <p class="text-muted">${users.length} tài khoản trong hệ thống</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                        <h3>Danh sách thành viên</h3>
                        <input type="text" id="user-search" class="form-control" style="width:220px" placeholder="Tìm theo tên, email...">
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Người dùng</th>
                                    <th>Email</th>
                                    <th>Vai trò</th>
                                    <th>Điểm</th>
                                    <th>Hỗ trợ</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="users-tbody">
                                ${users.map(u => {
                                    const roleColor = u.role === "founder" ? "#7B2FBE" : u.role === "admin" ? "var(--accent)" : "var(--text-muted)";
                                    const roleLabel = u.role === "founder" ? "Người Sáng Lập" : u.role === "admin" ? "Người Dẫn Lửa" : "Thành viên";
                                    const av = u.photoURL 
                                        ? `<img src="${u.photoURL}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="">` 
                                        : `<div class="lb-avatar" style="width:32px;height:32px;font-size:.8rem;flex-shrink:0">${(u.fullName || "?").charAt(0).toUpperCase()}</div>`;

                                    return `
                                        <tr class="user-row" data-search="${(u.fullName || "") + " " + (u.email || "")}">
                                            <td>
                                                <div style="display:flex;align-items:center;gap:10px;">
                                                    ${av}
                                                    <div>
                                                        <div style="font-weight:600;font-size:.875rem">${u.fullName || "Ẩn danh"}</div>
                                                        <div style="font-size:.72rem;color:var(--text-muted)">${u.phone || ""}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="font-size:.82rem">${u.email || ""}</td>
                                            <td>
                                                <select class="form-control form-control--sm role-select" data-uid="${u.uid}" style="width:auto;padding:4px 8px;font-size:.78rem">
                                                    <option value="member" ${u.role === "member" ? "selected" : ""}>Thành viên</option>
                                                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>Người Dẫn Lửa</option>
                                                    <option value="founder" ${u.role === "founder" ? "selected" : ""}>Người Sáng Lập</option>
                                                </select>
                                            </td>
                                            <td style="font-weight:700;color:var(--accent)">${u.points || 0}</td>
                                            <td>${u.supportedLocations?.length || 0}</td>
                                            <td>
                                                <button class="btn btn--ghost btn--sm edit-user-btn" data-uid="${u.uid}" data-name="${u.fullName || ""}" data-email="${u.email || ""}" data-phone="${u.phone || ""}" data-points="${u.points || 0}">Sửa</button>
                                                <button class="btn btn--sm warn-user-btn" style="background:#F59E0B;color:white" data-uid="${u.uid}" data-name="${u.fullName || ""}">Cảnh báo</button>
                                                <button class="btn btn--danger btn--sm delete-user-btn" data-uid="${u.uid}" data-name="${u.fullName || ""}">Xóa</button>
                                            </td>
                                        </tr>`;
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>

        <!-- Edit user modal -->
        <div class="modal-backdrop" id="edit-user-modal" style="display:none">
            <div class="modal-box">
                <div class="modal-header">
                    <h3>Chỉnh sửa thành viên</h3>
                    <button class="modal-close" id="modal-close-btn">&times;</button>
                </div>
                <form id="edit-user-form">
                    <input type="hidden" name="uid" id="edit-uid">
                    <div class="form-group"><label>Họ và tên</label><input type="text" name="fullName" id="edit-fullname" class="form-control" required></div>
                    <div class="form-group"><label>Email</label><input type="email" name="email" id="edit-email" class="form-control" disabled style="opacity:.6"></div>
                    <div class="form-group"><label>Số điện thoại</label><input type="tel" name="phone" id="edit-phone" class="form-control"></div>
                    <div class="form-group"><label>Điểm hỗ trợ</label><input type="number" name="points" id="edit-points" class="form-control" min="0" placeholder="0"></div>
                    <div style="display:flex;gap:10px;margin-top:16px;">
                        <button type="submit" class="btn btn--primary" style="flex:1">Lưu</button>
                        <button type="button" class="btn btn--ghost" id="modal-cancel-btn">Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    `,

  // ── FORM ĐỀ XUẤT ĐỊA ĐIỂM (member) ──────────────────────
  "suggest-form": ({ userData, helpTypes, urgency }) => `
    <div class="container pt-120 pb-80" style="max-width:820px;">
      <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;">Đề xuất địa điểm cần hỗ trợ</h1>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:6px;">
          Đề xuất sẽ được admin xem xét và đưa lên bản đồ sau khi duyệt.
        </p>
      </div>

      <form id="suggest-form">
        <div class="form-2col">
          <div>
            <div class="card mb-20">
              <div class="card-header"><h3>Thông tin cơ bản</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label>Tiêu đề <span style="color:var(--accent)">*</span></label>
                  <input type="text" name="title" class="form-control" placeholder="Ví dụ: Cụ ông vô gia cư tại..." required>
                </div>
                <div class="form-group">
                  <label>Mô tả tình huống</label>
                  <textarea name="description" class="form-control" placeholder="Mô tả chi tiết về người cần giúp..."></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Số người <span style="color:var(--accent)">*</span></label>
                    <input type="number" name="peopleCount" class="form-control" value="1" min="1">
                  </div>
                  <div class="form-group">
                    <label>Mức độ khẩn</label>
                    <select name="urgency" class="form-control">
                      ${urgency.map(u => `<option value="${u.value}">${u.label}</option>`).join("")}
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>Từ giờ</label><input type="text" name="timeFrom" class="form-control" placeholder="18:00"></div>
                  <div class="form-group"><label>Đến giờ</label><input type="text" name="timeTo" class="form-control" placeholder="22:00"></div>
                </div>
              </div>
            </div>

            <div class="card mb-20">
              <div class="card-header"><h3>Loại hỗ trợ cần thiết</h3></div>
              <div class="card-body">
                <div class="help-types-grid">
                  ${helpTypes.map(ht => `
                    <label class="check-card">
                      <input type="checkbox" name="helpTypes" value="${ht.value}">
                      <span style="width:8px;height:8px;border-radius:50%;background:${ht.color};flex-shrink:0;"></span>
                      ${ht.label}
                    </label>`).join("")}
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h3>Ghi chú thêm</h3></div>
              <div class="card-body">
                <textarea name="note" class="form-control" placeholder="Thông tin bổ sung, lưu ý cho tình nguyện viên..."></textarea>
              </div>
            </div>
          </div>

          <div>
            <div class="card mb-20">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <h3>Vị trí trên bản đồ <span style="color:var(--accent)">*</span></h3>
                <button type="button" id="suggest-locate" class="btn btn--ghost btn--sm">Vị trí của tôi</button>
              </div>
              <div id="suggest-map" style="height:240px;"></div>
              <div class="card-body" style="padding-top:12px;">
                <div class="form-group" style="margin-bottom:0;">
                  <label>Địa chỉ</label>
                  <input type="text" name="address" id="suggest-address" class="form-control" placeholder="Tự động điền khi chọn trên bản đồ">
                </div>
              </div>
              <input type="hidden" id="suggest-lat" name="lat">
              <input type="hidden" id="suggest-lng" name="lng">
            </div>

            <div class="card">
              <div class="card-header"><h3>Ảnh địa điểm <span style="color:var(--accent)">*</span></h3></div>
              <div class="card-body">
                <img id="suggest-img-preview" style="display:none;width:100%;height:150px;object-fit:cover;border-radius:var(--radius);margin-bottom:12px;" alt="Preview">
                <label style="display:flex;align-items:center;gap:8px;padding:12px 16px;border:1.5px dashed var(--border);border-radius:var(--radius);cursor:pointer;font-size:.82rem;color:var(--text-muted);background:var(--bg2);"
                       onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Chọn ảnh từ thiết bị (bắt buộc)
                  <input type="file" id="suggest-img-input" accept="image/*" style="display:none">
                </label>
                <p style="font-size:.74rem;color:var(--text-muted);margin-top:8px;line-height:1.5;">
                  Ảnh phải thể hiện rõ địa điểm thực tế để admin có thể xác minh. Tối đa 5MB.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-top:20px;">
          <button type="submit" class="btn btn--primary btn--lg" style="flex:1">Gửi đề xuất</button>
          <a href="/home" class="btn btn--ghost btn--lg">Hủy</a>
        </div>
      </form>
    </div>`,

  // ── ADMIN: DANH SÁCH ĐỀ XUẤT ─────────────────────────────
  "admin-suggestions": ({ userData, pending, approved, rejected }) => `
    <div class="admin-layout">
      <aside class="admin-sidebar">${_adminNav("suggestions", userData?.role)}</aside>
      <main class="admin-main">
        <div class="admin-topbar">
          <div>
            <h1>Đề xuất địa điểm</h1>
            <p class="text-muted">Xem xét và duyệt đề xuất từ thành viên cộng đồng</p>
          </div>
        </div>

        <!-- Tabs -->
        <style>
          .sug-tab .sug-badge { background:#9CA3AF; color:white; font-size:.68rem; padding:1px 6px; border-radius:999px; margin-left:4px; }
          .sug-tab.active .sug-badge { background:var(--accent); }
        </style>
        <div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:0;">
          <button class="sug-tab active" data-tab="pending"
            style="padding:10px 18px;background:none;border:none;border-bottom:2px solid var(--accent);font-family:inherit;font-size:.875rem;font-weight:700;color:var(--accent);cursor:pointer;">
            Chờ duyệt <span class="sug-badge">${pending.length}</span>
          </button>
          <button class="sug-tab" data-tab="approved"
            style="padding:10px 18px;background:none;border:none;border-bottom:2px solid transparent;font-family:inherit;font-size:.875rem;font-weight:500;color:var(--text-muted);cursor:pointer;">
            Đã duyệt (${approved.length})
          </button>
          <button class="sug-tab" data-tab="rejected"
            style="padding:10px 18px;background:none;border:none;border-bottom:2px solid transparent;font-family:inherit;font-size:.875rem;font-weight:500;color:var(--text-muted);cursor:pointer;">
            Từ chối (${rejected.length})
          </button>
        </div>

        <div id="suggestions-wrap">
          <!-- Panel: Pending -->
          <div id="panel-pending" class="sug-panel">
            ${pending.length === 0
              ? `<div style="text-align:center;padding:48px;color:var(--text-muted);">
                  <div style="font-size:2.5rem;margin-bottom:12px;">📭</div>
                  <div style="font-weight:600;">Không có đề xuất nào đang chờ duyệt</div>
                </div>`
              : `<div style="display:grid;gap:16px;">
                  ${pending.map(s => _suggestionCard(s, "pending")).join("")}
                </div>`}
          </div>

          <!-- Panel: Approved -->
          <div id="panel-approved" class="sug-panel" style="display:none;">
            <div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
              <label class="text-muted" style="font-size:0.85rem;">Lọc theo ngày:</label>
              <input type="date" class="form-control filter-date" data-panel="approved" style="max-width:200px; padding:6px 12px; height:auto;">
            </div>
            ${approved.length === 0
              ? `<div style="text-align:center;padding:48px;color:var(--text-muted);">Chưa có đề xuất nào được duyệt.</div>`
              : `<div class="sug-list" style="display:grid;gap:16px;">${approved.map(s => _suggestionCard(s, "approved")).join("")}</div>`}
          </div>

          <!-- Panel: Rejected -->
          <div id="panel-rejected" class="sug-panel" style="display:none;">
            <div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
              <label class="text-muted" style="font-size:0.85rem;">Lọc theo ngày:</label>
              <input type="date" class="form-control filter-date" data-panel="rejected" style="max-width:200px; padding:6px 12px; height:auto;">
            </div>
            ${rejected.length === 0
              ? `<div style="text-align:center;padding:48px;color:var(--text-muted);">Chưa có đề xuất nào bị từ chối.</div>`
              : `<div class="sug-list" style="display:grid;gap:16px;">${rejected.map(s => _suggestionCard(s, "rejected")).join("")}</div>`}
          </div>
        </div>
      </main>
    </div>`,


};

// ── Helper: Suggestion card ──────────────────────────────
function _suggestionCard(s, status) {
  const URGENCY_LABEL = { normal: "Bình thường", urgent: "Khẩn cấp", critical: "Rất khẩn" };
  const urgencyColor = { normal: "#22C55E", urgent: "#EAB308", critical: "#EF4444" };
  const uc = urgencyColor[s.urgency] || "#22C55E";
  const time = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString("vi-VN") : "";
  const isoDate = s.createdAt?.toDate ? s.createdAt.toDate().toISOString().split("T")[0] : "";

  const actionBtns = status === "pending" ? `
    <button class="btn btn--sm btn-check-nearby" data-lat="${s.lat}" data-lng="${s.lng}" data-title="${s.title}" style="background:var(--bg2);color:var(--text1);border:1px solid var(--border);">Xem vị trí</button>
    <button class="btn btn--sm btn-approve" data-id="${s.id}" style="min-width:80px;background:#22C55E;color:white;border:none;">Duyệt</button>
    <button class="btn btn--sm btn-reject" data-id="${s.id}" data-title="${s.title}" data-uid="${s.submittedBy}" style="background:#EF4444;color:white;border:none;">Từ chối</button>
    <button class="btn btn--sm btn-sug-delete" data-id="${s.id}" style="background:var(--bg2);color:var(--text-muted);border:1px solid var(--border);">Xóa</button>
  ` : status === "rejected" ? `
    <button class="btn btn--sm btn-sug-delete" data-id="${s.id}" style="background:var(--bg2);color:var(--text-muted);border:1px solid var(--border);">Xóa</button>
  ` : "";

  return `
    <div class="card sug-row" data-id="${s.id}" data-date="${time}" data-isodate="${isoDate}" data-title="${encodeURIComponent(s.title || "")}" data-desc="${encodeURIComponent(s.description || "")}" style="overflow:hidden;">
      <div style="display:grid;grid-template-columns:${s.imageUrl ? "200px 1fr" : "1fr"};gap:0;">
        ${s.imageUrl ? `<img src="${s.imageUrl}" style="width:200px;height:100%;max-height:200px;object-fit:cover;cursor:pointer;" alt="" onclick="document.getElementById('global-img-view').src=this.src; document.getElementById('global-img-modal').style.display='flex';">` : ""}
        <div style="padding:18px 20px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;">
            <h3 style="font-size:1rem;margin:0;">${s.title}</h3>
            <span class="badge" style="background:${uc}20;color:${uc};flex-shrink:0;">${URGENCY_LABEL[s.urgency] || ""}</span>
          </div>
          <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px;">
            Đề xuất bởi: <a href="javascript:void(0)" class="view-user-info" data-uid="${s.submittedBy}" style="font-weight:600; text-decoration:underline;">${s.submitterName || "Ẩn danh"}</a> · ${time}
            ${s.address ? ` · 📍 ${s.address}` : ""}
          </div>
          ${s.description ? `<p style="font-size:.82rem;color:var(--text2);margin-bottom:10px;line-height:1.6;">${s.description.substring(0, 200)}${s.description.length > 200 ? "..." : ""}</p>` : ""}
          
          ${status === "pending" ? `<div id="ai-result-${s.id}" style="margin-bottom:10px; padding:10px; border-radius:8px; font-size:0.85rem; background:rgba(139,92,246,.08); border:1px solid rgba(139,92,246,.2); color:#7C3AED;">
            <span class="spinner"></span> Đang chờ AI phân tích tự động...
          </div>` : ""}

          ${status === "rejected" && s.rejectedReason ? `
            <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:var(--radius);padding:8px 12px;margin-bottom:10px;font-size:.78rem;color:#DC2626;">
              Lý do từ chối: ${s.rejectedReason}
            </div>` : ""}
          ${status === "approved" ? `
            <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:var(--radius);padding:6px 12px;margin-bottom:10px;font-size:.78rem;color:#16A34A;">
              ✅ Đã được duyệt và thêm lên bản đồ
            </div>` : ""}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
            ${actionBtns}
          </div>
        </div>
      </div>
    </div>`;
}

// Hàm hỗ trợ Admin Navigation
function _adminNav(active, role = "admin") {
    const isFounder = role === "founder";
    
    const items = [
        { id: "dashboard", href: "/admin/dashboard", label: "Bảng điều khiển", icon: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>` },
        { id: "new", href: "/admin/locations/new", label: "Thêm địa điểm", icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>` },
        { id: "suggestions", href: "/admin/suggestions", label: "Đề xuất", icon: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>` },

        ...(isFounder ? [{ id: "users", href: "/admin/users", label: "Quản lý người dùng", icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` }] : []),
        { id: "home-link", href: "/home", label: "Xem bản đồ", icon: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>` },
        { id: "profile-link", href: "/profile", label: "Hồ sơ", icon: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>` },
    ];

    const navLabel = isFounder ? "Người Sáng Lập" : "Người Dẫn Lửa";

    return `<div class="admin-nav-label">${navLabel}</div>` + 
           items.map(item => `
               <a href="${item.href}" class="admin-nav-item ${active === item.id ? "active" : ""}">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.icon}</svg>
                   ${item.label}
               </a>
           `).join("");
}
