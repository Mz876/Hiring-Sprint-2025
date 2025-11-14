const express = require("express");
const multer = require("multer");
const analyzeController = require("../controllers/analyze.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/analyze
 * form-data:
 *  - pickup: image
 *  - returned: image
 */
router.post(
  "/",
  upload.fields([
    { name: "pickup", maxCount: 1 },
    { name: "returned", maxCount: 1 }
  ]),
  analyzeController.analyzePickupAndReturn
);

module.exports = router;
 