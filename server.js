const express = require("express");
const { Pool } = require("pg");

const app = express();

/* ===============================
   PostgreSQL（Supabase）接続
================================ */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/* ===============================
   ミドルウェア
================================ */
app.use(express.json());
app.use(express.static("public"));

/* ===============================
   記録追加 API
================================ */
const allowedPurposes = ["SNS", "調べ物", "連絡"];

app.post("/log", async (req, res) => {
  const { userId, purpose, success } = req.body;

  // バリデーション
  if (!userId) {
    return res.status(400).json({ message: "userIdがありません" });
  }

  if (!allowedPurposes.includes(purpose)) {
    return res.status(400).json({ message: "不正な目的です" });
  }

  if (typeof success !== "boolean") {
    return res.status(400).json({ message: "successが不正です" });
  }

  try {
    await pool.query(
      `
      INSERT INTO logs (user_id, purpose, success)
      VALUES ($1, $2, $3)
      `,
      [userId, purpose, success]
    );

    res.json({ message: "記録しました" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "保存に失敗しました" });
  }
});

/* ===============================
   履歴取得 API
================================ */
app.get("/logs/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      `
      SELECT user_id AS "userId",
             created_at AS date,
             purpose,
             success
      FROM logs
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* ===============================
   サーバ起動
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
