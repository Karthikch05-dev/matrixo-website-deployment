import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy - matriXO',
  description: 'matriXO cancellation and refund policy for event tickets and registrations. 7-day refund window with transparent processing.',
  openGraph: {
    title: 'Refund & Cancellation Policy - matriXO',
    description: 'Cancellation and refund policy for matriXO event registrations.',
    url: 'https://matrixo.in/refund',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function RefundPage() {
  return (
    <div className="min-h-screen pt-20 pb-20 bg-white dark:bg-gray-950">
      <div className="container-custom px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 gradient-text">
          Cancellations and Refunds Policy
        </h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: October 9, 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. General Refund Policy</h2>
            <p className="mb-4">At matriXO, we strive to provide the best learning experience through our workshops, hackathons, and bootcamps. We understand that plans can change, and we've designed our refund policy to be fair to both participants and organizers.</p>
            <p className="mb-4"><strong>Standard Refund Eligibility:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Refunds are available up to 7 days before the event start date</li>
              <li>A processing fee of 5% or ₹50 (whichever is higher) will be deducted</li>
              <li>Refund requests within 7 days of the event are subject to organizer approval</li>
              <li>No refunds will be issued within 48 hours of the event</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Event-Specific Policies</h2>
            <p className="mb-4">Some events may have different refund policies based on their nature:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Workshops:</strong> Full refund (minus processing fee) if cancelled 7+ days in advance</li>
              <li><strong>Hackathons:</strong> 50% refund if cancelled 3-7 days before, no refund within 3 days</li>
              <li><strong>Bootcamps:</strong> Pro-rated refund available within first 2 sessions, no refund after</li>
              <li><strong>Free Events:</strong> No refund applicable (no payment made)</li>
            </ul>
            <p>Please check the specific event page for any special refund terms.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Event Cancellation by Organizer</h2>
            <p className="mb-4">If matriXO or the event organizer cancels an event:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Full refund</strong> of the registration amount will be processed</li>
              <li>No processing fees will be deducted</li>
              <li>Refunds will be initiated within 2-3 business days of cancellation</li>
              <li>You will receive an email confirmation with refund details</li>
              <li>Alternative: Option to transfer your registration to a future event</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. How to Request a Refund</h2>
            <p className="mb-4">To request a refund, follow these steps:</p>
            <ol className="list-decimal pl-6 mb-4">
              <li>Email us at <strong>hello@matrixo.in</strong> with subject "Refund Request"</li>
              <li>Include your booking ID/transaction ID</li>
              <li>Provide your registered email and phone number</li>
              <li>State the reason for cancellation</li>
              <li>Include your bank account details for refund processing</li>
            </ol>
            <p className="mb-4">Our team will review your request within 24-48 hours and send you a confirmation email.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Refund Processing Time</h2>
            <p className="mb-4"><strong>Timeline for approved refunds:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Credit/Debit Card:</strong> 5-7 business days after approval</li>
              <li><strong>UPI/Net Banking:</strong> 3-5 business days after approval</li>
              <li><strong>Wallet Payments:</strong> 2-3 business days after approval</li>
            </ul>
            <p className="mb-4">Note: Refund processing time may vary depending on your bank/payment provider. Refunds will be credited to the original source of payment method. If you don't receive your refund within the stated period, please contact your bank first, then reach out to us.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Non-Refundable Items</h2>
            <p className="mb-4">The following are not eligible for refunds:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Course materials or resources already accessed/downloaded</li>
              <li>Completed workshop sessions or bootcamp modules</li>
              <li>No-show without prior cancellation notice</li>
              <li>Violation of event terms and conditions</li>
              <li>Third-party services or tools included in the package</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Transfer Policy</h2>
            <p className="mb-4">Instead of a refund, you may transfer your registration:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Transfer to another person (same event) - Free, up to 3 days before event</li>
              <li>Transfer to future event (same price range) - ₹100 processing fee</li>
              <li>Transfer requests must be made via email to hello@matrixo.in</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Contact Us</h2>
            <p className="mb-4">For any questions or concerns regarding cancellations and refunds:</p>
            <ul className="list-none mb-4">
              <li><strong>Email:</strong> hello@matrixo.in</li>
              <li><strong>Phone:</strong> Available on our contact page</li>
              <li><strong>Response Time:</strong> Within 24-48 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              matriXO is an An Ed-Tech Startup committed to providing quality technical education and transparent business practices. This policy is subject to change, and any updates will be communicated via email to registered users.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
