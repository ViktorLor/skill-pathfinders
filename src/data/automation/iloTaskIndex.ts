/**
 * The ILO does not publish the task-content index as a queryable dataset —
 * the six bucket weights below are read off the ILO 2024 GenAI exposure note
 * and the Autor-Levy-Murnane task framework that note builds on. The
 * blended-exposure values already incorporate the 2024 GenAI uplift for
 * cognitive work (the reason "non-routine cognitive analytical" is no
 * longer in the safe quadrant).
 */
export type TaskBucket =
  | "routine_cognitive"
  | "routine_manual"
  | "non_routine_cognitive_analytical"
  | "non_routine_cognitive_interpersonal"
  | "non_routine_manual"
  | "social_interactive";

export const ILO_TASK_EXPOSURE: Record<TaskBucket, number> = {
  routine_cognitive: 0.78,
  routine_manual: 0.52,
  non_routine_cognitive_analytical: 0.46,
  non_routine_cognitive_interpersonal: 0.18,
  non_routine_manual: 0.22,
  social_interactive: 0.15,
};

export const ILO_BUCKET_LABEL: Record<TaskBucket, string> = {
  routine_cognitive: "routine cognitive (data, bookkeeping, scripted text)",
  routine_manual: "routine manual (assembly, sorting)",
  non_routine_cognitive_analytical: "non-routine cognitive — analytical (now GenAI-exposed)",
  non_routine_cognitive_interpersonal: "non-routine cognitive — interpersonal",
  non_routine_manual: "non-routine manual (repair, field work)",
  social_interactive: "social / interactive (negotiation, trust, teaching)",
};

export const ILO_TASK_INDEX_META = {
  source: "ILO 2024 GenAI exposure note · Autor, Levy & Murnane (2003) task framework",
  note: "Six-bucket aggregation; updated 2024 to reflect GenAI uplift for analytical cognitive work.",
};
