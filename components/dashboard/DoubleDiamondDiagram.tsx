'use client'

import type { DoubleDiamondPhase } from '@/lib/frameworks'

export type DiamondDiagramSelection = DoubleDiamondPhase | 'hmw'

type Props = {
  activeSelection: DiamondDiagramSelection
  onSelect: (selection: DiamondDiagramSelection) => void
}

const HMW_CX = 600
const HMW_CY = 350

export default function DoubleDiamondDiagram({ activeSelection, onSelect }: Props) {
  const quadrantProps = (phase: DoubleDiamondPhase) => {
    const active = activeSelection === phase
    return {
      fill: active ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 250, 243, 0.75)',
      stroke: active ? '#b45309' : '#d97706',
      strokeWidth: active ? 2.4 : 1.4,
      className: 'cursor-pointer transition-all duration-300',
    }
  }

  return (
    <svg
      viewBox="0 0 1200 650"
      className="w-full min-w-[800px] h-auto"
      role="img"
      aria-label="Revamped Double Diamond model med HMW i midten"
    >
      <defs>
        <style>{`
          .dd-top { fill: #57534e; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 18px; font-weight: 600; }
          .dd-phase-title { fill: #fbbf24; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 22px; font-weight: 700; }
          .dd-phase-sub { fill: #a8a29e; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; }
          .dd-dv { fill: #44403c; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; font-weight: 600; }
          .dd-small { fill: #78716c; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10px; }
          .dd-tiny { fill: #78716c; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10px; }
          .dd-rot { fill: #78716c; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10px; }
          .dd-axis { fill: #b45309; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 17px; font-weight: 700; }
          .dd-foot { fill: #57534e; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10px; }
        `}</style>
      </defs>

      {/* Klikbare quadrants */}
      <polygon
        points="100,350 350,150 350,550"
        {...quadrantProps('discover')}
        onClick={() => onSelect('discover')}
      />
      <polygon
        points="350,150 600,350 350,550"
        {...quadrantProps('define')}
        onClick={() => onSelect('define')}
      />
      <polygon
        points="600,350 850,150 850,550"
        {...quadrantProps('develop')}
        onClick={() => onSelect('develop')}
      />
      <polygon
        points="850,150 1100,350 850,550"
        {...quadrantProps('deliver')}
        onClick={() => onSelect('deliver')}
      />

      <g className="pointer-events-none">
        {/* Top Text Lines */}
        <g textAnchor="middle">
          <text x={350} y={80} className="dd-top">
            Doing the right things
          </text>
          <line x1={150} y1={85} x2={550} y2={85} stroke="#d6d3d1" strokeWidth={1} />
          <text x={850} y={80} className="dd-top">
            Doing things right
          </text>
          <line x1={650} y1={85} x2={1050} y2={85} stroke="#d6d3d1" strokeWidth={1} />
        </g>

        {/* Phase Titles */}
        <g textAnchor="middle">
          <text x={225} y={130} className="dd-phase-title">
            Discover
          </text>
          <text x={475} y={130} className="dd-phase-title">
            Define
          </text>
          <text x={725} y={130} className="dd-phase-title">
            Develop
          </text>
          <text x={975} y={130} className="dd-phase-title">
            Deliver
          </text>
        </g>
        <g textAnchor="middle">
          <text x={225} y={150} className="dd-phase-sub">
            Research Phase
          </text>
          <text x={475} y={150} className="dd-phase-sub">
            Synthesis Phase
          </text>
          <text x={725} y={150} className="dd-phase-sub">
            Ideation Phase
          </text>
          <text x={975} y={150} className="dd-phase-sub">
            Implementation Phase
          </text>
        </g>

        {/* Diverging / Converging */}
        <g>
          <text x={210} y={240} transform="rotate(-38, 210, 240)" className="dd-dv">
            Diverging
          </text>
          <text x={470} y={240} transform="rotate(38, 470, 240)" className="dd-dv">
            Converging
          </text>
          <text x={710} y={240} transform="rotate(-38, 710, 240)" className="dd-dv">
            Diverging
          </text>
          <text x={970} y={240} transform="rotate(38, 970, 240)" className="dd-dv">
            Converging
          </text>
        </g>

        {/* Center horizontal line */}
        <line x1={60} y1={350} x2={1140} y2={350} stroke="#e8c9a5" strokeWidth={2} />

        {/* Start / End Texts */}
        <text x={80} y={340} textAnchor="middle" className="dd-axis">
          A
        </text>
        <text x={80} y={380} textAnchor="middle" className="dd-small" style={{ fontWeight: 600, fontSize: 14 }}>
          Don&apos;t know
        </text>
        <text x={80} y={405} textAnchor="middle" className="dd-small" style={{ fontWeight: 600, fontSize: 14 }}>
          Could be
        </text>

        <text x={1120} y={340} textAnchor="middle" className="dd-axis">
          B
        </text>
        <text x={1120} y={300} textAnchor="middle" className="dd-small" style={{ fontWeight: 600, fontSize: 14 }}>
          Do know
        </text>
        <text x={1120} y={325} textAnchor="middle" className="dd-small" style={{ fontWeight: 600, fontSize: 14 }}>
          Should be
        </text>

        {/* DISCOVER SLICES */}
        <line x1={225} y1={250} x2={225} y2={450} stroke="#d6d3d1" strokeWidth={1} />
        <text x={160} y={355} className="dd-small" textAnchor="middle">
          Rip the brief
        </text>
        <text x={285} y={270} className="dd-small" textAnchor="middle">
          Conduct
        </text>
        <text x={285} y={285} className="dd-small" textAnchor="middle">
          Primary
        </text>
        <text x={285} y={300} className="dd-small" textAnchor="middle">
          Research
        </text>
        <text x={285} y={420} className="dd-small" textAnchor="middle">
          Conduct
        </text>
        <text x={285} y={435} className="dd-small" textAnchor="middle">
          Secondary
        </text>
        <text x={285} y={450} className="dd-small" textAnchor="middle">
          Research
        </text>
        <text x={285} y={350} className="dd-small" textAnchor="middle">
          Define research
        </text>
        <text x={285} y={365} className="dd-small" textAnchor="middle">
          areas and methods
        </text>

        {/* DEFINE SLICES */}
        <line x1={400} y1={190} x2={400} y2={510} stroke="#d6d3d1" strokeWidth={1} />
        <line x1={450} y1={230} x2={450} y2={470} stroke="#d6d3d1" strokeWidth={1} />
        <line x1={500} y1={270} x2={500} y2={430} stroke="#d6d3d1" strokeWidth={1} />
        <line x1={550} y1={310} x2={550} y2={390} stroke="#d6d3d1" strokeWidth={1} />
        <text x={375} y={350} transform="rotate(-90, 375, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Build Themes &amp; Clusters
        </text>
        <text x={425} y={350} transform="rotate(-90, 425, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Find Insights
        </text>
        <text x={475} y={350} transform="rotate(-90, 475, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Deduce Opportunity Areas
        </text>
        <text x={525} y={350} transform="rotate(-90, 525, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Form HMW Questions
        </text>

        {/* DEVELOP SLICES */}
        <line x1={725} y1={250} x2={725} y2={450} stroke="#d6d3d1" strokeWidth={1} />
        <text x={660} y={355} className="dd-small" textAnchor="middle">
          Ideate
        </text>
        <text x={785} y={270} className="dd-tiny" textAnchor="middle" style={{ fontSize: 9 }}>
          Set Ideas,
        </text>
        <text x={785} y={285} className="dd-tiny" textAnchor="middle" style={{ fontSize: 9 }}>
          a Design Vision
        </text>
        <text x={785} y={300} className="dd-tiny" textAnchor="middle" style={{ fontSize: 9 }}>
          &amp; Hypotheses
        </text>
        <text x={785} y={355} className="dd-small" textAnchor="middle">
          Evaluate 1st ideas
        </text>
        <text x={785} y={420} className="dd-tiny" textAnchor="middle" style={{ fontSize: 9 }}>
          Set Ideas,
        </text>
        <text x={785} y={435} className="dd-tiny" textAnchor="middle" style={{ fontSize: 9 }}>
          a Design Vision
        </text>
        <text x={785} y={450} className="dd-tiny" textAnchor="middle" style={{ fontSize: 9 }}>
          &amp; Hypotheses
        </text>

        {/* DELIVER SLICES */}
        <line x1={900} y1={190} x2={900} y2={510} stroke="#d6d3d1" strokeWidth={1} />
        <line x1={950} y1={230} x2={950} y2={470} stroke="#d6d3d1" strokeWidth={1} />
        <line x1={1000} y1={270} x2={1000} y2={430} stroke="#d6d3d1" strokeWidth={1} />
        <line x1={1050} y1={310} x2={1050} y2={390} stroke="#d6d3d1" strokeWidth={1} />
        <text x={875} y={350} transform="rotate(-90, 875, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Prototype, Test &amp; Analyse
        </text>
        <text x={925} y={350} transform="rotate(-90, 925, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Learn, Iterate &amp; Repeat
        </text>
        <text x={975} y={350} transform="rotate(-90, 975, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Build, Iterate &amp; Repeat
        </text>
        <text x={1025} y={350} transform="rotate(-90, 1025, 350)" className="dd-rot" textAnchor="middle" style={{ fontSize: 9 }}>
          Release &amp; Out
        </text>

        {/* BOTTOM LABELS */}
        <g className="dd-foot" textAnchor="start">
          <text x={100} y={580}>
            Question,
          </text>
          <text x={100} y={595}>
            Challenge,
          </text>
          <text x={100} y={610}>
            Client Brief
          </text>
          <text x={350} y={580}>
            Unstructured
          </text>
          <text x={350} y={595}>
            Research
          </text>
          <text x={350} y={610}>
            Findings
          </text>
          <text x={600} y={580}>
            Final Brief,
          </text>
          <text x={600} y={595}>
            HMW-Question,
          </text>
          <text x={600} y={610}>
            Strategy
          </text>
          <text x={850} y={580}>
            First Ideas and visions,
          </text>
          <text x={850} y={595}>
            Potential solutions,
          </text>
          <text x={850} y={610}>
            Hypothetical answers
          </text>
          <text x={1100} y={580}>
            Answers,
          </text>
          <text x={1100} y={595}>
            Product,
          </text>
          <text x={1100} y={610}>
            Solution
          </text>
        </g>

        <text x={1180} y={635} textAnchor="end" className="dd-tiny" opacity={0.55} style={{ fontSize: 9 }}>
          Efter Double Diamond (research → synthesis → ideation → delivery)
        </text>
      </g>

      {/* HMW — ovenpå, klikbar */}
      <g onClick={() => onSelect('hmw')} className="cursor-pointer">
        <circle
          cx={HMW_CX}
          cy={HMW_CY}
          r={32}
          fill={activeSelection === 'hmw' ? '#f59e0b' : '#ffffff'}
          stroke="#d97706"
          strokeWidth={activeSelection === 'hmw' ? 3 : 2}
        />
        <text
          x={HMW_CX}
          y={HMW_CY + 4}
          textAnchor="middle"
          fontSize={11}
          fill={activeSelection === 'hmw' ? '#ffffff' : '#b45309'}
          style={{ fontWeight: 700, letterSpacing: '0.1em' }}
        >
          HMW
        </text>
      </g>
    </svg>
  )
}
