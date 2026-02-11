import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy - matriXO',
  description: 'matriXO digital delivery policy for event tickets, confirmations, and registration details. Instant digital delivery.',
  openGraph: {
    title: 'Shipping & Delivery Policy - matriXO',
    description: 'Digital delivery policy for matriXO event registrations.',
    url: 'https://matrixo.in/shipping',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen pt-20 pb-20 bg-white dark:bg-gray-950">
      <div className="container-custom px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 gradient-text">
          Shipping & Delivery Policy
        </h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: October 9, 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Digital Delivery</h2>
            <p className="mb-4">
              matriXO provides <strong>digital event registrations</strong> for workshops, hackathons, and bootcamps. 
              Since our services are entirely digital, there is no physical shipping involved.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Registration Confirmation</h2>
            <p className="mb-4">Upon successful payment, you will receive:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Immediate:</strong> Payment confirmation on screen</li>
              <li><strong>Within 5 minutes:</strong> Registration confirmation email with:
                <ul className="list-circle pl-6 mt-2">
                  <li>Booking ID and transaction details</li>
                  <li>Event name, date, time, and venue/link</li>
                  <li>Digital ticket (PDF attachment)</li>
                  <li>Instructions for event participation</li>
                </ul>
              </li>
              <li><strong>24 hours before event:</strong> Reminder email with event details</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Delivery Timelines</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Email Delivery</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Confirmation Email:</strong> Within 5 minutes of payment</li>
              <li><strong>Reminder Email:</strong> 24 hours before the event</li>
              <li><strong>Event Materials:</strong> Shared during/after the event</li>
              <li><strong>Certificates:</strong> 7-14 days after event completion (if applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">For Online Events</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Meeting link sent in confirmation email</li>
              <li>Additional link reminder 1 hour before event</li>
              <li>Access credentials (if required) sent 30 minutes before start</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">For Offline Events</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Venue address and directions in confirmation email</li>
              <li>Digital ticket (QR code) for entry</li>
              <li>Contact details of event organizer</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Didn't Receive Your Email?</h2>
            <p className="mb-4">If you don't receive your confirmation email within 10 minutes:</p>
            <ol className="list-decimal pl-6 mb-4">
              <li><strong>Check your spam/junk folder</strong> - emails may be filtered</li>
              <li><strong>Verify the email address</strong> - ensure you entered it correctly during registration</li>
              <li><strong>Add hello@matrixo.in to your contacts</strong> - to prevent future filtering</li>
              <li><strong>Check your payment status</strong> - payment may have failed</li>
              <li><strong>Contact us</strong> - email hello@matrixo.in with:
                <ul className="list-circle pl-6 mt-2">
                  <li>Your name and phone number</li>
                  <li>Event name and date</li>
                  <li>Transaction ID or payment screenshot</li>
                </ul>
              </li>
            </ol>
            <p className="mb-4">Our team will resend your confirmation within 2-4 hours.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Event Materials Delivery</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Course Resources</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Pre-event Materials:</strong> Sent 2-3 days before (if applicable)</li>
              <li><strong>Session Slides:</strong> Shared during the event</li>
              <li><strong>Code Repositories:</strong> GitHub links provided during sessions</li>
              <li><strong>Recordings:</strong> Available within 48 hours (for online events)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Post-Event Delivery</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Certificates:</strong> 7-14 days after event (80% attendance required)</li>
              <li><strong>Additional Resources:</strong> Shared via email or learning portal</li>
              <li><strong>Community Access:</strong> Discord/Slack invites (if applicable)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Physical Materials (If Any)</h2>
            <p className="mb-4">
              For certain events that include physical kits or merchandise:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Offline Events:</strong> Distributed at the venue during the event</li>
              <li><strong>Online Events:</strong> Shipped to registered address within 7-10 business days</li>
              <li><strong>Tracking:</strong> Courier tracking details sent via email</li>
              <li><strong>Shipping Charges:</strong> Included in registration fee (if applicable)</li>
            </ul>
            <p className="mb-4"><em>Note: Physical items are event-specific and not available for all programs.</em></p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Certificate Delivery</h2>
            <p className="mb-4">Certificates of completion/participation are provided for eligible participants:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Eligibility:</strong> Minimum 80% attendance required</li>
              <li><strong>Format:</strong> Digital certificate (PDF) via email</li>
              <li><strong>Timeline:</strong> 7-14 days after event completion</li>
              <li><strong>Physical Certificate:</strong> Available on request (₹500 + shipping charges)</li>
              <li><strong>Re-issue:</strong> ₹100 fee for lost certificates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Access to Online Platforms</h2>
            <p className="mb-4">For bootcamps and multi-session programs:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Learning Portal Access:</strong> Activated within 24 hours of registration</li>
              <li><strong>Login Credentials:</strong> Sent to registered email</li>
              <li><strong>Access Duration:</strong> Varies by program (typically 3-6 months)</li>
              <li><strong>Content Updates:</strong> Automatic, no action required</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Cancellation Impact on Delivery</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>If you cancel your registration, access to all digital materials will be revoked</li>
              <li>Refund processing time: 5-7 business days (see our Refund Policy)</li>
              <li>Physical items already shipped cannot be refunded</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Technical Support</h2>
            <p className="mb-4">For issues with accessing digital content:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Email:</strong> hello@matrixo.in</li>
              <li><strong>Response Time:</strong> Within 24 hours</li>
              <li><strong>Live Support:</strong> Available during event hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Privacy & Data Security</h2>
            <p className="mb-4">
              All digital deliveries are secured with:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>SSL/TLS encrypted email transmission</li>
              <li>Password-protected learning portals</li>
              <li>Secure file hosting on trusted platforms</li>
              <li>No sharing of personal data with third parties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Us</h2>
            <p className="mb-4">For delivery-related queries:</p>
            <ul className="list-none mb-4">
              <li><strong>Email:</strong> hello@matrixo.in</li>
              <li><strong>Subject Line:</strong> "Delivery Issue - [Event Name]"</li>
              <li><strong>Include:</strong> Booking ID, registered email, and issue description</li>
            </ul>
          </section>

          <section className="mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              matriXO is committed to providing timely and reliable delivery of all digital services. As an MSME 
              Registered organization, we maintain the highest standards of service delivery and customer satisfaction.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
