import type { FilterState } from "../types/jobs";
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

      <label className="filter-checkbox">
        <input
          checked={filters.hideExcluded}
          onChange={(event) =>
            onChange({
              ...filters,
              hideExcluded: event.target.checked,
              section:
                event.target.checked && filters.section === "rejected" ? "all" : filters.section,
            })
          }
          type="checkbox"
        />
        <span>Hide excluded job postings</span>
      </label>

      <div className="filter-grid">
        <label className="filter-field filter-field--search" htmlFor="search-filter">
          <span>Search</span>
          <input
            autoComplete="off"
            id="search-filter"
            name="search"
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Company or title…"
            type="search"
            value={filters.search}
          />
        </label>

        <label className="filter-field" htmlFor="section-filter">
          <span>Section</span>
          <select
            id="section-filter"
            onChange={(event) =>
              onChange({ ...filters, section: event.target.value as FilterState["section"] })
            }
            value={filters.section}
          >
            <option value="all">All Sections</option>
            {Object.entries(SECTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

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

        <label className="filter-field" htmlFor="fit-score-filter">
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
            <option value="company_asc">Company (A to Z)</option>
            <option value="compensation_desc">Compensation Max (High to Low)</option>
          </select>
        </label>
      </div>

      <div aria-label="Keyword filters" className="tag-row" role="group">
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
    </section>
  );
}

