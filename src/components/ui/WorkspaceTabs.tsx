import { useId, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export function WorkspaceTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
}) {
  const [params, setParams] = useSearchParams();
  const prefix = useId();
  const selected = tabs.find((t) => t.id === params.get("tab")) || tabs[0];
  const choose = (id: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("tab", id);
      return next;
    });
  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Bo‘limlar"
        className="flex flex-wrap gap-2 border-b border-warm-200 px-4 pt-4"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${prefix}-${tab.id}`}
            role="tab"
            aria-selected={tab.id === selected.id}
            aria-controls={`${prefix}-panel`}
            tabIndex={tab.id === selected.id ? 0 : -1}
            className={`min-h-11 px-4 border-b-2 font-semibold text-sm ${tab.id === selected.id ? "border-brand-500 text-brand-600" : "border-transparent text-charcoal-600"}`}
            onClick={() => choose(tab.id)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              else if (event.key === "ArrowLeft")
                next = (index - 1 + tabs.length) % tabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = tabs.length - 1;
              else return;
              event.preventDefault();
              choose(tabs[next].id);
              document.getElementById(`${prefix}-${tabs[next].id}`)?.focus();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        key={selected.id}
        id={`${prefix}-panel`}
        role="tabpanel"
        aria-labelledby={`${prefix}-${selected.id}`}
      >
        {selected.content}
      </div>
    </div>
  );
}
