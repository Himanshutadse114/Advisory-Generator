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

function serialiseSvg(svgElement) {
  if (!svgElement) throw new Error('Advisory canvas is not available.')
  const clone = svgElement.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '1080')
  clone.setAttribute('height', '1620')
  return new XMLSerializer().serializeToString(clone)
}

async function renderCanvas(svgElement, scale = 2) {
  const source = serialiseSvg(svgElement)
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Unable to render the advisory artwork for export.'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = 1080 * scale
    canvas.height = 1620 * scale
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

function base64Bytes(dataUrl) {
  const base64 = dataUrl.split(',')[1] || ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function encode(text) {
  return new TextEncoder().encode(text)
}

function concat(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length }
  return result
}

function createSinglePagePdf(jpegBytes, width, height) {
  const pageWidth = 540
  const pageHeight = 810
  const header = encode('%PDF-1.4\n')
  const content = encode(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`)
  const objects = [
    encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`),
    concat([encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`), jpegBytes, encode('\nendstream\nendobj\n')]),
    concat([encode(`5 0 obj\n<< /Length ${content.length} >>\nstream\n`), content, encode('endstream\nendobj\n')])
  ]

  const offsets = []
  let cursor = header.length
  for (const object of objects) { offsets.push(cursor); cursor += object.length }
  const xrefOffset = cursor
  const xref = [`xref\n0 ${objects.length + 1}\n`, '0000000000 65535 f \n']
  for (const offset of offsets) xref.push(`${String(offset).padStart(10, '0')} 00000 n \n`)
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return concat([header, ...objects, encode(xref.join('')), encode(trailer)])
}

export function exportProjectJson(project) {
  downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${safeName(project?.advisory?.title)}.advisory.json`)
}

export function exportSvg(svgElement, project) {
  const source = serialiseSvg(svgElement)
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), `${safeName(project?.advisory?.title)}.svg`)
}

export async function exportPng(svgElement, project) {
  const canvas = await renderCanvas(svgElement, 2)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1))
  if (!blob) throw new Error('PNG export failed.')
  downloadBlob(blob, `${safeName(project?.advisory?.title)}.png`)
}

export async function exportPdf(svgElement, project) {
  const canvas = await renderCanvas(svgElement, 2)
  const jpeg = canvas.toDataURL('image/jpeg', 0.96)
  const pdf = createSinglePagePdf(base64Bytes(jpeg), canvas.width, canvas.height)
  downloadBlob(new Blob([pdf], { type: 'application/pdf' }), `${safeName(project?.advisory?.title)}.pdf`)
}

export async function importProjectJson(file) {
  const text = await file.text()
  const project = JSON.parse(text)
  if (project?.mode !== 'hybrid-editable' || !project?.advisory || !project?.blueprint) throw new Error('This is not a valid hybrid advisory project file.')
  return project
}
