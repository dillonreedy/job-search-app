import type { FilterState, JobSectionKey, SortOption, ViewMode } from "../types/jobs";

const DEFAULTS: FilterState = {
  section: "all",
  hideExcluded: true,
  remoteStatus: "all",
  sourceType: "all",
  confidence: "all",
  minFitScore: 0,
  search: "",
  keywordTags: [],
  sortBy: "run_newest",
  viewMode: "cards",
};

export function getDefaultFilters(): FilterState {
  return { ...DEFAULTS, keywordTags: [] };
}

export function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section");
  const sortBy = params.get("sortBy");
  const viewMode = params.get("view");
  const confidenceParam = params.get("confidence");
  const showExcluded = params.get("showExcluded");

  return {
    section: isSection(section) ? section : DEFAULTS.section,
    hideExcluded: showExcluded !== "1",
    remoteStatus: DEFAULTS.remoteStatus,
    sourceType: DEFAULTS.sourceType,
    confidence: isConfidence(confidenceParam) ? confidenceParam : DEFAULTS.confidence,
    minFitScore: clampScore(Number(params.get("minFit"))),
    search: params.get("q") || DEFAULTS.search,
    keywordTags: params
      .get("tags")
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) || [],
    sortBy: isSort(sortBy) ? sortBy : DEFAULTS.sortBy,
    viewMode: isView(viewMode) ? viewMode : DEFAULTS.viewMode,
  } satisfies FilterState;
}

export function writeFiltersToUrl(filters: FilterState, selectedId: string | null) {
  const params = new URLSearchParams();

  if (filters.section !== DEFAULTS.section) params.set("section", filters.section);
  if (filters.hideExcluded !== DEFAULTS.hideExcluded) params.set("showExcluded", "1");
  if (filters.confidence !== DEFAULTS.confidence) params.set("confidence", filters.confidence);
  if (filters.minFitScore !== DEFAULTS.minFitScore) params.set("minFit", String(filters.minFitScore));
  if (filters.search) params.set("q", filters.search);
  if (filters.keywordTags.length > 0) params.set("tags", filters.keywordTags.join(","));
  if (filters.sortBy !== DEFAULTS.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.viewMode !== DEFAULTS.viewMode) params.set("view", filters.viewMode);
  if (selectedId) params.set("job", selectedId);

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

export function readSelectedIdFromUrl() {
  return new URLSearchParams(window.location.search).get("job");
}

function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return DEFAULTS.minFitScore;
  }
  return Math.max(0, Math.min(10, Math.round(value)));
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

