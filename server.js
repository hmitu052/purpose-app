const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("logs.db");

// ===== DB初期化 =====
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      date TEXT,
      purpose TEXT,
      success INTEGER
    )
  `);
});

// ===== ミドルウェア =====
app.use(express.json());
app.use(express.static("public"));

// ===== 記録追加 =====
const allowedPurposes = ["SNS", "調べ物", "連絡"];

app.post("/log", (req, res) => {
  const { userId, purpose, success } = req.body;

  if (!userId) {
    res.status(400).json({ message: "userIdがありません" });
    return;
  }

  if (!allowedPurposes.includes(purpose)) {
    res.status(400).json({ message: "不正な目的です" });
    return;
  }

  const date = new Date().toISOString();

  db.run(
    `INSERT INTO logs (userId, date, purpose, success)
     VALUES (?, ?, ?, ?)`,
    [userId, date, purpose, success ? 1 : 0],
    (err) => {
      if (err) {
        res.status(500).json({ message: "保存に失敗しました" });
        return;
      }
      res.json({ message: "記録しました" });
    }
  );
});

// ===== ユーザーごとの履歴取得 =====
app.get("/logs/:userId", (req, res) => {
  const userId = req.params.userId;

  db.all(
    `SELECT * FROM logs WHERE userId = ? ORDER BY id DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json([]);
        return;
      }

      const logs = rows.map(row => ({
        userId: row.userId,
        date: row.date,
        purpose: row.purpose,
        success: row.success === 1
      }));

      res.json(logs);
    }
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
