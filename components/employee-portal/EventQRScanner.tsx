'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  FaQrcode, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner,
  FaUser,
  FaUniversity,
  FaCodeBranch,
  FaRedo,
  FaCamera,
  FaStop,
  FaKeyboard
} from 'react-icons/fa'
import { toast } from 'sonner'

interface AttendeeInfo {
  name: string
  rollNumber: string
  email: string
  phone: string
  college: string
  branch: string
  year: string
  transactionCode: string
  status: string
  rowNumber: number
}

interface EventQRScannerProps {
  eventName?: string
}

export default function EventQRScanner({ eventName = 'VibeCode IRL' }: EventQRScannerProps) {
  const [mode, setMode] = useState<'idle' | 'scanning' | 'manual' | 'loading' | 'success' | 'error'>('idle')
  const [manualCode, setManualCode] = useState('')
  const [attendeeInfo, setAttendeeInfo] = useState<AttendeeInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [scannerReady, setScannerReady] = useState(false)
  
  const scannerRef = useRef<any>(null)
  const scannerContainerId = 'qr-reader'

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmI_1t6i0eYpNPJ3T7litVtQmPeVbuEdug_E8dXbM1lR8ucO57wxmy4iilZUZ5BwLiYA/exec'

  // Load html5-qrcode library
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
    script.async = true
    script.onload = () => {
      console.log('html5-qrcode loaded')
      setScannerReady(true)
    }
    document.body.appendChild(script)

    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    if (!scannerReady || !(window as any).Html5Qrcode) {
      toast.error('Scanner not ready. Please wait...')
      return
    }

    setMode('scanning')
    setAttendeeInfo(null)
    setErrorMessage('')

    // Wait for DOM to render
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const html5QrCode = new (window as any).Html5Qrcode(scannerContainerId)
      scannerRef.current = html5QrCode

      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log('QR Scanned:', decodedText)
        if (decodedText.startsWith('VIBECODE-')) {
          // Vibrate on success
          if (navigator.vibrate) navigator.vibrate(200)
          stopScanner()
          lookupAttendee(decodedText)
        }
      }

      const config = {
        fps: 10,
        qrbox: { width: 200, height: 200 },
        aspectRatio: 1.0,
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        () => {} // Ignore errors
      )
    } catch (err: any) {
      console.error('Scanner error:', err)
      toast.error('Failed to start camera. Try manual entry.')
      setMode('manual')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (e) {}
      scannerRef.current = null
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.trim().toUpperCase()
    if (!code) {
      toast.error('Please enter a code')
      return
    }
    const fullCode = code.startsWith('VIBECODE-') ? code : `VIBECODE-${code}`
    stopScanner()
    lookupAttendee(fullCode)
  }

  const lookupAttendee = async (transactionCode: string) => {
    setMode('loading')
    setErrorMessage('')
    setAttendeeInfo(null)

    try {
      // Mark attendance
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAttendance', transactionCode })
      }).catch(() => {})

      // Lookup attendee
      const res = await fetch(`${APPS_SCRIPT_URL}?action=lookupAttendee&transactionCode=${encodeURIComponent(transactionCode)}`)
      const data = await res.json()

      if (data.success && data.attendee) {
        setAttendeeInfo(data.attendee)
        setMode('success')
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
        toast.success(`Welcome ${data.attendee.name}!`)
      } else {
        setErrorMessage(data.message || 'Attendee not found')
        setMode('error')
        toast.error('Attendee not found')
      }
    } catch (err) {
      console.error('Lookup error:', err)
      setErrorMessage('Network error. Please try again.')
      setMode('error')
      toast.error('Verification failed')
    }
  }

  const handleReset = () => {
    setMode('idle')
    setManualCode('')
    setAttendeeInfo(null)
    setErrorMessage('')
  }

  const handleScanAgain = () => {
    handleReset()
    setTimeout(() => startScanner(), 100)
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-[#0a1525] to-[#0d1830] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-full mb-3">
            <FaQrcode className="text-3xl text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{eventName} Check-In</h1>
          <p className="text-gray-400 text-sm">Scan attendee QR code to mark attendance</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-sm">
          
          {/* IDLE State - Show Start Buttons */}
          {mode === 'idle' && (
            <div className="text-center py-6">
              <div className="space-y-4">
                <button
                  onClick={startScanner}
                  disabled={!scannerReady}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 
                           text-white font-bold text-lg rounded-xl hover:from-cyan-600 hover:to-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                >
                  <FaCamera className="text-xl" />
                  {scannerReady ? 'Scan QR Code' : 'Loading Scanner...'}
                </button>
                
                <button
                  onClick={() => setMode('manual')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 
                           text-white font-semibold rounded-xl hover:bg-white/20 
                           transition-all active:scale-95 border border-white/20"
                >
                  <FaKeyboard className="text-xl" />
                  Enter Code Manually
                </button>
              </div>
            </div>
          )}

          {/* SCANNING State */}
          {mode === 'scanning' && (
            <div>
              {/* QR Scanner Container */}
              <div 
                id={scannerContainerId}
                className="w-full rounded-xl overflow-hidden mb-4"
                style={{ minHeight: '280px' }}
              />
              
              <div className="text-center">
                <p className="text-cyan-400 animate-pulse mb-4">Point camera at QR code...</p>
                <button
                  onClick={() => { stopScanner(); setMode('idle'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/20 text-red-400 
                           border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
                >
                  <FaStop />
                  Stop
                </button>
              </div>

              {/* Manual fallback */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-gray-500 text-center text-sm mb-3">Or enter code manually:</p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="VIBECODE-XXXXXXXXXX"
                    className="w-full px-4 py-3 bg-white/10 border border-cyan-500/30 rounded-xl text-white 
                             placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 text-center"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Check
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MANUAL Entry State */}
          {mode === 'manual' && (
            <div className="py-4">
              <p className="text-gray-400 text-center mb-4">Enter the transaction code from the attendee's email</p>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="VIBECODE-XXXXXXXXXX"
                  autoFocus
                  className="w-full px-4 py-4 bg-white/10 border border-cyan-500/30 rounded-xl text-white text-lg
                           placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 text-center font-mono"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('idle')}
                    className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Check
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LOADING State */}
          {mode === 'loading' && (
            <div className="text-center py-12">
              <FaSpinner className="animate-spin text-5xl text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-400">Looking up attendee...</p>
            </div>
          )}

          {/* ERROR State */}
          {mode === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-4">
                <FaTimesCircle className="text-4xl text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Not Found</h3>
              <p className="text-gray-400 mb-6">{errorMessage}</p>
              <button
                onClick={handleScanAgain}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600
                         text-white font-semibold rounded-xl transition-all"
              >
                <FaRedo />
                Try Again
              </button>
            </motion.div>
          )}

          {/* SUCCESS State */}
          {mode === 'success' && attendeeInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4"
            >
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-3">
                  <FaCheckCircle className="text-3xl text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-green-400">Attendance Marked!</h3>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 mb-5">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-500/20 rounded-full mb-2">
                    <FaUser className="text-xl text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{attendeeInfo.name}</h2>
                  {attendeeInfo.rollNumber && (
                    <p className="text-cyan-400 text-sm">{attendeeInfo.rollNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {attendeeInfo.college && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                        <FaUniversity className="text-[10px]" />
                        College
                      </div>
                      <p className="text-white text-sm font-medium truncate">{attendeeInfo.college}</p>
                    </div>
                  )}
                  {attendeeInfo.branch && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                        <FaCodeBranch className="text-[10px]" />
                        Branch
                      </div>
                      <p className="text-white text-sm font-medium truncate">{attendeeInfo.branch}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">Transaction Code</p>
                  <p className="text-cyan-400 font-mono text-sm break-all">{attendeeInfo.transactionCode}</p>
                </div>
              </div>

              <button
                onClick={handleScanAgain}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold 
                         rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all active:scale-[0.98] 
                         shadow-lg shadow-cyan-500/30"
              >
                <span className="flex items-center justify-center gap-2">
                  <FaRedo />
                  Scan Next Attendee
                </span>
              </button>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-gray-500 text-xs">
          <p>Scan the QR code from attendee's confirmation email</p>
          <p className="mt-1">Transaction codes start with "VIBECODE-"</p>
        </div>
      </motion.div>
    </div>
  )
}
