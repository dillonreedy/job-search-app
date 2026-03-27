type BadgeProps = {
  label: string;
  tone?: "neutral" | "accent" | "success" | "warn" | "muted";
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{label}</span>;
}
