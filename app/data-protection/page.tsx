import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Protection & Security - matriXO',
  description: 'How matriXO protects your personal data, skill profiles, and learning information. Our commitment to data security and user privacy.',
  openGraph: {
    title: 'Data Protection & Security - matriXO',
    description: 'matriXO data protection and security policy for user accounts, skill profiles, and learning data.',
    url: 'https://matrixo.in/data-protection',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function DataProtectionPage() {
  return (
    <div className="min-h-screen pt-20 pb-20 bg-transparent">
      <div className="container-custom px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 gradient-text">
          Data Protection &amp; Security
        </h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: March 3, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Our Commitment</h2>
            <p className="mb-4">
              At matriXO, protecting your personal data, skill profiles, and learning information is a top priority.
              This policy outlines how we collect, store, protect, and manage your data across our platform — including
              SkillDNA™ profiles, event registrations, career assessments, and account information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Data We Collect</h2>
            <p className="mb-4">We collect the following categories of data to deliver our services:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, college/university, and profile photo.</li>
              <li><strong>Skill &amp; Assessment Data:</strong> SkillDNA™ profiles, skill scores, cognitive assessments, behavioral traits, and learning preferences.</li>
              <li><strong>Event Data:</strong> Registration details, attendance records, ticket purchases, and event participation history.</li>
              <li><strong>Payment Information:</strong> Transaction IDs and payment confirmations (processed securely via Razorpay — we do not store card details).</li>
              <li><strong>Usage Data:</strong> Platform interaction patterns, feature usage, and analytics data to improve our services.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. How We Protect Your Data</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Encryption:</strong> All data transmitted between your device and our servers is encrypted using TLS/SSL protocols.</li>
              <li><strong>Secure Infrastructure:</strong> We use Firebase (Google Cloud) for authentication, database, and storage — benefiting from Google&apos;s enterprise-grade security infrastructure.</li>
              <li><strong>Access Control:</strong> Role-based access ensures only authorized team members can access specific data. Employee access is logged and monitored.</li>
              <li><strong>Authentication Security:</strong> We support secure sign-in via Google, GitHub, and email with Firebase Authentication, including multi-factor authentication support.</li>
              <li><strong>Payment Security:</strong> All payments are processed through Razorpay, which is PCI DSS compliant. We never store your credit/debit card details on our servers.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Data Storage &amp; Retention</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Storage Location:</strong> Your data is stored on Firebase (Google Cloud) servers with regional compliance.</li>
              <li><strong>Retention Period:</strong> Account data is retained as long as your account is active. Event data is retained for record-keeping purposes for up to 3 years after event completion.</li>
              <li><strong>SkillDNA™ Profiles:</strong> Your skill genome data is retained until you request deletion or delete your account.</li>
              <li><strong>Deletion Requests:</strong> You may request complete data deletion at any time by contacting us at <a href="mailto:hello@matrixo.in" className="text-blue-600 dark:text-blue-400 hover:underline">hello@matrixo.in</a>.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Your Rights</h2>
            <p className="mb-4">As a matriXO user, you have the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct any inaccurate personal information through your profile settings.</li>
              <li><strong>Deletion:</strong> Request complete deletion of your account and associated data.</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format.</li>
              <li><strong>Objection:</strong> Opt out of marketing communications at any time.</li>
              <li><strong>Restriction:</strong> Request that we limit how your data is processed.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Third-Party Services</h2>
            <p className="mb-4">We use the following trusted third-party services:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Firebase (Google):</strong> Authentication, database, cloud storage, and hosting.</li>
              <li><strong>Razorpay:</strong> Secure payment processing for event registrations.</li>
              <li><strong>Google Analytics:</strong> Anonymous usage analytics to improve our platform.</li>
              <li><strong>Resend:</strong> Transactional email delivery for registration confirmations and notifications.</li>
            </ul>
            <p>Each service maintains its own privacy and security standards. We only share the minimum data necessary for each service to function.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Data Breach Protocol</h2>
            <p className="mb-4">In the unlikely event of a data breach:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Affected users will be notified within <strong>72 hours</strong> of discovery.</li>
              <li>We will provide clear information about what data was affected and what actions you should take.</li>
              <li>Immediate remediation steps will be taken to secure the platform.</li>
              <li>Relevant regulatory authorities will be notified as required by applicable law.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Cookies &amp; Tracking</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for authentication and session management.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand platform usage (anonymized).</li>
              <li><strong>No Advertising Cookies:</strong> We do not use cookies for targeted advertising or sell your data to advertisers.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Children&apos;s Data</h2>
            <p className="mb-4">
              Our platform is designed for college students and professionals (typically 17+). We do not knowingly collect
              personal data from children under 13. If we become aware that we have collected data from a child under 13,
              we will take steps to delete that information promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Updates to This Policy</h2>
            <p className="mb-4">
              We may update this policy from time to time. Material changes will be communicated via email or a prominent
              notice on our platform. Continued use of matriXO after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Contact Us</h2>
            <p className="mb-4">
              For questions about data protection, to exercise your rights, or to report a security concern:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:hello@matrixo.in" className="text-blue-600 dark:text-blue-400 hover:underline">hello@matrixo.in</a></li>
              <li><strong>Address:</strong> KPRISE Incubation Center, KPRES, Ghanpur, Hyderabad, Telangana - 500088</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
