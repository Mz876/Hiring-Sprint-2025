const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load OpenAPI spec from openapi.yaml at backend root
const openapiDocument = YAML.load(path.join(__dirname, "..", "docs", "openapi.yaml"));

// Swagger UI - must be before 404
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// All API routes under /api
app.use("/api", routes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
