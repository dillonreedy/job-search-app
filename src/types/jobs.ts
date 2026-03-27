import { z } from "zod";

const stringArray = z.array(z.string()).default([]);

export const compensationSchema = z
  .object({
    currency: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    interval: z.string().optional(),
    display: z.string().optional(),
  })
  .partial()
  .optional();

export const jobSchema = z.object({
  company: z.string(),
  job_title: z.string(),
  location: z.string().optional(),
  remote_status: z.string().optional(),
  posting_date: z.string().optional(),
  found_date: z.string().optional(),
  source_type: z.string().optional(),
  source_name: z.string().optional(),
  job_url: z.string().url().optional(),
  fit_score: z.number().min(0).max(10).optional(),
  match_reasons: stringArray,
  red_flags: stringArray,
  skills_alignment: stringArray,
  role_signals: stringArray,
  compensation: compensationSchema,
  dedupe_key: z.string().optional(),
  confidence: z.string().optional(),
});

export const summarySchema = z
  .object({
    insights: stringArray,
    highlights: stringArray.optional(),
    notes: stringArray.optional(),
  })
  .partial()
  .default({});

export const searchMetadataSchema = z
  .object({
    generated_at: z.string().optional(),
    report_date: z.string().optional(),
    query: z.string().optional(),
    location_focus: z.string().optional(),
    total_roles_considered: z.number().optional(),
    notes: stringArray.optional(),
  })
  .partial()
  .default({});

export const jobsDataSchema = z.object({
  search_metadata: searchMetadataSchema,
  top_matches: z.array(jobSchema).default([]),
  strong_maybes: z.array(jobSchema).default([]),
  rejected: z.array(jobSchema).default([]),
  summary: summarySchema,
});

export type Compensation = z.infer<typeof compensationSchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobsData = z.infer<typeof jobsDataSchema>;
export type JobSectionKey = "top_matches" | "strong_maybes" | "rejected";
export type LoadedJob = Job & { sourceFile?: string };

export type SectionedJob = LoadedJob & {
  section: JobSectionKey;
  id: string;
};

export type ConfidenceFilter = "all" | "high" | "medium" | "low" | "unknown";
export type ViewMode = "cards" | "list";
export type SortOption =
  | "fit_desc"
  | "posting_newest"
  | "company_asc"
  | "compensation_desc";

export type FilterState = {
  section: "all" | JobSectionKey;
  hideExcluded: boolean;
  remoteStatus: string;
  sourceType: string;
  confidence: ConfidenceFilter;
  minFitScore: number;
  search: string;
  keywordTags: string[];
  sortBy: SortOption;
  viewMode: ViewMode;
};

type LegacyJobsData = JobsData;

const booleanMapSchema = z.record(z.string(), z.boolean()).default({});

const incomingCompensationSchema = z
  .object({
    currency: z.string().nullable().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    interval: z.string().optional(),
    display: z.string().optional(),
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    comp_visible: z.boolean().optional(),
  })
  .partial()
  .default({});

const incomingJobSchema = z.object({
  id: z.string().optional(),
  company: z.string(),
  job_title: z.string(),
  location: z.string().nullable().optional(),
  remote_status: z.string().nullable().optional(),
  posting_date: z.string().nullable().optional(),
  found_date: z.string().nullable().optional(),
  source_type: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  job_url: z.string().url().optional(),
  fit_score: z.number().min(0).max(10).optional(),
  match_reasons: stringArray,
  red_flags: stringArray,
  skills_alignment: z.union([stringArray, booleanMapSchema]).default([]),
  role_signals: z.union([stringArray, booleanMapSchema]).default([]),
  compensation: incomingCompensationSchema.optional(),
  dedupe_key: z.string().optional(),
  confidence: z.string().nullable().optional(),
  bucket: z.string().optional(),
});

const excludedJobSchema = z.object({
  id: z.string().optional(),
  dedupe_key: z.string().optional(),
  company: z.string(),
  job_title: z.string(),
  location: z.string().optional(),
  job_url: z.string().url().optional(),
  rejection_reasons: stringArray,
});

const modernJobsDataSchema = z.object({
  schema_version: z.string().optional(),
  generated_at: z.string().optional(),
  meta: z
    .object({
      run_date: z.string().optional(),
      target_locations: stringArray.optional(),
      date_window: z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
        })
        .partial()
        .optional(),
      candidate_profile_summary: z.string().optional(),
      source_preference: stringArray.optional(),
    })
    .partial()
    .default({}),
  stats: z
    .object({
      jobs_considered: z.number().optional(),
      jobs_included: z.number().optional(),
      jobs_excluded: z.number().optional(),
      top_matches_count: z.number().optional(),
      strong_maybes_count: z.number().optional(),
    })
    .partial()
    .default({}),
  jobs: z.array(incomingJobSchema).default([]),
  excluded_jobs: z.array(excludedJobSchema).default([]),
  summary: z
    .object({
      best_overall: z
        .object({
          company: z.string().nullable().optional(),
          job_title: z.string().nullable().optional(),
          job_url: z.string().url().nullable().optional(),
        })
        .partial()
        .optional(),
      best_react_nextjs_fit: z
        .object({
          company: z.string().nullable().optional(),
          job_title: z.string().nullable().optional(),
          job_url: z.string().url().nullable().optional(),
        })
        .partial()
        .optional(),
      best_design_systems_fit: z
        .object({
          company: z.string().nullable().optional(),
          job_title: z.string().nullable().optional(),
          job_url: z.string().url().nullable().optional(),
        })
        .partial()
        .optional(),
      best_comp_visible_role: z
        .object({
          company: z.string().nullable().optional(),
          job_title: z.string().nullable().optional(),
          job_url: z.string().url().nullable().optional(),
        })
        .partial()
        .optional(),
      market_notes: stringArray.optional(),
    })
    .partial()
    .default({}),
});

