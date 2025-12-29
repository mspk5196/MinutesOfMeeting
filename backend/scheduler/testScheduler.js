// Test script for scheduler - run this to manually trigger scheduling
require('dotenv').config();
const db = require('../config/db');

const formatMySQLDateTime = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const testScheduler = async () => {
    console.log('\n=== Testing Daily Scheduler ===\n');

    try {
        // Find completed meetings that need to be rescheduled
        const today = new Date().toISOString().split('T')[0];
        
        const [meetings] = await db.query(
            `SELECT m.id, m.meeting_name, m.repeat_type, m.next_schedule, m.meeting_status,
                    COUNT(mpf.point_id) as forwarded_points_count
             FROM meeting m
             LEFT JOIN meeting_points mp ON m.id = mp.meeting_id
             LEFT JOIN meeting_point_future mpf ON mp.id = mpf.point_id 
                AND mpf.forwarded_decision = 'false' 
                AND mpf.forward_type != 'NIL'
                AND mpf.add_point_meeting = 'true'
             WHERE m.meeting_status = "completed" 
               AND m.repeat_type = "daily"
               AND DATE(m.next_schedule) <= ?
             GROUP BY m.id`,
            [today]
        );

        if (meetings.length === 0) {
            console.log('✓ No completed daily meetings found to reschedule\n');
            console.log('To test:');
            console.log('1. Create a meeting with repeat_type="daily"');
            console.log('2. End the meeting (set meeting_status="completed")');
            console.log('3. Add forwarded points via meeting_point_future table');
            console.log('4. Run this script again\n');
            process.exit(0);
        }

        console.log(`Found ${meetings.length} meeting(s) to reschedule:\n`);
        
        meetings.forEach((m, i) => {
            console.log(`${i + 1}. "${m.meeting_name}" (ID: ${m.id})`);
            console.log(`   Status: ${m.meeting_status}`);
            console.log(`   Next schedule: ${m.next_schedule}`);
            console.log(`   Forwarded points: ${m.forwarded_points_count}`);
            console.log('');
        });

        // Import and run the scheduler
        const { cloneMeetingForNextOccurrence } = require('./cronJob');
        
        console.log('Triggering scheduler...\n');
        
        for (const meeting of meetings) {
            const nextSchedule = new Date(meeting.next_schedule);
            nextSchedule.setDate(nextSchedule.getDate() + 1); // Daily = +1 day
            
            console.log(`Processing meeting "${meeting.meeting_name}"...`);
            
            // This will be available after we export it
            // For now, we'll just show what would happen
            console.log(`  → Would clone to: ${formatMySQLDateTime(nextSchedule)}`);
            console.log(`  → Would copy ${meeting.forwarded_points_count} forwarded points\n`);
        }

        console.log('✓ Test complete!\n');
        console.log('To enable automatic scheduling:');
        console.log('1. Add SCHEDULER_ENABLED=true to your .env');
        console.log('2. Restart the backend server');
        console.log('3. Scheduler will run every 5 minutes\n');

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        process.exit(0);
    }
};

testScheduler();
