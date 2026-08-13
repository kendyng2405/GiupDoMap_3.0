// models/NotificationModel.js — Hệ thống thông báo
import { db } from "./firebase.js";
import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const NotificationModel = {

  // Tạo thông báo cho 1 user cụ thể
  async create({ toUid, type, title, body, link = "" }) {
    const payload = {
      toUid, type, title, body, link,
      read:      false,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, "notifications"), payload);
    return { id: ref.id, ...payload };
  },

  // Tạo thông báo cho nhiều uid cùng lúc (admin/founder)
  async createForMany(uids, { type, title, body, link = "" }) {
    const batch = writeBatch(db);
    uids.forEach(uid => {
      const ref = doc(collection(db, "notifications"));
      batch.set(ref, { toUid: uid, type, title, body, link, read: false, createdAt: serverTimestamp() });
    });
    await batch.commit();
  },

  // Lấy thông báo của 1 user
  async getForUser(uid, n = 30) {
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(n)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Đếm unread
  async countUnread(uid) {
    const all = await this.getForUser(uid, 50);
    return all.filter(n => !n.read).length;
  },

  // Đánh dấu đã đọc
  async markRead(notifId) {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  },

  // Đánh dấu tất cả đã đọc
  async markAllRead(uid) {
    const notifs = await this.getForUser(uid, 50);
    const batch  = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  },

  async delete(id) {
    await deleteDoc(doc(db, "notifications", id));
  },
};
