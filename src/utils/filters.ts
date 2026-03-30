import type { FilterState, JobSectionKey, SortOption, ViewMode } from "../types/jobs";

function buildDefaults(): FilterState {
  return {
    runDate: getDefaultRunDate(),
    section: "all",
    hideExcluded: false,
    remoteStatus: "all",
    sourceType: "all",
    confidence: "all",
    minFitScore: 0,
    search: "",
    keywordTags: [],
    sortBy: "run_newest",
    viewMode: "list",
  };
}

export function getDefaultFilters(): FilterState {
  const defaults = buildDefaults();
  return { ...defaults, keywordTags: [] };
}

export function readFiltersFromUrl() {
  const defaults = buildDefaults();
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section");
  const sortBy = params.get("sortBy");
  const viewMode = params.get("view");
  const confidenceParam = params.get("confidence");
  const showExcluded = params.get("showExcluded");
  const runDate = params.get("runDate");

  return {
    runDate: isDateInputValue(runDate) ? runDate : defaults.runDate,
    section: isSection(section) ? section : defaults.section,
    hideExcluded: showExcluded === "1",
    remoteStatus: defaults.remoteStatus,
    sourceType: defaults.sourceType,
    confidence: isConfidence(confidenceParam) ? confidenceParam : defaults.confidence,
    minFitScore: clampScore(Number(params.get("minFit"))),
    search: params.get("q") || defaults.search,
    keywordTags: params
      .get("tags")
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) || [],
    sortBy: isSort(sortBy) ? sortBy : defaults.sortBy,
    viewMode: isView(viewMode) ? viewMode : defaults.viewMode,
  } satisfies FilterState;
}

export function writeFiltersToUrl(filters: FilterState, selectedId: string | null) {
  const defaults = buildDefaults();
  const params = new URLSearchParams();

  if (filters.runDate !== defaults.runDate) params.set("runDate", filters.runDate);
  if (filters.section !== defaults.section) params.set("section", filters.section);
  if (filters.hideExcluded !== defaults.hideExcluded) params.set("showExcluded", "1");
  if (filters.confidence !== defaults.confidence) params.set("confidence", filters.confidence);
  if (filters.minFitScore !== defaults.minFitScore) params.set("minFit", String(filters.minFitScore));
  if (filters.search) params.set("q", filters.search);
  if (filters.keywordTags.length > 0) params.set("tags", filters.keywordTags.join(","));
  if (filters.sortBy !== defaults.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.viewMode !== defaults.viewMode) params.set("view", filters.viewMode);
  if (selectedId) params.set("job", selectedId);

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

export function readSelectedIdFromUrl() {
  return new URLSearchParams(window.location.search).get("job");
}

function clampScore(value: number) {
  const defaults = buildDefaults();
  if (Number.isNaN(value)) {
    return defaults.minFitScore;
  }
  return Math.max(0, Math.min(10, Math.round(value)));
}

function getDefaultRunDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDateInputValue(date);
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateInputValue(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isSection(value: string | null): value is "all" | JobSectionKey {
  return value === "all" || value === "top_matches" || value === "strong_maybes" || value === "rejected";
}

function isConfidence(value: string | null): value is FilterState["confidence"] {
  return value === "all" || value === "high" || value === "medium" || value === "low" || value === "unknown";
}

function isSort(value: string | null): value is SortOption {
  return value === "fit_desc"
    || value === "posting_newest"
    || value === "posting_oldest"
    || value === "scraped_newest"
    || value === "scraped_oldest"
    || value === "run_newest"
    || value === "run_oldest"
    || value === "company_asc"
    || value === "compensation_desc";
}

function isView(value: string | null): value is ViewMode {
  return value === "cards" || value === "list";
}

