const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All API routes under /api
app.use("/api", routes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
