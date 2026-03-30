import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { FilterBar } from "./components/FilterBar";
import { JobCard } from "./components/JobCard";
import { JobDetailPanel } from "./components/JobDetailPanel";
import { StatCard } from "./components/StatCard";
import { loadJobsData, type LoadedJobsData } from "./data/loader";
import type { FilterState, SectionedJob } from "./types/jobs";
import {
  filterAndSortJobs,
  flattenJobs,
  formatScore,
  getSummaryStats,
} from "./utils/jobs";
import {
  getDefaultFilters,
  readFiltersFromUrl,
  readSelectedIdFromUrl,
  writeFiltersToUrl,
} from "./utils/filters";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: LoadedJobsData };

function buildNoIncludedRolesMessage(
  consideredCount: number | undefined,
  rejectedCount: number,
  insight: string | undefined,
) {
  const counts = typeof consideredCount === "number"
    ? `The scan considered ${consideredCount} role${consideredCount === 1 ? "" : "s"} and excluded ${rejectedCount}.`
    : `This report excluded ${rejectedCount} role${rejectedCount === 1 ? "" : "s"}.`;
  const context = insight ? ` ${insight}` : "";

  return `${counts} Switch the Section filter to Rejected if you want to inspect the excluded leads and their reasons.${context}`;
}

