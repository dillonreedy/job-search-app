import type { SectionedJob } from "../types/jobs";
import {
  SECTION_LABELS,
  formatCompensation,
  formatDate,
  formatScore,
  normalizeConfidence,
} from "../utils/jobs";
import { Badge } from "./Badge";

type JobCardProps = {
  job: SectionedJob;
  selected: boolean;
  viewMode: "cards" | "list";
  onSelect: (jobId: string) => void;
};

export function JobCard({ job, selected, viewMode, onSelect }: JobCardProps) {
  const confidence = normalizeConfidence(job.confidence);
  const cardClassName =
    viewMode === "list"
      ? `job-card job-card--list ${selected ? "is-selected" : ""}`
      : `job-card ${selected ? "is-selected" : ""}`;
  const companySearchUrl = `https://www.google.com/search?q=${encodeURIComponent(job.company)}`;
  const labelId = `job-title-${job.id}`;

  return (
    <article aria-labelledby={labelId} className={cardClassName}>
      <div className="job-card__header job-card__header--top">
        <div className="job-card__title-block">
          <p className="job-card__company">
            <a
              className="job-card__company-link"
              href={companySearchUrl}
              rel="noreferrer"
              target="_blank"
            >
              {job.company}
            </a>
          </p>
          <h3 id={labelId}>{job.job_title}</h3>
        </div>
        <div className="score-chip" title={`Fit score ${formatScore(job.fit_score)}`}>
          <span>Fit</span>
          <strong>{formatScore(job.fit_score)}</strong>
        </div>
      </div>

      <div className="job-card__meta">
        <Badge label={SECTION_LABELS[job.section]} tone="accent" />
        <Badge label={job.remote_status || "Unknown remote"} tone="neutral" />
        <Badge label={job.source_type || "Unknown source"} tone="muted" />
        <Badge label={`${confidence} confidence`} tone={getConfidenceTone(confidence)} />
      </div>

      <dl className="job-card__facts">
        <div>
          <dt>Location</dt>
          <dd>{job.location || "Unknown"}</dd>
        </div>
        <div>
          <dt>Posting Date</dt>
          <dd>{formatDate(job.posting_date)}</dd>
        </div>
        <div>
          <dt>Scraped Date</dt>
          <dd>{formatDate(job.found_date)}</dd>
        </div>
        <div>
          <dt>Compensation</dt>
          <dd>{formatCompensation(job.compensation)}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{job.source_name || "Unknown"}</dd>
        </div>
      </dl>

      {job.skills_alignment.length > 0 ? (
        <div className="skill-tag-row">
          {job.skills_alignment.slice(0, 4).map((skill) => (
            <span className="skill-tag" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="job-card__actions">
        <button
          aria-pressed={selected}
          className="job-card__select"
          onClick={() => onSelect(job.id)}
          type="button"
        >
          {selected ? "Inspecting Role" : "Inspect Role"}
        </button>
      </div>
    </article>
  );
}

function getConfidenceTone(confidence: ReturnType<typeof normalizeConfidence>) {
  if (confidence === "high") return "success";
  if (confidence === "medium") return "warn";
  if (confidence === "low") return "muted";
  return "neutral";
}
