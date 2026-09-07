import { useEffect, useMemo, useRef, useState } from 'react'
import AdvisoryCanvas from './components/AdvisoryCanvas'
import AdminPanel from './components/AdminPanel'
import { advisoryReferences } from './data/references'
import { BRAND_PROFILES, createCustomBrand, getBrandProfile, sanitiseBrandProfile } from './data/brands'
import {
  ADVISORY_TYPES,
  AUDIENCES,
  TEMPLATES,
  generateAdvisory,
  getRecommendedTemplate
} from './lib/advisoryEngine'
import { generateAdvisoryContent } from './lib/contentService'
import { getBestFitTemplate, prepareAdvisoryForLayout, tightenAdvisoryCopy } from './lib/designIntelligence'
import { getReferenceDirection } from './lib/referenceIntelligence'
import { exportAsPng, exportAsSvg, exportPrintSvg } from './lib/exportAdvisory'
import { evaluateAdvisory } from './lib/qualityChecker'
import { createEditorState, EDITOR_LAYERS, resetAllLayers, resetLayerState, updateLayerState } from './lib/editorState'
import useDocumentHistory from './hooks/useDocumentHistory'
import './quality.css'
import './advanced-editor.css'
import './admin.css'

const VISUAL_FAMILIES = [
  ['auto', 'Auto from references'],
  ['message-threat', 'Messaging / phishing'],
  ['identity-protection', 'Identity & access'],
  ['fraud-alert', 'Financial fraud'],
  ['device-security', 'Device security'],
  ['human-manipulation', 'Social engineering'],
  ['privacy-risk', 'Data & privacy'],
  ['network-threat', 'Network security'],
  ['ai-safety', 'AI safety']
]

const initialAdvisory = generateAdvisory({ topic: 'MFA Fatigue Attack', audience: 'All Employees', advisoryType: 'Internal Advisory' })
initialAdvisory.generation = { mode: 'local-preview', provider: 'local-rules', model: null }
const initialDirection = getReferenceDirection(initialAdvisory)
const initialPreferred = initialDirection.template || getRecommendedTemplate(initialAdvisory.category)
const initialPrepared = prepareAdvisoryForLayout(initialAdvisory, initialPreferred)

const initialDocument = {
  advisory: initialPrepared.advisory,
  template: initialPrepared.template,
  brand: getBrandProfile('innvikta'),
  editor: createEditorState(),
  referenceDirection: initialDirection,
  visualFamily: initialDirection.visualFamily || 'auto'
}

function EditablePoint({ value, onChange, index }) {
  return <label className="point-field"><span>{index + 1}</span><textarea value={value} rows="3" onChange={event => onChange(event.target.value)} /></label>
}

function ColourField({ label, value, onChange }) {
  return <label className="colour-field"><span>{label}</span><div><input type="color" value={value} onChange={event => onChange(event.target.value)} /><input value={value} onChange={event => onChange(event.target.value)} maxLength="7" /></div></label>
}

