import { forwardRef } from 'react'
import { BRAND } from '../lib/advisoryEngine'

const WIDTH = 1080
const HEIGHT = 1350

function wrapText(text, maxChars = 46) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })

  if (line) lines.push(line)
  return lines
}

function TextLines({ text, x, y, width = 400, fontSize = 28, lineHeight = 1.3, weight = 400, fill = BRAND.ink, maxLines, anchor = 'start' }) {
  const estimatedChars = Math.max(16, Math.floor(width / (fontSize * 0.55)))
  const lines = wrapText(text, estimatedChars).slice(0, maxLines || 99)

  return (
    <text x={x} y={y} fontFamily="Inter, Arial, sans-serif" fontSize={fontSize} fontWeight={weight} fill={fill} textAnchor={anchor}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : fontSize * lineHeight}>{line}</tspan>
      ))}
    </text>
  )
}

function BulletList({ points, x, y, width, accent = BRAND.primary, compact = false }) {
  const fontSize = compact ? 20 : 22
  const lineHeight = compact ? 1.24 : 1.28
  const itemGap = compact ? 69 : 79

  return points.slice(0, 4).map((point, index) => {
    const itemY = y + index * itemGap
    return (
      <g key={`${point}-${index}`}>
        <circle cx={x + 9} cy={itemY - 5} r="9" fill={accent} />
        <text x={x + 9} y={itemY - 1} fontSize="11" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">
          {index + 1}
        </text>
        <TextLines text={point} x={x + 32} y={itemY} width={width - 32} fontSize={fontSize} lineHeight={lineHeight} fill={BRAND.ink} maxLines={3} />
      </g>
    )
  })
}

function SecurityVisual({ x, y, scale = 1, variant = 'phone' }) {
  if (variant === 'flow') {
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <circle cx="125" cy="125" r="112" fill="#FFF1E7" />
        <path d="M66 78h118c16 0 29 13 29 29v86c0 16-13 29-29 29H66c-16 0-29-13-29-29v-86c0-16 13-29 29-29Z" fill="#fff" stroke={BRAND.line} strokeWidth="4" />
        <rect x="61" y="103" width="128" height="16" rx="8" fill="#FFD6BB" />
        <rect x="61" y="135" width="92" height="12" rx="6" fill="#E9E5E1" />
        <rect x="61" y="160" width="112" height="12" rx="6" fill="#E9E5E1" />
        <path d="M146 28l53 18v49c0 47-24 79-53 94-29-15-53-47-53-94V46l53-18Z" fill={BRAND.primary} />
        <path d="m119 93 18 18 38-42" fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M215 131h52" stroke={BRAND.primaryDark} strokeWidth="8" strokeLinecap="round" />
        <path d="m251 116 18 15-18 15" fill="none" stroke={BRAND.primaryDark} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="128" cy="127" r="116" fill="#FFF0E5" />
      <rect x="73" y="25" width="118" height="211" rx="28" fill={BRAND.ink} />
      <rect x="83" y="45" width="98" height="166" rx="13" fill="#fff" />
      <rect x="103" y="65" width="58" height="10" rx="5" fill="#FFD1B3" />
      <rect x="103" y="88" width="58" height="48" rx="10" fill="#FFF2E9" stroke="#F9C6A6" strokeWidth="3" />
      <path d="M132 100l18 6v17c0 16-8 26-18 31-10-5-18-15-18-31v-17l18-6Z" fill={BRAND.primary} />
      <path d="m124 123 6 6 13-15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="102" y="153" width="60" height="8" rx="4" fill="#E7E2DE" />
      <rect x="113" y="220" width="39" height="6" rx="3" fill="#5A5A5C" />
      <circle cx="203" cy="77" r="35" fill={BRAND.primary} />
      <path d="M203 57v25" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="203" cy="92" r="4" fill="#fff" />
    </g>
  )
}

function Header({ advisory, compact = false }) {
  return (
    <g>
      <rect x="0" y="0" width={WIDTH} height="14" fill={BRAND.primary} />
      <text x="72" y="71" fontFamily="Inter, Arial, sans-serif" fontSize="18" fontWeight="800" letterSpacing="2.4" fill={BRAND.primary}>
        {advisory.eyebrow || 'SECURITY ADVISORY'}
      </text>
      <text x={WIDTH - 72} y="71" fontFamily="Inter, Arial, sans-serif" fontSize="17" fontWeight="700" fill={BRAND.ink} textAnchor="end">
        INNVIKTA
      </text>
      {!compact && <line x1="72" y1="94" x2={WIDTH - 72} y2="94" stroke={BRAND.line} strokeWidth="2" />}
    </g>
  )
}

function Footer({ advisory }) {
  return (
    <g>
      <line x1="72" y1="1270" x2={WIDTH - 72} y2="1270" stroke={BRAND.line} strokeWidth="2" />
      <text x="72" y="1309" fontFamily="Inter, Arial, sans-serif" fontSize="17" fontWeight="650" fill={BRAND.muted}>
        {advisory.category || 'Cybersecurity Awareness'}
      </text>
      <text x={WIDTH - 72} y="1309" fontFamily="Inter, Arial, sans-serif" fontSize="17" fontWeight="650" fill={BRAND.muted} textAnchor="end">
        Think • Verify • Report
      </text>
    </g>
  )
}