function buildStatusCopy(reportCount: number) {
  return `Loaded ${reportCount} report${reportCount === 1 ? "" : "s"}.`;
}

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") {
      return getDefaultFilters();
    }
    return readFiltersFromUrl();
  });
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return readSelectedIdFromUrl();
  });

  useEffect(() => {
    let isMounted = true;

    void loadJobsData()
      .then((data) => {
        if (isMounted) {
          setLoadState({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error loading data.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const allJobs = useMemo(
    () => (loadState.status === "ready" ? flattenJobs(loadState.data.data) : []),
    [loadState],
  );
  const visibleJobs = useMemo(() => filterAndSortJobs(allJobs, filters), [allJobs, filters]);
  const summaryStats = useMemo(
    () => (loadState.status === "ready" ? getSummaryStats(loadState.data.data, allJobs) : null),
    [allJobs, loadState],
  );
  const includedRolesCount = useMemo(
    () =>
      loadState.status === "ready"
        ? loadState.data.data.top_matches.length + loadState.data.data.strong_maybes.length
        : 0,
    [loadState],
  );
  const rejectedRolesCount = useMemo(
    () => (loadState.status === "ready" ? loadState.data.data.rejected.length : 0),
    [loadState],
  );
  const hasNoIncludedRoles = loadState.status === "ready" && includedRolesCount === 0;
  const selectedJob = useMemo(
    () =>
      visibleJobs.find((job: SectionedJob) => job.id === selectedId) ??
      allJobs.find((job: SectionedJob) => job.id === selectedId) ??
      null,
    [allJobs, selectedId, visibleJobs],
  );

  useEffect(() => {
    writeFiltersToUrl(filters, selectedId);
  }, [filters, selectedId]);

  useEffect(() => {
    if (filters.hideExcluded && filters.section === "rejected") {
      setFilters((current) => ({ ...current, section: "all" }));
    }
  }, [filters.hideExcluded, filters.section]);

  useEffect(() => {
    if (selectedId && !allJobs.some((job) => job.id === selectedId)) {
      setSelectedId(null);
    }
  }, [allJobs, selectedId]);

  if (loadState.status === "loading") {
    return (
      <main className="app-shell">
        <a className="skip-link" href="#results-heading">
          Skip to results
        </a>
        <section className="hero" aria-live="polite">
          <p className="eyebrow">Local Job Review</p>
          <h1>Loading your latest search results…</h1>
        </section>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className="app-shell">
        <a className="skip-link" href="#results-heading">
          Skip to results
        </a>
        <section className="hero" aria-live="polite">
          <p className="eyebrow">Local Job Review</p>
          <h1>Jobs JSON could not be loaded</h1>
          <p className="hero-copy">{loadState.message}</p>
          <p className="hero-copy">
            Add one or more report files under <code>public/data</code> and refresh.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <a className="skip-link" href="#results-heading">
        Skip to results
      </a>

      <header className="hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Local Job Review</p>
          <h1>Scan, filter, and compare roles across your local JSON reports.</h1>
          <p className="hero-copy">
            Built for quick triage: high-signal scoring, compact metadata, and a structured inspector for fit reasons, flags, and skill alignment.
          </p>
        </div>
        <div className="hero-note" aria-label={buildStatusCopy(loadState.data.reportCount)}>
          <span>Data sources</span>
          <strong>
            {loadState.data.reportCount} report{loadState.data.reportCount === 1 ? "" : "s"}
          </strong>
          <p>
            {loadState.data.data.search_metadata.report_date || "Unknown report date"} · {" "}
            {loadState.data.sourceFiles.length} file
            {loadState.data.sourceFiles.length === 1 ? "" : "s"} loaded
          </p>
        </div>
      </header>

      {summaryStats ? (
        <section aria-label="Summary stats" className="stats-grid">
          <StatCard label="Included Roles" value={String(includedRolesCount)} />
          <StatCard label="Top Matches" value={String(summaryStats.topMatches)} />
          <StatCard label="Strong Maybes" value={String(summaryStats.strongMaybes)} />
          <StatCard label="Rejected" value={String(summaryStats.rejected)} />
          <StatCard
            label="Avg Top Fit"
            value={summaryStats.averageFitScore ? formatScore(summaryStats.averageFitScore) : "N/A"}
          />
          <StatCard
            label="Compensation Visible"
            value={String(summaryStats.visibleCompensationCount)}
          />
        </section>
      ) : null}

      <FilterBar
        filters={filters}
        onChange={setFilters}
      />

      <section className="workspace">
        <section className="results-pane" aria-labelledby="results-heading">
          <div className="results-pane__header">
            <div>
              <p className="eyebrow">{hasNoIncludedRoles ? "Latest Run" : "Matches"}</p>
              <h2 id="results-heading">
                {hasNoIncludedRoles
                  ? "No included matches in this report"
                  : `${visibleJobs.length} roles in the current view`}
              </h2>
            </div>
          </div>

          {hasNoIncludedRoles && filters.section !== "rejected" ? (
            <EmptyState
              title="This run didn’t produce any included roles"
              description={buildNoIncludedRolesMessage(
                loadState.data.data.search_metadata.total_roles_considered,
                rejectedRolesCount,
                loadState.data.data.summary.insights?.[0],
              )}
            />
          ) : visibleJobs.length === 0 ? (
            <EmptyState
              title="No roles match these filters"
              description="Try lowering the fit score threshold, widening the source filters, or clearing keyword tags."
            />
          ) : (
            <div className={filters.viewMode === "list" ? "jobs-grid jobs-grid--list" : "jobs-grid"}>
              {visibleJobs.map((job) => (
                <JobCard
                  job={job}
                  key={job.id}
                  onSelect={setSelectedId}
                  selected={selectedId === job.id}
                  viewMode={filters.viewMode}
                />
              ))}
            </div>
          )}
        </section>

        <JobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedId(null)}
        />
      </section>

      <section className="summary-panel" aria-labelledby="summary-heading">
        <div>
          <p className="eyebrow">Summary Insights</p>
          <h2 id="summary-heading">What the report is signaling</h2>
        </div>
        <div className="summary-columns">
          <section>
            <h3>Insights</h3>
            {loadState.data.data.summary.insights?.length ? (
              <ul>
                {loadState.data.data.summary.insights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No summary insights available.</p>
            )}
          </section>
          <section>
            <h3>Highlights</h3>
            {loadState.data.data.summary.highlights?.length ? (
              <ul>
                {loadState.data.data.summary.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No highlight notes available.</p>
            )}
          </section>
          <section>
            <h3>Notes</h3>
            {loadState.data.data.summary.notes?.length ? (
              <ul>
                {loadState.data.data.summary.notes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No extra notes available.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

