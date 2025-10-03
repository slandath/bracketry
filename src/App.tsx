import { useEffect, useRef } from "react";
import bracketData from "./2025-tournament-blank.json";
import { createBracket } from "./lib/lib.mjs";

const STORAGE_KEY = "bracketry:tournament:v1";

export default function App() {
  const bracketContainerRef = useRef<HTMLDivElement | null>(null);
  const bracketInstanceRef = useRef<any>(null);

  function readStoredData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore parse/storage errors
    }
    return bracketData;
  }

  function buildBracket(data: any) {
    if (!bracketContainerRef.current) return;
    bracketInstanceRef.current?.uninstall?.();
    bracketInstanceRef.current = createBracket(data, bracketContainerRef.current, {});
  }

  useEffect(() => {
    // seed storage if empty
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bracketData));
      }
    } catch {
      // localStorage may be disabled — fall back to bundled data
    }

    const dataToUse = readStoredData();
    buildBracket(dataToUse);

    return () => {
      bracketInstanceRef.current?.uninstall?.();
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* This div is where createBracket will render */}
      <div ref={bracketContainerRef} className="bracketry-wrapper" />
    </div>
  );
}
