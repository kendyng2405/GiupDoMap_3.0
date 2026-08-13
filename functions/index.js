// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
admin.initializeApp();

// Lưu ý: Cần set GEMINI_API_KEY trong environment variables của Cloud Run / Firebase Functions
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dùng 1.5-flash vì ổn định hơn với Node.js SDK cũ

exports.moderateSuggestion = onDocumentCreated("suggestions/{suggestionId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const description = data.description || data.note;

  if (!description) return;

  try {
    const prompt = `Bạn là một trợ lý kiểm duyệt nội dung cho dự án Trái Tim Việt. Hãy đọc đoạn mô tả sau, đánh giá xem có chứa nội dung phản cảm không, và tóm tắt lại thành 3 gạch đầu dòng.
Nội dung: ${description}

Trình bày kết quả bằng định dạng JSON có 2 trường:
{
  "isAppropriate": boolean, (true nếu nội dung bình thường, false nếu phản cảm, spam hoặc chửi bậy)
  "summary": string (đoạn tóm tắt 3 gạch đầu dòng)
}`;

    const result = await aiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    });

    const aiResult = JSON.parse(result.response.text());

    // Cập nhật lại bản ghi trên Firestore với kết quả kiểm duyệt của AI
    await snapshot.ref.update({
      aiModeration: {
        isAppropriate: aiResult.isAppropriate,
        summary: aiResult.summary,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    console.log(`[Gemini] Đã kiểm duyệt thành công suggestion ${snapshot.id}`);

  } catch (error) {
    console.error(`[Gemini] Lỗi kiểm duyệt suggestion ${snapshot.id}:`, error);
  }
});

exports.deleteUser = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Xác thực Firebase ID Token
      const authHeader = req.headers.authorization || "";
      const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!idToken) {
        res.status(401).json({ error: "Chưa đăng nhập." });
        return;
      }

      const decoded = await admin.auth().verifyIdToken(idToken);
      const callerUid = decoded.uid;

      // Kiểm tra quyền founder
      const callerDoc = await admin.firestore().doc(`users/${callerUid}`).get();
      if (callerDoc.data()?.role !== "founder") {
        res.status(403).json({ error: "Chỉ founder mới có quyền xóa tài khoản." });
        return;
      }

      // Validate uid cần xóa
      const { uid } = req.body;
      if (!uid || typeof uid !== "string") {
        res.status(400).json({ error: "Thiếu uid." });
        return;
      }
      if (uid === callerUid) {
        res.status(400).json({ error: "Không thể xóa chính mình." });
        return;
      }

      // Xóa Auth + Firestore
      await Promise.all([
        admin.auth().deleteUser(uid),
        admin.firestore().doc(`users/${uid}`).delete(),
      ]);

      res.status(200).json({ success: true });

    } catch (err) {
      console.error("deleteUser error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);
