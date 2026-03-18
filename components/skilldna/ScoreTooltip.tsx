// ============================================================
// ScoreTooltip — "?" icon tooltip for SkillDNA score cards
// Shows: title, definition, how it's calculated, why it matters
// Dark-theme compatible, hover/click activation
// ============================================================

'use client';

import { FaQuestionCircle } from 'react-icons/fa';

export interface ScoreTooltipData {
  title: string;
  definition: string;
  howCalculated: string;
  whyItMatters: string;
}

interface ScoreTooltipProps {
  data: ScoreTooltipData;
  tooltipId: string;
  activeTooltip: string | null;
  setActiveTooltip: (id: string | null) => void;
}

export default function ScoreTooltip({ data, tooltipId, activeTooltip, setActiveTooltip }: ScoreTooltipProps) {
  const isOpen = activeTooltip === tooltipId;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setActiveTooltip(tooltipId)}
      onMouseLeave={() => setActiveTooltip(null)}
    >
      <button
        className="text-gray-400 hover:text-purple-400 transition-colors p-0.5 rounded-full focus:outline-none"
        aria-label={`Info about ${data.title}`}
        type="button"
      >
        <FaQuestionCircle size={13} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-4 rounded-xl bg-gray-900/95 dark:bg-gray-950/95 border border-gray-700/60 shadow-2xl shadow-purple-900/20 backdrop-blur-md text-left pointer-events-none"
        >
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-gray-900/95 dark:bg-gray-950/95 border-r border-b border-gray-700/60" />

          <h4 className="text-sm font-bold text-purple-400 mb-2">{data.title}</h4>

          <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
            <div>
              <span className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">What is it?</span>
              <p className="mt-0.5">{data.definition}</p>
            </div>

            <div>
              <span className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">How is it calculated?</span>
              <p className="mt-0.5">{data.howCalculated}</p>
            </div>

            <div>
              <span className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Why does it matter?</span>
              <p className="mt-0.5">{data.whyItMatters}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
