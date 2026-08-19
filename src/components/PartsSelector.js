"use client";
/**
 * PartsSelector — smart multi-select + free-type component for spare parts.
 *
 * Props:
 *   value       {string}   current textarea value (newline-separated)
 *   onChange    {fn}       called with new string value on every change
 *   placeholder {string}   placeholder text
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ── Parse the parts string into an array of items ────────────────────────────
function parseItems(str) {
  if (!str || !str.trim()) return [];
  return str
    .split("\n")
    .map(l => l.replace(/^(\d+[\.\)]\s*|[•\-]\s*)/, "").trim())
    .filter(Boolean);
}

// ── Format array back into numbered list string ──────────────────────────────
function formatItems(arr) {
  return arr.map((item, i) => `${i + 1}. ${item}`).join("\n");
}

export default function PartsSelector({ value, onChange, placeholder }) {
  const [library, setLibrary]         = useState([]);   // all parts from DB
  const [items, setItems]             = useState([]);   // currently selected parts
  const [query, setQuery]             = useState("");   // search/type input
  const [open, setOpen]               = useState(false);
  const [loadingLib, setLoadingLib]   = useState(true);
  const inputRef  = useRef(null);
  const dropRef   = useRef(null);

  // Load library once on mount
  useEffect(() => {
    supabase
      .from("parts_library")
      .select("id, name, category")
      .order("category")
      .order("name")
      .then(({ data }) => {
        setLibrary(data || []);
        setLoadingLib(false);
      });
  }, []);

  // Sync value → items when editing an existing entry
  useEffect(() => {
    setItems(parseItems(value));
  }, []); // only on mount — user edits are managed by addItem/removeItem

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function emit(newItems) {
    setItems(newItems);
    onChange(formatItems(newItems));
  }

  function addItem(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (items.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setQuery(""); setOpen(false); return; // already added
    }
    emit([...items, trimmed]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeItem(idx) {
    emit(items.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e) {
    if ((e.key === "Enter" || e.key === ",") && query.trim()) {
      e.preventDefault();
      addItem(query.trim().replace(/,$/, ""));
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Backspace" && !query && items.length) {
      removeItem(items.length - 1);
    }
  }

  // Filtered library suggestions — match query, exclude already-selected
  const suggestions = library.filter(p =>
    !items.some(i => i.toLowerCase() === p.name.toLowerCase()) &&
    (query === "" || p.name.toLowerCase().includes(query.toLowerCase()) ||
     p.category.toLowerCase().includes(query.toLowerCase()))
  );

  // Group suggestions by category
  const grouped = suggestions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const showCustomOption =
    query.trim().length > 0 &&
    !library.some(p => p.name.toLowerCase() === query.trim().toLowerCase()) &&
    !items.some(i => i.toLowerCase() === query.trim().toLowerCase());

  return (
    <div style={{ position: "relative" }} ref={dropRef}>

      {/* ── Selected tags ── */}
      {items.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          marginBottom: 8,
        }}>
          {items.map((item, idx) => (
            <span key={idx} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px 3px 10px",
              borderRadius: 20,
              background: "rgba(12,35,64,0.07)",
              border: "1px solid rgba(12,35,64,0.15)",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--navy)",
              maxWidth: "100%",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                {item}
              </span>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--muted)", lineHeight: 1, padding: 0,
                  fontSize: 14, flexShrink: 0,
                }}
                title="Remove">×</button>
            </span>
          ))}
        </div>
      )}

      {/* ── Input row ── */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={items.length === 0
            ? (placeholder || "Search or type a part / model number…")
            : "Add another part…"}
          className="input"
          style={{ paddingRight: 36 }}
          autoComplete="off"
        />
        {/* Dropdown chevron */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setOpen(o => !o); inputRef.current?.focus(); }}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--muted)", padding: 0,
          }}>
          <svg style={{ width: 16, height: 16, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white",
          border: "1.5px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          zIndex: 9999,
          maxHeight: 280,
          overflowY: "auto",
        }}>
          {loadingLib ? (
            <div style={{ padding: "12px 16px", color: "var(--muted)", fontSize: "0.8rem" }}>
              Loading parts library…
            </div>
          ) : (
            <>
              {/* Custom / typed option */}
              {showCustomOption && (
                <div
                  key="custom"
                  onClick={() => addItem(query.trim())}
                  style={{
                    padding: "9px 14px",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    borderBottom: Object.keys(grouped).length ? "1px solid var(--border)" : "none",
                    display: "flex", alignItems: "center", gap: 8,
                    color: "var(--navy)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F0F7FF"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 700, padding: "1px 6px",
                    background: "rgba(232,146,11,0.12)", color: "var(--accent)",
                    borderRadius: 4,
                  }}>NEW</span>
                  <span>Add "<strong>{query.trim()}</strong>"</span>
                </div>
              )}

              {/* Library items grouped by category */}
              {Object.entries(grouped).map(([cat, parts]) => (
                <div key={cat}>
                  <div style={{
                    padding: "6px 14px 3px",
                    fontSize: "0.65rem", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    color: "var(--muted)",
                    background: "#FAFAFA",
                  }}>{cat}</div>
                  {parts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => addItem(p.name)}
                      style={{
                        padding: "8px 14px 8px 20px",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        color: "var(--fg)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <span>{p.name}</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>+ add</span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Empty state */}
              {!showCustomOption && Object.keys(grouped).length === 0 && (
                <div style={{ padding: "12px 16px", color: "var(--muted)", fontSize: "0.8rem" }}>
                  No matches. Type a part name and press Enter to add it.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Hint */}
      <p style={{ marginTop: 5, fontSize: "0.7rem", color: "var(--muted)" }}>
        Select from library or type &amp; press <kbd style={{ padding: "0 4px", borderRadius: 3, border: "1px solid #DDD", background: "#F5F5F5", fontSize: "0.65rem" }}>Enter</kbd> to add custom parts. Press <kbd style={{ padding: "0 4px", borderRadius: 3, border: "1px solid #DDD", background: "#F5F5F5", fontSize: "0.65rem" }}>Backspace</kbd> to remove last.
      </p>
    </div>
  );
}
