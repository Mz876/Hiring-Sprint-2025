const express = require("express");
const multer = require("multer");
const analyzeController = require("../controllers/analyze.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/analyze
// form-data:
//  - pickup: up to 6 images
//  - returned: up to 6 images
router.post(
  "/",
  upload.fields([
    { name: "pickup", maxCount: 6 },
    { name: "returned", maxCount: 6 },
  ]),
  analyzeController.analyzePickupAndReturn
);

module.exports = router;
