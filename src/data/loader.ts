import dataFileUrls from "virtual:data-files";
import {
  normalizeJobsData,
  type JobsData,
  type JobSectionKey,
  type LoadedJob,
} from "../types/jobs";

export type LoadedJobsData = {
  data: JobsData;
  sourceFiles: string[];
  reportCount: number;
};

export async function loadJobsData(): Promise<LoadedJobsData> {
  if (dataFileUrls.length === 0) {
    throw new Error("No JSON files were found under public/data.");
  }

  const reports = await Promise.all(
    dataFileUrls.map(async (path) => {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Could not load local JSON file at ${path}.`);
      }

      const raw = (await response.json()) as unknown;

      try {
        const normalized = normalizeJobsData(raw);

        return {
          path,
          data: normalized,
        };
      } catch (error) {
        const firstIssue =
          error instanceof Error && "issues" in error
            ? (
                error as {
                  issues?: Array<{
                    path: Array<string | number>;
                    message: string;
                  }>;
                }
              ).issues?.[0]
            : undefined;
        throw new Error(
          `The jobs JSON is malformed in ${path}. ${firstIssue?.path.join(".") || "root"}: ${firstIssue?.message || "Unknown validation error."}`,
        );
      }
    }),
  );

  return {
    data: mergeReports(reports),
    sourceFiles: reports.map((report) => report.path),
    reportCount: reports.length,
  };
}

function mergeReports(
  reports: Array<{ path: string; data: JobsData }>,
): JobsData {
  const latestReport =
    reports
      .slice()
      .sort((left, right) => getReportTimestamp(right.data) - getReportTimestamp(left.data))[0]
    ?? null;

  const mergedSections = {
    top_matches: [] as LoadedJob[],
    strong_maybes: [] as LoadedJob[],
    rejected: [] as LoadedJob[],
  };

  const seenKeys = new Set<string>();

  for (const report of reports) {
    (Object.keys(mergedSections) as JobSectionKey[]).forEach((section) => {
      report.data[section].forEach((job, index) => {
        const dedupeKey =
          job.dedupe_key ||
          `${report.path}:${section}:${job.company}:${job.job_title}:${index}`;
        if (seenKeys.has(dedupeKey)) {
          return;
        }
        seenKeys.add(dedupeKey);
        mergedSections[section].push({
          ...job,
          sourceFile: report.path,
          run_date: report.data.search_metadata.report_date,
        });
      });
    });
  }

  return {
    search_metadata: {
      generated_at: getLatestValue(
        reports.map((report) => report.data.search_metadata.generated_at),
      ),
      report_date: getLatestValue(
        reports.map((report) => report.data.search_metadata.report_date),
      ),
      query: reports
        .map((report) => report.data.search_metadata.query)
        .find(Boolean),
      location_focus: reports
        .map((report) => report.data.search_metadata.location_focus)
        .find(Boolean),
      total_roles_considered: reports.reduce(
        (sum, report) =>
          sum + (report.data.search_metadata.total_roles_considered ?? 0),
        0,
      ),
      notes: dedupeStrings(
        reports.flatMap((report) => report.data.search_metadata.notes ?? []),
      ),
    },
    top_matches: mergedSections.top_matches,
    strong_maybes: mergedSections.strong_maybes,
    rejected: mergedSections.rejected,
    summary: latestReport?.data.summary ?? {},
  };
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values));
}

function getLatestValue(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

function getReportTimestamp(data: JobsData) {
  return Date.parse(data.search_metadata.report_date || data.search_metadata.generated_at || "") || 0;
}
