const cron = require("node-cron");
const db = require("../config/db");

const calculateNextSchedule = (currentDate, repeatType, customDays = null) => {
  const nextDate = new Date(currentDate);

  if (repeatType === "daily") {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (repeatType === "weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (repeatType === "monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (repeatType === "custom_day" && customDays && customDays > 0) {
    nextDate.setDate(nextDate.getDate() + parseInt(customDays));
  } else {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
};

// Format JavaScript Date to MySQL DATETIME format: YYYY-MM-DD HH:MM:SS
const formatMySQLDateTime = (date) => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

// Clone meeting with forwarded points
const cloneMeetingForNextOccurrence = async (
  completedMeetingId,
  nextSchedule
) => {
  try {
    // Get original meeting details
    const [meetings] = await db.query(`SELECT * FROM meeting WHERE id = ?`, [
      completedMeetingId,
    ]);

    if (meetings.length === 0) {
      console.error(`Meeting ${completedMeetingId} not found`);
      return null;
    }

    const originalMeeting = meetings[0];
    const originalStartTime = originalMeeting.start_time
      ? new Date(originalMeeting.start_time)
      : null;
    const originalEndTime = originalMeeting.end_time
      ? new Date(originalMeeting.end_time)
      : null;

    // Calculate new start and end times with the same time of day
    let newStartTime, newEndTime;

    if (originalStartTime) {
      newStartTime = new Date(nextSchedule);
      newStartTime.setHours(
        originalStartTime.getHours(),
        originalStartTime.getMinutes(),
        originalStartTime.getSeconds()
      );
    } else {
      newStartTime = new Date(nextSchedule);
      newStartTime.setHours(9, 0, 0);
    }

    if (originalEndTime) {
      newEndTime = new Date(nextSchedule);
      newEndTime.setHours(
        originalEndTime.getHours(),
        originalEndTime.getMinutes(),
        originalEndTime.getSeconds()
      );
    } else {
      newEndTime = new Date(nextSchedule);
      newEndTime.setHours(17, 0, 0);
    }

    // Create new meeting (clone)
    const [result] = await db.query(
      `INSERT INTO meeting 
            (template_id, meeting_name, meeting_description, priority, venue_id, start_time, end_time, 
             created_by, repeat_type, custom_days, next_schedule, meeting_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_started')`,
      [
        originalMeeting.template_id,
        originalMeeting.meeting_name,
        originalMeeting.meeting_description,
        originalMeeting.priority,
        originalMeeting.venue_id,
        formatMySQLDateTime(newStartTime),
        formatMySQLDateTime(newEndTime),
        originalMeeting.created_by,
        originalMeeting.repeat_type,
        originalMeeting.custom_days,
        formatMySQLDateTime(nextSchedule),
      ]
    );

    const newMeetingId = result.insertId;

    // Copy meeting members
    const [members] = await db.query(
      `SELECT user_id, role FROM meeting_members WHERE meeting_id = ?`,
      [completedMeetingId]
    );

    if (members.length > 0) {
      const memberValues = members.map((m) => [
        newMeetingId,
        m.user_id,
        m.role,
      ]);
      await db.query(
        `INSERT INTO meeting_members (meeting_id, user_id, role) VALUES ?`,
        [memberValues]
      );
    }

    // Get ONLY NEXT-type forwarded points from completed meeting
    const [forwardedPoints] = await db.query(
      `SELECT mpf.point_id, mpf.forward_type, mpf.forward_decision, 
                    mp.point_name, mp.point_responsibility, mp.point_deadline, mp.todo, mp.remarks
             FROM meeting_point_future mpf
             JOIN meeting_points mp ON mp.id = mpf.point_id
             WHERE mpf.user_id = ? 
               AND mpf.forward_type = 'NEXT'
               AND (mpf.add_point_meeting IS NULL OR LOWER(mpf.add_point_meeting) = 'false' OR mpf.add_point_meeting = '0')
               AND mp.meeting_id = ?`,
      [originalMeeting.created_by, completedMeetingId]
    );

    // Insert forwarded points into new meeting
    for (const point of forwardedPoints) {
      // Carry all decisions (AGREE, DISAGREE, FORWARD) with full details
      await db.query(
        `INSERT INTO meeting_points (meeting_id, point_name, point_responsibility, point_deadline, remarks, forwarded_from_point_id)
                     VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newMeetingId,
          point.point_name,
          point.point_responsibility,
          point.point_deadline,
          point.remarks,
          point.point_id
        ]
      );
    }

    // Mark forwarded points as processed
    if (forwardedPoints.length > 0) {
      const pointIds = forwardedPoints.map((p) => p.point_id);
      await db.query(
        `UPDATE meeting_point_future 
                 SET add_point_meeting = 'true'
                 WHERE user_id = ? AND point_id IN (?)`,
        [originalMeeting.created_by, pointIds]
      );

      console.log(
        `✓ Cloned meeting ${completedMeetingId} → ${newMeetingId} with ${forwardedPoints.length} forwarded points`
      );
    } else {
      console.log(
        `✓ Cloned meeting ${completedMeetingId} → ${newMeetingId} (no forwarded points)`
      );
    }

    // Log to history
    await db.query(
      `INSERT INTO meeting_history (meeting_id, schedule_date, status, created_date) 
             VALUES (?, ?, 'scheduled', NOW())`,
      [newMeetingId, formatMySQLDateTime(nextSchedule)]
    );

    return newMeetingId;
  } catch (error) {
    console.error(`Error cloning meeting ${completedMeetingId}:`, error);
    return null;
  }
};

const initScheduler = () => {
  console.log("Meeting scheduler initialized");

  // Run every 30 seconds for testing
  cron.schedule(
    "*/10 * * * * *",
    async () => {
      console.log("Running meeting scheduler...");

      try {
        const today = new Date().toISOString().split("T")[0];
        console.log(today)
        // Find completed meetings scheduled for today that haven't been cloned yet
        const [meetings] = await db.query(
          `SELECT id, repeat_type, custom_days, next_schedule, start_time, end_time, created_by 
                 FROM meeting 
                 WHERE meeting_status = "completed" 
                   AND repeat_type IN ('daily', 'week', 'monthly', 'custom_day')
                   AND DATE(next_schedule) <= ?
                 ORDER BY next_schedule ASC`,
          [today]
        );

        if (meetings.length === 0) {
          console.log("No meetings to schedule");
          return;
        }

        console.log(`Found ${meetings.length} meeting(s) to reschedule`);

        for (const meeting of meetings) {
          const nextSchedule = new Date(meeting.next_schedule);

          // Clone the meeting at its scheduled next occurrence
          const newMeetingId = await cloneMeetingForNextOccurrence(
            meeting.id,
            nextSchedule
          );

          if (newMeetingId) {
            // Advance next_schedule to the following occurrence
            const following = calculateNextSchedule(
              nextSchedule,
              meeting.repeat_type,
              meeting.custom_days
            );
            await db.query(
              `UPDATE meeting SET next_schedule = ? WHERE id = ?`,
              [formatMySQLDateTime(following), meeting.id]
            );
          }
        }
      } catch (error) {
        console.error("Cron job error:", error);
      }
    },
    { timezone: "Asia/Kolkata" }
  );
};

module.exports = { initScheduler, cloneMeetingForNextOccurrence, calculateNextSchedule };
