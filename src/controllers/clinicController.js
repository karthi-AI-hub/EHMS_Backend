const db = require("../config/sequelize");

const addClinicNotes = async (req, res) => {
    const { employeeId, notes_name } = req.body;
    const created_by = req.user.employeeId;

    try {
        const notes = await db.employee_clinicnotes.create({
            employee_id: employeeId,
            notes_name,
            created_by,
        });
        res.status(201).json(notes);
    } catch (error) {
        console.error("Error adding clini notes :", error);
        res.status(500).json({ message: "Failed to add clinic notes." });
    }
};

const getClinicNotes = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const notes = await db.employee_clinicnotes.findAll({
            where: { employee_id: employeeId },
        });
        res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching clinic notes:", error);
        res.status(500).json({ message: "Failed to fetch clinic notes." });
    }
};

const updateClinicNotes = async (req, res) => {
    const { id } = req.params;
    const { notes_name } = req.body;
    const updated_by = req.user.employeeId;

    try {
        const note = await db.employee_clinicnotes.findByPk(id);
        if (!note) {
            return res.status(404).json({ message: "Clini note not found." });
        }

        await note.update({ notes_name, updated_by });
        res.status(200).json(note);
    } catch (error) {
        console.error("Error updating clinic notes:", error);
        res.status(500).json({ message: "Failed to update clinic notes." });
    }
};

const getLatestClinicNotes = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const latestNote = await db.employee_clinicnotes.findOne({
            where: { employee_id: employeeId },
            order: [["updated_at", "DESC"]],
        });
        res.status(200).json(latestNote || {});
    } catch (error) {
        console.error("Error fetching latest clini note:", error);
        res.status(500).json({ message: "Failed to fetch latest clinic note." });
    }
};

module.exports = { addClinicNotes, getClinicNotes, updateClinicNotes, getLatestClinicNotes };