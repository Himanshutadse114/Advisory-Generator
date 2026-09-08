import { useMemo, useRef, useState } from 'react'
import AdminPanel from './components/AdminPanel'
import HybridCanvas from './components/HybridCanvas'
import { advisoryReferences } from './data/references'
import { ADVISORY_TYPES, AUDIENCES, generateAdvisory } from './lib/advisoryEngine'
import { getReferenceDirection } from './lib/referenceIntelligence'
import { generateHybridAdvisory, imageUrlToDataUrl } from './lib/hybridService'
import { exportPng, exportProjectJson, exportSvg, importProjectJson } from './lib/hybridProject'
import './admin.css'
import './hybrid.css'

const SIMILARITY = [['low', 'Creative'], ['medium', 'Balanced'], ['high', 'Close']]
const CONCEPTS = [['balanced', 'Balanced'], ['illustration', 'Illustration-led'], ['infographic', 'Infographic-led'], ['scenario', 'Scenario-led']]
const LAYERS = [['artwork', 'Artwork'], ['title', 'Title'], ['intro', 'Introduction'], ['sectionOne', 'Section 1'], ['sectionTwo', 'Section 2'], ['footer', 'Footer']]

function EditablePoint({ value, onChange, index }) {
  return <label className="hybrid-point"><span>{index + 1}</span><textarea value={value} onChange={event => onChange(event.target.value)} rows="2" /></label>
}

