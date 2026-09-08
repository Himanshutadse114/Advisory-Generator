export async function generateHybridAdvisory(input) {
  const response = await fetch('/api/advisories/generate-hybrid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || `Hybrid generation failed (${response.status}).`)
  if (!payload?.project?.advisory || !payload?.project?.blueprint) throw new Error('Hybrid generator returned an incomplete project.')
  return payload.project
}

export async function imageUrlToDataUrl(url) {
  if (!url || url.startsWith('data:')) return url || ''
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) return url
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || url))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}
