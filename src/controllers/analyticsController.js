const db = require("../config/sequelize");
const moment = require("moment");

const getAnalyticsData = async (req, res) => {
  try {
    // Extract and validate date range parameters
    const { startDate, endDate } = req.query;

    // Validate date formats
    const isValidDate = (dateStr) => moment(dateStr, "YYYY-MM-DD", true).isValid();

    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({ message: "Invalid startDate format. Use YYYY-MM-DD." });
    }
    if (endDate && !isValidDate(endDate)) {
      return res.status(400).json({ message: "Invalid endDate format. Use YYYY-MM-DD." });
    }

    // Set default to last 7 days if no dates provided
    const defaultStart = moment().subtract(7, "days").format("YYYY-MM-DD");
    const defaultEnd = moment().format("YYYY-MM-DD");

    const dateRangeStart = startDate || defaultStart;
    const dateRangeEnd = endDate || defaultEnd;

    // Ensure start date is before end date
    if (moment(dateRangeStart).isAfter(dateRangeEnd)) {
      return res.status(400).json({
        message: "Start date must be before end date",
      });
    }

    // Define today's date range
    const todayStart = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss");
    const todayEnd = moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");

    // Define the date range for the last 12 months
    const twelveMonthsAgo = moment().subtract(12, "months").startOf("month").format("YYYY-MM-DD HH:mm:ss");

    // Define the date range for the last 30 days
    const thirtyDaysAgo = moment().subtract(30, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");

    // Execute queries in parallel
    const [
      dateRangeReports,
      todaysReports,
      reportTypeStats,
      monthlyTrends,
      dailyActivity,
      topContributors,
      recentActivity,
      deletionAnalysis,
      reportTypeGrowth,
    ] = await Promise.all([
      // 1. Reports filtered by date range
      db.sequelize.query(
        `SELECT 
          report_type,
          COUNT(*) AS count,
          COUNT(DISTINCT employee_id) AS unique_patients
         FROM reports_metadata
         WHERE is_deleted = 0 
         AND uploaded_at BETWEEN ? AND ?
         GROUP BY report_type`,
        {
          replacements: [
            moment(dateRangeStart).startOf("day").format("YYYY-MM-DD HH:mm:ss"),
            moment(dateRangeEnd).endOf("day").format("YYYY-MM-DD HH:mm:ss"),
          ],
          type: db.sequelize.QueryTypes.SELECT,
        }
      ),

      // 2. Today's reports
      db.sequelize.query(
        `SELECT 
          report_type,
          COUNT(*) AS count,
          COUNT(DISTINCT employee_id) AS unique_patients
         FROM reports_metadata
         WHERE is_deleted = 0 
         AND uploaded_at BETWEEN ? AND ?
         GROUP BY report_type`,
        {
          replacements: [todayStart, todayEnd],
          type: db.sequelize.QueryTypes.SELECT,
        }
      ),

      // 3. Report Type Distribution with subtypes
      db.sequelize.query(
        `SELECT 
          report_type,
          report_subtype,
          COUNT(*) AS count,
          COUNT(DISTINCT employee_id) AS unique_patients
         FROM reports_metadata
         WHERE is_deleted = 0
         GROUP BY report_type, report_subtype
         ORDER BY report_type, count DESC`,
        { type: db.sequelize.QueryTypes.SELECT }
      ),

      // 4. Time-based Trends
      db.sequelize.query(
        `SELECT 
          DATE_FORMAT(uploaded_at, '%Y-%m') AS month,
          COUNT(*) AS total_uploads,
          COUNT(DISTINCT employee_id) AS unique_patients,
          COUNT(DISTINCT uploaded_by) AS active_uploaders,
          SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deletions
         FROM reports_metadata
         WHERE uploaded_at >= ?
         GROUP BY month
         ORDER BY month`,
        {
          replacements: [twelveMonthsAgo],
          type: db.sequelize.QueryTypes.SELECT,
        }
      ),

      // 5. Daily Activity (last 30 days)
      db.sequelize.query(
        `SELECT 
          DATE(uploaded_at) AS date,
          COUNT(*) AS uploads,
          SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deletions
         FROM reports_metadata
         WHERE uploaded_at >= ?
         GROUP BY date
         ORDER BY date`,
        {
          replacements: [thirtyDaysAgo],
          type: db.sequelize.QueryTypes.SELECT,
        }
      ),

      // 6. Top Contributors
      db.sequelize.query(
        `SELECT 
          uploaded_by AS user_id,
          COUNT(*) AS report_count,
          COUNT(DISTINCT employee_id) AS unique_patients,
          COUNT(DISTINCT report_type) AS report_types_uploaded
         FROM reports_metadata
         WHERE is_deleted = 0
         GROUP BY uploaded_by
         ORDER BY report_count DESC
         LIMIT 10`,
        { type: db.sequelize.QueryTypes.SELECT }
      ),

      // 7. Recent Activity with deletion info
      db.sequelize.query(
        `SELECT 
          id,
          file_name AS report_name,
          report_type,
          report_subtype,
          uploaded_at,
          uploaded_by AS user_id,
          is_deleted,
          deleted_by,
          deleted_at
         FROM reports_metadata
         ORDER BY uploaded_at DESC
         LIMIT 10`,
        { type: db.sequelize.QueryTypes.SELECT }
      ),

      // 8. Deletion Analysis
      db.sequelize.query(
        `SELECT 
          report_type,
          deleted_by,
          COUNT(*) AS total_deleted,
          AVG(TIMESTAMPDIFF(HOUR, uploaded_at, deleted_at)) AS avg_hours_before_deletion,
          MAX(TIMESTAMPDIFF(HOUR, uploaded_at, deleted_at)) AS max_hours_before_deletion,
          MIN(TIMESTAMPDIFF(HOUR, uploaded_at, deleted_at)) AS min_hours_before_deletion
         FROM reports_metadata
         WHERE is_deleted = 1
         GROUP BY report_type, deleted_by
         ORDER BY total_deleted DESC`,
        { type: db.sequelize.QueryTypes.SELECT }
      ),

      // 9. Report Type Growth (weekly)
      db.sequelize.query(
        `SELECT 
          report_type,
          YEARWEEK(uploaded_at, 3) AS week,
          COUNT(*) AS count
         FROM reports_metadata
         WHERE is_deleted = 0 AND uploaded_at >= ?
         GROUP BY report_type, week
         ORDER BY week, report_type`,
        {
          replacements: [twelveMonthsAgo],
          type: db.sequelize.QueryTypes.SELECT,
        }
      ),
    ]);

    // Calculate summary statistics
    const summaryStats = {
      totalReports: await db.sequelize.query(
        `SELECT COUNT(*) AS count FROM reports_metadata WHERE is_deleted = 0`,
        { type: db.sequelize.QueryTypes.SELECT }
      ).then((result) => result[0].count),
      totalUniquePatients: await db.sequelize.query(
        `SELECT COUNT(DISTINCT employee_id) AS count FROM reports_metadata WHERE is_deleted = 0`,
        { type: db.sequelize.QueryTypes.SELECT }
      ).then((result) => result[0].count),
      todaysUploads: todaysReports.reduce((sum, item) => sum + item.count, 0),
      todaysUniquePatients: todaysReports.reduce((sum, item) => sum + item.unique_patients, 0),
      deletionRate: await db.sequelize.query(
        `SELECT 
          (SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS rate 
         FROM reports_metadata`,
        { type: db.sequelize.QueryTypes.SELECT }
      ).then((result) => result[0].rate),
      avgMonthlyUploads: monthlyTrends.reduce((sum, item) => sum + item.total_uploads, 0) / (monthlyTrends.length || 1),
    };

    // Send response
    res.status(200).json({
      dateRangeUsed: {
        start: dateRangeStart,
        end: dateRangeEnd
      },
      dateRangeReports: dateRangeReports || [],
      todaysReports: todaysReports || [],
      reportTypeStats: reportTypeStats || [],
      monthlyTrends: monthlyTrends || [],
      dailyActivity: dailyActivity || [],
      topContributors: topContributors || [],
      recentActivity: recentActivity || [],
      deletionAnalysis: deletionAnalysis || [],
      reportTypeGrowth: reportTypeGrowth || [],
      summaryStats: summaryStats || {
        totalReports: 0,
        totalUniquePatients: 0,
        todaysUploads: 0,
        todaysUniquePatients: 0,
        deletionRate: 0,
        avgMonthlyUploads: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({
      message: "Failed to fetch analytics data.",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

module.exports = { getAnalyticsData };