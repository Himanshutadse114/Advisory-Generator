export const EDITOR_LAYERS = [
  { id: 'header', label: 'Header', scalable: false },
  { id: 'title', label: 'Title', scalable: true },
  { id: 'intro', label: 'Introduction', scalable: true },
  { id: 'illustration', label: 'Illustration', scalable: true },
  { id: 'sectionOne', label: 'How It Works', scalable: true },
  { id: 'sectionTwo', label: 'Best Practices', scalable: true },
  { id: 'footer', label: 'Footer', scalable: false }
]

export function createEditorState() {
  return {
    selectedLayer: 'title',
    snapToGrid: true,
    showGuides: true,
    layers: Object.fromEntries(EDITOR_LAYERS.map(layer => [layer.id, {
      x: 0,
      y: 0,
      scale: 1,
      locked: layer.id === 'header' || layer.id === 'footer',
      visible: true
    }]))
  }
}

export function updateLayerState(editor, layerId, patch) {
  const current = editor.layers[layerId]
  if (!current) return editor
  return { ...editor, layers: { ...editor.layers, [layerId]: { ...current, ...patch } } }
}

export function resetLayerState(editor, layerId) {
  const defaults = createEditorState().layers[layerId]
  if (!defaults) return editor
  return updateLayerState(editor, layerId, defaults)
}

export function resetAllLayers(editor) {
  const fresh = createEditorState()
  return { ...fresh, selectedLayer: editor?.selectedLayer || 'title', snapToGrid: editor?.snapToGrid !== false, showGuides: editor?.showGuides !== false }
}
