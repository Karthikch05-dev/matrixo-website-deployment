import type { Metadata } from 'next'
import Image from 'next/image'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'About',
  description:
    'matriXO is an MSME-registered ed-tech company, supported by KPRISE, that runs hands-on technical workshops, hackathons and bootcamps with colleges across India.',
  alternates: { canonical: '/about' },
  openGraph: { url: '/about', title: 'About matriXO' },
}

const values = [
  { title: 'Students first', body: 'Every program is priced and planned around what students can afford and what helps their careers.' },
  { title: 'Built with colleges', body: 'We work alongside faculty, placement cells and student chapters, not around them.' },
  { title: 'Learn by making', body: 'If a session doesn’t end with something you built, we haven’t done our job.' },
  { title: 'Say what we do', body: 'Clear pricing, honest descriptions and quick replies. No surprises after you register.' },
]

const partners = [
  'Kommuri Pratap Reddy Institute of Technology',
  'J B Institute of Engineering and Technology',
  'TEDxKPRIT',
  'TEDxCMRIT Hyderabad',
  'TEDxIARE',
  'Smartzy Edu Pvt. Ltd.',
]

export default function AboutPage() {
  return (
    <>
      <Container className="pb-16 pt-16 sm:pb-24 sm:pt-24">
        <p className="eyebrow">About matriXO</p>
        <h1 className="mt-4 max-w-4xl text-[42px] font-semibold leading-[1.03] tracking-[-0.04em] text-ink sm:text-[64px]">
          We started matriXO because college taught us theory,
          <span className="text-muted"> and the jobs wanted practice.</span>
        </h1>
      </Container>

      <Section tone="subtle">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <SectionHeader eyebrow="Our story" title="Closing the gap between the classroom and the job." />
            <div className="space-y-5 text-[17px] leading-relaxed text-muted">
              <p>
                Too many students graduate with a degree but without the hands-on skills companies ask for in the first
                interview. We saw it in our own classes, and we decided to do something about it.
              </p>
              <p>
                matriXO is an MSME-registered ed-tech company. We run technical workshops, hackathons, bootcamps and
                career-focused events exclusively for students, in partnership with colleges across India.
              </p>
              <p>
                From AI agent workshops to full-stack bootcamps and TEDx stages, the focus never changes: practical skills,
                taught by people who use them, that lead somewhere.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-7 sm:p-9">
              <p className="eyebrow">Mission</p>
              <p className="mt-4 text-[22px] font-medium leading-snug tracking-[-0.02em] text-ink sm:text-[26px]">
                Give every student industry-relevant skills through hands-on workshops, hackathons and bootcamps, at a
                price they can afford.
              </p>
            </div>
            <div className="rounded-card border border-line bg-surface p-7 sm:p-9">
              <p className="eyebrow">Vision</p>
              <p className="mt-4 text-[22px] font-medium leading-snug tracking-[-0.02em] text-ink sm:text-[26px]">
                Every engineering student graduates with real project experience and the confidence to walk into any tech
                interview.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="subtle">
        <Container>
          <SectionHeader eyebrow="How we work" title="Four things we don’t compromise on." />
          <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <li key={v.title} className="border-t border-line pt-6">
                <span className="font-mono text-[13px] text-subtle">0{i + 1}</span>
                <h3 className="mt-3 text-[19px] font-semibold tracking-[-0.02em] text-ink">{v.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{v.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid items-center gap-10 rounded-card border border-line bg-surface p-7 sm:p-10 md:grid-cols-[220px_1fr] md:gap-14">
            <div className="flex justify-center rounded-2xl bg-white p-6 ring-1 ring-line">
              <Image src="/logos/kprise-logo.png" alt="KPRISE" width={3531} height={1130} sizes="200px" className="h-auto w-full max-w-[180px]" />
            </div>
            <div>
              <p className="eyebrow">Supported by</p>
              <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[32px]">
                KPR Foundation for Innovation and Social Empowerment
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted">
                KPRISE has given us mentorship, resources and a place to build. Their support took matriXO from an idea to a
                platform that thousands of students use.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="subtle" spacing="compact">
        <Container>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-subtle">Colleges and events we’ve worked with</p>
          <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-[17px] font-medium text-muted">
            {partners.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container size="narrow" className="text-center">
          <h2 className="text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[44px]">Meet the people behind it.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/team" size="lg">
              Meet the team
            </ButtonLink>
            <ButtonLink href="/careers" size="lg" variant="secondary">
              Join us
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
