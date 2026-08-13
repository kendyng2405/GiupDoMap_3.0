// models/SuggestionModel.js — Đề xuất địa điểm từ user
import { db, storage } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

export const SuggestionModel = {

  async create(data, imageFile = null) {
    let imageUrl = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const fileName = `suggestions/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, imageFile, { contentType: imageFile.type || "image/jpeg" });
      imageUrl = await getDownloadURL(storageRef);
    }

    const payload = {
      title:       data.title || "",
      description: data.description || "",
      lat:         parseFloat(data.lat),
      lng:         parseFloat(data.lng),
      address:     data.address || "",
      helpTypes:   data.helpTypes || [],
      urgency:     data.urgency || "normal",
      peopleCount: parseInt(data.peopleCount) || 1,
      timeFrom:    data.timeFrom || "",
      timeTo:      data.timeTo || "",
      note:        data.note || "",
      imageUrl,
      status:      "pending",   // pending | approved | rejected
      submittedBy: data.submittedBy,
      submitterName: data.submitterName || "Ẩn danh",
      rejectedReason: "",
      createdAt:   serverTimestamp(),
      reviewedAt:  null,
      reviewedBy:  null,
    };

    const docRef = await addDoc(collection(db, "suggestions"), payload);
    return { id: docRef.id, ...payload };
  },

  async findAll(status = null) {
    const q = query(collection(db, "suggestions"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return status ? all.filter(s => s.status === status) : all;
  },

  async findById(id) {
    const snap = await getDoc(doc(db, "suggestions", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async findByUser(uid) {
    const q = query(
      collection(db, "suggestions"),
      where("submittedBy", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async approve(id, reviewerUid) {
    await updateDoc(doc(db, "suggestions", id), {
      status:      "approved",
      reviewedAt:  serverTimestamp(),
      reviewedBy:  reviewerUid,
    });
  },

  async reject(id, reviewerUid, reason) {
    await updateDoc(doc(db, "suggestions", id), {
      status:         "rejected",
      rejectedReason: reason || "",
      reviewedAt:     serverTimestamp(),
      reviewedBy:     reviewerUid,
    });
  },

  async delete(id) {
    const snap = await getDoc(doc(db, "suggestions", id));
    if (snap.exists() && snap.data().imageUrl) {
      try {
        const path = decodeURIComponent(snap.data().imageUrl.split("/o/")[1].split("?")[0]);
        await deleteObject(ref(storage, path));
      } catch(e) { console.warn("Không xóa được ảnh suggestion:", e.message); }
    }
    await deleteDoc(doc(db, "suggestions", id));
  },

  async updateAiResult(id, aiResult) {
    await updateDoc(doc(db, "suggestions", id), {
      aiResult: aiResult,
    });
  }
};
