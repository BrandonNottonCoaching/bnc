import React, { useEffect, useState } from "react";
import { ShoppingBag, Tag, Copy, ExternalLink, Plus, Trash2, Pencil, ArrowLeft, Save as SaveIcon } from "lucide-react";
import { C, uid } from "./helpers";
import { Card, SectionLabel, PrimaryButton, GhostButton, EmptyState } from "./ui";
import { listShopItems, saveShopItem, deleteShopItem } from "./api";

const CATEGORY_SUGGESTIONS = ["Supplements", "Equipment", "Apparel", "Apps", "Nutrition", "Other"];

function orderedCategories(items) {
  const set = [];
  items.forEach((it) => {
    const c = (it.category || "Other").trim() || "Other";
    if (!set.includes(c)) set.push(c);
  });
  set.sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
  return set;
}

export default function Shop({ viewerRole, showToast }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(false);

  async function refresh() {
    const data = await listShopItems();
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try { await refresh(); } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  function copyCode(code) {
    try {
      navigator.clipboard.writeText(code);
      showToast("Code copied");
    } catch (e) {
      showToast("Couldn't copy");
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  if (editing) {
    return (
      <ShopEditor
        items={items}
        onCancel={() => setEditing(false)}
        onSaved={async () => {
          await refresh();
          setEditing(false);
          showToast("Shop updated");
        }}
      />
    );
  }

  const cats = orderedCategories(items);

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>Recommended</h2>
        {viewerRole === "trainer" && (
          <button onClick={() => setEditing(true)} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 7 }}>
            <Pencil size={15} color={C.pine} />
          </button>
        )}
      </div>
      <p style={{ fontSize: 13.5, color: C.graphite, marginTop: 2, marginBottom: 18 }}>
        Kit, supplements and apps I rate, with any discounts I can get you.
      </p>

      {items.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Nothing here yet"
          sub={viewerRole === "trainer" ? "Tap the pencil to add your first recommendation." : "Your coach hasn't added recommendations yet."}
        />
      )}

      {cats.map((cat) => (
        <div key={cat}>
          <SectionLabel>{cat}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
            {items
              .filter((it) => ((it.category || "Other").trim() || "Other") === cat)
              .map((it) => (
                <Card key={it.id}>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 15.5 }}>{it.name}</div>
                  {it.note && <div style={{ fontSize: 13, color: C.graphite, marginTop: 4, lineHeight: 1.5 }}>{it.note}</div>}

                  {it.code && (
                    <button
                      onClick={() => copyCode(it.code)}
                      style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: C.amberTint, border: `1px dashed ${C.amber}`, borderRadius: 10, padding: "9px 12px" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <Tag size={14} color={C.amber} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color: C.amber, fontSize: 14, letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.code}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.amber, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        <Copy size={13} /> Copy
                      </span>
                    </button>
                  )}

                  {it.url && (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: 10, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.pine, color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 700 }}
                    >
                      Shop now <ExternalLink size={14} />
                    </a>
                  )}
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopEditor({ items, onCancel, onSaved }) {
  const [draft, setDraft] = useState(
    items.map((it) => ({ _key: it.id, id: it.id, category: it.category || "", name: it.name || "", note: it.note || "", code: it.code || "", url: it.url || "" }))
  );
  const [removedIds, setRemovedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  function update(key, field, value) {
    setDraft((prev) => prev.map((d) => (d._key === key ? { ...d, [field]: value } : d)));
  }
  function addItem() {
    setDraft((prev) => [...prev, { _key: uid("shop"), category: "", name: "", note: "", code: "", url: "" }]);
  }
  function removeItem(key) {
    setDraft((prev) => {
      const item = prev.find((d) => d._key === key);
      if (item && item.id) setRemovedIds((r) => [...r, item.id]);
      return prev.filter((d) => d._key !== key);
    });
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const id of removedIds) {
        await deleteShopItem(id);
      }
      for (const d of draft) {
        if (!d.name.trim()) continue; // skip blank rows
        await saveShopItem({
          id: d.id, // undefined for new items -> DB generates one
          category: (d.category || "Other").trim() || "Other",
          name: d.name.trim(),
          note: d.note.trim(),
          code: d.code.trim(),
          url: d.url.trim(),
        });
      }
      await onSaved();
    } catch (e) {
      console.error(e);
      alert("Couldn't save the shop. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "18px 18px 150px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", padding: 4 }}>
          <ArrowLeft size={19} color={C.ink} />
        </button>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.ink, margin: 0 }}>Edit shop</h2>
      </div>

      <datalist id="shop-categories">
        {CATEGORY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {draft.map((d) => (
        <Card key={d._key} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</span>
            <button onClick={() => removeItem(d._key)} style={{ background: "none", border: "none" }}>
              <Trash2 size={15} color={C.danger} />
            </button>
          </div>

          <label style={{ fontSize: 11.5, color: C.graphite, fontWeight: 600 }}>Category</label>
          <input
            list="shop-categories"
            value={d.category}
            onChange={(e) => update(d._key, "category", e.target.value)}
            placeholder="e.g. Supplements"
            style={inputStyle}
          />

          <label style={{ fontSize: 11.5, color: C.graphite, fontWeight: 600, marginTop: 8, display: "block" }}>Product name</label>
          <input
            value={d.name}
            onChange={(e) => update(d._key, "name", e.target.value)}
            placeholder="e.g. Myprotein Impact Whey"
            style={inputStyle}
          />

          <label style={{ fontSize: 11.5, color: C.graphite, fontWeight: 600, marginTop: 8, display: "block" }}>Your note (why you rate it)</label>
          <textarea
            value={d.note}
            onChange={(e) => update(d._key, "note", e.target.value)}
            placeholder="A line or two on why you recommend it"
            style={{ ...inputStyle, minHeight: 56, fontFamily: "inherit" }}
          />

          <label style={{ fontSize: 11.5, color: C.graphite, fontWeight: 600, marginTop: 8, display: "block" }}>Discount code (optional)</label>
          <input
            value={d.code}
            onChange={(e) => update(d._key, "code", e.target.value)}
            placeholder="e.g. BRANDON20"
            style={inputStyle}
          />

          <label style={{ fontSize: 11.5, color: C.graphite, fontWeight: 600, marginTop: 8, display: "block" }}>Link (optional)</label>
          <input
            value={d.url}
            onChange={(e) => update(d._key, "url", e.target.value)}
            placeholder="https://…"
            inputMode="url"
            style={inputStyle}
          />
        </Card>
      ))}

      <GhostButton onClick={addItem} icon={Plus} style={{ width: "100%", marginBottom: 18 }}>
        Add product
      </GhostButton>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 18px calc(14px + env(safe-area-inset-bottom))", background: "#fff", borderTop: `1px solid ${C.line}`, maxWidth: 480, margin: "0 auto", zIndex: 50 }}>
        <PrimaryButton icon={SaveIcon} disabled={saving} onClick={saveAll}>
          {saving ? "Saving…" : "Save shop"}
        </PrimaryButton>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  fontSize: 14,
  background: "#fff",
  boxSizing: "border-box",
  marginTop: 3,
};
