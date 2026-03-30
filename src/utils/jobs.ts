import type {
  Compensation,
  FilterState,
  Job,
  JobSectionKey,
  LoadedJob,
  JobsData,
  SectionedJob,
} from "../types/jobs";

export const SECTION_LABELS: Record<JobSectionKey, string> = {
  top_matches: "Top Matches",
  strong_maybes: "Strong Maybes",
  rejected: "Rejected",
};

export const KEYWORD_TAGS = [
  "React",
  "Next.js",
  "TypeScript",
  "design systems",
  "accessibility",
  "performance",
] as const;

export function createJobId(
  job: Job,
  section: JobSectionKey,
  index: number,
  sourceFile?: string,
): string {
  const dedupe = job.dedupe_key?.trim();
  const sourcePrefix = sourceFile?.replace(/[^\w-]+/g, "-") ?? "local";
  if (dedupe) {
    return `${sourcePrefix}:${section}:${dedupe}`;
  }

  const company = job.company.trim().toLowerCase().replace(/\s+/g, "-");
  const title = job.job_title.trim().toLowerCase().replace(/\s+/g, "-");
  return `${sourcePrefix}:${section}:${company}:${title}:${index}`;
}

export function flattenJobs(data: JobsData): SectionedJob[] {
  return (Object.keys(SECTION_LABELS) as JobSectionKey[]).flatMap((section) =>
    data[section].map((job, index) => {
      const loadedJob = job as LoadedJob;
      return {
      ...job,
      id: createJobId(job, section, index, loadedJob.sourceFile),
      section,
      sourceFile: loadedJob.sourceFile,
    };
    }),
  );
}

export function getSummaryStats(data: JobsData, jobs: SectionedJob[]) {
  const topMatches = jobs.filter((job) => job.section === "top_matches");
  const visibleCompensationCount = jobs.filter((job) => hasCompensation(job.compensation)).length;
  const averageFitScore =
    topMatches.length > 0
      ? topMatches.reduce((sum, job) => sum + (job.fit_score ?? 0), 0) / topMatches.length
      : null;

  const newestPostingDate = jobs
    .map((job) => parseDate(getDisplayPostingDateValue(job)))
    .filter((value): value is number => value !== null)
    .sort((left, right) => right - left)[0];

  return {
    totalRoles: jobs.length,
    topMatches: data.top_matches.length,
    strongMaybes: data.strong_maybes.length,
    rejected: data.rejected.length,
    averageFitScore,
    newestPostingDate: newestPostingDate ? new Date(newestPostingDate) : null,
    visibleCompensationCount,
  };
}

export function getOptions(jobs: SectionedJob[], field: "remote_status" | "source_type") {
  const values = new Set(
    jobs
      .map((job) => job[field]?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  return Array.from(values).sort((left, right) => left.localeCompare(right));
}

export function filterAndSortJobs(jobs: SectionedJob[], filters: FilterState) {
  const keywordNeedles = filters.keywordTags.map((tag) => tag.toLowerCase());
  const searchNeedle = filters.search.trim().toLowerCase();

  return jobs
    .filter((job) => {
      if (filters.hideExcluded && job.section === "rejected") {
        return false;
      }

      if (filters.section !== "all" && job.section !== filters.section) {
        return false;
      }

      if (!matchesConfidence(job.confidence, filters.confidence)) {
        return false;
      }

      if ((job.fit_score ?? 0) < filters.minFitScore) {
        return false;
      }

      if (searchNeedle) {
        const haystack = `${job.company} ${job.job_title}`.toLowerCase();
        if (!haystack.includes(searchNeedle)) {
          return false;
        }
      }

      if (keywordNeedles.length > 0) {
        const content = getSearchableJobText(job).toLowerCase();
        if (!keywordNeedles.every((needle) => content.includes(needle))) {
          return false;
        }
      }

      return true;
    })
    .slice()
    .sort((left, right) => sortJobs(left, right, filters.sortBy));
}

function sortJobs(left: SectionedJob, right: SectionedJob, sortBy: FilterState["sortBy"]) {
  if (sortBy === "fit_desc") {
    return (right.fit_score ?? -1) - (left.fit_score ?? -1);
  }

  if (sortBy === "posting_newest") {
    return (parseDate(getDisplayPostingDateValue(right)) ?? 0) - (parseDate(getDisplayPostingDateValue(left)) ?? 0);
  }

  if (sortBy === "posting_oldest") {
    return (parseDate(getDisplayPostingDateValue(left)) ?? 0) - (parseDate(getDisplayPostingDateValue(right)) ?? 0);
  }

  if (sortBy === "scraped_newest") {
    return (parseDate(right.found_date) ?? 0) - (parseDate(left.found_date) ?? 0);
  }

  if (sortBy === "scraped_oldest") {
    return (parseDate(left.found_date) ?? 0) - (parseDate(right.found_date) ?? 0);
  }

  if (sortBy === "company_asc") {
    return left.company.localeCompare(right.company);
  }

  return getCompensationMax(right.compensation) - getCompensationMax(left.compensation);
}

function getSearchableJobText(job: SectionedJob) {
  return [
    job.company,
    job.job_title,
    job.remote_status,
    job.location,
    job.source_type,
    job.source_name,
    ...job.match_reasons,
    ...job.skills_alignment,
    ...job.role_signals,
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesConfidence(value: string | undefined, filter: FilterState["confidence"]) {
  if (filter === "all") {
    return true;
  }

  const normalized = normalizeConfidence(value);
  return normalized === filter;
}

export function normalizeConfidence(value: string | undefined) {
  const raw = value?.trim().toLowerCase();
  if (!raw) {
    return "unknown";
  }
  if (raw.includes("high")) {
    return "high";
  }
  if (raw.includes("med")) {
    return "medium";
  }
  if (raw.includes("low")) {
    return "low";
  }
  return "unknown";
}

export function parseDate(value: string | undefined) {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatDate(value: string | Date | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getDisplayPostingDateValue(job: Pick<Job, "posting_date" | "found_date">) {
  return job.posting_date || job.found_date;
}

export function formatScore(value: number | undefined) {
  if (typeof value !== "number") {
    return "N/A";
  }
  return value.toFixed(1);
}

export function formatCompensation(compensation: Compensation) {
  if (!compensation || !hasCompensation(compensation)) {
    return "Not listed";
  }

  if (compensation.display) {
    return compensation.display;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: compensation.currency || "USD",
    maximumFractionDigits: 0,
  });

  const min = compensation.min ? formatter.format(compensation.min) : null;
  const max = compensation.max ? formatter.format(compensation.max) : null;

  if (min && max) {
    return `${min} - ${max}${compensation.interval ? ` / ${compensation.interval}` : ""}`;
  }

  return `${min || max}${compensation.interval ? ` / ${compensation.interval}` : ""}`;
}

export function getCompensationMax(compensation: Compensation) {
  return compensation?.max ?? compensation?.min ?? -1;
}

export function hasCompensation(compensation: Compensation) {
  return Boolean(compensation?.display || compensation?.min || compensation?.max);
}