export function normalizeJobsData(raw: unknown): JobsData {
  if (isRecord(raw) && (Array.isArray(raw.jobs) || Array.isArray(raw.excluded_jobs))) {
    const parsedModern = modernJobsDataSchema.safeParse(raw);
    if (!parsedModern.success) {
      throw parsedModern.error;
    }
    return normalizeModernJobsData(parsedModern.data);
  }

  const parsedLegacy = jobsDataSchema.safeParse(raw);
  if (!parsedLegacy.success) {
    throw parsedLegacy.error;
  }

  return parsedLegacy.data as LegacyJobsData;
}

function normalizeModernJobsData(data: z.infer<typeof modernJobsDataSchema>): JobsData {
  const topMatches = data.jobs
    .filter((job) => job.bucket === "TOP_MATCH")
    .map((job) => normalizeIncomingJob(job));
  const strongMaybes = data.jobs
    .filter((job) => job.bucket === "STRONG_MAYBE")
    .map((job) => normalizeIncomingJob(job));
  const rejected = data.excluded_jobs.map((job) => normalizeExcludedJob(job));

  return {
    search_metadata: {
      generated_at: data.generated_at,
      report_date: data.meta.run_date,
      query: data.meta.candidate_profile_summary,
      location_focus: data.meta.target_locations?.join(", "),
      total_roles_considered: data.stats.jobs_considered,
      notes: compactStrings([
        data.meta.date_window?.from && data.meta.date_window?.to
          ? `Date window: ${data.meta.date_window.from} to ${data.meta.date_window.to}`
          : undefined,
        data.meta.source_preference?.length
          ? `Source preference: ${data.meta.source_preference.join(", ")}`
          : undefined,
      ]),
    },
    top_matches: topMatches,
    strong_maybes: strongMaybes,
    rejected,
    summary: {
      insights: data.summary.market_notes ?? [],
      highlights: compactStrings([
        formatBestFit("Best overall", data.summary.best_overall),
        formatBestFit("Best React / Next.js fit", data.summary.best_react_nextjs_fit),
        formatBestFit("Best design systems fit", data.summary.best_design_systems_fit),
        formatBestFit("Best comp visible role", data.summary.best_comp_visible_role),
      ]),
      notes: compactStrings([
        data.meta.candidate_profile_summary
          ? `Candidate profile: ${data.meta.candidate_profile_summary}`
          : undefined,
        typeof data.stats.jobs_included === "number" && typeof data.stats.jobs_excluded === "number"
          ? `Included ${data.stats.jobs_included} jobs and excluded ${data.stats.jobs_excluded}.`
          : undefined,
      ]),
    },
  };
}

function normalizeIncomingJob(job: z.infer<typeof incomingJobSchema>): Job {
  return {
    company: job.company,
    job_title: job.job_title,
    location: job.location ?? undefined,
    remote_status: job.remote_status ?? undefined,
    posting_date: job.posting_date ?? undefined,
    found_date: job.found_date ?? undefined,
    source_type: job.source_type ?? undefined,
    source_name: job.source_name ?? undefined,
    job_url: job.job_url,
    fit_score: job.fit_score,
    match_reasons: job.match_reasons,
    red_flags: job.red_flags,
    skills_alignment: normalizeBooleanFlags(job.skills_alignment),
    role_signals: normalizeBooleanFlags(job.role_signals),
    compensation: normalizeCompensation(job.compensation),
    dedupe_key: job.dedupe_key ?? job.id,
    confidence: job.confidence ?? undefined,
  };
}

function normalizeExcludedJob(job: z.infer<typeof excludedJobSchema>): Job {
  return {
    company: job.company,
    job_title: job.job_title,
    location: job.location,
    job_url: job.job_url,
    fit_score: undefined,
    match_reasons: [],
    red_flags: job.rejection_reasons,
    skills_alignment: [],
    role_signals: [],
    compensation: undefined,
    dedupe_key: job.dedupe_key ?? job.id,
    confidence: undefined,
  };
}

function normalizeCompensation(compensation: z.infer<typeof incomingCompensationSchema> | undefined) {
  if (!compensation) {
    return undefined;
  }

  const min = compensation.min ?? compensation.salary_min;
  const max = compensation.max ?? compensation.salary_max;

  if (!compensation.display && !min && !max) {
    return undefined;
  }

  return {
    currency: compensation.currency ?? undefined,
    min,
    max,
    interval: compensation.interval,
    display: compensation.display,
  };
}

function normalizeBooleanFlags(values: string[] | Record<string, boolean>) {
  if (Array.isArray(values)) {
    return values;
  }

  return Object.entries(values)
    .filter(([, enabled]) => enabled)
    .map(([key]) => humanizeKey(key));
}

function humanizeKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\bnextjs\b/gi, "Next.js")
    .replace(/\bgraphql\b/gi, "GraphQL")
    .replace(/\bui\b/g, "UI")
    .replace(/\bic\b/g, "IC")
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
}

function formatBestFit(
  label: string,
  fit:
    | {
        company?: string | null;
        job_title?: string | null;
      }
    | undefined,
) {
  if (!fit?.company || !fit.job_title) {
    return undefined;
  }

  return `${label}: ${fit.company} - ${fit.job_title}`;
}

function compactStrings(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
