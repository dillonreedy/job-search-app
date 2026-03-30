import type { FilterState } from "../types/jobs";
import { getDefaultFilters } from "../utils/filters";
import { KEYWORD_TAGS, SECTION_LABELS } from "../utils/jobs";

type FilterBarProps = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
};

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <section aria-labelledby="filters-heading" className="filter-bar">
      <div className="filter-bar__topline">
        <div>
          <p className="eyebrow">Review Controls</p>
          <h2 id="filters-heading">Filter the board without losing context</h2>
        </div>
        <div aria-label="View mode" className="segmented-control" role="group">
          <button
            aria-pressed={filters.viewMode === "cards"}
            className={filters.viewMode === "cards" ? "is-active" : ""}
            onClick={() => onChange({ ...filters, viewMode: "cards" })}
            type="button"
          >
            Cards
          </button>
          <button
            aria-pressed={filters.viewMode === "list"}
            className={filters.viewMode === "list" ? "is-active" : ""}
            onClick={() => onChange({ ...filters, viewMode: "list" })}
            type="button"
          >
            Compact List
          </button>
        </div>
      </div>

      <div className="filter-primary">
        <label className="filter-field filter-field--search-hero" htmlFor="search-filter">
          <div className="search-input-wrap">
            <input
              aria-label="Search roles"
              autoComplete="off"
              id="search-filter"
              name="search"
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder="Search by company, title, skill, or keyword…"
              type="search"
              value={filters.search}
            />
            <button
              aria-label="Search roles"
              className="search-input-button"
              onClick={() => {
                document.getElementById("search-filter")?.focus();
              }}
              type="button"
            >
              <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16L21 21" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
        </label>

        <details className="advanced-filters">
          <summary>
            <span>Advanced Filters</span>
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
          </summary>
          <div className="advanced-filters__panel">
            <div className="advanced-filters__actions">
              <button
                className="advanced-filters__clear"
                onClick={() =>
                  onChange({
                    ...getDefaultFilters(),
                    viewMode: filters.viewMode,
                  })
                }
                type="button"
              >
                Clear All Filters
              </button>
            </div>

            <div className="advanced-filters__grid">
              <label className="filter-field" htmlFor="run-date-filter">
                <span>Run Date</span>
                <input
                  id="run-date-filter"
                  onChange={(event) => onChange({ ...filters, runDate: event.target.value })}
                  type="date"
                  value={filters.runDate}
                />
              </label>

              <fieldset className="filter-field filter-field--section-group">
                <span>Section</span>
                <div className="section-filter-list" role="group" aria-label="Section filters">
                  {Object.entries(SECTION_LABELS).map(([value, label]) => (
                    <button
                      aria-pressed={filters.sections.includes(value as keyof typeof SECTION_LABELS)}
                      className={`section-chip ${filters.sections.includes(value as keyof typeof SECTION_LABELS) ? "is-active" : ""}`}
                      key={value}
                      onClick={() => {
                        const section = value as keyof typeof SECTION_LABELS;
                        const isActive = filters.sections.includes(section);
                        const nextSections = isActive
                          ? filters.sections.filter((item) => item !== section)
                          : [...filters.sections, section];

                        onChange({
                          ...filters,
                          sections: nextSections.length > 0 ? nextSections : filters.sections,
                        });
                      }}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="filter-field" htmlFor="confidence-filter">
                <span>Confidence</span>
                <select
                  id="confidence-filter"
                  onChange={(event) =>
                    onChange({ ...filters, confidence: event.target.value as FilterState["confidence"] })
                  }
                  value={filters.confidence}
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>

              <label className="filter-field filter-field--slider" htmlFor="fit-score-filter">
                <span>Minimum Fit Score</span>
                <div className="range-control">
                  <input
                    id="fit-score-filter"
                    max="10"
                    min="0"
                    onChange={(event) =>
                      onChange({ ...filters, minFitScore: Number(event.target.value) })
                    }
                    step="1"
                    type="range"
                    value={filters.minFitScore}
                  />
                  <strong className="range-value">{filters.minFitScore}</strong>
                </div>
              </label>

              <label className="filter-field filter-field--sort" htmlFor="sort-filter">
                <span>Sort By</span>
                <select
                  id="sort-filter"
                  onChange={(event) =>
                    onChange({ ...filters, sortBy: event.target.value as FilterState["sortBy"] })
                  }
                  value={filters.sortBy}
                >
                  <option value="fit_desc">Fit Score (High to Low)</option>
                  <option value="posting_newest">Posted Date (Newest First)</option>
                  <option value="posting_oldest">Posted Date (Oldest First)</option>
                  <option value="scraped_newest">Scraped Date (Newest First)</option>
                  <option value="scraped_oldest">Scraped Date (Oldest First)</option>
                  <option value="run_newest">Run Date (Newest First)</option>
                  <option value="run_oldest">Run Date (Oldest First)</option>
                  <option value="company_asc">Company (A to Z)</option>
                  <option value="compensation_desc">Compensation Max (High to Low)</option>
                </select>
              </label>
            </div>

            <div aria-label="Keyword filters" className="tag-row tag-row--panel" role="group">
              {KEYWORD_TAGS.map((tag) => {
                const active = filters.keywordTags.includes(tag);
                return (
                  <button
                    aria-pressed={active}
                    key={tag}
                    className={`tag-toggle ${active ? "is-active" : ""}`}
                    onClick={() =>
                      onChange({
                        ...filters,
                        keywordTags: active
                          ? filters.keywordTags.filter((item) => item !== tag)
                          : [...filters.keywordTags, tag],
                      })
                    }
                    type="button"
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

