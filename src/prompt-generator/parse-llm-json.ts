export const parseLLMJson = <T>(text: string): T => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    console.warn('Failed to parse LLM JSON response. Falling back to raw text.')
    throw new Error('LLM did not return valid JSON.')
  }
}
