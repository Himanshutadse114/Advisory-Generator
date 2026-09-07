import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import ThreatIllustration from './IllustrationLibrary'
import { getBrandProfile } from '../data/brands'

const WIDTH = 1080
const HEIGHT = 1350

function wrapText(text, maxChars = 46) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > maxChars && line) { lines.push(line); line = word } else line = candidate
  })
  if (line) lines.push(line)
  return lines
}

function TextLines({ text, x, y, width = 400, fontSize = 28, lineHeight = 1.3, weight = 400, fill, maxLines, anchor = 'start', brand }) {
  const estimatedChars = Math.max(16, Math.floor(width / (fontSize * 0.55)))
  const lines = wrapText(text, estimatedChars).slice(0, maxLines || 99)
  return <text x={x} y={y} fontFamily={brand.fontFamily} fontSize={fontSize} fontWeight={weight} fill={fill || brand.ink} textAnchor={anchor}>{lines.map((line, index) => <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : fontSize * lineHeight}>{line}</tspan>)}</text>
}

function BulletList({ points, x, y, width, brand, compact = false, inverse = false }) {
  const fontSize = compact ? 20 : 22
  const lineHeight = compact ? 1.24 : 1.28
  const itemGap = compact ? 69 : 79
  return points.slice(0, 4).map((point, index) => {
    const itemY = y + index * itemGap
    return <g key={`${point}-${index}`}><circle cx={x + 9} cy={itemY - 5} r="9" fill={brand.primary} /><text x={x + 9} y={itemY - 1} fontSize="11" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily={brand.fontFamily}>{index + 1}</text><TextLines text={point} x={x + 32} y={itemY} width={width - 32} fontSize={fontSize} lineHeight={lineHeight} fill={inverse ? '#F7F7F7' : brand.ink} maxLines={3} brand={brand} /></g>
  })
}

function pointToSvg(event) {
  const svg = event.currentTarget.ownerSVGElement
  if (!svg) return { x: event.clientX, y: event.clientY }
  const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY
  const ctm = svg.getScreenCTM()
  return ctm ? point.matrixTransform(ctm.inverse()) : point
}

function LayerGroup({ id, layer, selected, interactive, onSelect, onMove, children }) {
  const contentRef = useRef(null)
  const dragRef = useRef(null)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [box, setBox] = useState(null)
  const current = layer || { x: 0, y: 0, scale: 1, locked: false, visible: true }

  useLayoutEffect(() => {
    if (!contentRef.current) return
    try {
      const bbox = contentRef.current.getBBox()
      setBox({ x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height })
    } catch { setBox(null) }
  }, [children])

  if (current.visible === false) return null
  const handlePointerDown = event => { if (!interactive) return; event.stopPropagation(); onSelect?.(id); if (current.locked) return; dragRef.current = { start: pointToSvg(event), pointerId: event.pointerId }; event.currentTarget.setPointerCapture?.(event.pointerId) }
  const handlePointerMove = event => { if (!dragRef.current || current.locked) return; const point = pointToSvg(event); setDrag({ x: point.x - dragRef.current.start.x, y: point.y - dragRef.current.start.y }) }
  const finishDrag = event => { if (!dragRef.current) return; const delta = drag; dragRef.current = null; setDrag({ x: 0, y: 0 }); if (!current.locked && (Math.abs(delta.x) > 0.5 || Math.abs(delta.y) > 0.5)) onMove?.(id, delta.x, delta.y); event.currentTarget.releasePointerCapture?.(event.pointerId) }

  const scale = current.scale || 1
  const cx = box ? box.x + box.width / 2 : 0
  const cy = box ? box.y + box.height / 2 : 0
  const transform = `translate(${(current.x || 0) + drag.x} ${(current.y || 0) + drag.y}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`
  return <g transform={transform} data-editor-layer={id} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishDrag} onPointerCancel={finishDrag} style={{ cursor: interactive ? (current.locked ? 'default' : 'move') : 'default' }}><g ref={contentRef}>{children}</g>{interactive && selected && box && <rect data-editor-ui="selection" x={box.x - 10} y={box.y - 10} width={box.width + 20} height={box.height + 20} rx="8" fill="none" stroke="#2C6BED" strokeWidth="3" strokeDasharray="10 8" vectorEffect="non-scaling-stroke" pointerEvents="none" />}</g>
}

