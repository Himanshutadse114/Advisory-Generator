function safeName(value) {
  return String(value || 'advisory').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'advisory'
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

export function exportProjectJson(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${safeName(project?.advisory?.title)}.advisory.json`)
}

export function exportSvg(svgElement, project) {
  if (!svgElement) return
  const clone = svgElement.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '1080')
  clone.setAttribute('height', '1620')
  const source = new XMLSerializer().serializeToString(clone)
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), `${safeName(project?.advisory?.title)}.svg`)
}

export async function exportPng(svgElement, project) {
  if (!svgElement) return
  const clone = svgElement.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '1080')
  clone.setAttribute('height', '1620')
  const source = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = 2160
    canvas.height = 3240
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1))
    if (!blob) throw new Error('PNG export failed.')
    downloadBlob(blob, `${safeName(project?.advisory?.title)}.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function importProjectJson(file) {
  const text = await file.text()
  const project = JSON.parse(text)
  if (project?.mode !== 'hybrid-editable' || !project?.advisory || !project?.blueprint) throw new Error('This is not a valid hybrid advisory project file.')
  return project
}
