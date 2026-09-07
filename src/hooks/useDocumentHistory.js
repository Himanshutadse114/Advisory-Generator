import { useCallback, useState } from 'react'

export default function useDocumentHistory(initialValue, limit = 80) {
  const [state, setState] = useState({
    past: [],
    present: initialValue,
    future: []
  })

  const commit = useCallback(updater => {
    setState(current => {
      const next = typeof updater === 'function' ? updater(current.present) : updater
      if (Object.is(next, current.present)) return current
      return {
        past: [...current.past.slice(-(limit - 1)), current.present],
        present: next,
        future: []
      }
    })
  }, [limit])

  const replace = useCallback(updater => {
    setState(current => ({
      ...current,
      present: typeof updater === 'function' ? updater(current.present) : updater
    }))
  }, [])

  const reset = useCallback(value => {
    setState({ past: [], present: value, future: [] })
  }, [])

  const undo = useCallback(() => {
    setState(current => {
      if (!current.past.length) return current
      const previous = current.past[current.past.length - 1]
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future]
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState(current => {
      if (!current.future.length) return current
      const next = current.future[0]
      return {
        past: [...current.past, current.present].slice(-limit),
        present: next,
        future: current.future.slice(1)
      }
    })
  }, [limit])

  return {
    value: state.present,
    commit,
    replace,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  }
}
