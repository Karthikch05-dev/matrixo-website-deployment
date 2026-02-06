import Link from 'next/link'
import { FaLinkedin, FaInstagram, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300 pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10">
      <div className="container-custom px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12">
          {/* Brand */}
          <div>
            <div className="relative h-10 w-auto mb-4">
              {/* Light Mode Logo (Black) */}
              <img 
                src="/logos/logo-light.png" 
                alt="matriXO" 
                className="h-10 w-auto rounded-lg block dark:hidden"
              />
              {/* Dark Mode Logo (White) */}
              <img 
                src="/logos/logo-dark.png" 
                alt="matriXO" 
                className="h-10 w-auto rounded-lg absolute top-0 left-0 hidden dark:block"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Technical workshops, hackathons, and career-focused events for students.
            </p>
            <div className="flex space-x-4">
              <a href="https://linkedin.com/company/matrixo" target="_blank" rel="noopener noreferrer"
                 className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300">
                <FaLinkedin size={20} />
              </a>
              <a href="https://instagram.com/matrixo_official" target="_blank" rel="noopener noreferrer"
                 className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link href="/events" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Events</Link></li>
              <li><Link href="/services" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Services</Link></li>
              <li><Link href="/team" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Team</Link></li>
              <li><Link href="/blog" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              <li><Link href="/services#workshops" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Technical Workshops</Link></li>
              <li><Link href="/services#hackathons" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Hackathons</Link></li>
              <li><Link href="/services#bootcamps" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Bootcamps</Link></li>
              <li><Link href="/services#events" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Career Events</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <FaMapMarkerAlt className="mt-1 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                <span>25, Heaven Down Residency<br />RTC Colony, Nagaram<br />Hyderabad, Telangana - 501302</span>
              </li>
              <li className="flex items-center space-x-2">
                <FaEnvelope className="flex-shrink-0 text-blue-500 dark:text-blue-400" />
                <a href="mailto:hello@matrixo.in" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  hello@matrixo.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-300 dark:border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {currentYear} matriXO - An Ed-Tech Startup. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/terms" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link href="/refund" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Cancellations & Refunds</Link>
              <Link href="/shipping" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Shipping & Delivery</Link>
              <Link href="/contact" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
