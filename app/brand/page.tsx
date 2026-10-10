import type { Metadata } from 'next'
import { Check, Download, X } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import { CopyHex, UiKit } from '@/components/brand/BrandInteractive'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Section, SectionHeader } from '@/components/ui/Section'

export const metadata: Metadata = {
  title: 'Brand kit',
  description:
    'Download the matriXO logo, XO mark and app icon in SVG and PNG, with brand colours, typography, UI components and usage guidelines.',
  alternates: { canonical: '/brand' },
  openGraph: { url: '/brand', title: 'matriXO brand kit' },
}

const logos = [
  {
    name: 'Wordmark',
    note: 'The primary logo. Use it wherever there’s room.',
    variant: 'wordmark' as const,
    files: [
      { label: 'SVG', light: '/brand/matrixo-logo.svg', dark: '/brand/matrixo-logo-white.svg' },
      { label: 'PNG', light: '/brand/matrixo-logo.png', dark: '/brand/matrixo-logo-white.png' },
    ],
  },
  {
    name: 'XO mark',
    note: 'For tight spaces, stickers and social posts.',
    variant: 'mark' as const,
    files: [
      { label: 'SVG', light: '/brand/matrixo-mark.svg', dark: '/brand/matrixo-mark-white.svg' },
      { label: 'PNG', light: '/brand/matrixo-mark.png', dark: '/brand/matrixo-mark-white.png' },
    ],
  },
]

const colours = [
  { name: 'Ink', hex: '#0A0A0B', use: 'Wordmark and primary text', swatch: 'bg-[#0A0A0B]' },
  { name: 'Paper', hex: '#FFFFFF', use: 'Light backgrounds', swatch: 'bg-white ring-1 ring-inset ring-line' },
  { name: 'Mist', hex: '#F5F5F7', use: 'Light surfaces', swatch: 'bg-[#F5F5F7] ring-1 ring-inset ring-line' },
  { name: 'Night', hex: '#06070B', use: 'Dark backgrounds', swatch: 'bg-[#06070B]' },
  { name: 'XO Blue', hex: '#2283C5', use: 'The glow inside the O', swatch: 'bg-[#2283C5]' },
  { name: 'Signal', hex: '#0A6FD6', use: 'Links and buttons, light UI', swatch: 'bg-[#0A6FD6]' },
  { name: 'Signal Dark', hex: '#4BA3F5', use: 'Links on dark UI', swatch: 'bg-[#4BA3F5]' },
  { name: 'Graphite', hex: '#6E6E73', use: 'Secondary text', swatch: 'bg-[#6E6E73]' },
]

const typeScale = [
  { label: 'Display', size: 'text-[48px] sm:text-[64px]', spec: '64 / 1.02 · Semibold · −4%', sample: 'Learn by building.' },
  { label: 'Title', size: 'text-[32px] sm:text-[40px]', spec: '40 / 1.06 · Semibold · −3%', sample: 'Explore programs.' },
  { label: 'Headline', size: 'text-[21px]', spec: '21 / 1.3 · Semibold · −2%', sample: 'DevAgentic 2.0 — 24-hour AI agents hackathon' },
  { label: 'Body', size: 'text-[17px]', spec: '17 / 1.6 · Regular', sample: 'Hands-on workshops, hackathons and talks, run with colleges across India.' },
  { label: 'Caption', size: 'text-[13px]', spec: '13 / 1.5 · Medium', sample: '11 Jul 2026 · 3:00 PM · Hyderabad' },
]

const dos = [
  'Keep clear space around the logo equal to the height of the X.',
  'Use the black logo on light backgrounds and the white logo on dark ones.',
  'Use at least 88 px wide on screen and 22 mm in print.',
  'Place the white logo over the darker part of a photo.',
]

const donts = [
  'Recolour, stretch, rotate or outline the logo.',
  'Change the blue glow in the O or add effects to it.',
  'Rebuild the wordmark in another font.',
  'Put the logo on busy backgrounds where it loses contrast.',
]

const sections = [
  { id: 'logo', label: 'Logo' },
  { id: 'colour', label: 'Colour' },
  { id: 'type', label: 'Type' },
  { id: 'components', label: 'Components' },
  { id: 'usage', label: 'Usage' },
]

