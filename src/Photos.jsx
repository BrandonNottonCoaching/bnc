import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { C, fmtNice, fmtShort, resizeImageFile } from "./helpers";
import { PrimaryButton, EmptyState } from "./ui";
import { listPhotos, uploadPhoto, deletePhoto } from "./api";

export default function Photos({ clientId, showToast }) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selA, setSelA] = useState(null);
  const [selB, setSelB] = useState(null);

  async function refresh() {
    const p = await listPhotos(clientId);
    setPhotos(p);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeImageFile(file);
      await uploadPhoto(clientId, blob);
      await refresh();
      showToast("Photo added");
    } catch (err) {
      showToast("Couldn't upload photo");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removePhoto(p) {
    await deletePhoto(p.id, p.path);
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
  }

  function toggleSelect(p) {
    if (selA === p.id) { setSelA(null); return; }
    if (selB === p.id) { setSelB(null); return; }
    if (!selA) setSelA(p.id);
    else if (!selB) setSelB(p.id);
    else { setSelA(p.id); setSelB(null); }
  }
  const photoA = photos.find((p) => p.id === selA);
  const photoB = photos.find((p) => p.id === selB);

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>Progress photos</h2>
        <button
          onClick={() => { setCompareMode((s) => !s); setSelA(null); setSelB(null); }}
          style={{ background: compareMode ? C.pine : C.stone, color: compareMode ? "#fff" : C.pine, border: "none", borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 700 }}
        >
          {compareMode ? "Done" : "Compare"}
        </button>
      </div>
      <p style={{ fontSize: 13, color: C.graphite, marginTop: 2, marginBottom: 16 }}>{compareMode ? "Select two photos to compare side by side" : "Private to you and your coach"}</p>

      {compareMode && photoA && photoB && (
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <img src={photoA.image} style={{ width: "100%", borderRadius: 10, objectFit: "cover", aspectRatio: "3/4" }} />
              <div style={{ fontSize: 11.5, color: C.graphite, textAlign: "center", marginTop: 4 }}>{fmtNice(photoA.date)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <img src={photoB.image} style={{ width: "100%", borderRadius: 10, objectFit: "cover", aspectRatio: "3/4" }} />
              <div style={{ fontSize: 11.5, color: C.graphite, textAlign: "center", marginTop: 4 }}>{fmtNice(photoB.date)}</div>
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
      {!compareMode && (
        <PrimaryButton icon={Camera} disabled={uploading} onClick={() => fileRef.current?.click()} style={{ marginBottom: 18 }}>
          {uploading ? "Uploading…" : "Add progress photo"}
        </PrimaryButton>
      )}

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          {photos.length === 0 && <EmptyState icon={Camera} title="No photos yet" sub="Capture your first progress photo." />}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {photos.map((p) => {
              const selected = selA === p.id || selB === p.id;
              return (
                <div key={p.id} onClick={() => (compareMode ? toggleSelect(p) : null)} style={{ position: "relative", cursor: compareMode ? "pointer" : "default" }}>
                  <img src={p.image} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 10, border: selected ? `3px solid ${C.pine}` : "none" }} />
                  <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 9.5, padding: "2px 5px", borderRadius: 5 }}>{fmtShort(p.date)}</div>
                  {!compareMode && (
                    <button onClick={(e) => { e.stopPropagation(); removePhoto(p); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 999, padding: 3 }}>
                      <X size={11} color="#fff" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
