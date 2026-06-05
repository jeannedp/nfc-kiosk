"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CardMapping {
  id: string;
  uid_normalized: string;
  destination_url: string;
  label: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ScanLog {
  id: string;
  uid_normalized: string;
  matched: boolean;
  destination_url: string | null;
  device: string | null;
  user_agent: string | null;
  created_at: string;
}

type AdminTab = "mappings" | "logs";

// ── Main admin page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Check auth on load
  useEffect(() => {
    fetch("/api/admin/mappings")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div style={s.loadingScreen}>Loading…</div>;
  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />;

  return <Dashboard onLogout={() => setAuthed(false)} />;
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setLoading(false);
    if (res.ok) {
      onSuccess();
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div style={s.loginRoot}>
      <div style={s.loginCard}>
        <h1 style={s.loginTitle}>NFC Kiosk Admin</h1>
        <p style={s.loginSub}>Enter admin password to continue</p>
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={s.input}
          autoFocus
        />
        {error && <p style={s.errorText}>{error}</p>}
        <button onClick={submit} disabled={loading} style={s.btn}>
          {loading ? "Checking…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("mappings");
  const [mappings, setMappings] = useState<CardMapping[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Add/edit modal
  const [modal, setModal] = useState<{ mode: "add" | "edit"; mapping?: CardMapping } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMappings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/mappings");
    if (res.ok) setMappings(await res.json());
    setLoading(false);
  }, []);

  const loadLogs = useCallback(async () => {
    const res = await fetch("/api/admin/logs?limit=100");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setLogsTotal(data.total);
    }
  }, []);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  useEffect(() => {
    if (tab === "logs") loadLogs();
  }, [tab, loadLogs]);

  const deleteMapping = async (id: string) => {
    if (!confirm("Delete this mapping?")) return;
    const res = await fetch(`/api/admin/mappings/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Deleted");
      loadMappings();
    } else {
      showToast("Delete failed", "err");
    }
  };

  const toggleEnabled = async (m: CardMapping) => {
    const res = await fetch(`/api/admin/mappings/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !m.enabled }),
    });
    if (res.ok) {
      showToast(m.enabled ? "Disabled" : "Enabled");
      loadMappings();
    } else {
      showToast("Update failed", "err");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    onLogout();
  };

  return (
    <div style={s.dashRoot}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>NFC Kiosk</span>
          <span style={s.logoBadge}>Admin</span>
        </div>
        <div style={s.headerRight}>
          <a href="/" style={s.headerLink} target="_blank" rel="noopener noreferrer">
            ↗ Kiosk page
          </a>
          <button onClick={logout} style={s.logoutBtn}>
            Sign out
          </button>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === "err" ? s.toastErr : s.toastOk) }}>
          {toast.msg}
        </div>
      )}

      <div style={s.content}>
        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === "mappings" ? s.tabActive : {}) }}
            onClick={() => setTab("mappings")}
          >
            Card Mappings
            <span style={s.tabBadge}>{mappings.length}</span>
          </button>
          <button
            style={{ ...s.tab, ...(tab === "logs" ? s.tabActive : {}) }}
            onClick={() => setTab("logs")}
          >
            Scan Logs
            {logsTotal > 0 && <span style={s.tabBadge}>{logsTotal}</span>}
          </button>
        </div>

        {/* Mappings tab */}
        {tab === "mappings" && (
          <div>
            <div style={s.tableHeader}>
              <h2 style={s.sectionTitle}>UID → URL Mappings</h2>
              <button onClick={() => setModal({ mode: "add" })} style={s.btn}>
                + Add mapping
              </button>
            </div>

            {loading ? (
              <div style={s.emptyState}>Loading…</div>
            ) : mappings.length === 0 ? (
              <div style={s.emptyState}>
                No mappings yet.{" "}
                <button onClick={() => setModal({ mode: "add" })} style={s.inlineLink}>
                  Add one.
                </button>
              </div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>UID</th>
                      <th style={s.th}>Label</th>
                      <th style={s.th}>Destination URL</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((m) => (
                      <tr key={m.id} style={s.tr}>
                        <td style={s.td}>
                          <code style={s.code}>{m.uid_normalized}</code>
                        </td>
                        <td style={s.td}>
                          <span style={s.labelText}>{m.label ?? "—"}</span>
                        </td>
                        <td style={{ ...s.td, maxWidth: 260 }}>
                          <a
                            href={m.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={s.urlLink}
                            title={m.destination_url}
                          >
                            {truncate(m.destination_url, 48)}
                          </a>
                        </td>
                        <td style={s.td}>
                          <button
                            onClick={() => toggleEnabled(m)}
                            style={m.enabled ? s.badgeEnabled : s.badgeDisabled}
                          >
                            {m.enabled ? "Enabled" : "Disabled"}
                          </button>
                        </td>
                        <td style={s.td}>
                          <div style={s.actions}>
                            <button
                              onClick={() => setModal({ mode: "edit", mapping: m })}
                              style={s.actionBtn}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMapping(m.id)}
                              style={{ ...s.actionBtn, ...s.actionBtnDanger }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Logs tab */}
        {tab === "logs" && (
          <div>
            <div style={s.tableHeader}>
              <h2 style={s.sectionTitle}>Scan Logs ({logsTotal} total)</h2>
              <button onClick={loadLogs} style={s.outlineBtn}>
                Refresh
              </button>
            </div>
            {logs.length === 0 ? (
              <div style={s.emptyState}>No scans recorded yet.</div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Time</th>
                      <th style={s.th}>UID</th>
                      <th style={s.th}>Result</th>
                      <th style={s.th}>Destination</th>
                      <th style={s.th}>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} style={s.tr}>
                        <td style={s.td}>
                          <span style={s.timeText}>{fmtDate(l.created_at)}</span>
                        </td>
                        <td style={s.td}>
                          <code style={s.code}>{l.uid_normalized}</code>
                        </td>
                        <td style={s.td}>
                          <span style={l.matched ? s.badgeEnabled : s.badgeDisabled}>
                            {l.matched ? "Match" : "No match"}
                          </span>
                        </td>
                        <td style={{ ...s.td, maxWidth: 220 }}>
                          {l.destination_url ? (
                            <a
                              href={l.destination_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={s.urlLink}
                            >
                              {truncate(l.destination_url, 40)}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={s.td}>
                          <span style={s.labelText}>{l.device ?? "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <MappingModal
          mode={modal.mode}
          existing={modal.mapping}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadMappings();
            showToast(modal.mode === "add" ? "Mapping added" : "Mapping updated");
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}

// ── Mapping modal ─────────────────────────────────────────────────────────────

function MappingModal({
  mode,
  existing,
  onClose,
  onSaved,
  onError,
}: {
  mode: "add" | "edit";
  existing?: CardMapping;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [uid, setUid] = useState(existing?.uid_normalized ?? "");
  const [url, setUrl] = useState(existing?.destination_url ?? "");
  const [label, setLabel] = useState(existing?.label ?? "");
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!uid.trim() || !url.trim()) {
      onError("UID and URL are required");
      return;
    }
    setSaving(true);

    const body: Record<string, unknown> = {
      uid,
      destination_url: url,
      label: label || null,
      enabled,
    };

    const res =
      mode === "add"
        ? await fetch("/api/admin/mappings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/admin/mappings/${existing!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

    setSaving(false);

    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      onError(data.error ?? "Save failed");
    }
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={s.modalTitle}>
          {mode === "add" ? "Add card mapping" : "Edit card mapping"}
        </h2>

        <label style={s.fieldLabel}>Card UID</label>
        <input
          style={s.input}
          placeholder="e.g. 04:03:2A:92:D4:13:91"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          disabled={mode === "edit"}
        />

        <label style={s.fieldLabel}>Destination URL</label>
        <input
          style={s.input}
          placeholder="https://example.com/page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <label style={s.fieldLabel}>Label (optional)</label>
        <input
          style={s.input}
          placeholder="e.g. Reception desk card"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />

        <div style={s.checkRow}>
          <input
            type="checkbox"
            id="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <label htmlFor="enabled" style={{ cursor: "pointer" }}>
            Enabled
          </label>
        </div>

        <div style={s.modalActions}>
          <button onClick={onClose} style={s.outlineBtn}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={s.btn}>
            {saving ? "Saving…" : mode === "add" ? "Add mapping" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--admin-bg)",
    color: "var(--admin-muted)",
    fontSize: "1rem",
  },
  // Login
  loginRoot: {
    minHeight: "100vh",
    background: "var(--admin-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginCard: {
    background: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    borderRadius: "1rem",
    padding: "2.5rem",
    width: 360,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  loginTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--admin-text)",
  },
  loginSub: {
    color: "var(--admin-muted)",
    fontSize: "0.9rem",
    marginTop: "-0.5rem",
  },
  // Dashboard
  dashRoot: {
    minHeight: "100vh",
    background: "var(--admin-bg)",
    color: "var(--admin-text)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "var(--admin-surface)",
    borderBottom: "1px solid var(--admin-border)",
    padding: "0 2rem",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  logo: { fontWeight: 700, fontSize: "1.1rem", color: "var(--admin-text)" },
  logoBadge: {
    background: "var(--admin-accent)",
    color: "#fff",
    borderRadius: "0.4rem",
    padding: "0.15rem 0.5rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem" },
  headerLink: { color: "var(--admin-accent)", textDecoration: "none", fontSize: "0.9rem" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid var(--admin-border)",
    borderRadius: "0.5rem",
    padding: "0.35rem 0.9rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "var(--admin-muted)",
  },
  // Toast
  toast: {
    position: "fixed",
    top: "5rem",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.6rem",
    fontWeight: 600,
    fontSize: "0.9rem",
    zIndex: 100,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  },
  toastOk: { background: "var(--admin-success)", color: "#fff" },
  toastErr: { background: "var(--admin-danger)", color: "#fff" },
  // Content
  content: { maxWidth: 1100, margin: "0 auto", padding: "2rem" },
  tabs: {
    display: "flex",
    gap: "0.25rem",
    borderBottom: "2px solid var(--admin-border)",
    marginBottom: "2rem",
  },
  tab: {
    padding: "0.75rem 1.25rem",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.95rem",
    color: "var(--admin-muted)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "color 0.15s",
  },
  tabActive: {
    color: "var(--admin-accent)",
    borderBottomColor: "var(--admin-accent)",
    fontWeight: 600,
  },
  tabBadge: {
    background: "var(--admin-border)",
    color: "var(--admin-muted)",
    borderRadius: "999px",
    padding: "0.1rem 0.5rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
  },
  sectionTitle: { fontSize: "1.1rem", fontWeight: 600, color: "var(--admin-text)" },
  tableWrap: {
    background: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    borderRadius: "0.75rem",
    overflow: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
  th: {
    padding: "0.75rem 1rem",
    textAlign: "left",
    fontWeight: 600,
    color: "var(--admin-muted)",
    borderBottom: "1px solid var(--admin-border)",
    background: "var(--admin-bg)",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid var(--admin-border)" },
  td: { padding: "0.85rem 1rem", verticalAlign: "middle" },
  code: {
    fontFamily: "monospace",
    fontSize: "0.85rem",
    background: "var(--admin-bg)",
    padding: "0.2rem 0.5rem",
    borderRadius: "0.3rem",
    border: "1px solid var(--admin-border)",
  },
  labelText: { color: "var(--admin-muted)", fontSize: "0.9rem" },
  timeText: { color: "var(--admin-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" },
  urlLink: {
    color: "var(--admin-accent)",
    textDecoration: "none",
    fontSize: "0.85rem",
    wordBreak: "break-all",
  },
  badgeEnabled: {
    display: "inline-block",
    padding: "0.25rem 0.65rem",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.12)",
    color: "#16a34a",
    fontWeight: 600,
    fontSize: "0.78rem",
    border: "1px solid rgba(34,197,94,0.25)",
    cursor: "pointer",
  },
  badgeDisabled: {
    display: "inline-block",
    padding: "0.25rem 0.65rem",
    borderRadius: "999px",
    background: "rgba(239,68,68,0.1)",
    color: "#dc2626",
    fontWeight: 600,
    fontSize: "0.78rem",
    border: "1px solid rgba(239,68,68,0.2)",
    cursor: "pointer",
  },
  actions: { display: "flex", gap: "0.5rem" },
  actionBtn: {
    padding: "0.3rem 0.7rem",
    background: "var(--admin-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "0.4rem",
    cursor: "pointer",
    fontSize: "0.82rem",
    color: "var(--admin-text)",
    fontWeight: 500,
  },
  actionBtnDanger: { color: "var(--admin-danger)", borderColor: "rgba(239,68,68,0.3)" },
  emptyState: {
    padding: "3rem",
    textAlign: "center",
    color: "var(--admin-muted)",
    background: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    borderRadius: "0.75rem",
  },
  inlineLink: {
    background: "none",
    border: "none",
    color: "var(--admin-accent)",
    cursor: "pointer",
    fontSize: "inherit",
    padding: 0,
  },
  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    borderRadius: "1rem",
    padding: "2rem",
    width: 480,
    maxWidth: "95vw",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    boxShadow: "0 8px 48px rgba(0,0,0,0.15)",
  },
  modalTitle: { fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "0.75rem",
  },
  // Shared form
  fieldLabel: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "var(--admin-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: "0.25rem",
  },
  input: {
    width: "100%",
    padding: "0.6rem 0.9rem",
    border: "1px solid var(--admin-border)",
    borderRadius: "0.5rem",
    fontSize: "0.95rem",
    outline: "none",
    color: "var(--admin-text)",
    background: "var(--admin-bg)",
    fontFamily: "inherit",
  },
  btn: {
    padding: "0.6rem 1.25rem",
    background: "var(--admin-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.95rem",
    fontFamily: "inherit",
  },
  outlineBtn: {
    padding: "0.6rem 1.25rem",
    background: "transparent",
    color: "var(--admin-text)",
    border: "1px solid var(--admin-border)",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.95rem",
    fontFamily: "inherit",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.95rem",
    color: "var(--admin-text)",
  },
  errorText: { color: "var(--admin-danger)", fontSize: "0.9rem" },
};
