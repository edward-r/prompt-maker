import { PromptSections } from "./types";

const join = (label: string, value?: string | string[]) =>
  !value || (Array.isArray(value) && value.length === 0)
    ? ""
    : Array.isArray(value)
      ? `${label}:\n- ${value.join("\n- ")}\n`
      : `${label}: ${value}\n`;

export const buildPrompt = (s: PromptSections): string =>
  [
    join("Role", s.role),
    join("Objective", s.objective),
    join("Audience & Use", s.audienceUse),
    join("Context", s.context),
    join("Constraints", s.constraints),
    join("Output Format", s.outputFormat),
    join("Process", s.process),
    join("Rubric", s.rubric),
    join("Uncertainty", s.uncertainty),
  ]
    .filter(Boolean)
    .join("\n");
