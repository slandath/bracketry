import { useEffect, useRef } from "react";
import bracketData from "./2025-tournament-blank.json";
import { createBracket } from "./lib/lib.mjs";

export default function App() {
  const bracketContainerRef = useRef<HTMLDivElement | null>(null);
  const bracketInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (bracketContainerRef.current) {
      // Install bracket into this container
      bracketInstanceRef.current = createBracket(
        bracketData, // initial_user_data
        bracketContainerRef.current, // wrapper element
        {
          // no custom options passed in for now
        },
      );
    }

    // Clean up on unmount
    return () => {
      bracketInstanceRef.current?.uninstall();
    };
  }, []);

  return (
    <div>
      {/* This div is where createBracket will render */}
      <div ref={bracketContainerRef} className="bracketry-wrapper" />
    </div>
  );
}