function layerProps(id, editor, interactive, onSelectLayer, onMoveLayer) { return { id, layer: editor?.layers?.[id], selected: editor?.selectedLayer === id, interactive, onSelect: onSelectLayer, onMove: onMoveLayer } }
function Header({ advisory, brand, compact = false }) { return <g><rect x="0" y="0" width={WIDTH} height="14" fill={brand.primary} /><text x="72" y="71" fontFamily={brand.fontFamily} fontSize="18" fontWeight="800" letterSpacing="2.4" fill={brand.primary}>{advisory.eyebrow || 'SECURITY ADVISORY'}</text>{brand.logoDataUrl ? <image href={brand.logoDataUrl} x={WIDTH - 222} y="35" width="150" height="52" preserveAspectRatio="xMaxYMid meet" /> : <text x={WIDTH - 72} y="71" fontFamily={brand.fontFamily} fontSize="17" fontWeight="700" fill={brand.ink} textAnchor="end">{brand.logoText}</text>}{!compact && <line x1="72" y1="94" x2={WIDTH - 72} y2="94" stroke={brand.line} strokeWidth="2" />}</g> }
function Footer({ advisory, brand }) { return <g><line x1="72" y1="1270" x2={WIDTH - 72} y2="1270" stroke={brand.line} strokeWidth="2" /><text x="72" y="1309" fontFamily={brand.fontFamily} fontSize="17" fontWeight="650" fill={brand.muted}>{advisory.category || 'Cybersecurity Awareness'}</text><text x={WIDTH - 72} y="1309" fontFamily={brand.fontFamily} fontSize="17" fontWeight="650" fill={brand.muted} textAnchor="end">{brand.footerText}</text></g> }

function EditorialTemplate({ advisory, brand, editor, interactive, onSelectLayer, onMoveLayer, visualFamily }) { return <><LayerGroup {...layerProps('header', editor, interactive, onSelectLayer, onMoveLayer)}><Header advisory={advisory} brand={brand} /></LayerGroup><LayerGroup {...layerProps('title', editor, interactive, onSelectLayer, onMoveLayer)}><TextLines text={advisory.title} x={72} y={174} width={610} fontSize={62} lineHeight={1.02} weight={800} maxLines={3} brand={brand} /></LayerGroup><LayerGroup {...layerProps('intro', editor, interactive, onSelectLayer, onMoveLayer)}><TextLines text={advisory.intro} x={72} y={356} width={615} fontSize={24} lineHeight={1.38} fill={brand.muted} maxLines={4} brand={brand} /></LayerGroup><LayerGroup {...layerProps('illustration', editor, interactive, onSelectLayer, onMoveLayer)}><ThreatIllustration x={738} y={120} scale={1.02} category={advisory.category} visualFamily={visualFamily} brand={brand} /></LayerGroup><rect x="72" y="535" width="936" height="2" fill={brand.line} /><LayerGroup {...layerProps('sectionOne', editor, interactive, onSelectLayer, onMoveLayer)}><rect x="72" y="583" width="448" height="608" rx="28" fill={brand.cream} /><text x="108" y="646" fontFamily={brand.fontFamily} fontSize="28" fontWeight="800" fill={brand.ink}>{advisory.sectionOneTitle}</text><rect x="108" y="666" width="55" height="6" rx="3" fill={brand.primary} /><BulletList points={advisory.sectionOnePoints} x={108} y={724} width={367} compact brand={brand} /></LayerGroup><LayerGroup {...layerProps('sectionTwo', editor, interactive, onSelectLayer, onMoveLayer)}><rect x="540" y="583" width="468" height="608" rx="28" fill="#fff" stroke={brand.line} strokeWidth="2" /><text x="576" y="646" fontFamily={brand.fontFamily} fontSize="28" fontWeight="800" fill={brand.ink}>{advisory.sectionTwoTitle}</text><rect x="576" y="666" width="55" height="6" rx="3" fill={brand.primary} /><BulletList points={advisory.sectionTwoPoints} x={576} y={724} width={382} compact brand={brand} /></LayerGroup><LayerGroup {...layerProps('footer', editor, interactive, onSelectLayer, onMoveLayer)}><Footer advisory={advisory} brand={brand} /></LayerGroup></> }

function SplitTemplate({ advisory, brand, editor, interactive, onSelectLayer, onMoveLayer, visualFamily }) { return <><LayerGroup {...layerProps('header', editor, interactive, onSelectLayer, onMoveLayer)}><Header advisory={advisory} brand={brand} compact /></LayerGroup><rect x="0" y="102" width="438" height="1168" fill={brand.cream} /><LayerGroup {...layerProps('title', editor, interactive, onSelectLayer, onMoveLayer)}><TextLines text={advisory.title} x={72} y={194} width={315} fontSize={58} lineHeight={1.02} weight={800} maxLines={4} brand={brand} /></LayerGroup><LayerGroup {...layerProps('intro', editor, interactive, onSelectLayer, onMoveLayer)}><TextLines text={advisory.intro} x={72} y={430} width={315} fontSize={23} lineHeight={1.4} fill={brand.muted} maxLines={7} brand={brand} /></LayerGroup><LayerGroup {...layerProps('illustration', editor, interactive, onSelectLayer, onMoveLayer)}><ThreatIllustration x={70} y={650} scale={1.02} category={advisory.category} visualFamily={visualFamily} brand={brand} /></LayerGroup><LayerGroup {...layerProps('sectionOne', editor, interactive, onSelectLayer, onMoveLayer)}><text x="496" y="184" fontFamily={brand.fontFamily} fontSize="30" fontWeight="800" fill={brand.ink}>{advisory.sectionOneTitle}</text><rect x="496" y="205" width="55" height="6" rx="3" fill={brand.primary} /><BulletList points={advisory.sectionOnePoints} x={496} y={272} width={510} brand={brand} /></LayerGroup><line x1="496" y1="620" x2="1008" y2="620" stroke={brand.line} strokeWidth="2" /><LayerGroup {...layerProps('sectionTwo', editor, interactive, onSelectLayer, onMoveLayer)}><text x="496" y="686" fontFamily={brand.fontFamily} fontSize="30" fontWeight="800" fill={brand.ink}>{advisory.sectionTwoTitle}</text><rect x="496" y="707" width="55" height="6" rx="3" fill={brand.primary} /><BulletList points={advisory.sectionTwoPoints} x={496} y={774} width={510} brand={brand} /></LayerGroup><LayerGroup {...layerProps('footer', editor, interactive, onSelectLayer, onMoveLayer)}><Footer advisory={advisory} brand={brand} /></LayerGroup></> }

