// Test script to send a push notification
// Run: node test-push.js

const http = require('http')

console.log('Calling http://localhost:3000/api/push/test ...\n')

const req = http.get('http://localhost:3000/api/push/test', { timeout: 60000 }, (res) => {
  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    try {
      const json = JSON.parse(data)
      console.log(JSON.stringify(json, null, 2))
    } catch {
      console.log('Response:', data)
    }
  })
})

req.on('error', (e) => {
  console.error('Connection error:', e.message)
  console.log('\nMake sure the dev server is running: npm run dev')
})

req.on('timeout', () => {
  console.log('Request timed out')
  req.destroy()
})
