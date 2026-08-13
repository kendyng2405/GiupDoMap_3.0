import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Moderation & Summarization API Endpoint
app.post("/api/moderate", async (req, res) => {
  try {
    const { text, context, title } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Vui lòng cung cấp nội dung cần kiểm duyệt." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Chưa cấu hình GEMINI_API_KEY trong hệ thống.",
      });
    }

    const prompt = `Bạn là Trợ lý Kiểm duyệt & Tóm tắt Nội dung cấp cao cho "Dự án Trái Tim Việt" - một dự án thiện nguyện, từ thiện và hỗ trợ cộng đồng tại Việt Nam.

Nhiệm vụ của bạn:
1. Đánh giá kỹ lưỡng xem đoạn mô tả/bài viết sau có chứa nội dung PHẢN CẢM, thô tục, công kích thù hận, xúc phạm cá nhân/tổ chức, thông tin sai lệch, quảng cáo cờ bạc/vay nóng/spam, hay các yếu tố vi phạm văn hóa và pháp luật Việt Nam không.
2. Xác định điểm an toàn (0 đến 100), trong đó 100 là hoàn toàn lành mạnh và phù hợp.
3. Tạo EXACTLY 3 GẠCH ĐẦU DÒNG TÓM TẮT nội dung bài viết bằng tiếng Việt rõ ràng, cô đọng.
4. Đưa ra khuyến nghị kiểm duyệt (Cho phép đăng / Sửa đổi trước khi đăng / Từ chối đăng) và giải thích lý do cụ thể.

Thông tin bài viết cần kiểm duyệt:
${title ? `Tiêu đề: ${title}\n` : ''}${context ? `Thể loại: ${context}\n` : ''}Nội dung:
"${text.trim()}"

Trả về kết quả chuẩn theo định dạng JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `Bạn là chuyên viên kiểm duyệt nội dung của Dự án Trái Tim Việt. Bạn đánh giá khách quan, chính xác theo tiêu chuẩn cộng đồng nhân đạo, văn minh, tôn trọng người đọc. Bạn luôn trả về đúng 3 gạch đầu dòng tóm tắt.`,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: {
              type: Type.BOOLEAN,
              description: "True nếu an toàn, False nếu chứa nội dung phản cảm/vi phạm",
            },
            statusText: {
              type: Type.STRING,
              description: "'Phù hợp', 'Cần xem xét', hoặc 'Phản cảm / Vi phạm'",
            },
            overallScore: {
              type: Type.INTEGER,
              description: "Thang điểm an toàn từ 0 đến 100",
            },
            flags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Loại vi phạm" },
                  severity: { type: Type.STRING, description: "'Thấp', 'Trung bình', hoặc 'Cao'" },
                  detail: { type: Type.STRING, description: "Mô tả chi tiết vi phạm" },
                },
                required: ["category", "severity", "detail"],
              },
            },
            summaryBullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Chính xác 3 gạch đầu dòng tóm tắt nội dung bài viết",
            },
            recommendation: {
              type: Type.STRING,
              description: "'Cho phép đăng', 'Sửa đổi trước khi đăng', hoặc 'Từ chối đăng'",
            },
            reasoning: {
              type: Type.STRING,
              description: "Giải thích lý do kiểm duyệt chi tiết bằng tiếng Việt",
            },
            suggestedEdit: {
              type: Type.STRING,
              description: "Gợi ý bản viết lại sạch sẽ nếu bài viết có lỗi nhỏ (không bắt buộc)",
            },
            tone: {
              type: Type.STRING,
              description: "Sắc thái tình cảm của văn bản (ví dụ: Ấm áp, Cảnh báo, Công kích, Spam)",
            },
          },
          required: [
            "isSafe",
            "statusText",
            "overallScore",
            "flags",
            "summaryBullets",
            "recommendation",
            "reasoning",
            "tone",
          ],
        },
      },
    });

    const responseText = response.text || "{}";
    const result = JSON.parse(responseText);

    // Ensure 3 bullets guarantee
    if (!result.summaryBullets || !Array.isArray(result.summaryBullets) || result.summaryBullets.length === 0) {
      result.summaryBullets = [
        "Nội dung bài viết về các hoạt động thuộc Dự án Trái Tim Việt.",
        "Đã được phân tích qua hệ thống AI kiểm duyệt tự động.",
        "Cần ban quản trị kiểm tra lại tiêu chuẩn cộng đồng trước khi duyệt."
      ];
    } else if (result.summaryBullets.length < 3) {
      while (result.summaryBullets.length < 3) {
        result.summaryBullets.push("Nội dung đáp ứng quy định thông tin của Dự án Trái Tim Việt.");
      }
    } else if (result.summaryBullets.length > 3) {
      result.summaryBullets = result.summaryBullets.slice(0, 3);
    }

    result.processedAt = new Date().toLocaleString("vi-VN");

    return res.json(result);
  } catch (error: any) {
    console.error("Gemini Moderation Error:", error);
    return res.status(500).json({
      error: "Không thể xử lý kiểm duyệt lúc này. " + (error?.message || "Lỗi kết nối Gemini AI."),
    });
  }
});

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Trái Tim Việt Moderation AI" });
});

// Vite server setup for development or production static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, we serve the main app and the ai-moderator React app
    const mainAppPath = path.join(process.cwd(), "..", "public_html");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve the main app at the root
    app.use(express.static(mainAppPath));
    
    // Serve ai-moderator at /ai-moderator
    app.use("/ai-moderator", express.static(distPath));
    app.get("/ai-moderator/*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    // Fallback for main app SPA
    app.get("*", (_req, res) => {
      res.sendFile(path.join(mainAppPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Trái Tim Việt AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
