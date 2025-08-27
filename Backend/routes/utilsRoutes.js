// routes/utilsRoutes.js
const express = require("express");
const { exec } = require("child_process");

const router = express.Router();

// Kill process on port 5000
router.get("/kill5000", (req, res) => {
    exec("fuser -k 5000/tcp", (err, stdout, stderr) => {
        if (err) {
            console.error("❌ Error killing port 5000:", stderr);
            return res.status(500).send("Failed to kill port 5000");
        }
        console.log("✅ Killed process on port 5000");
        res.send("Killed process on port 5000");
    });
});

module.exports = router;
