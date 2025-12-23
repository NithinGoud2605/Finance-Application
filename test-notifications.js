// test-notifications.js
const { Notification } = require('./models');

async function testNotifications() {
  try {
    console.log('Testing Notification model...');
    
    // Test if we can count notifications
    const count = await Notification.count();
    console.log('Notification count:', count);
    
    // Test if we can find notifications
    const notifications = await Notification.findAll({ limit: 5 });
    console.log('Found notifications:', notifications.length);
    
    console.log('✅ Notification model test passed');
  } catch (error) {
    console.error('❌ Notification model test failed:', error.message);
    console.error('Full error:', error);
  }
}

testNotifications(); 