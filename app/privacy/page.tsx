import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - matriXO',
  description: 'Learn how matriXO collects, uses, and protects your personal information. Read our complete privacy policy.',
  openGraph: {
    title: 'Privacy Policy - matriXO',
    description: 'How matriXO handles your personal data and privacy.',
    url: 'https://matrixo.in/privacy',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-20 pb-20 bg-white dark:bg-gray-950">
      <div className="container-custom px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 gradient-text">
          Privacy Policy
        </h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: October 9, 2025</p>
          
          <section className="mb-8">
            <p className="mb-4">
              At matriXO, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website 
              and services for workshops, hackathons, and bootcamps.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Personal Information</h3>
            <p className="mb-4">When you register for our events or use our services, we collect:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Contact Information:</strong> Name, email address, phone number</li>
              <li><strong>Account Information:</strong> Username, password (encrypted)</li>
              <li><strong>Payment Information:</strong> Processed securely through Razorpay (we don't store card details)</li>
              <li><strong>Educational Information:</strong> College/university name, year of study, course</li>
              <li><strong>Professional Information:</strong> Company, job title (for bootcamps)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and time spent on our website</li>
              <li>Referral source and exit pages</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Event Registration:</strong> Process your registrations and send confirmations</li>
              <li><strong>Communication:</strong> Send event updates, reminders, and important announcements</li>
              <li><strong>Payment Processing:</strong> Complete transactions securely via Razorpay</li>
              <li><strong>Customer Support:</strong> Respond to your queries and provide assistance</li>
              <li><strong>Service Improvement:</strong> Analyze usage patterns to enhance our platform</li>
              <li><strong>Marketing:</strong> Send promotional emails about upcoming events (you can opt-out anytime)</li>
              <li><strong>Legal Compliance:</strong> Meet regulatory requirements and enforce our terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Payment Security</h2>
            <p className="mb-4">
              All payment transactions are processed through <strong>Razorpay</strong>, a PCI DSS Level 1 certified payment gateway. 
              We do not store your credit/debit card information on our servers. Payment data is encrypted and transmitted securely 
              to Razorpay's servers.
            </p>
            <p className="mb-4">For more information, please review Razorpay's privacy policy at: 
              <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"> https://razorpay.com/privacy/</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Information Sharing and Disclosure</h2>
            <p className="mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Event Organizers/Partners:</strong> To coordinate workshop/hackathon logistics</li>
              <li><strong>Service Providers:</strong> Razorpay (payments), email service providers, cloud hosting</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
            </ul>
            <p className="mb-4">We <strong>do not sell</strong> your personal information to third parties.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Data Security</h2>
            <p className="mb-4">We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Encrypted database storage</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Cookies and Tracking</h2>
            <p className="mb-4">We use cookies to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Remember your preferences and login status</li>
              <li>Analyze site traffic and user behavior</li>
              <li>Personalize content and recommendations</li>
              <li>Enable dark mode and other UI preferences</li>
            </ul>
            <p className="mb-4">You can control cookies through your browser settings. Disabling cookies may affect site functionality.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Your Rights and Choices</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations)</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (link in every email)</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Withdraw Consent:</strong> Revoke permission for data processing</li>
            </ul>
            <p className="mb-4">To exercise these rights, contact us at <strong>hello@matrixo.in</strong></p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Data Retention</h2>
            <p className="mb-4">We retain your information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Account data: Until you request deletion or account closure</li>
              <li>Transaction records: 7 years (legal requirement)</li>
              <li>Marketing data: Until you unsubscribe</li>
              <li>Analytics data: 24-36 months</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Third-Party Links</h2>
            <p className="mb-4">
              Our website may contain links to third-party sites (event partners, sponsors). We are not responsible 
              for their privacy practices. Please review their privacy policies before providing any information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Children's Privacy</h2>
            <p className="mb-4">
              Our services are intended for users aged 13 and above. We do not knowingly collect information from 
              children under 13. If you believe we have collected such data, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be stored on servers located in India or other countries. By using our services, 
              you consent to the transfer of your data to these locations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">12. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an 
              updated "Last updated" date. Significant changes will be communicated via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">13. Contact Us</h2>
            <p className="mb-4">For privacy-related questions or concerns:</p>
            <ul className="list-none mb-4">
              <li><strong>Email:</strong> hello@matrixo.in</li>
              <li><strong>Subject Line:</strong> "Privacy Inquiry"</li>
              <li><strong>Response Time:</strong> Within 48 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              matriXO is an An Ed-Tech Startup operating under Indian data protection laws. We are committed 
              to maintaining the highest standards of privacy and data security.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
