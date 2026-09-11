const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Database
const db = new Database("team.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Available',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Add sample members only if database is empty
const count = db.prepare("SELECT COUNT(*) AS count FROM team_members").get();

if (count.count === 0) {
    const insert = db.prepare(`
        INSERT INTO team_members (name, role, status)
        VALUES (?, ?, ?)
    `);

    const members = [
        ["Tanuja", "Frontend Developer", "Available"],
        ["Arjun", "Backend Developer", "Busy"],
        ["Priya", "UI/UX Designer", "Available"],
        ["Rahul", "QA Engineer", "Away"],
        ["Sneha", "Project Manager", "Available"],
        ["Kiran", "Full Stack Developer", "Busy"]
    ];

    members.forEach(member => insert.run(...member));
}

// Get all team members
app.get("/api/team", (req, res) => {
    const members = db.prepare(`
        SELECT * FROM team_members
        ORDER BY id
    `).all();

    res.json(members);
});

// Update member status
app.put("/api/team/:id/status", (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = ["Available", "Busy", "Away"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            error: "Invalid status"
        });
    }

    const result = db.prepare(`
        UPDATE team_members
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(status, id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Team member not found"
        });
    }

    const member = db.prepare(`
        SELECT * FROM team_members WHERE id = ?
    `).get(id);

    res.json(member);
});

// Add a new team member
app.post("/api/team", (req, res) => {
    const { name, role } = req.body;

    if (!name || !role) {
        return res.status(400).json({
            error: "Name and role are required"
        });
    }

    const result = db.prepare(`
        INSERT INTO team_members (name, role, status)
        VALUES (?, ?, 'Available')
    `).run(name, role);

    const member = db.prepare(`
        SELECT * FROM team_members WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(member);
});

// Delete a team member
app.delete("/api/team/:id", (req, res) => {
    const id = Number(req.params.id);

    const result = db.prepare(`
        DELETE FROM team_members WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Team member not found"
        });
    }

    res.json({
        message: "Team member deleted"
    });
});

// Frontend fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Team Availability Tracker running at http://localhost:${PORT}`);
});