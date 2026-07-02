import React, { useEffect, useRef } from "react";
import { C } from "./helpers";

const CALENDLY_URL = "https://calendly.com/nottonb";

export default function Book() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Load Calendly's widget script once, then it renders into the div.
    const existing = document.querySelector('script[src*="calendly.com/assets/external/widget.js"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>Book a session</h2>
      <p style={{ fontSize: 13.5, color: C.graphite, marginTop: 2, marginBottom: 16 }}>
        Pick a time that works for you — it goes straight to Brandon's calendar.
      </p>

      <div
        ref={containerRef}
        className="calendly-inline-widget"
        data-url={CALENDLY_URL}
        style={{ minWidth: "320px", height: "640px", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}` }}
      />
    </div>
  );
}
