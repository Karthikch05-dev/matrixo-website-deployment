'use client'

import { FaLayerGroup } from 'react-icons/fa'

const NAVBAR_HEIGHT = 80

type FeatureToggleButtonProps = {
  isOpen: boolean
  onClick: () => void
}

export default function FeatureToggleButton({ isOpen, onClick }: FeatureToggleButtonProps) {
  return (
    <button
      type="button"
      data-feature-toggle-button="true"
      aria-label={isOpen ? 'Close feature menu' : 'Open feature menu'}
      aria-expanded={isOpen}
      aria-controls="feature-sidebar"
      onClick={onClick}
      className="fixed left-4 z-[45] w-12 h-28 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg shadow-black/10 dark:shadow-black/40 text-gray-900 dark:text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] dark:hover:shadow-[0_0_20px_rgba(129,140,248,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 flex items-center justify-center"
      style={{ top: `${NAVBAR_HEIGHT + 20}px` }}
    >
      <FaLayerGroup className="text-xl" />
    </button>
  )
}
