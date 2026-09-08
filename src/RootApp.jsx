import { useState } from 'react'
import HybridApp from './HybridApp'
import AiApp from './AiApp'
import App from './App'
import './ai-advisory.css'

export default function RootApp() {
  const [mode, setMode] = useState('hybrid')

  if (mode === 'classic') {
    return (
      <div className="classic-root-wrap">
        <button className="back-to-ai-button" type="button" onClick={() => setMode('hybrid')}>← Hybrid Editable Studio</button>
        <App />
      </div>
    )
  }

  if (mode === 'poster') {
    return <AiApp onOpenClassic={() => setMode('classic')} onOpenHybrid={() => setMode('hybrid')} />
  }

  return <HybridApp onOpenFullPoster={() => setMode('poster')} onOpenClassic={() => setMode('classic')} />
}
