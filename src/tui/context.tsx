import React, { useCallback, useEffect, useState } from 'react'

import { loadCliConfig } from '../config'

import { ContextDispatchContext, ContextStateContext } from './context-store'

export const ContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<string[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [pdfs, setPdfs] = useState<string[]>([])
  const [smartContextEnabled, setSmartContextEnabled] = useState(false)
  const [smartContextRoot, setSmartContextRoot] = useState<string | null>(null)
  const [metaInstructions, setMetaInstructions] = useState('')
  const [maxContextTokens, setMaxContextTokens] = useState<number | null>(null)
  const [maxInputTokens, setMaxInputTokens] = useState<number | null>(null)
  const [contextOverflowStrategy, setContextOverflowStrategy] = useState<
    import('../config').ContextOverflowStrategy | null
  >(null)
  const [lastReasoning, setLastReasoning] = useState<string | null>(null)
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string | null>(null)

  const addEntry = useCallback(
    (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }
      setter((prev) => [...prev, trimmed])
    },
    [],
  )

  const removeEntry = useCallback(
    (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter((prev) => prev.filter((_, idx) => idx !== index))
    },
    [],
  )

  const updateEntry = useCallback(
    (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }

      setter((prev) => {
        if (index < 0 || index >= prev.length) {
          return prev
        }

        const next = [...prev]
        next[index] = trimmed
        return next
      })
    },
    [],
  )

  const addFile = useCallback((value: string) => addEntry(value, setFiles), [addEntry])
  const removeFile = useCallback((index: number) => removeEntry(index, setFiles), [removeEntry])

  const addUrl = useCallback((value: string) => addEntry(value, setUrls), [addEntry])
  const removeUrl = useCallback((index: number) => removeEntry(index, setUrls), [removeEntry])
  const updateUrl = useCallback(
    (index: number, value: string) => updateEntry(index, value, setUrls),
    [updateEntry],
  )

  const addImage = useCallback((value: string) => addEntry(value, setImages), [addEntry])
  const removeImage = useCallback((index: number) => removeEntry(index, setImages), [removeEntry])

  const addVideo = useCallback((value: string) => addEntry(value, setVideos), [addEntry])
  const removeVideo = useCallback((index: number) => removeEntry(index, setVideos), [removeEntry])

  const addPdf = useCallback((value: string) => addEntry(value, setPdfs), [addEntry])
  const removePdf = useCallback((index: number) => removeEntry(index, setPdfs), [removeEntry])

  const toggleSmartContext = useCallback(() => {
    setSmartContextEnabled((prev) => !prev)
  }, [])

  const setSmartRoot = useCallback((value: string) => {
    const trimmed = value.trim()
    setSmartContextRoot(trimmed.length > 0 ? trimmed : null)
  }, [])

  const resetContext = useCallback(() => {
    setFiles([])
    setUrls([])
    setImages([])
    setVideos([])
    setPdfs([])
    setSmartContextEnabled(false)
    setSmartContextRoot(null)
    setMetaInstructions('')
    setLastReasoning(null)
  }, [])

  const setBudgets = useCallback(
    (value: {
      maxContextTokens: number | null
      maxInputTokens: number | null
      contextOverflowStrategy: import('../config').ContextOverflowStrategy | null
    }) => {
      setMaxContextTokens(value.maxContextTokens)
      setMaxInputTokens(value.maxInputTokens)
      setContextOverflowStrategy(value.contextOverflowStrategy)
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    const loadBudgetsFromConfig = async (): Promise<void> => {
      const config = await loadCliConfig().catch(() => null)
      if (cancelled) {
        return
      }

      const promptGenerator = config?.promptGenerator
      setMaxInputTokens(promptGenerator?.maxInputTokens ?? null)
      setMaxContextTokens(promptGenerator?.maxContextTokens ?? null)
      setContextOverflowStrategy(promptGenerator?.contextOverflowStrategy ?? null)
    }

    void loadBudgetsFromConfig()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ContextStateContext.Provider
      value={{
        files,
        urls,
        images,
        videos,
        pdfs,

        smartContextEnabled,
        smartContextRoot,
        metaInstructions,
        maxContextTokens,
        maxInputTokens,
        contextOverflowStrategy,
        lastReasoning,
        lastGeneratedPrompt,
      }}
    >
      <ContextDispatchContext.Provider
        value={{
          addFile,
          removeFile,
          addUrl,
          removeUrl,
          updateUrl,
          addImage,
          removeImage,
          addVideo,
          removeVideo,
          addPdf,
          removePdf,
          toggleSmartContext,
          setSmartRoot,
          setMetaInstructions,
          setBudgets,
          setLastReasoning,
          setLastGeneratedPrompt,
          resetContext,
        }}
      >
        {children}
      </ContextDispatchContext.Provider>
    </ContextStateContext.Provider>
  )
}