export default function BrandPage() {
  return (
    <>
      <Container className="pb-12 pt-16 sm:pb-16 sm:pt-24">
        <SectionHeader
          as="h1"
          size="xl"
          eyebrow="Brand kit"
          title={
            <>
              The matriXO brand.
              <span className="text-muted"> Ready to download.</span>
            </>
          }
          description="Logos, colours, type and the interface components we build with. Everything you need to represent matriXO well, whether you’re a teammate, a partner college or press."
          actions={
            <>
              <ButtonLink href="/brand/matrixo-brand-kit.zip" size="lg" external leadingIcon={<Download aria-hidden="true" className="h-4 w-4" />}>
                Download full kit
              </ButtonLink>
              <ButtonLink href="mailto:hello@matrixo.in?subject=Brand%20request" size="lg" variant="secondary">
                Request other formats
              </ButtonLink>
            </>
          }
        />
        <nav aria-label="Brand kit sections" className="mt-12 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-surface px-4 py-2 text-[14px] font-medium text-muted transition-colors hover:text-ink">
              {s.label}
            </a>
          ))}
        </nav>
      </Container>

      {/* Logo */}
      <Section tone="subtle" id="logo" className="scroll-mt-16">
        <Container>
          <SectionHeader eyebrow="Logo" title="Wordmark and XO mark." description="Vector files scale to any size. PNGs are high resolution with transparent backgrounds." />
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {logos.map((logo) => (
              <div key={logo.name} className="overflow-hidden rounded-card border border-line bg-surface">
                <div className="grid grid-cols-2">
                  <div className="flex aspect-[4/3] items-center justify-center bg-white text-[#0A0A0B]">
                    <Logo variant={logo.variant} height={logo.variant === 'mark' ? 56 : 40} title={`${logo.name} on light`} />
                  </div>
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#06070B] text-white">
                    <Logo variant={logo.variant} height={logo.variant === 'mark' ? 56 : 40} title={`${logo.name} on dark`} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line p-5">
                  <div>
                    <h3 className="text-[17px] font-semibold text-ink">{logo.name}</h3>
                    <p className="text-[14px] text-muted">{logo.note}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {logo.files.map((f) => (
                      <span key={f.label} className="inline-flex overflow-hidden rounded-full border border-line-strong text-[13px] font-medium">
                        <a href={f.light} download className="px-3 py-1.5 text-ink hover:bg-canvas-subtle">
                          {f.label} black
                        </a>
                        <a href={f.dark} download className="border-l border-line-strong px-3 py-1.5 text-ink hover:bg-canvas-subtle">
                          {f.label} white
                        </a>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-6 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/matrixo-app-icon.svg" alt="matriXO app icon" width={88} height={88} className="h-[88px] w-[88px] rounded-[20px]" />
            <div className="flex-1">
              <h3 className="text-[17px] font-semibold text-ink">App icon</h3>
              <p className="text-[14px] text-muted">For favicons, social profile pictures and home-screen icons.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[13px] font-medium">
              <a href="/brand/matrixo-app-icon.svg" download className="rounded-full border border-line-strong px-3 py-1.5 text-ink hover:bg-canvas-subtle">
                SVG
              </a>
              <a href="/brand/matrixo-app-icon-512.png" download className="rounded-full border border-line-strong px-3 py-1.5 text-ink hover:bg-canvas-subtle">
                PNG 512
              </a>
              <a href="/brand/matrixo-app-icon-maskable-512.png" download className="rounded-full border border-line-strong px-3 py-1.5 text-ink hover:bg-canvas-subtle">
                Square 512
              </a>
            </div>
          </div>
        </Container>
      </Section>

      {/* Colour */}
      <Section id="colour" className="scroll-mt-16">
        <Container>
          <SectionHeader eyebrow="Colour" title="Mostly ink and paper. A little blue." description="The blue comes from the glow in the O. Use it for what people can tap, and sparingly everywhere else." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {colours.map((c) => (
              <li key={c.name} className="overflow-hidden rounded-card border border-line bg-surface">
                <div className={`h-28 ${c.swatch}`} />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-ink">{c.name}</h3>
                    <CopyHex value={c.hex} className="-mr-2" />
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{c.use}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Type */}
      <Section tone="subtle" id="type" className="scroll-mt-16">
        <Container>
          <SectionHeader
            eyebrow="Typography"
            title="Inter, everywhere."
            description="One typeface for interface, headings and body. Tight tracking on large sizes, generous line height on small ones."
            actions={
              <ButtonLink href="https://rsms.me/inter/" variant="secondary" external>
                Get Inter
              </ButtonLink>
            }
          />
          <ul className="mt-10 divide-y divide-line rounded-card border border-line bg-surface">
            {typeScale.map((t) => (
              <li key={t.label} className="grid gap-2 p-5 sm:grid-cols-[160px_1fr] sm:items-baseline sm:gap-8 sm:p-6">
                <div>
                  <p className="text-[13px] font-semibold text-ink">{t.label}</p>
                  <p className="font-mono text-[12px] text-subtle">{t.spec}</p>
                </div>
                <p className={`${t.size} font-semibold leading-tight tracking-[-0.03em] text-ink ${t.label === 'Body' || t.label === 'Caption' ? '!font-normal !tracking-normal text-muted' : ''}`}>
                  {t.sample}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Components */}
      <Section id="components" className="scroll-mt-16">
        <Container>
          <SectionHeader
            eyebrow="UI kit"
            title="The components behind every page."
            description="These are the live components from the site, so what you see here is exactly what ships. Developers: import them from components/ui."
          />
          <div className="mt-10">
            <UiKit />
          </div>
        </Container>
      </Section>

      {/* Usage */}
      <Section tone="subtle" id="usage" className="scroll-mt-16">
        <Container>
          <SectionHeader eyebrow="Usage" title="A few simple rules." />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
              <h3 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
                <Check aria-hidden="true" className="h-5 w-5 text-success" /> Do
              </h3>
              <ul className="mt-4 space-y-3">
                {dos.map((d) => (
                  <li key={d} className="text-[15px] leading-relaxed text-muted">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
              <h3 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
                <X aria-hidden="true" className="h-5 w-5 text-danger" /> Don’t
              </h3>
              <ul className="mt-4 space-y-3">
                {donts.map((d) => (
                  <li key={d} className="text-[15px] leading-relaxed text-muted">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-8 text-[14px] text-muted">
            Need something not covered here, or permission to use the logo commercially? Email{' '}
            <a className="link" href="mailto:hello@matrixo.in?subject=Brand%20request">
              hello@matrixo.in
            </a>
            .
          </p>
        </Container>
      </Section>
    </>
  )
}
