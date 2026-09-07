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
    <div className="min-h-screen pt-20 pb-20 bg-transparent">
      <div className="container-custom px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 gradient-text">
          Cancellations and Refunds Policy
        </h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: September 7, 2026</p>

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
            <p className="mb-4">All payments on matrixo.in are collected through <strong>Razorpay</strong>. Every approved refund is issued back to the original payment method through Razorpay — we cannot refund to a different account, card, or UPI ID than the one used to pay.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Platform Fee</h2>
            <p className="mb-4">A <strong>platform fee of ₹5</strong> is added to every paid registration and is shown separately at checkout before you pay (for example, a ₹499 ticket is charged as ₹504).</p>
            <ul className="list-disc pl-6 mb-4">
              <li>The platform fee covers payment gateway charges and registration platform costs that we incur the moment a payment is processed</li>
              <li>It is <strong>non-refundable</strong> on participant-initiated cancellations, and is deducted in addition to any applicable processing fee</li>
              <li>It <strong>is fully refunded</strong> when matriXO cancels an event, or when a duplicate/failed transaction is reversed</li>
              <li>Free events carry no platform fee and therefore no refund is applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Event-Specific Policies</h2>
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Event Cancellation by Organizer</h2>
            <p className="mb-4">If matriXO or the event organizer cancels an event:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Full refund</strong> of the total amount charged, including the ₹5 platform fee</li>
              <li>No processing fees will be deducted</li>
              <li>Refunds will be initiated within 2-3 business days of cancellation</li>
              <li>You will receive an email confirmation with refund details</li>
              <li>Alternative: Option to transfer your registration to a future event</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. How to Request a Refund</h2>
            <p className="mb-4">To request a refund, follow these steps:</p>
            <ol className="list-decimal pl-6 mb-4">
              <li>Email us at <strong>hello@matrixo.in</strong> with subject "Refund Request"</li>
              <li>Include your <strong>Razorpay Payment ID</strong> (the reference starting with <code>pay_</code> shown on your confirmation screen and email)</li>
              <li>Provide your registered email and phone number</li>
              <li>State the reason for cancellation</li>
            </ol>
            <p className="mb-4">You do <strong>not</strong> need to send bank account details. Approved refunds are pushed back automatically to the original payment method through Razorpay. matriXO will never ask you for your card number, CVV, UPI PIN, OTP, or net banking password — treat any such request as fraudulent.</p>
            <p className="mb-4">Our team will review your request within 24-48 hours and send you a confirmation email.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Refund Processing Time</h2>
            <p className="mb-4">Once approved, we initiate the refund with Razorpay within <strong>2-3 business days</strong>. The time taken to reach you after that depends on your bank or payment provider:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Credit/Debit Card:</strong> 5-7 business days after initiation</li>
              <li><strong>UPI/Net Banking:</strong> 3-5 business days after initiation</li>
              <li><strong>Wallet Payments:</strong> 2-3 business days after initiation</li>
            </ul>
            <p className="mb-4">Refunds are always credited to the original payment method. Razorpay sends you a refund confirmation with a Refund ID (starting with <code>rfnd_</code>) once processing begins. If the amount has not reached you within the stated period, please check with your bank first quoting that Refund ID, then reach out to us and we will follow it up with Razorpay.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Non-Refundable Items</h2>
            <p className="mb-4">The following are not eligible for refunds:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Course materials or resources already accessed/downloaded</li>
              <li>Completed workshop sessions or bootcamp modules</li>
              <li>No-show without prior cancellation notice</li>
              <li>Violation of event terms and conditions</li>
              <li>Third-party services or tools included in the package</li>
              <li>The ₹5 platform fee on participant-initiated cancellations (see section 2)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Transfer Policy</h2>
            <p className="mb-4">Instead of a refund, you may transfer your registration:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Transfer to another person (same event) - Free, up to 3 days before event</li>
              <li>Transfer to future event (same price range) - ₹100 processing fee</li>
              <li>Transfer requests must be made via email to hello@matrixo.in</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Contact Us</h2>
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
