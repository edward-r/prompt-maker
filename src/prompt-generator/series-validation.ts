import type { SeriesResponse } from './types'

const REQUIRED_ATOMIC_PROMPT_SECTIONS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: '# Title', pattern: /^#\s*Title\b/im },
  { label: 'Role', pattern: /^(?:#{1,6}\s*)?Role\b/im },
  { label: 'Context', pattern: /^(?:#{1,6}\s*)?Context\b/im },
  {
    label: 'Goals & Tasks',
    pattern: /^(?:#{1,6}\s*)?Goals\s*(?:&|and)\s*Tasks\b/im,
  },
  { label: 'Inputs', pattern: /^(?:#{1,6}\s*)?Inputs\b/im },
  { label: 'Constraints', pattern: /^(?:#{1,6}\s*)?Constraints\b/im },
  { label: 'Execution Plan', pattern: /^(?:#{1,6}\s*)?Execution\s+Plan\b/im },
  { label: 'Output Format', pattern: /^(?:#{1,6}\s*)?Output\s+Format\b/im },
  { label: 'Validation', pattern: /^(?:#{1,6}\s*)?Validation\b/im },
]

const FORBIDDEN_CROSS_REFERENCE_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: '"as above"', pattern: /\bas above\b/i },
  { label: '"as mentioned earlier"', pattern: /\bas mentioned earlier\b/i },
  { label: '"as described earlier"', pattern: /\bas described earlier\b/i },
  {
    label: '"previous step" / "prior step" / "earlier step"',
    pattern: /\b(previous|prior|earlier)\s+step\b/i,
  },
  {
    label: '"previous prompt" / "prior prompt" / "earlier prompt"',
    pattern: /\b(previous|prior|earlier)\s+prompt\b/i,
  },
  { label: '"from step N"', pattern: /\bfrom\s+step\s+\d+\b/i },
  { label: '"in step N"', pattern: /\bin\s+step\s+\d+\b/i },
  { label: '"see step N"', pattern: /\bsee\s+step\s+\d+\b/i },
  { label: '"step N above/below"', pattern: /\bstep\s+\d+\s+(above|below)\b/i },
  { label: '"continue from step N"', pattern: /\bcontinue\s+from\s+step\s+\d+\b/i },
]

const findMissingAtomicPromptSections = (content: string): string[] => {
  return REQUIRED_ATOMIC_PROMPT_SECTIONS.filter((section) => !section.pattern.test(content)).map(
    (section) => section.label,
  )
}

const findForbiddenCrossReference = (content: string): string | null => {
  const hit = FORBIDDEN_CROSS_REFERENCE_PATTERNS.find((entry) => entry.pattern.test(content))
  return hit?.label ?? null
}

export const validateSeriesResponse = (response: SeriesResponse): void => {
  if (!response || typeof response !== 'object') {
    throw new Error('LLM returned SeriesResponse with invalid shape.')
  }

  if (typeof response.reasoning !== 'string' || !response.reasoning.trim()) {
    throw new Error('Series reasoning is required.')
  }

  if (typeof response.overviewPrompt !== 'string' || !response.overviewPrompt.trim()) {
    throw new Error('Series overviewPrompt is required.')
  }

  if (!Array.isArray(response.atomicPrompts) || response.atomicPrompts.length === 0) {
    throw new Error('Series atomicPrompts must include at least one entry.')
  }

  response.atomicPrompts.forEach((entry, index) => {
    const promptNumber = index + 1

    if (!entry || typeof entry !== 'object') {
      throw new Error(`Atomic prompt ${promptNumber} is invalid.`)
    }
    if (typeof entry.title !== 'string' || !entry.title.trim()) {
      throw new Error(`Atomic prompt ${promptNumber} is missing a title.`)
    }
    if (typeof entry.content !== 'string' || !entry.content.trim()) {
      throw new Error(`Atomic prompt ${promptNumber} is missing content.`)
    }

    const missingSections = findMissingAtomicPromptSections(entry.content)
    if (missingSections.length > 0) {
      throw new Error(
        `Atomic prompt ${promptNumber} is missing required section(s): ${missingSections.join(', ')}.`,
      )
    }

    const forbiddenCrossReference = findForbiddenCrossReference(entry.content)
    if (forbiddenCrossReference) {
      throw new Error(
        `Atomic prompt ${promptNumber} contains forbidden cross-reference phrase ${forbiddenCrossReference}. Atomic prompts must be standalone.`,
      )
    }
  })
}
