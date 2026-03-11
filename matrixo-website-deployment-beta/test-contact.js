// Test script to verify contact form API
const testData = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+91 1234567890',
  subject: 'Test Message',
  message: 'This is a test message from the contact form.'
};

fetch('http://localhost:3001/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
  .then(response => response.json())
  .then(data => {
    console.log('Success Response:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
