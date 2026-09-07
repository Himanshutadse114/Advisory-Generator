import { useEffect, useState } from 'react'

const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash'
const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image'

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status}).`)
  return payload
}

function StatusPill({ configured, source }) {
  return (
    <div className={`admin-status-pill ${configured ? 'configured' : 'missing'}`}>
      <span className="admin-status-dot" />
      {configured ? `Configured${source ? ` · ${source}` : ''}` : 'Not configured'}
    </div>
  )
}

export default function AdminPanel() {
  const [session, setSession] = useState({ loading: true, authenticated: false, adminConfigured: false })
  const [settings, setSettings] = useState(null)
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(DEFAULT_TEXT_MODEL)
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL)
  const [state, setState] = useState({ status: 'idle', message: '' })

  const loadSettings = async () => {
    const payload = await api('/api/admin/settings')
    setSettings(payload)
    setModel(payload.gemini?.model || DEFAULT_TEXT_MODEL)
    setImageModel(payload.gemini?.imageModel || DEFAULT_IMAGE_MODEL)
    return payload
  }

  useEffect(() => {
    let active = true
    api('/api/admin/session')
      .then(async result => {
        if (!active) return
        setSession({ loading: false, ...result })
        if (result.authenticated) {
          try { await loadSettings() } catch (error) { if (active) setState({ status: 'error', message: error.message }) }
        }
      })
      .catch(error => {
        if (!active) return
        setSession({ loading: false, authenticated: false, adminConfigured: false })
        setState({ status: 'error', message: error.message })
      })
    return () => { active = false }
  }, [])

  const handleLogin = async event => {
    event.preventDefault()
    if (!password) return
    setState({ status: 'loading', message: 'Signing in…' })
    try {
      await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      })
      setPassword('')
      setSession(current => ({ ...current, authenticated: true }))
      await loadSettings()
      setState({ status: 'success', message: 'Admin access verified.' })
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  const handleSave = async event => {
    event.preventDefault()
    if (!apiKey.trim()) {
      setState({ status: 'error', message: 'Enter a Gemini API key before saving.' })
      return
    }

    setState({ status: 'loading', message: 'Encrypting and saving Gemini settings…' })
    try {
      const payload = await api('/api/admin/settings/gemini', {
        method: 'POST',
        headers: { 'X-Admin-Request': '1' },
        body: JSON.stringify({ apiKey, model, imageModel })
      })
      setApiKey('')
      setSettings(current => ({ ...(current || {}), authenticated: true, gemini: payload.gemini }))
      setState({ status: 'success', message: 'Gemini settings saved securely on the server.' })
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  const handleRemove = async () => {
    setState({ status: 'loading', message: 'Removing stored Gemini key…' })
    try {
      const payload = await api('/api/admin/settings/gemini', {
        method: 'DELETE',
        headers: { 'X-Admin-Request': '1' }
      })
      setSettings(current => ({ ...(current || {}), authenticated: true, gemini: payload.gemini }))
      setState({ status: 'success', message: payload.gemini?.configured ? 'Stored key removed. Environment credentials are still active.' : 'Stored Gemini key removed.' })
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  const handleLogout = async () => {
    try { await api('/api/admin/logout', { method: 'POST', body: '{}' }) } catch {}
    setSession(current => ({ ...current, authenticated: false }))
    setSettings(null)
    setApiKey('')
    setState({ status: 'idle', message: '' })
  }

  if (session.loading) {
    return <section className="panel-content admin-panel"><div className="panel-heading compact"><span className="eyebrow">ADMIN</span><h2>Loading settings…</h2></div></section>
  }

  if (!session.adminConfigured) {
    return (
      <section className="panel-content admin-panel">
        <div className="panel-heading compact"><span className="eyebrow">ADMIN</span><h2>Admin setup required</h2><p>Set <code>ADMIN_PASSWORD</code> on the server first. It must be at least 12 characters. The password is never stored in the browser.</p></div>
        <div className="admin-security-note"><strong>Why this is required</strong><p>The Gemini API key must only be writable by an authenticated administrator. Once the admin password is configured, this panel can securely store the key without committing it to GitHub.</p></div>
      </section>
    )
  }

  if (!session.authenticated) {
    return (
      <section className="panel-content admin-panel">
        <div className="panel-heading compact"><span className="eyebrow">ADMIN</span><h2>Admin sign in</h2><p>Sign in to manage AI credentials. Sessions expire automatically.</p></div>
        <form className="admin-form" onSubmit={handleLogin}>
          <label className="field"><span>Admin password</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
          <button className="generate-button" type="submit" disabled={!password || state.status === 'loading'}><span>{state.status === 'loading' ? 'Signing in…' : 'Sign in'}</span><small>Protected server-side session</small></button>
        </form>
        {state.message && <div className={`admin-message ${state.status}`}>{state.message}</div>}
      </section>
    )
  }

  const gemini = settings?.gemini || {}

  return (
    <section className="panel-content admin-panel">
      <div className="panel-heading compact"><span className="eyebrow">ADMIN SETTINGS</span><h2>Gemini configuration</h2><p>Add or replace the Gemini API key used by the advisory generator. The saved key is encrypted at rest and never displayed again.</p></div>

      <div className="admin-provider-card">
        <div>
          <span>Gemini provider</span>
          <strong>{gemini.provider || 'google-gemini'}</strong>
        </div>
        <StatusPill configured={Boolean(gemini.configured)} source={gemini.source} />
        {gemini.maskedKey && <small>Saved key: {gemini.maskedKey}</small>}
        {gemini.updatedAt && <small>Updated: {new Date(gemini.updatedAt).toLocaleString()}</small>}
      </div>

      <form className="admin-form" onSubmit={handleSave}>
        <label className="field"><span>Gemini API key</span><input type="password" autoComplete="new-password" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={gemini.maskedKey || 'Paste a new Gemini API key'} /></label>
        <label className="field"><span>Text model</span><input value={model} onChange={event => setModel(event.target.value)} placeholder={DEFAULT_TEXT_MODEL} /></label>
        <label className="field"><span>Image model</span><input value={imageModel} onChange={event => setImageModel(event.target.value)} placeholder={DEFAULT_IMAGE_MODEL} /></label>
        <button className="generate-button" type="submit" disabled={!apiKey.trim() || state.status === 'loading'}><span>{state.status === 'loading' ? 'Saving…' : gemini.configured ? 'Replace API key' : 'Save API key'}</span><small>AES-256-GCM encrypted server storage</small></button>
      </form>

      <div className="admin-actions-row">
        <button className="ghost-button" type="button" disabled={!gemini.configured || state.status === 'loading'} onClick={handleRemove}>Remove stored key</button>
        <button className="ghost-button" type="button" onClick={handleLogout}>Sign out</button>
      </div>

      {state.message && <div className={`admin-message ${state.status}`}>{state.message}</div>}

      <div className="admin-security-note"><strong>Security behaviour</strong><p>The key is encrypted on the server, excluded from Git, returned only as a masked suffix and automatically used by both text generation and the configured image-generation model.</p></div>
    </section>
  )
}
