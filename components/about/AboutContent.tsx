'use client'

import { motion } from 'framer-motion'
import { FaGraduationCap, FaLightbulb, FaRocket, FaUsers, FaHeart, FaAward } from 'react-icons/fa'

export default function AboutContent() {
  return (
    <div className="min-h-screen pt-0">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white section-padding overflow-hidden">
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 backdrop-blur-[1px]" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="container-custom px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              About <span className="gradient-text">matriXO</span>
            </h1>
            <p className="text-2xl text-gray-300 mb-8">
              Empowering students through technical workshops, hackathons, and career-focused bootcamps
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-padding bg-transparent">
        <div className="container-custom px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-display font-bold mb-6">
                Our <span className="gradient-text">Story</span>
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                matriXO is an MSME-registered organization dedicated to bridging the gap between academic learning 
                and industry requirements. We specialize in conducting hands-on technical workshops, competitive hackathons, 
                intensive bootcamps, and career-focused events exclusively for students.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Our journey began when we recognized that traditional education often lacks practical, industry-relevant training. 
                Students were graduating without the real-world skills that companies demand. We set out to change that.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Today, we partner with leading educational institutions across India to deliver technical training programs 
                that transform students into industry-ready professionals. From full-stack development bootcamps to AI/ML workshops, 
                we focus on what matters: building skills that lead to careers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-12"
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-4xl font-bold gradient-text mb-4">Why Choose matriXO?</h3>
                  <ul className="space-y-4 text-gray-600 dark:text-gray-400 text-lg">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Hands-on technical training programs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Industry-relevant curriculum</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Expert mentorship and guidance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Growing partner network</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Career-focused approach</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-white/30 dark:bg-white/[0.01] backdrop-blur-sm">
        <div className="container-custom px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <FaRocket className="text-5xl text-neon-blue mb-6" />
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Our Mission</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                To empower every student with industry-relevant technical skills through hands-on workshops, 
                competitive hackathons, and intensive bootcamps. We believe that practical learning, combined 
                with expert mentorship, is the key to building successful tech careers. Our mission is to make 
                quality technical education accessible to all students.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8"
            >
              <FaLightbulb className="text-5xl text-neon-purple mb-6" />
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Our Vision</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                To become India's most trusted technical education platform for students, creating a vibrant 
                ecosystem where learning meets career opportunities. We envision a future where every engineering 
                student graduates not just with a degree, but with real project experience, competitive coding skills, 
                and the confidence to succeed in the tech industry.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-transparent">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FaGraduationCap,
                title: 'Student-First',
                description: 'Every program is designed with student career growth in mind, from affordable pricing to placement support.',
              },
              {
                icon: FaUsers,
                title: 'Collaboration',
                description: 'We work closely with colleges, industry experts, and companies to create programs that truly matter.',
              },
              {
                icon: FaHeart,
                title: 'Passion for Education',
                description: 'We\'re driven by a genuine passion for empowering students through educational opportunities.',
              },
              {
                icon: FaRocket,
                title: 'Innovation',
                description: 'We constantly evolve our platform with cutting-edge technology to serve our users better.',
              },
              {
                icon: FaAward,
                title: 'Excellence',
                description: 'We strive for excellence in every aspect of our service, from technology to customer support.',
              },
              {
                icon: FaLightbulb,
                title: 'Transparency',
                description: 'We maintain open, honest communication with all stakeholders and operate with integrity.',
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 hover-lift text-center"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-blue to-neon-purple rounded-2xl 
                              flex items-center justify-center mb-6 text-white">
                  <value.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Incubation */}
      <section className="section-padding bg-gradient-to-br from-neon-blue/10 to-neon-purple/10">
        <div className="container-custom px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto glass-card p-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Supported by <span className="gradient-text">KPRISE</span>
            </h2>
            <div className="flex justify-center mb-6">
              <div className="dark:bg-white p-4 rounded-xl">
                <img 
                  src="/logos/kprise-logo.png" 
                  alt="KPRISE Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              We&apos;re proud to be supported by <strong>KPR Foundation for Innovation and Social Empowerment (KPRISE)</strong>, 
              which has provided us with mentorship, resources, and a collaborative environment to grow. This partnership 
              has been instrumental in our journey from an idea to a thriving platform serving thousands of students.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="px-4 py-2 glass-chip">EdTech Startup</span>
              <span className="px-4 py-2 glass-chip">Supported 2023</span>
              <span className="px-4 py-2 glass-chip">Hyderabad, India</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

