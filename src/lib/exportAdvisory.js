function serialiseSvg(svgElement) {
  const clone = svgElement.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  return new XMLSerializer().serializeToString(clone)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeName(value) {
  return (value || 'advisory')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function exportAsSvg(svgElement, title) {
  if (!svgElement) return
  const source = serialiseSvg(svgElement)
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, `${safeName(title)}.svg`)
}

export function exportAsPng(svgElement, title, scale = 2) {
  if (!svgElement) return

  const source = serialiseSvg(svgElement)
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const image = new Image()

  image.onload = () => {
    const viewBox = svgElement.viewBox.baseVal
    const width = viewBox.width || 1080
    const height = viewBox.height || 1350
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const context = canvas.getContext('2d')
    context.scale(scale, scale)
    context.drawImage(image, 0, 0, width, height)
    URL.revokeObjectURL(url)
    canvas.toBlob(pngBlob => {
      if (pngBlob) downloadBlob(pngBlob, `${safeName(title)}.png`)
    }, 'image/png', 1)
  }

  image.onerror = () => URL.revokeObjectURL(url)
  image.src = url
}
