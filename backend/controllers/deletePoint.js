// Delete point function - to be added to meetingController.js
const deletePoint = async (req, res) => {
    const pointId = req.params.pointId;
    const db = require('../config/db');

    if (!pointId) {
        return res.status(400).json({
            success: false,
            message: 'Point ID is required'
        });
    }

    try {
        // Check if point exists
        const [pointCheck] = await db.query(
            'SELECT id FROM meeting_points WHERE id = ?',
            [pointId]
        );

        if (pointCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Point not found'
            });
        }

        // Delete the point (cascade will handle subpoints due to ON DELETE CASCADE)
        await db.query(
            'DELETE FROM meeting_points WHERE id = ?',
            [pointId]
        );

        return res.status(200).json({
            success: true,
            message: 'Point deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting point:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting point',
            error: error.message
        });
    }
};

module.exports = deletePoint;
