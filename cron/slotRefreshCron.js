import cron from 'node-cron';
import refreshSlotDates from '../utils/refreshSlotDates.js';

cron.schedule('59 23 * * *', async () => {
  console.log('🕐 Running daily slot date refresher at 11:59 PM...');
  await refreshSlotDates();
}, {
  timezone: "Asia/Kolkata"
});
