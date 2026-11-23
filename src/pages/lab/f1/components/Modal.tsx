import { useEffect, useId, useRef, type ReactNode } from "react";
import { useF1 } from "../context/f1Context";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Diálogo accesible: Esc cierra, el foco queda dentro y vuelve al elemento
// que lo abrió al cerrar; el fondo no hace scroll
export default function Modal({
  label,
  title,
  subtitle,
  onClose,
  children,
}: {
  label: string;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useF1();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !(el as HTMLButtonElement).disabled
      );
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div
      className="f1-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="f1-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="f1-modal-top">
          <span className="f1-modal-label">{label}</span>
          <button type="button" className="f1-modal-close" onClick={onClose} aria-label={t.race.close}>
            ✕
          </button>
        </div>
        <h2 id={titleId} className="f1-modal-title">
          {title}
        </h2>
        {subtitle && <p className="f1-modal-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