function FlowTemplate({ advisory, brand, editor, interactive, onSelectLayer, onMoveLayer, visualFamily }) { return <><LayerGroup {...layerProps('header', editor, interactive, onSelectLayer, onMoveLayer)}><Header advisory={advisory} brand={brand} /></LayerGroup><LayerGroup {...layerProps('title', editor, interactive, onSelectLayer, onMoveLayer)}><TextLines text={advisory.title} x={72} y={176} width={620} fontSize={58} lineHeight={1.04} weight={800} maxLines={3} brand={brand} /></LayerGroup><LayerGroup {...layerProps('intro', editor, interactive, onSelectLayer, onMoveLayer)}><TextLines text={advisory.intro} x={72} y={344} width={620} fontSize={23} lineHeight={1.4} fill={brand.muted} maxLines={4} brand={brand} /></LayerGroup><LayerGroup {...layerProps('illustration', editor, interactive, onSelectLayer, onMoveLayer)}><ThreatIllustration x={748} y={112} scale={.92} category={advisory.category} visualFamily={visualFamily} brand={brand} /></LayerGroup><LayerGroup {...layerProps('sectionOne', editor, interactive, onSelectLayer, onMoveLayer)}><text x="72" y="532" fontFamily={brand.fontFamily} fontSize="28" fontWeight="800" fill={brand.ink}>{advisory.sectionOneTitle}</text><rect x="72" y="553" width="55" height="6" rx="3" fill={brand.primary} />{advisory.sectionOnePoints.slice(0, 4).map((point, index) => { const x = 72 + index * 235; return <g key={`${point}-${index}`}><circle cx={x + 28} cy="626" r="28" fill={index === 3 ? brand.primary : brand.cream} /><text x={x + 28} y="634" textAnchor="middle" fontFamily={brand.fontFamily} fontSize="20" fontWeight="800" fill={index === 3 ? '#fff' : brand.primary}>{index + 1}</text>{index < 3 && <path d={`M${x + 61} 626h137`} stroke={brand.line} strokeWidth="4" strokeLinecap="round" />}<TextLines text={point} x={x} y={700} width={205} fontSize={19} lineHeight={1.25} fill={brand.ink} maxLines={5} brand={brand} /></g> })}</LayerGroup><LayerGroup {...layerProps('sectionTwo', editor, interactive, onSelectLayer, onMoveLayer)}><rect x="72" y="890" width="936" height="294" rx="30" fill={brand.ink} /><text x="108" y="952" fontFamily={brand.fontFamily} fontSize="29" fontWeight="800" fill="#fff">{advisory.sectionTwoTitle}</text><rect x="108" y="973" width="55" height="6" rx="3" fill={brand.primary} />{advisory.sectionTwoPoints.slice(0, 4).map((point, index) => { const col = index % 2; const row = Math.floor(index / 2); const x = 108 + col * 443; const y = 1030 + row * 83; return <g key={`${point}-${index}`}><circle cx={x + 9} cy={y - 4} r="8" fill={brand.primary} /><TextLines text={point} x={x + 29} y={y} width={388} fontSize={18} lineHeight={1.25} fill="#F7F3F0" maxLines={3} brand={brand} /></g> })}</LayerGroup><LayerGroup {...layerProps('footer', editor, interactive, onSelectLayer, onMoveLayer)}><Footer advisory={advisory} brand={brand} /></LayerGroup></> }

const AdvisoryCanvas = forwardRef(function AdvisoryCanvas({ advisory, template = 'editorial', brand = getBrandProfile('innvikta'), editor, visualFamily = '', interactive = false, onSelectLayer, onMoveLayer }, ref) { const shared = { advisory, brand, editor, interactive, onSelectLayer, onMoveLayer, visualFamily }; return <svg ref={ref} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${advisory.title} advisory preview`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}><rect width={WIDTH} height={HEIGHT} fill={brand.paper} />{template === 'split' && <SplitTemplate {...shared} />}{template === 'flow' && <FlowTemplate {...shared} />}{template === 'editorial' && <EditorialTemplate {...shared} />}</svg> })

export default AdvisoryCanvas
