const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const { addClinicNotes, getLatestClinicNotes, updateClinicNotes, getClinicNotes } = require("../controllers/clinicController");

const router = express.Router();

router.post("/", authenticate, authorizeRoles("DOCTOR", "ADMIN"), addClinicNotes);
router.get("/:employeeId", authenticate, authorizeRoles("DOCTOR", "ADMIN", "TECHNICIAN"), getClinicNotes);
router.get("/latest/:employeeId", authenticate, authorizeRoles("DOCTOR", "ADMIN", "TECHNICIAN"), getLatestClinicNotes);
router.put("/:id", authenticate, authorizeRoles("DOCTOR", "ADMIN"), updateClinicNotes);

module.exports = router;