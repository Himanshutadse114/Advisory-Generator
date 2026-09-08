import { forwardRef, useRef } from 'react'

const W = 1080
const H = 1620

function wrap(text, width, fontSize, factor = 0.53) {
  const limit = Math.max(10, Math.floor(width / (fontSize * factor)))
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > limit && line) { lines.push(line); line = word } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function SvgLines({ text, x, y, width, fontSize, lineHeight = 1.28, fill, weight = 400, align = 'left', maxLines = 20 }) {
  const lines = wrap(text, width, fontSize).slice(0, maxLines)
  const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
  const tx = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x
  return <text x={tx} y={y} fontSize={fontSize} fontWeight={weight} fill={fill} textAnchor={anchor} fontFamily="Inter, Arial, sans-serif">{lines.map((line, index) => <tspan key={`${line}-${index}`} x={tx} dy={index === 0 ? 0 : fontSize * lineHeight}>{line}</tspan>)}</text>
}

function Section({ box, title, points, palette, typography, selected, id }) {
  const headingSize = typography.sectionHeadingSize || 30
  const bodySize = typography.bodySize || 22
  const pad = 28
  const itemGap = Math.max(68, Math.floor((box.h - 118) / 4))
  return <g>
    <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={26} fill={palette.soft} fillOpacity="0.88" stroke={selected ? palette.accent : palette.line} strokeWidth={selected ? 4 : 1.5} />
    <SvgLines text={title} x={box.x + pad} y={box.y + 52} width={box.w - pad * 2} fontSize={headingSize} fill={palette.ink} weight={750} maxLines={2} />
    {points.map((point, index) => {
      const cy = box.y + 112 + index * itemGap
      return <g key={`${id}-${index}`}><circle cx={box.x + pad + 18} cy={cy + 3} r={18} fill={palette.accent} /><text x={box.x + pad + 18} y={cy + 10} fill="#fff" fontSize="17" fontWeight="800" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">{index + 1}</text><SvgLines text={point} x={box.x + pad + 52} y={cy} width={box.w - pad * 2 - 54} fontSize={bodySize} fill={palette.ink} lineHeight={1.25} maxLines={3} /></g>
    })}
  </g>
}

const HybridCanvas = forwardRef(function HybridCanvas({ project, selectedLayer, onSelectLayer, onMoveLayer }, ref) {
  const drag = useRef(null)
  const { advisory, blueprint, artworkDataUrl, artworkUrl, brand } = project
  const { layers, palette, typography } = blueprint

  const startDrag = (event, id) => {
    if (!onMoveLayer || id === 'artwork') { event.stopPropagation(); onSelectLayer?.(id); return }
    event.stopPropagation()
    const svg = event.currentTarget.ownerSVGElement
    const scale = W / svg.getBoundingClientRect().width
    const source = layers[id]
    drag.current = { id, startX: event.clientX, startY: event.clientY, x: source.x, y: source.y, scale }
    onSelectLayer?.(id)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveDrag = event => {
    if (!drag.current) return
    const d = drag.current
    onMoveLayer?.(d.id, { x: Math.round(d.x + (event.clientX - d.startX) * d.scale), y: Math.round(d.y + (event.clientY - d.startY) * d.scale) })
  }
  const stopDrag = () => { drag.current = null }
  const selection = id => selectedLayer === id

  return <svg ref={ref} className="hybrid-svg" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onPointerDown={() => onSelectLayer?.('')}>
    <rect width={W} height={H} fill={palette.paper} />
    {(artworkDataUrl || artworkUrl) && <image href={artworkDataUrl || artworkUrl} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" opacity="0.98" onPointerDown={event => { event.stopPropagation(); onSelectLayer?.('artwork') }} />}
    <rect width={W} height={H} fill={palette.paper} opacity="0.035" pointerEvents="none" />
    <g onPointerDown={event => startDrag(event, 'title')} style={{ cursor: 'move' }}><SvgLines text={advisory.title} x={layers.title.x} y={layers.title.y + layers.title.fontSize} width={layers.title.w} fontSize={layers.title.fontSize} fill={palette.ink} weight={850} align={layers.title.align} maxLines={3} />{selection('title') && <rect x={layers.title.x - 8} y={layers.title.y - 8} width={layers.title.w + 16} height={layers.title.h + 16} fill="none" stroke={palette.accent} strokeWidth="3" strokeDasharray="10 8" />}</g>
    <g onPointerDown={event => startDrag(event, 'intro')} style={{ cursor: 'move' }}><SvgLines text={advisory.intro} x={layers.intro.x} y={layers.intro.y + layers.intro.fontSize} width={layers.intro.w} fontSize={layers.intro.fontSize} fill={palette.ink} weight={430} align={layers.intro.align} maxLines={7} />{selection('intro') && <rect x={layers.intro.x - 8} y={layers.intro.y - 8} width={layers.intro.w + 16} height={layers.intro.h + 16} fill="none" stroke={palette.accent} strokeWidth="3" strokeDasharray="10 8" />}</g>
    <g onPointerDown={event => startDrag(event, 'sectionOne')} style={{ cursor: 'move' }}><Section box={layers.sectionOne} title={advisory.sectionOneTitle} points={advisory.sectionOnePoints} palette={palette} typography={typography} selected={selection('sectionOne')} id="sectionOne" /></g>
    <g onPointerDown={event => startDrag(event, 'sectionTwo')} style={{ cursor: 'move' }}><Section box={layers.sectionTwo} title={advisory.sectionTwoTitle} points={advisory.sectionTwoPoints} palette={palette} typography={typography} selected={selection('sectionTwo')} id="sectionTwo" /></g>
    <g onPointerDown={event => startDrag(event, 'footer')} style={{ cursor: 'move' }}><line x1={layers.footer.x} y1={layers.footer.y} x2={layers.footer.x + layers.footer.w} y2={layers.footer.y} stroke={palette.line} strokeWidth="2" /><text x={layers.footer.x} y={layers.footer.y + 42} fill={palette.ink} fontSize="20" fontWeight="800" fontFamily="Inter, Arial, sans-serif">{brand?.logoText || 'INNVIKTA'}</text><text x={layers.footer.x + layers.footer.w} y={layers.footer.y + 42} fill={palette.ink} fontSize="18" textAnchor="end" fontFamily="Inter, Arial, sans-serif">{brand?.footerText || 'Stay aware. Stay secure.'}</text>{selection('footer') && <rect x={layers.footer.x - 8} y={layers.footer.y - 8} width={layers.footer.w + 16} height={layers.footer.h + 16} fill="none" stroke={palette.accent} strokeWidth="3" strokeDasharray="10 8" />}</g>
  </svg>
})

export default HybridCanvas
