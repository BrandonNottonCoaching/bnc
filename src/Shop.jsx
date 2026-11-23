import React, { useEffect, useRef, useState } from "react";
import { ShoppingBag, Tag, Copy, ExternalLink, Plus, Trash2, Pencil, ArrowLeft, ChevronRight, ImagePlus, Save as SaveIcon } from "lucide-react";
import { C, uid, resizeImageFile } from "./helpers";
import { Card, SectionLabel, PrimaryButton, GhostButton, EmptyState } from "./ui";
import { listShopItems, saveShopItem, deleteShopItem, uploadShopImage } from "./api";

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

function Thumb({ src, size = 54 }) {
  if (src) {
    return <img src={src} style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: C.stone }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: C.stone, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <ShoppingBag size={20} color={C.graphite} />
    </div>
  );
}

export default function Shop({ viewerRole, showToast }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(null);

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
        showToast={showToast}
      />
    );
  }

  if (selected) {
    const live = items.find((it) => it.id === selected.id) || selected;
    return <ShopDetail item={live} onBack={() => setSelected(null)} onCopy={copyCode} />;
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
                <Card key={it.id} onClick={() => setSelected(it)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <Thumb src={it.image} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.ink, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                    {(it.price || it.sale_price) && (
                      <div style={{ fontSize: 13, marginTop: 2 }}>
                        {it.price && it.sale_price ? (
                          <>
                            <span style={{ color: C.graphite, textDecoration: "line-through", marginRight: 6 }}>{it.price}</span>
                            <span style={{ color: C.pine, fontWeight: 700 }}>{it.sale_price}</span>
                          </>
                        ) : (
                          <span style={{ color: C.ink, fontWeight: 600 }}>{it.sale_price || it.price}</span>
                        )}
                      </div>
                    )}
                    {it.code && (
                      <div style={{ fontSize: 11.5, color: C.amber, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <Tag size={11} /> {it.code}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} color={C.graphite} style={{ flexShrink: 0 }} />
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopDetail({ item, onBack, onCopy }) {
  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", padding: 4, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, color: C.ink }}>
        <ArrowLeft size={19} color={C.ink} /> <span style={{ fontSize: 14, fontWeight: 600 }}>Back to shop</span>
      </button>

      {item.image ? (
        <img src={item.image} style={{ width: "100%", borderRadius: 16, objectFit: "cover", maxHeight: 340, background: C.stone }} />
      ) : (
        <div style={{ width: "100%", height: 200, borderRadius: 16, background: C.stone, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingBag size={40} color={C.graphite} />
        </div>
      )}

      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.pine, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 16 }}>
        {(item.category || "Other").trim() || "Other"}
      </div>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, color: C.ink, margin: "4px 0 0" }}>{item.name}</h2>

      {(item.price || item.sale_price) && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
          {item.price && item.sale_price ? (
            <>
              <span style={{ fontSize: 17, color: C.graphite, textDecoration: "line-through" }}>{item.price}</span>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color: C.pine }}>{item.sale_price}</span>
            </>
          ) : (
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color: C.ink }}>{item.sale_price || item.price}</span>
          )}
        </div>
      )}

      {item.note && (
        <p style={{ fontSize: 14.5, color: C.ink, lineHeight: 1.6, marginTop: 14, whiteSpace: "pre-wrap" }}>{item.note}</p>
      )}

      {item.code && (
        <button
          onClick={() => onCopy(item.code)}
          style={{ marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: C.amberTint, border: `1px dashed ${C.amber}`, borderRadius: 12, padding: "12px 14px" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Tag size={15} color={C.amber} style={{ flexShrink: 0 }} />
            <span style={{ textAlign: "left", minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 10.5, color: C.amber, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Discount code</span>
              <span style={{ display: "block", fontWeight: 700, color: C.amber, fontSize: 16, letterSpacing: "0.03em" }}>{item.code}</span>
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.amber, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            <Copy size={14} /> Copy
          </span>
        </button>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 14, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.pine, color: "#fff", borderRadius: 12, padding: "14px 18px", fontSize: 15.5, fontWeight: 700 }}
        >
          Buy now <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}

function ShopEditor({ items, onCancel, onSaved, showToast }) {
  const [draft, setDraft] = useState(
    items.map((it) => ({
      _key: it.id,
      id: it.id,
      category: it.category || "",
      name: it.name || "",
      note: it.note || "",
      code: it.code || "",
      url: it.url || "",
      price: it.price || "",
      sale_price: it.sale_price || "",
      image_path: it.image_path || "",
      image: it.image || "",
    }))
  );
  const [removed, setRemoved] = useState([]); // [{ id, image_path }]
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);

  function update(key, field, value) {
    setDraft((prev) => prev.map((d) => (d._key === key ? { ...d, [field]: value } : d)));
  }
  function addItem() {
    setDraft((prev) => [...prev, { _key: uid("shop"), category: "", name: "", note: "", code: "", url: "", price: "", sale_price: "", image_path: "", image: "" }]);
  }
  function removeItem(key) {
    setDraft((prev) => {
      const item = prev.find((d) => d._key === key);
      if (item && item.id) setRemoved((r) => [...r, { id: item.id, image_path: item.image_path }]);
      return prev.filter((d) => d._key !== key);
    });
  }

  async function handlePhoto(key, e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingKey(key);
    try {
      const blob = await resizeImageFile(file, 900, 0.8);
      const { path, url } = await uploadShopImage(blob);
      setDraft((prev) => prev.map((d) => (d._key === key ? { ...d, image_path: path, image: url } : d)));
    } catch (err) {
      console.error(err);
      showToast("Couldn't upload photo");
    } finally {
      setUploadingKey(null);
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const r of removed) {
        await deleteShopItem(r.id, r.image_path);
      }
      for (const d of draft) {
        if (!d.name.trim()) continue; // skip blank rows
        await saveShopItem({
          id: d.id,
          category: (d.category || "Other").trim() || "Other",
          name: d.name.trim(),
          note: d.note.trim(),
          code: d.code.trim(),
          url: d.url.trim(),
          price: d.price.trim(),
          sale_price: d.sale_price.trim(),
          image_path: d.image_path || null,
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</span>
            <button onClick={() => removeItem(d._key)} style={{ background: "none", border: "none" }}>
              <Trash2 size={15} color={C.danger} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <Thumb src={d.image} size={64} />
            <label style={{ background: C.stone, color: C.pine, borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <ImagePlus size={14} />
              {uploadingKey === d._key ? "Uploading…" : d.image ? "Change photo" : "Add photo"}
              <input type="file" accept="image/*" onChange={(e) => handlePhoto(d._key, e)} style={{ display: "none" }} />
            </label>
          </div>

          <label style={labelStyle}>Category</label>
          <input list="shop-categories" value={d.category} onChange={(e) => update(d._key, "category", e.target.value)} placeholder="e.g. Supplements" style={inputStyle} />

          <label style={labelStyle}>Product name</label>
          <input value={d.name} onChange={(e) => update(d._key, "name", e.target.value)} placeholder="e.g. Myprotein Impact Whey" style={inputStyle} />

          <label style={labelStyle}>Description</label>
          <textarea value={d.note} onChange={(e) => update(d._key, "note", e.target.value)} placeholder="What it is and why you recommend it" style={{ ...inputStyle, minHeight: 64, fontFamily: "inherit" }} />

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Full price</label>
              <input value={d.price} onChange={(e) => update(d._key, "price", e.target.value)} placeholder="£29.99" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Price with code</label>
              <input value={d.sale_price} onChange={(e) => update(d._key, "sale_price", e.target.value)} placeholder="£23.99" style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Discount code (optional)</label>
          <input value={d.code} onChange={(e) => update(d._key, "code", e.target.value)} placeholder="e.g. BRANDON20" style={inputStyle} />

          <label style={labelStyle}>Buy link (optional)</label>
          <input value={d.url} onChange={(e) => update(d._key, "url", e.target.value)} placeholder="https://…" inputMode="url" style={inputStyle} />
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

const labelStyle = {
  fontSize: 11.5,
  color: C.graphite,
  fontWeight: 600,
  marginTop: 8,
  display: "block",
};

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