function App() {
  const canvasRef = useRef(null)
  const history = useDocumentHistory(initialDocument)
  const documentState = history.value
  const { advisory, template, brand, editor, referenceDirection, visualFamily } = documentState

  const [topic, setTopic] = useState(initialAdvisory.topic)
  const [audience, setAudience] = useState(initialAdvisory.audience)
  const [advisoryType, setAdvisoryType] = useState(initialAdvisory.advisoryType)
  const [panel, setPanel] = useState('create')
  const [referenceSearch, setReferenceSearch] = useState('')
  const [generationState, setGenerationState] = useState({ status: 'idle', message: '' })

  const quality = useMemo(() => evaluateAdvisory(advisory, template, brand, editor), [advisory, template, brand, editor])
  const selectedLayer = editor.layers[editor.selectedLayer]
  const selectedLayerMeta = EDITOR_LAYERS.find(item => item.id === editor.selectedLayer)

  const filteredReferences = useMemo(() => {
    const query = referenceSearch.trim().toLowerCase()
    if (!query) return advisoryReferences
    return advisoryReferences.filter(item => [item.title, item.category, item.visualFamily, ...(item.keywords || [])].join(' ').toLowerCase().includes(query))
  }, [referenceSearch])

  useEffect(() => {
    const onKeyDown = event => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key.toLowerCase() === 'z' && event.shiftKey) { event.preventDefault(); history.redo() }
      else if (event.key.toLowerCase() === 'z') { event.preventDefault(); history.undo() }
      else if (event.key.toLowerCase() === 'y') { event.preventDefault(); history.redo() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [history])

  const updateAdvisoryField = (key, value) => history.commit(current => ({ ...current, advisory: { ...current.advisory, [key]: value } }))

  const updatePoint = (key, index, value) => history.commit(current => ({
    ...current,
    advisory: {
      ...current.advisory,
      [key]: current.advisory[key].map((point, pointIndex) => pointIndex === index ? value : point)
    }
  }))

  const handleAutoFit = () => history.commit(current => {
    const preferred = current.referenceDirection?.template || getRecommendedTemplate(current.advisory.category)
    return { ...current, template: getBestFitTemplate(current.advisory, preferred) }
  })

  const handleTighten = () => history.commit(current => {
    const tightened = tightenAdvisoryCopy(current.advisory)
    const preferred = current.referenceDirection?.template || getRecommendedTemplate(tightened.category)
    return { ...current, advisory: tightened, template: getBestFitTemplate(tightened, preferred) }
  })

  const handleGenerate = async () => {
    if (!topic.trim() || generationState.status === 'loading') return
    setGenerationState({ status: 'loading', message: 'Generating structured advisory copy…' })

    const result = await generateAdvisoryContent({ topic, audience, advisoryType })
    const direction = getReferenceDirection(result.advisory)
    const preferred = direction.template || getRecommendedTemplate(result.advisory.category)
    const prepared = prepareAdvisoryForLayout(result.advisory, preferred)

    history.reset({
      ...documentState,
      advisory: prepared.advisory,
      template: prepared.template,
      editor: createEditorState(),
      referenceDirection: direction,
      visualFamily: direction.visualFamily || 'auto'
    })
    setPanel('edit')

    if (result.fallback) setGenerationState({ status: 'fallback', message: result.error || 'AI was unavailable, so controlled local copy was used.' })
    else setGenerationState({ status: 'success', message: `Generated with ${result.advisory.generation?.provider || 'AI'}${result.advisory.generation?.model ? ` · ${result.advisory.generation.model}` : ''}${prepared.tightened ? ' · copy tightened for layout fit' : ''}.` })
  }

  const handleSelectLayer = layerId => history.replace(current => ({ ...current, editor: { ...current.editor, selectedLayer: layerId || current.editor.selectedLayer } }))

  const handleMoveLayer = (layerId, dx, dy) => history.commit(current => {
    const layer = current.editor.layers[layerId]
    if (!layer || layer.locked) return current
    const snap = current.editor.snapToGrid === false ? 1 : 8
    const nextX = Math.round((layer.x + dx) / snap) * snap
    const nextY = Math.round((layer.y + dy) / snap) * snap
    return { ...current, editor: updateLayerState(current.editor, layerId, { x: nextX, y: nextY }) }
  })

  const handleLayerPatch = patch => {
    if (!editor.selectedLayer) return
    history.commit(current => ({ ...current, editor: updateLayerState(current.editor, current.editor.selectedLayer, patch) }))
  }

  const handleResetSelectedLayer = () => history.commit(current => ({ ...current, editor: resetLayerState(current.editor, current.editor.selectedLayer) }))
  const handleResetLayout = () => history.commit(current => ({ ...current, editor: resetAllLayers(current.editor) }))

  const chooseBrand = id => history.commit(current => ({
    ...current,
    brand: id === 'custom' ? createCustomBrand(current.brand) : getBrandProfile(id)
  }))

  const updateBrand = (key, value) => history.commit(current => ({
    ...current,
    brand: sanitiseBrandProfile({ ...current.brand, id: 'custom', [key]: value })
  }))

  const handleLogoUpload = event => {
    const file = event.target.files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => updateBrand('logoDataUrl', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const setVisualFamily = family => history.commit(current => ({
    ...current,
    visualFamily: family === 'auto' ? (current.referenceDirection?.visualFamily || 'general-security') : family
  }))

  const switchTemplate = nextTemplate => history.commit(current => ({ ...current, template: nextTemplate }))

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark">I</div><div><strong>Advisory Generator</strong><span>Innvikta Design Studio</span></div></div>
        <div className="topbar-actions editor-actions">
          <button className="ghost-button mini" type="button" disabled={!history.canUndo} onClick={history.undo}>Undo</button>
          <button className="ghost-button mini" type="button" disabled={!history.canRedo} onClick={history.redo}>Redo</button>
          <button className="ghost-button" type="button" disabled={!quality.canExport} onClick={() => exportAsSvg(canvasRef.current, advisory.title)}>SVG</button>
          <button className="ghost-button" type="button" disabled={!quality.canExport} onClick={() => exportPrintSvg(canvasRef.current, advisory.title)}>Print SVG</button>
          <button className="primary-button" type="button" disabled={!quality.canExport} onClick={() => exportAsPng(canvasRef.current, advisory.title)}>PNG</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar wide-sidebar">
          <nav className="panel-tabs expanded" aria-label="Editor panels">
            {[
              ['create', 'Create'], ['edit', 'Content'], ['design', 'Design'], ['brand', 'Brand'], ['references', 'Refs'], ['admin', 'Admin']
            ].map(([id, label]) => <button key={id} className={panel === id ? 'active' : ''} onClick={() => setPanel(id)}>{label}</button>)}
          </nav>

          {panel === 'create' && (
            <section className="panel-content">
              <div className="panel-heading"><span className="eyebrow">GENERATE</span><h1>Create an advisory</h1><p>AI writes into a strict advisory schema. Reference intelligence then chooses the visual family and design engine.</p></div>
              <label className="field"><span>Advisory topic</span><input value={topic} onChange={event => setTopic(event.target.value)} placeholder="e.g. QR Code Phishing" /></label>
              <label className="field"><span>Audience</span><select value={audience} onChange={event => setAudience(event.target.value)}>{AUDIENCES.map(item => <option key={item}>{item}</option>)}</select></label>
              <label className="field"><span>Advisory type</span><select value={advisoryType} onChange={event => setAdvisoryType(event.target.value)}>{ADVISORY_TYPES.map(item => <option key={item}>{item}</option>)}</select></label>
              <button className="generate-button" type="button" onClick={handleGenerate} disabled={!topic.trim() || generationState.status === 'loading'}><span>{generationState.status === 'loading' ? 'Generating…' : 'Generate advisory'}</span><small>AI copy + reference direction + automatic fit</small></button>
              <div className={`system-note generation-note ${generationState.status}`}><strong>AI content service</strong><p>{generationState.status === 'idle' ? 'Uses server-side Gemini or Vertex AI when configured, with deterministic fallback if the provider is unavailable. Gemini credentials can also be managed from the Admin tab.' : generationState.message}</p></div>
            </section>
          )}

          {panel === 'edit' && (
            <section className="panel-content edit-panel">
              <div className="panel-heading compact"><span className="eyebrow">CONTENT</span><h2>Edit advisory</h2><p>All copy remains editable and quality checks recalculate immediately.</p></div>
              <div className={`generation-result ${advisory.generation?.mode || 'local-preview'}`}><span>Content source</span><strong>{advisory.generation?.mode === 'ai' ? 'AI structured generation' : advisory.generation?.mode === 'local-fallback' ? 'Local fallback' : 'Local preview'}</strong>{advisory.fitAdjusted && <small>Copy was automatically tightened to fit an approved layout.</small>}</div>
              <div className={`quality-summary ${quality.score < 75 ? 'attention' : ''}`}><div className="quality-score-row"><div><span>Quality</span><strong>{quality.status}</strong></div><b>{quality.score}</b></div>{quality.issues.length === 0 ? <p className="quality-pass">No content or layout issues detected.</p> : <ul>{quality.issues.slice(0, 5).map(item => <li key={item.id}>{item.label}</li>)}</ul>}<div className="quality-buttons"><button className="quality-autofit" type="button" onClick={handleAutoFit}>Auto-fit layout</button><button className="quality-autofit" type="button" onClick={handleTighten}>Tighten copy</button></div></div>
              <label className="field"><span>Title</span><input value={advisory.title} onChange={event => updateAdvisoryField('title', event.target.value)} /></label>
              <label className="field"><span>Introduction</span><textarea rows="5" value={advisory.intro} onChange={event => updateAdvisoryField('intro', event.target.value)} /></label>
              <div className="editor-group"><input className="section-title-input" value={advisory.sectionOneTitle} onChange={event => updateAdvisoryField('sectionOneTitle', event.target.value)} />{advisory.sectionOnePoints.map((point, index) => <EditablePoint key={`one-${index}`} index={index} value={point} onChange={value => updatePoint('sectionOnePoints', index, value)} />)}</div>
              <div className="editor-group"><input className="section-title-input" value={advisory.sectionTwoTitle} onChange={event => updateAdvisoryField('sectionTwoTitle', event.target.value)} />{advisory.sectionTwoPoints.map((point, index) => <EditablePoint key={`two-${index}`} index={index} value={point} onChange={value => updatePoint('sectionTwoPoints', index, value)} />)}</div>
            </section>
          )}

          {panel === 'design' && (
            <section className="panel-content design-panel">
              <div className="panel-heading compact"><span className="eyebrow">DESIGN</span><h2>Layers & art direction</h2><p>Select layers here or directly on the canvas. Drag unlocked layers to reposition them.</p></div>
              <label className="field"><span>Illustration family</span><select value={VISUAL_FAMILIES.some(([id]) => id === visualFamily) ? visualFamily : 'auto'} onChange={event => setVisualFamily(event.target.value)}>{VISUAL_FAMILIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
              <div className="reference-direction-card"><span>Reference direction</span><strong>{referenceDirection?.visualFamily || 'general-security'}</strong><small>{referenceDirection?.references?.slice(0, 2).map(item => item.title).join(' • ') || 'General advisory library'}</small></div>
              <div className="layer-list">{EDITOR_LAYERS.map(layer => {
                const state = editor.layers[layer.id]
                return <button key={layer.id} type="button" className={editor.selectedLayer === layer.id ? 'active' : ''} onClick={() => handleSelectLayer(layer.id)}><span>{layer.label}</span><small>{state.locked ? 'Locked' : state.visible === false ? 'Hidden' : `${Math.round(state.scale * 100)}%`}</small></button>
              })}</div>
              {selectedLayer && <div className="layer-controls"><div className="layer-control-title"><strong>{selectedLayerMeta?.label}</strong><button type="button" onClick={handleResetSelectedLayer}>Reset</button></div><label><span>X</span><input type="number" value={Math.round(selectedLayer.x)} onChange={event => handleLayerPatch({ x: Number(event.target.value) || 0 })} /></label><label><span>Y</span><input type="number" value={Math.round(selectedLayer.y)} onChange={event => handleLayerPatch({ y: Number(event.target.value) || 0 })} /></label>{selectedLayerMeta?.scalable && <label><span>Scale {Math.round(selectedLayer.scale * 100)}%</span><input type="range" min="0.72" max="1.35" step="0.01" value={selectedLayer.scale} onChange={event => handleLayerPatch({ scale: Number(event.target.value) })} /></label>}<div className="layer-toggles"><label><input type="checkbox" checked={selectedLayer.visible !== false} onChange={event => handleLayerPatch({ visible: event.target.checked })} /> Visible</label><label><input type="checkbox" checked={selectedLayer.locked} onChange={event => handleLayerPatch({ locked: event.target.checked })} /> Locked</label></div></div>}
              <div className="design-utilities"><label><input type="checkbox" checked={editor.snapToGrid !== false} onChange={event => history.commit(current => ({ ...current, editor: { ...current.editor, snapToGrid: event.target.checked } }))} /> Snap to 8 px grid</label><label><input type="checkbox" checked={editor.showGuides !== false} onChange={event => history.commit(current => ({ ...current, editor: { ...current.editor, showGuides: event.target.checked } }))} /> Alignment guides</label><button type="button" onClick={handleResetLayout}>Reset all layer changes</button></div>
            </section>
          )}

          {panel === 'brand' && (
            <section className="panel-content brand-panel">
              <div className="panel-heading compact"><span className="eyebrow">BRAND</span><h2>Client brand profile</h2><p>Change the identity without changing advisory structure. Custom logos are embedded into exported SVG/PNG files.</p></div>
              <label className="field"><span>Brand preset</span><select value={BRAND_PROFILES.some(item => item.id === brand.id) ? brand.id : 'custom'} onChange={event => chooseBrand(event.target.value)}>{BRAND_PROFILES.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}<option value="custom">Custom client</option></select></label>
              <label className="field"><span>Client name</span><input value={brand.name} onChange={event => updateBrand('name', event.target.value)} /></label>
              <label className="field"><span>Logo text</span><input value={brand.logoText} onChange={event => updateBrand('logoText', event.target.value)} /></label>
              <label className="field"><span>Footer message</span><input value={brand.footerText} onChange={event => updateBrand('footerText', event.target.value)} /></label>
              <label className="field"><span>Font stack</span><input value={brand.fontFamily} onChange={event => updateBrand('fontFamily', event.target.value)} /></label>
              <div className="brand-colours"><ColourField label="Primary" value={brand.primary} onChange={value => updateBrand('primary', value)} /><ColourField label="Primary dark" value={brand.primaryDark} onChange={value => updateBrand('primaryDark', value)} /><ColourField label="Text" value={brand.ink} onChange={value => updateBrand('ink', value)} /><ColourField label="Background" value={brand.paper} onChange={value => updateBrand('paper', value)} /><ColourField label="Soft panel" value={brand.cream} onChange={value => updateBrand('cream', value)} /><ColourField label="Lines" value={brand.line} onChange={value => updateBrand('line', value)} /></div>
              <label className="field"><span>Logo image (max 2 MB)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} /></label>
              {brand.logoDataUrl && <button className="ghost-button brand-remove" type="button" onClick={() => updateBrand('logoDataUrl', '')}>Remove logo image</button>}
              <div className="brand-audit"><span>Contrast audit</span><strong>Body {quality.brandAudit.bodyContrast.toFixed(1)}:1</strong><small>Accent {quality.brandAudit.accentContrast.toFixed(1)}:1</small></div>
            </section>
          )}

          {panel === 'references' && (
            <section className="panel-content reference-panel">
              <div className="panel-heading compact"><span className="eyebrow">REFERENCE INTELLIGENCE</span><h2>Approved advisory library</h2><p>References are tagged by threat category, visual family, density, illustration position and recommended composition.</p></div>
              {referenceDirection?.references?.length > 0 && <div className="recommended-refs"><span>Recommended for this topic</span>{referenceDirection.references.slice(0, 3).map(reference => <a key={reference.id} href={reference.url} target="_blank" rel="noreferrer"><img src={reference.url} alt={reference.title} /><div><strong>{reference.title}</strong><small>{reference.category} · {reference.visualFamily} · score {reference.relevanceScore}</small></div></a>)}</div>}
              <label className="field"><span>Search references</span><input value={referenceSearch} onChange={event => setReferenceSearch(event.target.value)} placeholder="Topic, category or visual family" /></label>
              <div className="reference-grid enriched">{filteredReferences.map(reference => <a key={reference.id} className="reference-card" href={reference.url} target="_blank" rel="noreferrer"><img src={reference.url} alt={reference.title} loading="lazy" /><span>{reference.title}</span><small>{reference.category}<br />{reference.visualFamily} · {reference.suggestedTemplate}</small></a>)}</div>
            </section>
          )}

          {panel === 'admin' && <AdminPanel />}
        </aside>

        <section className="studio">
          <div className="studio-toolbar advanced-toolbar">
            <div><span className="toolbar-label">Layout</span><div className="template-switcher">{TEMPLATES.map(item => <button key={item.id} type="button" className={template === item.id ? 'active' : ''} onClick={() => switchTemplate(item.id)} title={item.description}>{item.name}</button>)}<button className="auto-fit-button" type="button" onClick={handleAutoFit}>Auto-fit</button></div></div>
            <div className="toolbar-meta"><span>{brand.name}</span><div className={`quality-chip ${quality.score < 75 ? 'warning' : ''}`}><span className="quality-dot" />{quality.canExport ? 'Export ready' : `${quality.errorCount} issue${quality.errorCount === 1 ? '' : 's'}`} · {quality.score}/100</div></div>
          </div>

          <div className="canvas-stage"><div className="canvas-frame editor-canvas-frame"><AdvisoryCanvas ref={canvasRef} advisory={advisory} template={template} brand={brand} editor={editor} visualFamily={visualFamily} interactive onSelectLayer={handleSelectLayer} onMoveLayer={handleMoveLayer} /></div></div>

          <div className="statusbar"><span>{advisory.category}</span><span>{referenceDirection?.visualFamily || visualFamily}</span><span>{advisory.generation?.provider || 'local-rules'}</span><span>{quality.fit.fits ? 'Text fit verified' : 'Text overflow'}</span><span>{quality.geometry.issues.length ? `${quality.geometry.issues.length} geometry issue(s)` : 'Geometry clear'}</span><span>1080 × 1350</span></div>
        </section>
      </main>
    </div>
  )
}

export default App
