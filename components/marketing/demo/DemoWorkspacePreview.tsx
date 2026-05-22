'use client'

import { useState } from 'react'
import type { DemoTabId } from '@/lib/marketing-demo-data'
import { DEMO_TABS } from '@/lib/marketing-demo-data'
import DemoBoardPreview from './DemoBoardPreview'
import DemoMethodsPreview from './DemoMethodsPreview'
import DemoResearchPreview from './DemoResearchPreview'
import DemoAiPreview from './DemoAiPreview'
import DemoOutputPreview from './DemoOutputPreview'

export default function DemoWorkspacePreview() {
  const [activeTab, setActiveTab] = useState<DemoTabId>('board')

  return (
    <div
      id="demo-workspace"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5"
    >
      {/* Workspace topbar */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-[#fafbfc] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-gray-900">
            Demo-projekt: Ny digital service
          </p>
          <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            Preview
          </span>
        </div>
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 sm:mx-0">
          {DEMO_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[420px] bg-[#f8f9fb] p-4 sm:p-5 md:min-h-[480px]">
        {activeTab === 'board' && <DemoBoardPreview />}
        {activeTab === 'methods' && <DemoMethodsPreview />}
        {activeTab === 'research' && <DemoResearchPreview />}
        {activeTab === 'ai' && <DemoAiPreview />}
        {activeTab === 'output' && <DemoOutputPreview />}
      </div>
    </div>
  )
}
