const express = require("express");
const { Pool } = require("pg");

const app = express();

// Neon用（Renderの環境変数を読む）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ===== ミドルウェア =====
app.use(express.json());
app.use(express.static("public"));

// ===== DB初期化 =====
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      userid TEXT,
      date TIMESTAMP,
      purpose TEXT,
      success BOOLEAN
    )
  `);
})();

// ===== 記録追加 =====
const allowedPurposes = ["SNS", "調べ物", "連絡"];

app.post("/log", async (req, res) => {
  const { userId, purpose, success } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userIdがありません" });
  }
  if (!allowedPurposes.includes(purpose)) {
    return res.status(400).json({ message: "不正な目的です" });
  }

  try {
    await pool.query(
      `INSERT INTO logs (userid, date, purpose, success)
       VALUES ($1, NOW(), $2, $3)`,
      [userId, purpose, success]
    );
    res.json({ message: "記録しました" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DBエラー" });
  }
});

// ===== 履歴取得 =====
app.get("/logs/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM logs WHERE userid = $1 ORDER BY id DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// ===== サーバ起動 =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
