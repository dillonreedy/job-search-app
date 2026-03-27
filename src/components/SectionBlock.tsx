type SectionBlockProps = {
  title: string;
  items: string[];
  emptyLabel: string;
  collapsible?: boolean;
};

export function SectionBlock({
  title,
  items,
  emptyLabel,
  collapsible = false,
}: SectionBlockProps) {
  if (collapsible) {
    return (
      <details className="detail-group" open={items.length > 0}>
        <summary>
          <span>{title}</span>
          <span>{items.length}</span>
        </summary>
        {items.length > 0 ? (
          <ul className="detail-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">{emptyLabel}</p>
        )}
      </details>
    );
  }

  return (
    <section className="detail-section">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul className="detail-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="detail-empty">{emptyLabel}</p>
      )}
    </section>
  );
}
