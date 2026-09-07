import { useMemo, useRef, useState } from 'react'
import AdvisoryCanvas from './components/AdvisoryCanvas'
import { advisoryReferences } from './data/references'
import {
  ADVISORY_TYPES,
  AUDIENCES,
  TEMPLATES,
  generateAdvisory,
  getRecommendedTemplate
} from './lib/advisoryEngine'
import { generateAdvisoryContent } from './lib/contentService'
import { getBestFitTemplate } from './lib/designIntelligence'
import { exportAsPng, exportAsSvg } from './lib/exportAdvisory'
import { evaluateAdvisory } from './lib/qualityChecker'
import './quality.css'

const initialAdvisory = generateAdvisory({
  topic: 'MFA Fatigue Attack',
  audience: 'All Employees',
  advisoryType: 'Internal Advisory'
})
initialAdvisory.generation = {
  mode: 'local-preview',
  provider: 'local-rules',
  model: null
}

function EditablePoint({ value, onChange, index }) {
  return (
    <label className="point-field">
      <span>{index + 1}</span>
      <textarea value={value} rows="3" onChange={event => onChange(event.target.value)} />
    </label>
  )
}

function App() {
  const canvasRef = useRef(null)
  const [topic, setTopic] = useState(initialAdvisory.topic)
  const [audience, setAudience] = useState(initialAdvisory.audience)
  const [advisoryType, setAdvisoryType] = useState(initialAdvisory.advisoryType)
  const initialPreferredTemplate = getRecommendedTemplate(initialAdvisory.category)
  const [template, setTemplate] = useState(getBestFitTemplate(initialAdvisory, initialPreferredTemplate))
  const [advisory, setAdvisory] = useState(initialAdvisory)
  const [panel, setPanel] = useState('create')
  const [referenceSearch, setReferenceSearch] = useState('')
  const [generationState, setGenerationState] = useState({ status: 'idle', message: '' })

  const quality = useMemo(() => evaluateAdvisory(advisory, template), [advisory, template])

  const filteredReferences = useMemo(() => {
    const query = referenceSearch.trim().toLowerCase()
    if (!query) return advisoryReferences
    return advisoryReferences.filter(item => item.title.toLowerCase().includes(query))
  }, [referenceSearch])

  const updateField = (key, value) => {
    setAdvisory(current => ({ ...current, [key]: value }))
  }

  const updatePoint = (key, index, value) => {
    setAdvisory(current => ({
      ...current,
      [key]: current[key].map((point, pointIndex) => pointIndex === index ? value : point)
    }))
  }

  const handleAutoFit = () => {
    const preferred = getRecommendedTemplate(advisory.category)
    setTemplate(getBestFitTemplate(advisory, preferred))
  }

  const handleGenerate = async () => {
    if (!topic.trim() || generationState.status === 'loading') return

    setGenerationState({
      status: 'loading',
      message: 'Generating structured advisory copy…'
    })

    const result = await generateAdvisoryContent({ topic, audience, advisoryType })
    const next = result.advisory
    const preferred = getRecommendedTemplate(next.category)

    setAdvisory(next)
    setTemplate(getBestFitTemplate(next, preferred))
    setPanel('edit')

    if (result.fallback) {
      setGenerationState({
        status: 'fallback',
        message: result.error || 'AI was unavailable, so controlled local copy was used.'
      })
    } else {
      setGenerationState({
        status: 'success',
        message: `Generated with ${next.generation?.provider || 'AI'}${next.generation?.model ? ` · ${next.generation.model}` : ''}.`
      })
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">I</div>
          <div>
            <strong>Advisory Generator</strong>
            <span>Innvikta Design Studio</span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button" disabled={!quality.canExport} onClick={() => exportAsSvg(canvasRef.current, advisory.title)}>Export SVG</button>
          <button className="primary-button" type="button" disabled={!quality.canExport} onClick={() => exportAsPng(canvasRef.current, advisory.title)}>Export PNG</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <nav className="panel-tabs" aria-label="Editor panels">
            <button className={panel === 'create' ? 'active' : ''} onClick={() => setPanel('create')}>Create</button>
            <button className={panel === 'edit' ? 'active' : ''} onClick={() => setPanel('edit')}>Edit</button>
            <button className={panel === 'references' ? 'active' : ''} onClick={() => setPanel('references')}>References</button>
          </nav>

          {panel === 'create' && (
            <section className="panel-content">
              <div className="panel-heading">
                <span className="eyebrow">GENERATE</span>
                <h1>Create an advisory</h1>
                <p>Start with the topic. The AI service structures the copy and the design engine selects an appropriate composition.</p>
              </div>

              <label className="field">
                <span>Advisory topic</span>
                <input value={topic} onChange={event => setTopic(event.target.value)} placeholder="e.g. QR Code Phishing" />
              </label>

              <label className="field">
                <span>Audience</span>
                <select value={audience} onChange={event => setAudience(event.target.value)}>
                  {AUDIENCES.map(item => <option key={item}>{item}</option>)}
                </select>
              </label>

              <label className="field">
                <span>Advisory type</span>
                <select value={advisoryType} onChange={event => setAdvisoryType(event.target.value)}>
                  {ADVISORY_TYPES.map(item => <option key={item}>{item}</option>)}
                </select>
              </label>

              <button
                className="generate-button"
                type="button"
                onClick={handleGenerate}
                disabled={!topic.trim() || generationState.status === 'loading'}
              >
                <span>{generationState.status === 'loading' ? 'Generating…' : 'Generate advisory'}</span>
                <small>AI copy + strict schema + measured layout fit</small>
              </button>

              <div className={`system-note generation-note ${generationState.status}`}>
                <strong>AI content service</strong>
                <p>
                  {generationState.status === 'idle'
                    ? 'Generation uses a server-side Gemini or Vertex AI provider when configured. If it is unavailable, the local controlled engine keeps the editor usable.'
                    : generationState.message}
                </p>
              </div>
            </section>
          )}

          {panel === 'edit' && (
            <section className="panel-content edit-panel">
              <div className="panel-heading compact">
                <span className="eyebrow">CONTENT</span>
                <h2>Edit advisory</h2>
                <p>Changes update the vector artwork and measured design-quality score immediately.</p>
              </div>

              <div className={`generation-result ${advisory.generation?.mode || 'local-preview'}`}>
                <span>Content source</span>
                <strong>
                  {advisory.generation?.mode === 'ai'
                    ? 'AI structured generation'
                    : advisory.generation?.mode === 'local-fallback'
                      ? 'Local fallback'
                      : 'Local preview'}
                </strong>
                {generationState.status === 'fallback' && <small>{generationState.message}</small>}
              </div>

              <div className={`quality-summary ${quality.score < 75 ? 'attention' : ''}`}>
                <div className="quality-score-row">
                  <div>
                    <span>Design quality</span>
                    <strong>{quality.status}</strong>
                  </div>
                  <b>{quality.score}</b>
                </div>
                {quality.issues.length === 0 ? (
                  <p className="quality-pass">Measured text fits the selected layout with no clipped content.</p>
                ) : (
                  <ul>
                    {quality.issues.slice(0, 4).map(item => <li key={item.id}>{item.label}</li>)}
                  </ul>
                )}
                {!quality.fit.fits && (
                  <button className="quality-autofit" type="button" onClick={handleAutoFit}>Auto-fit layout</button>
                )}
              </div>

              <label className="field">
                <span>Title</span>
                <input value={advisory.title} onChange={event => updateField('title', event.target.value)} />
              </label>

              <label className="field">
                <span>Introduction</span>
                <textarea rows="5" value={advisory.intro} onChange={event => updateField('intro', event.target.value)} />
              </label>

              <div className="editor-group">
                <input className="section-title-input" value={advisory.sectionOneTitle} onChange={event => updateField('sectionOneTitle', event.target.value)} />
                {advisory.sectionOnePoints.map((point, index) => (
                  <EditablePoint key={`one-${index}`} index={index} value={point} onChange={value => updatePoint('sectionOnePoints', index, value)} />
                ))}
              </div>

              <div className="editor-group">
                <input className="section-title-input" value={advisory.sectionTwoTitle} onChange={event => updateField('sectionTwoTitle', event.target.value)} />
                {advisory.sectionTwoPoints.map((point, index) => (
                  <EditablePoint key={`two-${index}`} index={index} value={point} onChange={value => updatePoint('sectionTwoPoints', index, value)} />
                ))}
              </div>
            </section>
          )}

          {panel === 'references' && (
            <section className="panel-content reference-panel">
              <div className="panel-heading compact">
                <span className="eyebrow">DESIGN LIBRARY</span>
                <h2>Existing advisories</h2>
                <p>These uploaded designs are the visual reference set for the generator.</p>
              </div>
              <label className="field">
                <span>Search references</span>
                <input value={referenceSearch} onChange={event => setReferenceSearch(event.target.value)} placeholder="Search topic" />
              </label>
              <div className="reference-grid">
                {filteredReferences.map(reference => (
                  <a key={reference.id} className="reference-card" href={reference.url} target="_blank" rel="noreferrer">
                    <img src={reference.url} alt={reference.title} loading="lazy" />
                    <span>{reference.title}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </aside>

        <section className="studio">
          <div className="studio-toolbar">
            <div>
              <span className="toolbar-label">Layout</span>
              <div className="template-switcher">
                {TEMPLATES.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={template === item.id ? 'active' : ''}
                    onClick={() => setTemplate(item.id)}
                    title={item.description}
                  >
                    {item.name}
                  </button>
                ))}
                <button className="auto-fit-button" type="button" onClick={handleAutoFit}>Auto-fit</button>
              </div>
            </div>
            <div className={`quality-chip ${quality.score < 75 ? 'warning' : ''}`}>
              <span className="quality-dot" />
              {quality.fit.fits ? 'Fit verified' : 'Overflow detected'} · {quality.score}/100
            </div>
          </div>

          <div className="canvas-stage">
            <div className="canvas-frame">
              <AdvisoryCanvas ref={canvasRef} advisory={advisory} template={template} />
            </div>
          </div>

          <div className="statusbar">
            <span>{advisory.category}</span>
            <span>{advisory.generation?.provider || 'local-rules'}</span>
            <span>{quality.fit.fits ? 'Measured fit verified' : 'Measured overflow'}</span>
            <span>Quality {quality.score}/100</span>
            <span>1080 × 1350</span>
            <span>SVG master</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
