"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export default function FormSubmitButton({
  idleLabel,
  pendingLabel = "Submitting...",
  className,
  disabled = false
}: {
  idleLabel: string;
  pendingLabel?: string;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const [locked, setLocked] = useState(false);
  const clickedRef = useRef(false);

  useEffect(() => {
    if (pending) return;
    const t = window.setTimeout(() => {
      clickedRef.current = false;
      setLocked(false);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [pending]);

  const isDisabled = disabled || pending || locked;

  return (
    <button
      className={className}
      disabled={isDisabled}
      onClick={(event) => {
        if (disabled || pending || clickedRef.current) {
          event.preventDefault();
          return;
        }
        clickedRef.current = true;
        setLocked(true);
      }}
      type="submit"
    >
      {isDisabled ? pendingLabel : idleLabel}
    </button>
  );
}
