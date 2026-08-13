// models/LocationModel.js
import { db, storage } from "./firebase.js";

import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ===== CONSTANTS =====
export const HELP_TYPES = [
  { value: "food", label: "Thực phẩm", color: "#F97316" },
  { value: "clothes", label: "Quần áo", color: "#8B5CF6" },
  { value: "money", label: "Tiền mặt", color: "#10B981" },
  { value: "medical", label: "Y tế", color: "#EF4444" },
  { value: "shelter", label: "Chỗ ở", color: "#3B82F6" },
  { value: "other", label: "Khác", color: "#6B7280" },
];

export const URGENCY = [
  { value: "normal", label: "Bình thường", color: "#22C55E" },
  { value: "urgent", label: "Khẩn cấp", color: "#EAB308" },
  { value: "critical", label: "Rất khẩn", color: "#EF4444" },
];

// ===== HELPER: upload ảnh =====
async function uploadLocationImage(file) {
  if (!file) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `locations/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, fileName);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg"
  });

  return await getDownloadURL(storageRef);
}

// ===== MODEL =====
export const LocationModel = {

  // CREATE
  async create(data, imageFile = null) {
    let imageUrl = data.imageUrl || null;

    if (imageFile) {
      imageUrl = await uploadLocationImage(imageFile);
    }

    const location = {
      title: data.title,
      description: data.description || "",
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      address: data.address || "",
      helpTypes: data.helpTypes || [],
      urgency: data.urgency || "normal",
      peopleCount: parseInt(data.peopleCount) || 1,
      timeFrom: data.timeFrom || "",
      timeTo: data.timeTo || "",
      note: data.note || "",
      imageUrl,

      isActive: true,
      supportCount: 0,
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "locations"), location);
    return { id: docRef.id, ...location };
  },

  // GET ALL
  async findAll(onlyActive = true) {
    const q = query(collection(db, "locations"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return onlyActive ? all.filter(l => l.isActive !== false) : all;
  },

  // GET BY ID
  async findById(id) {
    const snap = await getDoc(doc(db, "locations", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // UPDATE
  async update(id, data, imageFile = null) {
    let imageUrl = data.imageUrl || data.existingImageUrl || null;

    if (imageFile) {
      imageUrl = await uploadLocationImage(imageFile);
    }

    const updateData = {
      title: data.title,
      description: data.description || "",
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      address: data.address || "",
      helpTypes: data.helpTypes || [],
      urgency: data.urgency || "normal",
      peopleCount: parseInt(data.peopleCount) || 1,
      timeFrom: data.timeFrom || "",
      timeTo: data.timeTo || "",
      note: data.note || "",
      imageUrl,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "locations", id), updateData);
    return { id, ...updateData };
  },

  // DELETE
  async delete(id) {
    // Lấy imageUrl trước khi xóa doc
    const snap = await getDoc(doc(db, "locations", id));
    if (snap.exists()) {
      const imageUrl = snap.data().imageUrl;
      // Xóa ảnh trên Storage nếu có
      if (imageUrl && imageUrl.includes("firebasestorage")) {
        try {
          // Lấy path từ URL (dạng: .../o/locations%2Fxxx.jpg?...)
          const path = decodeURIComponent(
            imageUrl.split("/o/")[1].split("?")[0]
          );
          await deleteObject(ref(storage, path));
        } catch(e) {
          // Không throw — ảnh không xóa được thì vẫn xóa doc
          console.warn("Không thể xóa ảnh Storage:", e.message);
        }
      }
    }
    await deleteDoc(doc(db, "locations", id));
  },

  // TOGGLE ACTIVE
  async toggleActive(id, isActive) {
    await updateDoc(doc(db, "locations", id), {
      isActive,
      updatedAt: serverTimestamp()
    });
  },

  // SUPPORT COUNT
  async incrementSupport(id) {
    const snap = await getDoc(doc(db, "locations", id));
    if (!snap.exists()) return;

    await updateDoc(doc(db, "locations", id), {
      supportCount: (snap.data().supportCount || 0) + 1
    });
  },

  // DISTANCE
  haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toR = d => d * Math.PI / 180;
    const dLat = toR(lat2 - lat1);
    const dLng = toR(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toR(lat1)) *
      Math.cos(toR(lat2)) *
      Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};
