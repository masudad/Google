import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { InfoIcon } from "./Icons";

interface InfoTipProps {
  /** Accessible name of the trigger, e.g. "About the certificate strategy". */
  label: string;
  /** Explanation shown in the panel. Plain text or a couple of short paragraphs. */
  children: ReactNode;
  size?: number;
}

type TipState = "idle" | "pinned" | "dismissed";

/** Must match `.info-tip-panel { max-width }` in styles.css. */
const PANEL_MAX_WIDTH = 360;

/**
 * A small "i" button that reveals an explanation next to a heading or label.
 *
 * Hover and keyboard focus show the panel; a click or tap pins it open so it
 * survives the pointer leaving; Escape, a second click, or a click anywhere
 * else closes it. The panel flips to the trigger's left edge when the viewport
 * has no room on the right. Everything is CSS classes plus React state, so it
 * runs under the MV3 CSP without inline styles or portals.
 */
export function InfoTip({ label, children, size = 16 }: InfoTipProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<TipState>("idle");
  const [alignEnd, setAlignEnd] = useState(false);

  useEffect(() => {
    if (tip !== "pinned") return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setTip("idle");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTip("dismissed");
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [tip]);

  function updateAlignment() {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    if (!viewportWidth || rect.width === 0) return;
    const overflowsRight = rect.left + PANEL_MAX_WIDTH > viewportWidth - 16;
    const fitsLeft = rect.right - PANEL_MAX_WIDTH >= 8;
    setAlignEnd(overflowsRight && fitsLeft);
  }

  function reveal() {
    updateAlignment();
    setTip((current) => (current === "dismissed" ? "idle" : current));
  }

  function settle() {
    setTip((current) => (current === "dismissed" ? "idle" : current));
  }

  const className = [
    "info-tip",
    tip === "pinned" ? "is-open" : "",
    tip === "dismissed" ? "is-dismissed" : "",
    alignEnd ? "is-end" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={className} onMouseEnter={reveal} onMouseLeave={settle} ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-describedby={panelId}
        aria-expanded={tip === "pinned"}
        aria-label={label}
        className="info-tip-trigger"
        onBlur={settle}
        onClick={() => {
          updateAlignment();
          setTip((current) => (current === "pinned" ? "idle" : "pinned"));
        }}
        onFocus={reveal}
        onKeyDown={(event) => {
          if (event.key === "Escape") setTip("dismissed");
        }}
        type="button"
      >
        <InfoIcon size={size} />
      </button>
      <span className="info-tip-panel" id={panelId} role="tooltip">
        {children}
      </span>
    </span>
  );
}