export default function HybridApp({ onOpenFullPoster, onOpenClassic }) {
  const [topic, setTopic] = useState('MFA Fatigue Attack')
  const [audience, setAudience] = useState('All Employees')
  const [advisoryType, setAdvisoryType] = useState('Internal Advisory')
  const [referenceId, setReferenceId] = useState('auto')
  const [similarity, setSimilarity] = useState('medium')
  const [concept, setConcept] = useState('balanced')
  const [panel, setPanel] = useState('create')
  const [project, setProject] = useState(null)
  const [selectedLayer, setSelectedLayer] = useState('title')
  const [state, setState] = useState({ status: 'idle', message: '' })
  const svgRef = useRef(null)
  const fileRef = useRef(null)

  const direction = useMemo(() => {
    const preview = generateAdvisory({ topic: topic.trim() || 'Cybersecurity Awareness', audience, advisoryType })
    return getReferenceDirection(preview)
  }, [topic, audience, advisoryType])
  const autoReference = direction?.references?.[0] || advisoryReferences[0]
  const selectedReference = referenceId === 'auto' ? autoReference : advisoryReferences.find(item => item.id === referenceId) || autoReference

  const generate = async ({ variation = false } = {}) => {
    if (!topic.trim() || state.status === 'loading') return
    setState({ status: 'loading', message: 'Writing content, planning an editable layout and generating the artwork layer…' })
    try {
      const generated = await generateHybridAdvisory({
        topic: topic.trim(), audience, advisoryType, referenceId, similarity, concept,
        ...(variation ? { seed: Math.floor(Math.random() * 2147483646) + 1 } : {})
      })
      const artworkDataUrl = await imageUrlToDataUrl(generated.artworkUrl)
      setProject({ ...generated, artworkDataUrl })
      setSelectedLayer('title')
      setState({ status: 'success', message: 'Editable advisory created. Text, layout, colours and footer can now be changed without regenerating the artwork.' })
    } catch (error) {
      setState({ status: 'error', message: error?.message || 'Unable to generate the editable advisory.' })
    }
  }

  const updateAdvisory = (key, value) => setProject(current => ({ ...current, advisory: { ...current.advisory, [key]: value } }))
  const updatePoint = (key, index, value) => setProject(current => {
    const points = [...current.advisory[key]]
    points[index] = value
    return { ...current, advisory: { ...current.advisory, [key]: points } }
  })
  const updatePalette = (key, value) => setProject(current => ({ ...current, blueprint: { ...current.blueprint, palette: { ...current.blueprint.palette, [key]: value } } }))
  const updateBrand = (key, value) => setProject(current => ({ ...current, brand: { ...current.brand, [key]: value } }))
  const updateLayer = (id, patch) => setProject(current => {
    if (!current?.blueprint?.layers?.[id]) return current
    return { ...current, blueprint: { ...current.blueprint, layers: { ...current.blueprint.layers, [id]: { ...current.blueprint.layers[id], ...patch } } } }
  })

  const handleProjectLoad = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const loaded = await importProjectJson(file)
      setProject(loaded)
      setTopic(loaded.topic || loaded.advisory?.title || '')
      setAudience(loaded.audience || 'All Employees')
      setAdvisoryType(loaded.advisoryType || 'Internal Advisory')
      setState({ status: 'success', message: 'Editable advisory project loaded.' })
    } catch (error) {
      setState({ status: 'error', message: error.message })
    } finally { event.target.value = '' }
  }

  const currentBox = project?.blueprint?.layers?.[selectedLayer]

  return (
    <div className="hybrid-shell">
      <header className="hybrid-topbar">
        <div className="brand-lockup"><div className="brand-mark">I</div><div><strong>Advisory Generator</strong><span>Hybrid Editable AI Studio</span></div></div>
        <div className="hybrid-top-actions">
          <span className="hybrid-mode-pill">AI design + editable layers</span>
          <button className="ghost-button" type="button" onClick={onOpenFullPoster}>Full AI Poster</button>
          <button className="ghost-button" type="button" onClick={onOpenClassic}>Classic Editor</button>
        </div>
      </header>

      <main className="hybrid-workspace">
        <aside className="hybrid-sidebar">
          <nav className="hybrid-tabs">
            {[['create', 'Create'], ['content', 'Content'], ['layers', 'Layers'], ['brand', 'Brand'], ['refs', 'Refs'], ['admin', 'Admin']].map(([id, label]) => <button key={id} className={panel === id ? 'active' : ''} onClick={() => setPanel(id)}>{label}</button>)}
          </nav>

          {panel === 'create' && <section className="hybrid-panel">
            <div className="panel-heading"><span className="eyebrow">HYBRID AI</span><h1>AI-designed. Fully editable.</h1><p>AI studies your approved references, plans a fresh composition and generates only the visual artwork. All advisory text stays editable.</p></div>
            <label className="field"><span>Advisory topic</span><input value={topic} onChange={e => setTopic(e.target.value)} /></label>
            <label className="field"><span>Audience</span><select value={audience} onChange={e => setAudience(e.target.value)}>{AUDIENCES.map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>Advisory type</span><select value={advisoryType} onChange={e => setAdvisoryType(e.target.value)}>{ADVISORY_TYPES.map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>Visual reference</span><select value={referenceId} onChange={e => setReferenceId(e.target.value)}><option value="auto">Auto · closest approved reference</option>{advisoryReferences.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            <div className="hybrid-ref-preview"><img src={selectedReference.url} alt={selectedReference.title} /><div><span>{referenceId === 'auto' ? 'Auto selected' : 'Selected'}</span><strong>{selectedReference.title}</strong><small>{selectedReference.category}</small></div></div>
            <div className="hybrid-two"><label className="field"><span>Similarity</span><select value={similarity} onChange={e => setSimilarity(e.target.value)}>{SIMILARITY.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className="field"><span>Direction</span><select value={concept} onChange={e => setConcept(e.target.value)}>{CONCEPTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
            <button className="hybrid-generate" type="button" onClick={() => generate()} disabled={!topic.trim() || state.status === 'loading'}><strong>{state.status === 'loading' ? 'Generating editable advisory…' : 'Generate editable advisory'}</strong><span>Copy + AI layout blueprint + artwork without text</span></button>
            {project && <button className="hybrid-secondary" type="button" onClick={() => generate({ variation: true })} disabled={state.status === 'loading'}>Regenerate visual concept</button>}
            <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={handleProjectLoad} />
            <button className="hybrid-secondary" type="button" onClick={() => fileRef.current?.click()}>Open project JSON</button>
            <div className={`hybrid-status ${state.status}`}>{state.message || 'Your Replicate token on Render powers content, layout planning and the artwork layer.'}</div>
          </section>}

          {panel === 'content' && <section className="hybrid-panel">
            <div className="panel-heading compact"><span className="eyebrow">EDITABLE COPY</span><h2>Advisory content</h2><p>Changes appear immediately on the canvas. No AI regeneration is required.</p></div>
            {!project ? <div className="hybrid-empty-side">Generate or open a project first.</div> : <>
              <label className="field"><span>Title</span><textarea rows="2" value={project.advisory.title} onChange={e => updateAdvisory('title', e.target.value)} /></label>
              <label className="field"><span>Introduction</span><textarea rows="4" value={project.advisory.intro} onChange={e => updateAdvisory('intro', e.target.value)} /></label>
              <label className="field"><span>Section 1 heading</span><input value={project.advisory.sectionOneTitle} onChange={e => updateAdvisory('sectionOneTitle', e.target.value)} /></label>
              {project.advisory.sectionOnePoints.map((point, i) => <EditablePoint key={`one-${i}`} index={i} value={point} onChange={value => updatePoint('sectionOnePoints', i, value)} />)}
              <label className="field"><span>Section 2 heading</span><input value={project.advisory.sectionTwoTitle} onChange={e => updateAdvisory('sectionTwoTitle', e.target.value)} /></label>
              {project.advisory.sectionTwoPoints.map((point, i) => <EditablePoint key={`two-${i}`} index={i} value={point} onChange={value => updatePoint('sectionTwoPoints', i, value)} />)}
            </>}
          </section>}

          {panel === 'layers' && <section className="hybrid-panel">
            <div className="panel-heading compact"><span className="eyebrow">LAYERS</span><h2>Position and scale</h2><p>Select a layer or drag it directly on the canvas.</p></div>
            {!project ? <div className="hybrid-empty-side">Generate or open a project first.</div> : <>
              <div className="hybrid-layer-list">{LAYERS.map(([id, label]) => <button key={id} className={selectedLayer === id ? 'active' : ''} onClick={() => setSelectedLayer(id)}><span>{label}</span><small>{id === 'artwork' ? 'AI visual' : 'Editable'}</small></button>)}</div>
              {currentBox && <div className="hybrid-inspector"><label><span>X</span><input type="number" value={Math.round(currentBox.x)} onChange={e => updateLayer(selectedLayer, { x: Number(e.target.value) || 0 })} /></label><label><span>Y</span><input type="number" value={Math.round(currentBox.y)} onChange={e => updateLayer(selectedLayer, { y: Number(e.target.value) || 0 })} /></label><label><span>Width</span><input type="number" value={Math.round(currentBox.w)} onChange={e => updateLayer(selectedLayer, { w: Number(e.target.value) || 100 })} /></label><label><span>Height</span><input type="number" value={Math.round(currentBox.h)} onChange={e => updateLayer(selectedLayer, { h: Number(e.target.value) || 100 })} /></label>{currentBox.fontSize && <label><span>Font size</span><input type="number" value={Math.round(currentBox.fontSize)} onChange={e => updateLayer(selectedLayer, { fontSize: Number(e.target.value) || 20 })} /></label>}</div>}
            </>}
          </section>}

          {panel === 'brand' && <section className="hybrid-panel">
            <div className="panel-heading compact"><span className="eyebrow">BRAND & COLOUR</span><h2>Finish the advisory</h2></div>
            {!project ? <div className="hybrid-empty-side">Generate or open a project first.</div> : <>
              <label className="field"><span>Logo text</span><input value={project.brand?.logoText || ''} onChange={e => updateBrand('logoText', e.target.value)} /></label>
              <label className="field"><span>Footer message</span><input value={project.brand?.footerText || ''} onChange={e => updateBrand('footerText', e.target.value)} /></label>
              <div className="hybrid-colours">{[['paper', 'Background'], ['ink', 'Text'], ['accent', 'Accent'], ['soft', 'Panel'], ['line', 'Lines']].map(([key, label]) => <label key={key}><span>{label}</span><input type="color" value={project.blueprint.palette[key]} onChange={e => updatePalette(key, e.target.value)} /></label>)}</div>
            </>}
          </section>}

          {panel === 'refs' && <section className="hybrid-panel reference-panel"><div className="panel-heading compact"><span className="eyebrow">REFERENCES</span><h2>Approved design library</h2><p>Choose one reference or leave Auto enabled to let the system rank the closest visual family.</p></div><div className="reference-grid enriched">{advisoryReferences.map(reference => <button type="button" key={reference.id} className={`reference-card ai-reference-card ${referenceId === reference.id ? 'active' : ''}`} onClick={() => { setReferenceId(reference.id); setPanel('create') }}><img src={reference.url} alt={reference.title} loading="lazy" /><span>{reference.title}</span><small>{reference.category}</small></button>)}</div></section>}
          {panel === 'admin' && <AdminPanel />}
        </aside>

        <section className="hybrid-studio">
          <div className="hybrid-toolbar">
            <div><span>Editable design master</span><strong>{project?.advisory?.title || 'Generate an advisory to begin'}</strong></div>
            <div className="hybrid-export-actions">
              <button disabled={!project} onClick={() => exportProjectJson(project)}>Project JSON</button>
              <button disabled={!project} onClick={() => exportSvg(svgRef.current, project)}>SVG</button>
              <button disabled={!project} onClick={() => exportPng(svgRef.current, project).catch(error => setState({ status: 'error', message: error.message }))}>PNG</button>
            </div>
          </div>
          <div className="hybrid-stage">
            {project ? <div className="hybrid-canvas-wrap"><HybridCanvas ref={svgRef} project={project} selectedLayer={selectedLayer} onSelectLayer={setSelectedLayer} onMoveLayer={updateLayer} /></div> : <div className="hybrid-placeholder"><div>AI + EDITABLE</div><strong>Generate your first editable advisory</strong><p>The AI will create the visual design layer while all typography stays live and editable.</p></div>}
          </div>
          <div className="hybrid-statusbar"><span>Hybrid editable</span><span>{project?.blueprint?.composition || 'AI layout blueprint'}</span><span>{project?.generation?.imageModel || 'openai/gpt-image-2'}</span><span>1080 × 1620</span><span>SVG / PNG / JSON</span></div>
        </section>
      </main>
    </div>
  )
}
