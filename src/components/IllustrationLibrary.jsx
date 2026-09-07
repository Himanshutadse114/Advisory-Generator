function Shield({ x = 0, y = 0, scale = 1, fill, accent = '#fff' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M50 4 91 18v37c0 36-17 61-41 74C26 116 9 91 9 55V18L50 4Z" fill={fill} />
      <path d="m30 62 13 13 29-35" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function Phone({ x = 0, y = 0, scale = 1, brand, children }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="0" y="0" width="126" height="228" rx="28" fill={brand.ink} />
      <rect x="11" y="20" width="104" height="178" rx="16" fill="#fff" />
      <rect x="42" y="8" width="42" height="7" rx="4" fill="#5E6064" />
      <rect x="48" y="207" width="31" height="6" rx="3" fill="#5E6064" />
      {children}
    </g>
  )
}

function Laptop({ x = 0, y = 0, scale = 1, brand, children }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="13" y="0" width="210" height="138" rx="16" fill={brand.ink} />
      <rect x="26" y="14" width="184" height="108" rx="8" fill="#fff" />
      {children}
      <path d="M0 140h236l-20 24H20L0 140Z" fill="#3E4147" />
      <rect x="91" y="145" width="54" height="6" rx="3" fill="#777B82" />
    </g>
  )
}

function AlertBadge({ x, y, brand }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="0" r="31" fill={brand.primary} />
      <path d="M0-14v18" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <circle cx="0" cy="13" r="3.5" fill="#fff" />
    </g>
  )
}

function MessageScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      <Phone x="74" y="25" brand={brand}>
        <rect x="22" y="35" width="81" height="14" rx="7" fill={brand.line} />
        <rect x="22" y="62" width="68" height="44" rx="12" fill={brand.cream} />
        <rect x="30" y="74" width="51" height="6" rx="3" fill={brand.primary} opacity=".7" />
        <rect x="30" y="88" width="42" height="6" rx="3" fill={brand.line} />
        <rect x="22" y="120" width="78" height="44" rx="12" fill="#F7F7F7" />
        <rect x="30" y="132" width="52" height="6" rx="3" fill={brand.line} />
        <rect x="30" y="146" width="38" height="6" rx="3" fill={brand.line} />
      </Phone>
      <AlertBadge x="218" y="72" brand={brand} />
      <path d="M197 208c28-19 51-17 77 3" fill="none" stroke={brand.primaryDark} strokeWidth="8" strokeLinecap="round" />
      <path d="m263 198 16 13-18 10" fill="none" stroke={brand.primaryDark} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function IdentityScene({ brand }) {
  return (
    <g>
      <circle cx="145" cy="145" r="134" fill={brand.cream} />
      <Phone x="74" y="31" brand={brand}>
        <circle cx="63" cy="72" r="27" fill={brand.cream} />
        <circle cx="63" cy="66" r="10" fill={brand.primary} />
        <path d="M44 94c7-17 31-17 38 0" fill={brand.primary} />
        <rect x="27" y="115" width="72" height="9" rx="5" fill={brand.line} />
        <rect x="35" y="136" width="56" height="9" rx="5" fill={brand.line} />
      </Phone>
      <Shield x="188" y="101" scale=".75" fill={brand.primary} />
      <circle cx="242" cy="44" r="24" fill="#fff" stroke={brand.line} strokeWidth="3" />
      <path d="M231 44h22M242 33v22" stroke={brand.primaryDark} strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

function FraudScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      <Laptop x="28" y="65" scale=".92" brand={brand}>
        <rect x="43" y="34" width="116" height="15" rx="7" fill={brand.primary} opacity=".22" />
        <rect x="43" y="61" width="70" height="10" rx="5" fill={brand.line} />
        <rect x="43" y="80" width="95" height="10" rx="5" fill={brand.line} />
      </Laptop>
      <circle cx="231" cy="55" r="42" fill={brand.primary} />
      <text x="231" y="68" textAnchor="middle" fontFamily={brand.fontFamily} fontSize="36" fontWeight="800" fill="#fff">₹</text>
      <path d="M205 197c21 16 47 16 71 0" fill="none" stroke={brand.primaryDark} strokeWidth="8" strokeLinecap="round" />
      <path d="m267 184 13 14-17 8" fill="none" stroke={brand.primaryDark} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <AlertBadge x="63" y="47" brand={brand} />
    </g>
  )
}

function DeviceScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      <Laptop x="31" y="80" scale=".9" brand={brand}>
        <Shield x="72" y="17" scale=".62" fill={brand.primary} />
      </Laptop>
      <path d="M221 48h35v72h-35" fill="none" stroke={brand.primaryDark} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="253" cy="48" r="17" fill={brand.primary} />
      <circle cx="253" cy="120" r="17" fill={brand.primary} />
      <path d="M45 54c24-25 60-31 91-16" fill="none" stroke={brand.primary} strokeWidth="8" strokeLinecap="round" opacity=".65" />
    </g>
  )
}

function HumanScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      <circle cx="116" cy="79" r="35" fill="#F1B98C" />
      <path d="M78 204c8-62 26-90 68-90 43 0 62 30 70 90" fill={brand.primary} />
      <path d="M91 76c7-40 65-46 73 0-17-6-51-6-73 0Z" fill={brand.ink} />
      <rect x="151" y="125" width="116" height="78" rx="16" fill="#fff" stroke={brand.line} strokeWidth="4" />
      <rect x="169" y="145" width="79" height="9" rx="5" fill={brand.line} />
      <rect x="169" y="164" width="54" height="9" rx="5" fill={brand.line} />
      <AlertBadge x="244" y="117" brand={brand} />
      <path d="M193 62c23-17 48-15 66 4" fill="none" stroke={brand.primaryDark} strokeWidth="8" strokeLinecap="round" />
    </g>
  )
}

function PrivacyScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      <rect x="48" y="49" width="203" height="162" rx="24" fill="#fff" stroke={brand.line} strokeWidth="4" />
      <circle cx="98" cy="102" r="28" fill={brand.cream} />
      <circle cx="98" cy="95" r="10" fill={brand.primary} />
      <path d="M78 120c8-19 31-19 40 0" fill={brand.primary} />
      <rect x="139" y="79" width="78" height="10" rx="5" fill={brand.line} />
      <rect x="139" y="103" width="62" height="10" rx="5" fill={brand.line} />
      <rect x="79" y="151" width="138" height="12" rx="6" fill={brand.line} />
      <rect x="79" y="176" width="95" height="12" rx="6" fill={brand.line} />
      <Shield x="190" y="133" scale=".63" fill={brand.primary} />
    </g>
  )
}

function NetworkScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      {[[64,73],[232,72],[62,211],[236,207]].map(([x,y], index) => (
        <g key={index}>
          <circle cx={x} cy={y} r="25" fill="#fff" stroke={brand.primary} strokeWidth="5" />
          <circle cx={x} cy={y} r="8" fill={brand.primary} />
        </g>
      ))}
      <circle cx="150" cy="143" r="44" fill={brand.primary} />
      <path d="M84 84 123 118M215 84l-39 34M83 196l40-31M214 195l-39-31" stroke={brand.primaryDark} strokeWidth="7" strokeLinecap="round" />
      <Shield x="123" y="112" scale=".52" fill="#fff" accent={brand.primary} />
      <AlertBadge x="151" y="46" brand={brand} />
    </g>
  )
}

function AIScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      <rect x="57" y="51" width="186" height="184" rx="36" fill="#fff" stroke={brand.line} strokeWidth="4" />
      <circle cx="150" cy="142" r="63" fill={brand.primary} opacity=".12" />
      <path d="M109 136c0-26 18-46 41-46s41 20 41 46v34h-82v-34Z" fill={brand.primary} />
      <circle cx="132" cy="135" r="6" fill="#fff" />
      <circle cx="168" cy="135" r="6" fill="#fff" />
      <path d="M132 155c11 8 25 8 36 0" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M150 71V48M92 101 74 87M208 101l18-14M91 183l-20 14M210 183l18 14" stroke={brand.primaryDark} strokeWidth="7" strokeLinecap="round" />
      <Shield x="187" y="169" scale=".54" fill={brand.primaryDark} />
    </g>
  )
}

function GeneralScene({ brand }) {
  return (
    <g>
      <circle cx="150" cy="145" r="134" fill={brand.cream} />
      <Laptop x="34" y="81" scale=".86" brand={brand}>
        <Shield x="76" y="18" scale=".58" fill={brand.primary} />
      </Laptop>
      <AlertBadge x="233" y="59" brand={brand} />
    </g>
  )
}

function sceneFor(category = '', visualFamily = '') {
  const value = `${category} ${visualFamily}`.toLowerCase()
  if (value.includes('phishing') || value.includes('message')) return MessageScene
  if (value.includes('identity') || value.includes('access')) return IdentityScene
  if (value.includes('financial') || value.includes('fraud')) return FraudScene
  if (value.includes('malware') || value.includes('device')) return DeviceScene
  if (value.includes('social') || value.includes('voice') || value.includes('human')) return HumanScene
  if (value.includes('privacy') || value.includes('data')) return PrivacyScene
  if (value.includes('network')) return NetworkScene
  if (value.includes('ai') || value.includes('bot')) return AIScene
  return GeneralScene
}

export default function ThreatIllustration({ x = 0, y = 0, scale = 1, category, visualFamily, brand }) {
  const Scene = sceneFor(category, visualFamily)
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-illustration-family={visualFamily || 'auto'}>
      <Scene brand={brand} />
    </g>
  )
}