function EditorialTemplate({ advisory }) {
  return (
    <>
      <Header advisory={advisory} />
      <TextLines text={advisory.title} x={72} y={174} width={610} fontSize={62} lineHeight={1.02} weight={800} maxLines={3} />
      <TextLines text={advisory.intro} x={72} y={356} width={615} fontSize={24} lineHeight={1.38} fill={BRAND.muted} maxLines={4} />
      <SecurityVisual x={748} y={142} scale={1.02} />

      <rect x="72" y="535" width="936" height="2" fill={BRAND.line} />
      <rect x="72" y="583" width="448" height="608" rx="28" fill="#FFF8F2" />
      <rect x="540" y="583" width="468" height="608" rx="28" fill="#fff" stroke={BRAND.line} strokeWidth="2" />

      <text x="108" y="646" fontFamily="Inter, Arial, sans-serif" fontSize="28" fontWeight="800" fill={BRAND.ink}>{advisory.sectionOneTitle}</text>
      <rect x="108" y="666" width="55" height="6" rx="3" fill={BRAND.primary} />
      <BulletList points={advisory.sectionOnePoints} x={108} y={724} width={367} compact />

      <text x="576" y="646" fontFamily="Inter, Arial, sans-serif" fontSize="28" fontWeight="800" fill={BRAND.ink}>{advisory.sectionTwoTitle}</text>
      <rect x="576" y="666" width="55" height="6" rx="3" fill={BRAND.primary} />
      <BulletList points={advisory.sectionTwoPoints} x={576} y={724} width={382} compact />
      <Footer advisory={advisory} />
    </>
  )
}

function SplitTemplate({ advisory }) {
  return (
    <>
      <Header advisory={advisory} compact />
      <rect x="0" y="102" width="438" height="1168" fill="#FFF4EC" />
      <TextLines text={advisory.title} x={72} y={194} width={315} fontSize={58} lineHeight={1.02} weight={800} maxLines={4} />
      <TextLines text={advisory.intro} x={72} y={430} width={315} fontSize={23} lineHeight={1.4} fill={BRAND.muted} maxLines={7} />
      <SecurityVisual x={82} y={686} scale={1.08} />
      <text x="496" y="184" fontFamily="Inter, Arial, sans-serif" fontSize="30" fontWeight="800" fill={BRAND.ink}>{advisory.sectionOneTitle}</text>
      <rect x="496" y="205" width="55" height="6" rx="3" fill={BRAND.primary} />
      <BulletList points={advisory.sectionOnePoints} x={496} y={272} width={510} />
      <line x1="496" y1="620" x2="1008" y2="620" stroke={BRAND.line} strokeWidth="2" />
      <text x="496" y="686" fontFamily="Inter, Arial, sans-serif" fontSize="30" fontWeight="800" fill={BRAND.ink}>{advisory.sectionTwoTitle}</text>
      <rect x="496" y="707" width="55" height="6" rx="3" fill={BRAND.primary} />
      <BulletList points={advisory.sectionTwoPoints} x={496} y={774} width={510} />
      <Footer advisory={advisory} />
    </>
  )
}

function FlowTemplate({ advisory }) {
  return (
    <>
      <Header advisory={advisory} />
      <TextLines text={advisory.title} x={72} y={176} width={620} fontSize={58} lineHeight={1.04} weight={800} maxLines={3} />
      <TextLines text={advisory.intro} x={72} y={344} width={620} fontSize={23} lineHeight={1.4} fill={BRAND.muted} maxLines={4} />
      <SecurityVisual x={762} y={126} scale={0.9} variant="flow" />

      <text x="72" y="532" fontFamily="Inter, Arial, sans-serif" fontSize="28" fontWeight="800" fill={BRAND.ink}>{advisory.sectionOneTitle}</text>
      <rect x="72" y="553" width="55" height="6" rx="3" fill={BRAND.primary} />

      {advisory.sectionOnePoints.slice(0, 4).map((point, index) => {
        const x = 72 + index * 235
        return (
          <g key={`${point}-${index}`}>
            <circle cx={x + 28} cy="626" r="28" fill={index === 3 ? BRAND.primary : '#FFF0E5'} />
            <text x={x + 28} y="634" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="20" fontWeight="800" fill={index === 3 ? '#fff' : BRAND.primary}>{index + 1}</text>
            {index < 3 && <path d={`M${x + 61} 626h137`} stroke="#E0D2C9" strokeWidth="4" strokeLinecap="round" />}
            <TextLines text={point} x={x} y={700} width={205} fontSize={19} lineHeight={1.25} fill={BRAND.ink} maxLines={5} />
          </g>
        )
      })}

      <rect x="72" y="890" width="936" height="294" rx="30" fill={BRAND.ink} />
      <text x="108" y="952" fontFamily="Inter, Arial, sans-serif" fontSize="29" fontWeight="800" fill="#fff">{advisory.sectionTwoTitle}</text>
      <rect x="108" y="973" width="55" height="6" rx="3" fill={BRAND.primary} />
      {advisory.sectionTwoPoints.slice(0, 4).map((point, index) => {
        const col = index % 2
        const row = Math.floor(index / 2)
        const x = 108 + col * 443
        const y = 1030 + row * 83
        return (
          <g key={`${point}-${index}`}>
            <circle cx={x + 9} cy={y - 4} r="8" fill={BRAND.primary} />
            <TextLines text={point} x={x + 29} y={y} width={388} fontSize={18} lineHeight={1.25} fill="#F7F3F0" maxLines={3} />
          </g>
        )
      })}
      <Footer advisory={advisory} />
    </>
  )
}

const AdvisoryCanvas = forwardRef(function AdvisoryCanvas({ advisory, template = 'editorial' }, ref) {
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${advisory.title} advisory preview`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect width={WIDTH} height={HEIGHT} fill={BRAND.paper} />
      {template === 'split' && <SplitTemplate advisory={advisory} />}
      {template === 'flow' && <FlowTemplate advisory={advisory} />}
      {template === 'editorial' && <EditorialTemplate advisory={advisory} />}
    </svg>
  )
})

export default AdvisoryCanvas
