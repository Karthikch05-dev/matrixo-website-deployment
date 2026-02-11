import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - matriXO',
  description: 'Read the Terms and Conditions for using matriXO services, events, and platform. Last updated October 2025.',
  openGraph: {
    title: 'Terms of Service - matriXO',
    description: 'Terms and Conditions for matriXO services and events.',
    url: 'https://matrixo.in/terms',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-20 pb-20 bg-white dark:bg-gray-950">
      <div className="container-custom px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 gradient-text">
          Terms and Conditions
        </h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: October 9, 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to matriXO! By accessing our website at <strong>matrixo.in</strong> or using our services, 
              you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, 
              please do not use our services.
            </p>
            <p className="mb-4">
              These terms apply to all visitors, users, and others who access or use our platform for workshops, 
              hackathons, bootcamps, and related technical education services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. About matriXO</h2>
            <p className="mb-4">
              matriXO is an <strong>An Ed-Tech Startup</strong> dedicated to providing high-quality technical 
              education through workshops, hackathons, and bootcamps. We focus on empowering students and professionals 
              with industry-relevant skills.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Account Creation</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your password</li>
              <li>You must be at least 13 years old to create an account</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Account Security</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You are responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Event Registration and Payments</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Registration</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>All event registrations are subject to availability</li>
              <li>Registration is confirmed only after successful payment</li>
              <li>You will receive a confirmation email with event details</li>
              <li>Prices are listed in INR and include applicable taxes</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Payments</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>All payments are processed securely.</li>
              <li>We accept UPI, credit/debit cards, net banking, and wallets</li>
              <li>Prices are subject to change without prior notice</li>
              <li>All sales are final unless covered by our refund policy</li>
              <li>You are responsible for any bank charges or payment gateway fees</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Payment Failures</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>In case of payment failure, your registration will not be confirmed</li>
              <li>Failed payment amounts will be refunded by your bank/payment provider within 5-7 days</li>
              <li>For payment issues, contact our support team</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Cancellations and Refunds</h2>
            <p className="mb-4">
              Please refer to our <a href="/refund" className="text-blue-500 hover:underline">Cancellations and Refunds Policy</a> for 
              detailed information about cancellations, refunds, and transfer policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Event Participation</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Conduct Guidelines</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Participants must maintain professional and respectful behavior</li>
              <li>No harassment, discrimination, or disruptive behavior will be tolerated</li>
              <li>Follow all instructions from event organizers and instructors</li>
              <li>Respect intellectual property rights of presenters and other participants</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Attendance</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Participants must attend at least 80% of sessions for certification</li>
              <li>Late arrivals may not be admitted to certain sessions</li>
              <li>No-shows forfeit all rights to refunds or transfers</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Materials and Resources</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Course materials are for personal use only</li>
              <li>Sharing or redistributing materials without permission is prohibited</li>
              <li>Recording sessions without explicit permission is not allowed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Intellectual Property</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>All content on matrixo.in is owned by matriXO or licensed to us</li>
              <li>You may not copy, modify, distribute, or create derivative works</li>
              <li>The matriXO logo, name, and branding are protected trademarks</li>
              <li>User-generated content may be used by matriXO for promotional purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Modifications to Events</h2>
            <p className="mb-4">matriXO reserves the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Change event dates, times, or venues with reasonable notice</li>
              <li>Modify event curriculum or speakers as necessary</li>
              <li>Cancel events due to unforeseen circumstances (full refund provided)</li>
              <li>Replace instructors or speakers with equivalent alternatives</li>
            </ul>
            <p className="mb-4">We will notify registered participants via email of any significant changes.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Limitation of Liability</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>matriXO is not liable for any indirect, incidental, or consequential damages</li>
              <li>Our liability is limited to the amount paid for the event registration</li>
              <li>We are not responsible for technical issues, internet connectivity, or third-party services</li>
              <li>Participants attend events at their own risk</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a> to 
              understand how we collect, use, and protect your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. Prohibited Activities</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use our services for any illegal or unauthorized purpose</li>
              <li>Attempt to hack, disrupt, or damage our platform</li>
              <li>Upload malware, viruses, or malicious code</li>
              <li>Impersonate others or provide false information</li>
              <li>Scrape, crawl, or automate access to our website</li>
              <li>Resell or transfer registrations without authorization</li>
              <li>Spam or send unsolicited communications to other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">12. Termination</h2>
            <p className="mb-4">
              We reserve the right to suspend or terminate your account and access to our services at any time, 
              without prior notice, for violating these terms or engaging in prohibited activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">13. Governing Law</h2>
            <p className="mb-4">
              These Terms and Conditions are governed by the laws of India. Any disputes arising from these terms 
              will be subject to the exclusive jurisdiction of courts in Hyderabad, India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">14. Changes to Terms</h2>
            <p className="mb-4">
              We may update these Terms and Conditions from time to time. Changes will be posted on this page with 
              an updated "Last updated" date. Continued use of our services after changes constitutes acceptance of 
              the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">15. Contact Information</h2>
            <p className="mb-4">For questions or concerns about these Terms and Conditions:</p>
            <ul className="list-none mb-4">
              <li><strong>Email:</strong> hello@matrixo.in</li>
              <li><strong>Website:</strong> matrixo.in</li>
              <li><strong>Response Time:</strong> Within 24-48 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">16. Severability</h2>
            <p className="mb-4">
              If any provision of these terms is found to be unenforceable or invalid, that provision will be limited 
              or eliminated to the minimum extent necessary, and the remaining provisions will remain in full effect.
            </p>
          </section>

          <section className="mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              By registering for our events or using our services, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and Conditions. matriXO is an An Ed-Tech Startup committed 
              to providing quality technical education and maintaining transparent business practices.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
