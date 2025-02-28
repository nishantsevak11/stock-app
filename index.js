const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const app = express();

// Middleware
app.use(cors());
app.use(express.static("frontend"));
app.use(express.json());

// Cache for storing processed data
const cache = {
    stockData: [],
    indices: null,
    indexData: {},
    lastUpdated: null,
};

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
});

// Function to parse date from different formats
function parseDate(dateStr) {
    let date = new Date(dateStr);

    // If invalid, try parsing DD-MM-YYYY format
    if (isNaN(date.getTime())) {
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
            date = new Date(parts[2], parts[1] - 1, parts[0]); // Assuming DD-MM-YYYY format
        }
    }

    // Return formatted date or null if invalid
    if (isNaN(date.getTime())) {
        console.error(`Invalid date format: ${dateStr}`);
        return null;
    }

    return date.toISOString().split("T")[0];
}

// Function to load and process CSV data
async function loadCSVData() {
    try {
        const data = [];
        const filePath = path.join(__dirname, "dump.csv");

        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .on("error", (error) => {
                    console.error("Error reading CSV file:", error);
                    reject(error);
                })
                .pipe(csv())
                .on("data", (row) => {
                    data.push({
                        ...row,
                        closing_index_value: parseFloat(row.closing_index_value),
                        index_date: parseDate(row.index_date),
                    });
                })
                .on("end", () => {
                    data.sort((a, b) => new Date(a.index_date) - new Date(b.index_date));

                    cache.stockData = data;
                    cache.lastUpdated = new Date();
                    cache.indices = null; // Reset cache
                    cache.indexData = {};

                    console.log("CSV file successfully processed");
                    resolve(data);
                })
                .on("error", (error) => {
                    console.error("Error processing CSV:", error);
                    reject(error);
                });
        });
    } catch (error) {
        console.error("Failed to load CSV data:", error);
        process.exit(1);
    }
}

// Initialize data on startup
loadCSVData().catch((err) => {
    console.error("Failed to load initial data:", err);
    process.exit(1);
});

// Watch for changes in CSV file and reload data
fs.watch("dump.csv", (eventType) => {
    if (eventType === "change") {
        console.log("CSV file changed, reloading data...");
        loadCSVData().catch((err) => console.error("Failed to reload data:", err));
    }
});

// Routes

// Get all indices
app.get("/api/indices", (req, res) => {
    try {
        if (!cache.indices) {
            cache.indices = [...new Set(cache.stockData.map((item) => item.index_name))].sort();
        }
        res.json(cache.indices);
    } catch (error) {
        console.error("Error fetching indices:", error);
        res.status(500).json({ error: "Failed to fetch indices" });
    }
});

// Get data for a specific index
app.get("/api/data/:index", (req, res) => {
    try {
        const index = req.params.index;

        // Check cache first
        if (cache.indexData[index]) {
            return res.json(cache.indexData[index]);
        }

        const indexData = cache.stockData.filter((item) => item.index_name === index);

        if (indexData.length === 0) {
            return res.status(404).json({ error: "Index not found" });
        }

        // Cache the filtered data
        cache.indexData[index] = indexData;
        res.json(indexData);
    } catch (error) {
        console.error("Error fetching index data:", error);
        res.status(500).json({ error: "Failed to fetch index data" });
    }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        lastDataUpdate: cache.lastUpdated,
        dataCount: cache.stockData.length,
        indicesCount: cache.indices?.length || 0,
    });
});

// Serve frontend index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});
