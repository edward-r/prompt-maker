import { loadCliConfig } from '../config'

const CONTEXT_TEMPLATE_PLACEHOLDER = '{{prompt}}'

const BUILT_IN_CONTEXT_TEMPLATES: Record<string, string> = {
  nvim: [
    '## NeoVim Prompt Buffer',
    'Paste this block into a scratch buffer (e.g., :enew) so you can keep prompts beside your work.',
    CONTEXT_TEMPLATE_PLACEHOLDER,
  ].join('\n\n'),
}

export const renderContextTemplate = (template: string, prompt: string): string => {
  if (template.includes(CONTEXT_TEMPLATE_PLACEHOLDER)) {
    return template.split(CONTEXT_TEMPLATE_PLACEHOLDER).join(prompt)
  }

  const trimmedTemplate = template.trimEnd()
  if (!trimmedTemplate) {
    return prompt
  }
  return `${trimmedTemplate}\n\n${prompt}`
}

export const resolveContextTemplate = async (name: string): Promise<string> => {
  const builtIn = BUILT_IN_CONTEXT_TEMPLATES[name]
  if (builtIn) {
    return builtIn
  }

  const config = await loadCliConfig()
  const fromConfig = config?.contextTemplates?.[name]
  if (fromConfig) {
    return fromConfig
  }

  const available = [
    ...Object.keys(BUILT_IN_CONTEXT_TEMPLATES),
    ...(config?.contextTemplates ? Object.keys(config.contextTemplates) : []),
  ]
  const availableList = available.length > 0 ? available.join(', ') : 'none'

  throw new Error(`Unknown context template "${name}". Available templates: ${availableList}.`)
}
