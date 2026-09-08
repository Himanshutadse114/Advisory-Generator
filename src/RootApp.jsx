import { useState } from 'react'
import AiApp from './AiApp'
import App from './App'
import './ai-advisory.css'

export default function RootApp() {
  const [mode, setMode] = useState('ai')

  if (mode === 'classic') {
    return (
      <div className="classic-root-wrap">
        <button className="back-to-ai-button" type="button" onClick={() => setMode('ai')}>← AI Advisory Generator</button>
        <App />
      </div>
    )
  }

  return <AiApp onOpenClassic={() => setMode('classic')} />
}
