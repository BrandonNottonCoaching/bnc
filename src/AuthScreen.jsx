import React, { useState } from "react";
import { Mail, Eye, EyeOff } from "lucide-react";
import { C } from "./helpers";
import { PrimaryButton, GhostButton, TextField, StorageBanner } from "./ui";
import { signUp, signIn } from "./api";
import logoBlack from "./logo-black.png";

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Enter your name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        const user = await signUp({ email: emailNorm, password, name: name.trim(), role });
        onAuthed(user);
      } else {
        const user = await signIn({ email: emailNorm, password });
        onAuthed(user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", flexDirection: "column", alignItems: "center", padding: "54px 26px 30px" }}>
      <img src={logoBlack} alt="Brandon Notton Coaching" style={{ width: 210, marginBottom: 6 }} />
      <p style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic", color: C.graphite, fontSize: 14, marginBottom: 34 }}>
        Strength. Structure. Results.
      </p>

      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", background: C.stone, borderRadius: 12, padding: 4, marginBottom: 22 }}>
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                fontWeight: 700,
                fontSize: 13.5,
                background: mode === m ? C.paper : "transparent",
                color: mode === m ? C.ink : C.graphite,
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "login" ? "Log in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {mode === "signup" && (
            <>
              <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Mitchell" autoComplete="name" />
              <label style={{ display: "block", marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>I am a</span>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {["client", "trainer"].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 10,
                        border: `1.5px solid ${role === r ? C.pine : C.line}`,
                        background: role === r ? C.pineTint : "#fff",
                        color: role === r ? C.pineDeep : C.graphite,
                        fontWeight: 600,
                        fontSize: 13.5,
                      }}
                    >
                      {r === "trainer" ? "Coach" : "Client"}
                    </button>
                  ))}
                </div>
              </label>
            </>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            right={<Mail size={15} color={C.graphite} />}
          />
          <TextField
            label={mode === "signup" ? "Create a password (6+ characters)" : "Password"}
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            right={
              <button type="button" onClick={() => setShowPw((s) => !s)} style={{ background: "none", border: "none", padding: 0 }}>
                {showPw ? <EyeOff size={15} color={C.graphite} /> : <Eye size={15} color={C.graphite} />}
              </button>
            }
          />

          {error && <div style={{ color: C.danger, fontSize: 12.5, marginBottom: 12, marginTop: -4 }}>{error}</div>}

          <PrimaryButton type="submit" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
