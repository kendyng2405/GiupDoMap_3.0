// models/UserModel.js — Model: User data & rank logic
import { db, auth, storage } from "./firebase.js";
import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, orderBy, limit, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


export const RANKS = [
  { name: "Đồng Lòng",     minPoints: 0,  color: "#CD7F32", next: 5  },
  { name: "Tấm Lòng Bạc",  minPoints: 5,  color: "#A8B8C8", next: 15 },
  { name: "Vàng Tâm",      minPoints: 15, color: "#FFD700", next: 30 },
  { name: "Trái Tim Vàng", minPoints: 30, color: "#FF8C00", next: null },
];

export function getRankByPoints(points) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (points >= r.minPoints) rank = r;
  }
  const idx = RANKS.indexOf(rank);
  const next = RANKS[idx + 1] || null;
  const progress = next
    ? Math.min(100, Math.round(((points - rank.minPoints) / (next.minPoints - rank.minPoints)) * 100))
    : 100;
  return { ...rank, idx, next, progress, pointsToNext: next ? next.minPoints - points : 0 };
}

export const UserModel = {
  async create(uid, data) {
    const user = {
      uid, email: data.email, fullName: data.fullName,
      phone: data.phone || "", role: "member",
      points: 0, supportedLocations: [],
      photoURL: null,
      agreedToPolicy: data.agreedToPolicy, // true for email auth, false for new Google auth
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), user);
    return user;
  },

  async findById(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { uid: snap.id, ...data, rank: getRankByPoints(data.points || 0) };
  },

  async update(uid, data) {
    // Lọc bỏ undefined, xử lý points riêng
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v;
    }
    // Đảm bảo points là số nguyên nếu có
    if (clean.points !== undefined) {
      clean.points = Math.max(0, parseInt(clean.points) || 0);
    }
    await updateDoc(doc(db, "users", uid), { ...clean, updatedAt: new Date().toISOString() });
  },

  async addSupportedLocation(uid, locationId) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const user = snap.data();
    const supported = user.supportedLocations || [];
    if (supported.includes(locationId)) return { alreadySupported: true };
    const newPoints = (user.points || 0) + 1;
    await updateDoc(doc(db, "users", uid), {
      supportedLocations: [...supported, locationId],
      points: newPoints,
      updatedAt: new Date().toISOString(),
    });
    return { points: newPoints, rank: getRankByPoints(newPoints) };
  },

  async getLeaderboard(n = 10) {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(n));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return { uid: d.id, ...data, rank: getRankByPoints(data.points || 0) };
    });
  },

  async getAll() {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => {
      const data = d.data();
      return { uid: d.id, ...data, rank: getRankByPoints(data.points || 0) };
    });
  },

  async updateProfile(uid, { fullName, phone }) {
    await updateDoc(doc(db, "users", uid), { fullName, phone, updatedAt: new Date().toISOString() });
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: fullName });
  },

  // FIX: dùng verifyBeforeUpdateEmail thay vì updateEmail (Firebase v10+)
  // Yêu cầu reauthenticate trước
  async changeEmail(currentPassword, newEmail) {
    const user = auth.currentUser;
    if (!user) throw new Error("Chưa đăng nhập");
    // Reauthenticate
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    // Gửi email xác thực tới địa chỉ mới (email chỉ đổi sau khi user click link)
    await verifyBeforeUpdateEmail(user, newEmail);
  },

  async sendPasswordReset(email) {
    await sendPasswordResetEmail(auth, email);
  },

  // Upload ảnh đại diện
  async uploadAvatar(uid, file) {
    const ext = file.name.split(".").pop();
    const storageRef = ref(storage, `avatars/${uid}.${ext}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    // Cập nhật Firestore + Firebase Auth profile
    await updateDoc(doc(db, "users", uid), { photoURL: url, updatedAt: new Date().toISOString() });
    if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
    return url;
  },

  // FIX #8: Gọi Cloud Function để xóa cả Auth account lẫn Firestore doc
  // (Client SDK không thể xóa Auth account của người khác)
  async deleteUser(uid) {
    const user = auth.currentUser;
    if (!user) throw new Error("Chưa đăng nhập.");
    const idToken = await user.getIdToken();
    const res = await fetch(
      "https://us-central1-kdhelpmap.cloudfunctions.net/deleteUser",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi xóa người dùng.");
  },

  // Founder: update role
  async setRole(uid, role) {
    await updateDoc(doc(db, "users", uid), { role, updatedAt: new Date().toISOString() });
  },
};
