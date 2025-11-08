

export const generateQuestions = (d: Diagnosis, max = 4): ClarifyingQ[] => {
  // Rank by missingness → top weighted criteria
  const prioritized = d.missing.sort((a, b) => {
    const w: Record<CriterionKey, number> = {
      outcome: 0.25,
      outputFormat: 0.25,
      constraints: 0.2,
      context: 0.15,
      processRubric: 0.1,
      uncertainty: 0.05,
    };
    return w[b] - w[a];
  });
  return prioritized.slice(0, max).map((k) => builders[k]());
};
