import type { SectionedJob } from "../types/jobs";
import {
  SECTION_LABELS,
  formatCompensation,
  formatDate,
  formatScore,
  getDisplayPostingDateValue,
} from "../utils/jobs";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { SectionBlock } from "./SectionBlock";

type JobDetailPanelProps = {
  job: SectionedJob | null;
  onClose: () => void;
};

export function JobDetailPanel({ job, onClose }: JobDetailPanelProps) {
  if (!job) {
    return (
      <aside aria-label="Role details" className="detail-panel detail-panel--empty">
        <EmptyState
          title="Pick a role to inspect"
          description="Select any job card to open the structured detail view and compare why it was scored the way it was."
        />
      </aside>
    );
  }

  return (
    <aside aria-labelledby="detail-panel-heading" className="detail-panel">
      <div className="detail-panel__header">
        <div>
          <p className="eyebrow">{SECTION_LABELS[job.section]}</p>
          <h2 id="detail-panel-heading">{job.job_title}</h2>
          <p className="detail-panel__company">{job.company}</p>
        </div>
        <button aria-label="Close detail panel" className="detail-close" onClick={onClose} type="button">
          Close
        </button>
      </div>

      <div className="detail-panel__meta">
        <Badge label={job.remote_status || "Unknown remote"} tone="neutral" />
        <Badge label={job.source_type || "Unknown source"} tone="muted" />
        <Badge label={`Confidence: ${job.confidence || "Unknown"}`} tone="accent" />
      </div>

      <section className="detail-score">
        <div>
          <span>Fit Score</span>
          <strong>{formatScore(job.fit_score)}</strong>
        </div>
        <div>
          <span>Compensation</span>
          <strong>{formatCompensation(job.compensation)}</strong>
        </div>
      </section>

      <dl className="detail-grid">
        <div>
          <dt>Location</dt>
          <dd>{job.location || "Unknown"}</dd>
        </div>
        <div>
          <dt>Posting Date</dt>
          <dd>{formatDate(getDisplayPostingDateValue(job))}</dd>
        </div>
        <div>
          <dt>Found Date</dt>
          <dd>{formatDate(job.found_date)}</dd>
        </div>
        <div>
          <dt>Run Date</dt>
          <dd>{formatDate(job.run_date)}</dd>
        </div>
        <div>
          <dt>Source Name</dt>
          <dd>{job.source_name || "Unknown"}</dd>
        </div>
        <div>
          <dt>Dedupe Key</dt>
          <dd>{job.dedupe_key || "Unavailable"}</dd>
        </div>
      </dl>

      <div className="detail-actions">
        {job.job_url ? (
          <a className="apply-link" href={job.job_url} rel="noreferrer" target="_blank">
            Open Application
          </a>
        ) : (
          <span aria-disabled="true" className="apply-link apply-link--disabled">
            Application Link Unavailable
          </span>
        )}
      </div>

      <SectionBlock
        title="Match Reasons"
        items={job.match_reasons}
        emptyLabel="No match reasons were provided."
        collapsible
      />
      <SectionBlock
        title="Red Flags"
        items={job.red_flags}
        emptyLabel="No red flags were listed."
        collapsible
      />
      <SectionBlock
        title="Skills Alignment"
        items={job.skills_alignment}
        emptyLabel="No skill alignment notes were provided."
      />
      <SectionBlock
        title="Role Signals"
        items={job.role_signals}
        emptyLabel="No role signals were provided."
      />
    </aside>
  );
}
