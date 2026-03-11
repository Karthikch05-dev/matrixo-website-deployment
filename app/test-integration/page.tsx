'use client'

import { useState } from 'react'
import { storage } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function TestPage() {
  const [testResult, setTestResult] = useState<string[]>([])
  const [testing, setTesting] = useState(false)

  const addLog = (message: string) => {
    console.log(message)
    setTestResult(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testFirebase = async () => {
    try {
      addLog('🔥 Testing Firebase Storage...')
      
      // Create a test file
      const testBlob = new Blob(['Test content'], { type: 'text/plain' })
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
      
      addLog(`📁 Test file created: ${testFile.name}`)
      
      // Upload to Firebase
      const timestamp = Date.now()
      const filename = `test_${timestamp}.txt`
      const storageRef = ref(storage, `screenshots/${filename}`)
      
      addLog(`⬆️ Uploading to: screenshots/${filename}`)
      
      const uploadResult = await uploadBytes(storageRef, testFile)
      addLog(`✅ Upload successful!`)
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      addLog(`🔗 Download URL: ${downloadURL}`)
      
      return true
    } catch (error) {
      addLog(`❌ Firebase Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Firebase test error:', error)
      return false
    }
  }

  const testGoogleSheet = async () => {
    try {
      addLog('📊 Testing Google Apps Script...')
      
      const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL
      
      if (!GOOGLE_SCRIPT_URL) {
        addLog('❌ Google Script URL not found in environment variables')
        return false
      }
      
      addLog(`🔗 URL: ${GOOGLE_SCRIPT_URL}`)
      
      const testData = {
        timestamp: new Date().toISOString(),
        eventId: 'test-event',
        eventTitle: 'Test Event',
        fullName: 'Test User',
        email: 'test@example.com',
        contactNumber: '1234567890',
        studentId: 'TEST123',
        collegeName: 'Test College',
        department: 'Computer Science',
        year: '3rd Year',
        emergencyContact: '0987654321',
        address: 'Test Address',
        wantCertificate: 'no',
        wantTransport: 'yes',
        hearAboutEvent: 'Instagram',
        paymentScreenshotURL: 'https://example.com/test.jpg',
        status: 'Test Entry'
      }
      
      addLog(`📤 Sending test data...`)
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })
      
      addLog(`✅ Request sent (no-cors mode - cannot verify response)`)
      addLog(`📝 Check your Google Sheet for a new test entry`)
      
      return true
    } catch (error) {
      addLog(`❌ Google Sheet Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Google Sheet test error:', error)
      return false
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    setTestResult([])
    
    addLog('🧪 Starting integration tests...')
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Test 1: Firebase
    const firebaseOk = await testFirebase()
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Test 2: Google Sheet
    const googleSheetOk = await testGoogleSheet()
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Summary
    addLog(`\n📊 Test Summary:`)
    addLog(`Firebase Storage: ${firebaseOk ? '✅ PASS' : '❌ FAIL'}`)
    addLog(`Google Apps Script: ${googleSheetOk ? '✅ PASS (check sheet)' : '❌ FAIL'}`)
    
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          🧪 Firebase + Google Sheet Integration Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Environment Check
          </h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex items-center gap-2">
              <span className={process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅' : '❌'}
              </span>
              <span className="text-gray-700 dark:text-gray-300">Firebase API Key</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅' : '❌'}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅' : '❌'}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                Storage Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ? '✅' : '❌'}
              </span>
              <span className="text-gray-700 dark:text-gray-300">Google Script URL</span>
            </div>
          </div>
        </div>

        <button
          onClick={runAllTests}
          disabled={testing}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 
                   text-white rounded-lg font-semibold text-lg shadow-lg
                   hover:shadow-xl transform hover:scale-105 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {testing ? '🧪 Running Tests...' : '🚀 Run All Tests'}
        </button>

        {testResult.length > 0 && (
          <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 text-white">Test Output:</h3>
            {testResult.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2">
            📋 What This Tests:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-300 text-sm">
            <li>Firebase Storage connection and upload</li>
            <li>Firebase Storage rules (read/write permissions)</li>
            <li>Google Apps Script Web App connectivity</li>
            <li>Data submission to Google Sheets</li>
          </ul>
          <p className="mt-4 text-yellow-800 dark:text-yellow-300 text-sm">
            After running tests, check:
            <br />
            1. Firebase Console → Storage → screenshots/ folder
            <br />
            2. Your Google Sheet for a test entry
          </p>
        </div>
      </div>
    </div>
  )
}
