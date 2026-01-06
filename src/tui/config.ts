export const COMMAND_DESCRIPTORS = [
  { id: 'model', label: 'Model', description: 'Switch the generation model' },
  {
    id: 'target',
    label: 'Target',
    description:
      'Switch the runtime model used for optimization (/target; not included in prompt text)',
  },
  {
    id: 'intent',
    label: 'Intent File',
    description: 'Use a file for the intent text (/intent path/to/file.md)',
  },
  {
    id: 'instructions',
    label: 'Meta Instructions',
    description: 'Add optional meta guidance (/meta <text>)',
    aliases: ['meta'] as const,
  },
  {
    id: 'new',
    label: 'New',
    description: 'Reset session state (/new)',
  },
  {
    id: 'reuse',
    label: 'Reuse',
    description: 'Reset and reuse last prompt (/reuse)',
  },
  { id: 'file', label: 'File', description: 'Attach file context' },
  { id: 'url', label: 'URL', description: 'Add/manage URL context (/url [url1 url2 ...])' },
  { id: 'smart', label: 'Smart', description: 'Toggle smart context (/smart on|off)' },
  {
    id: 'smart-root',
    label: 'Smart Context Root',
    description: 'Set/clear smart context root (/smart-root path or /smart-root --clear)',
  },
  { id: 'image', label: 'Image', description: 'Attach reference images' },
  { id: 'video', label: 'Video', description: 'Attach reference videos' },
  { id: 'polish', label: 'Polish', description: 'Select a model for prompt polishing' },
  {
    id: 'series',
    label: 'Series',
    description:
      'Atomic prompt series (Tab) · standalone prompts; prefilled from typed/last intent or intent file',
  },
  { id: 'copy', label: 'Copy', description: 'Auto-copy final prompt' },
  { id: 'chatgpt', label: 'ChatGPT', description: 'Open ChatGPT automatically' },
  { id: 'json', label: 'JSON', description: 'Toggle JSON payload in history (/json on|off)' },
  { id: 'tokens', label: 'Tokens', description: 'Show token usage breakdown (/tokens)' },
  {
    id: 'budgets',
    label: 'Budgets',
    description: 'Configure token budgets and overflow strategy (/budgets)',
  },
  { id: 'settings', label: 'Settings', description: 'Show current settings (/settings)' },
  { id: 'theme', label: 'Theme', description: 'Switch TUI theme (/theme)' },
  {
    id: 'theme-mode',
    label: 'Theme Mode',
    description: 'Switch theme mode (/theme-mode dark|light|system)',
  },
  {
    id: 'reasoning',
    label: 'Reasoning',
    description: 'Show last model reasoning (/reasoning or /why)',
    aliases: ['why'] as const,
  },
  { id: 'history', label: 'History', description: 'Browse command/intent history (/history)' },
  {
    id: 'resume',
    label: 'Resume',
    description: 'Resume generation from history or an exported payload (/resume)',
  },
  {
    id: 'export',
    label: 'Export',
    description: 'Export a selected history payload to JSON/YAML (/export)',
  },
  { id: 'test', label: 'Test', description: 'Run prompt tests (/test prompt-tests.yaml)' },
  { id: 'exit', label: 'Exit', description: 'Exit the app (/exit)' },
] as const

export const TOGGLE_LABELS = {
  copy: 'Copy',
  chatgpt: 'ChatGPT',
  json: 'JSON',
} as const

export const POPUP_HEIGHTS = {
  model: 16,
  toggle: 6,
  file: 16,
  url: 12,
  image: 16,
  video: 16,
  history: 16,
  resume: 18,
  export: 18,
  smart: 12,
  tokens: 16,
  budgets: 14,
  settings: 14,
  theme: 16,
  themeMode: 8,
  reasoning: 18,
  test: 7,
  intent: 9,
  instructions: 7,
  series: 8,
} as const
