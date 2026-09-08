import { useMemo, useState } from 'react'
import AdminPanel from './components/AdminPanel'
import GeneratedAdvisoryView from './components/GeneratedAdvisoryView'
import { advisoryReferences } from './data/references'
import { ADVISORY_TYPES, AUDIENCES, generateAdvisory } from './lib/advisoryEngine'
import { getReferenceDirection } from './lib/referenceIntelligence'
import { generateReferenceAdvisoryImage } from './lib/aiImageService'
import './advanced-editor.css'
import './admin.css'
import './ai-advisory.css'

const SIMILARITY = [
  ['low', 'Creative', 'Looser interpretation of the reference'],
  ['medium', 'Balanced', 'Same design family with a fresh composition'],
  ['high', 'Close', 'Very close visual direction without copying']
]

const CONCEPTS = [
  ['balanced', 'Balanced'],
  ['illustration', 'Illustration-led'],
  ['infographic', 'Infographic-led'],
  ['scenario', 'Scenario-led']
]

function findReference(id) {
  return advisoryReferences.find(item => item.id === id)
}

export default function AiApp({ onOpenClassic }) {
  const [topic, setTopic] = useState('MFA Fatigue Attack')
  const [audience, setAudience] = useState('All Employees')
  const [advisoryType, setAdvisoryType] = useState('Internal Advisory')
  const [referenceId, setReferenceId] = useState('auto')
  const [similarity, setSimilarity] = useState('medium')
  const [concept, setConcept] = useState('balanced')
  const [panel, setPanel] = useState('create')
  const [result, setResult] = useState(null)
  const [state, setState] = useState({ status: 'idle', message: '' })
  const [referenceSearch, setReferenceSearch] = useState('')

  const direction = useMemo(() => {
    const preview = generateAdvisory({ topic: topic.trim() || 'Cybersecurity Awareness', audience, advisoryType })
    return getReferenceDirection(preview)
  }, [topic, audience, advisoryType])

  const autoReference = direction?.references?.[0] || advisoryReferences[0]
  const selectedReference = referenceId === 'auto' ? autoReference : (findReference(referenceId) || autoReference)

  const filteredReferences = useMemo(() => {
    const query = referenceSearch.trim().toLowerCase()
    if (!query) return advisoryReferences
    return advisoryReferences.filter(item => [item.title, item.category, item.visualFamily, ...(item.keywords || [])].join(' ').toLowerCase().includes(query))
  }, [referenceSearch])

  const generate = async ({ newConcept = false } = {}) => {
    if (!topic.trim() || state.status === 'loading') return
    setState({ status: 'loading', message: 'Writing the advisory and generating a fresh reference-guided design…' })
    try {
      const payload = await generateReferenceAdvisoryImage({
        topic: topic.trim(),
        audience,
        advisoryType,
        referenceId,
        similarity,
        concept,
        ...(newConcept ? { seed: Math.floor(Math.random() * 2147483646) + 1 } : {})
      })
      setResult(payload)
      setState({ status: 'success', message: `Created with ${payload.imageModel} using ${payload.reference.title} as visual direction.` })
    } catch (error) {
      setState({ status: 'error', message: error?.message || 'Unable to create the AI advisory.' })
    }
  }

  const chooseReference = id => {
    setReferenceId(id)
    setPanel('create')
  }

  return (
    <div className="app-shell ai-app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark">I</div><div><strong>Advisory Generator</strong><span>Reference-guided AI Studio</span></div></div>
        <div className="topbar-actions ai-primary-toolbar">
          <span className="mode-pill">AI Image Mode</span>
          {result?.imageUrl && <a className="ghost-button ai-download-link" href={result.imageUrl} target="_blank" rel="noreferrer">Open image</a>}
          <button className="ghost-button" type="button" onClick={onOpenClassic}>Classic Editor</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar wide-sidebar">
          <nav className="panel-tabs expanded ai-tabs" aria-label="AI generator panels">
            {[['create', 'Create'], ['references', 'Refs'], ['admin', 'Admin']].map(([id, label]) => (
              <button key={id} className={panel === id ? 'active' : ''} onClick={() => setPanel(id)}>{label}</button>
            ))}
          </nav>

          {panel === 'create' && (
            <section className="panel-content">
              <div className="panel-heading"><span className="eyebrow">AI ADVISORY</span><h1>Create from your reference style</h1><p>Replicate writes the content, selects an approved reference and generates a completely new advisory image in a similar professional design language.</p></div>

              <label className="field"><span>Advisory topic</span><input value={topic} onChange={event => setTopic(event.target.value)} placeholder="e.g. QR Code Phishing" /></label>
              <label className="field"><span>Audience</span><select value={audience} onChange={event => setAudience(event.target.value)}>{AUDIENCES.map(item => <option key={item}>{item}</option>)}</select></label>
              <label className="field"><span>Advisory type</span><select value={advisoryType} onChange={event => setAdvisoryType(event.target.value)}>{ADVISORY_TYPES.map(item => <option key={item}>{item}</option>)}</select></label>

              <div className="ai-mode-controls">
                <label className="field"><span>Visual reference</span><select value={referenceId} onChange={event => setReferenceId(event.target.value)}><option value="auto">Auto · closest approved reference</option>{advisoryReferences.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
                <div className="reference-select-preview"><img src={selectedReference.url} alt={selectedReference.title} /><div><span>{referenceId === 'auto' ? 'Auto selected' : 'Selected reference'}</span><strong>{selectedReference.title}</strong><small>{selectedReference.category} · {selectedReference.visualFamily}</small></div></div>

                <div className="ai-mode-grid">
                  <label className="field"><span>Similarity</span><select value={similarity} onChange={event => setSimilarity(event.target.value)}>{SIMILARITY.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
                  <label className="field"><span>Creative direction</span><select value={concept} onChange={event => setConcept(event.target.value)}>{CONCEPTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
                </div>

                <button className="ai-generate-button" type="button" onClick={() => generate()} disabled={!topic.trim() || state.status === 'loading'}><span>{state.status === 'loading' ? 'Generating complete advisory…' : 'Generate AI advisory'}</span><small>Replicate copy + approved reference + FLUX Kontext Pro</small></button>
                <button className="classic-generate-link" type="button" onClick={onOpenClassic}>Need precise editable text? Open the structured SVG editor instead.</button>
              </div>

              <div className={`system-note generation-note ${state.status}`}><strong>Replicate generation</strong><p>{state.status === 'idle' ? 'Add REPLICATE_API_TOKEN in Render Environment Variables. One generation uses a text model plus one reference-guided image generation.' : state.message}</p></div>
            </section>
          )}

          {panel === 'references' && (
            <section className="panel-content reference-panel">
              <div className="panel-heading compact"><span className="eyebrow">APPROVED REFERENCES</span><h2>Choose the visual direction</h2><p>Auto mode selects the closest reference for the topic. You can override it with any approved advisory below.</p></div>
              <label className="field"><span>Search references</span><input value={referenceSearch} onChange={event => setReferenceSearch(event.target.value)} placeholder="Phishing, MFA, fraud…" /></label>
              <div className="reference-grid enriched">{filteredReferences.map(reference => <button type="button" key={reference.id} className={`reference-card ai-reference-card ${referenceId === reference.id ? 'active' : ''}`} onClick={() => chooseReference(reference.id)}><img src={reference.url} alt={reference.title} loading="lazy" /><span>{reference.title}</span><small>{reference.category}<br />{reference.visualFamily}</small></button>)}</div>
            </section>
          )}

          {panel === 'admin' && <AdminPanel />}
        </aside>

        <section className="studio ai-studio">
          <div className="studio-toolbar advanced-toolbar">
            <div><span className="toolbar-label">Generation mode</span><div className="ai-classic-toolbar"><strong>Reference-guided AI image</strong><span>{selectedReference.title}</span></div></div>
            <div className="toolbar-meta"><span>{similarity} similarity</span><span>{concept}</span></div>
          </div>

          <div className="canvas-stage ai-canvas-stage">
            <GeneratedAdvisoryView
              result={result}
              loading={state.status === 'loading'}
              error={state.status === 'error' ? state.message : ''}
              onRegenerate={() => generate({ newConcept: true })}
              onUseClassic={onOpenClassic}
            />
          </div>

          <div className="statusbar"><span>Replicate</span><span>{result?.textModel || 'meta/meta-llama-3-8b-instruct'}</span><span>{result?.imageModel || 'black-forest-labs/flux-kontext-pro'}</span><span>{result ? result.reference?.title : 'Awaiting generation'}</span></div>
        </section>
      </main>
    </div>
  )
}
