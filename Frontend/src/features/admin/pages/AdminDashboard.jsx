import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
    getAdminStatsAPI,
    getAllUsersAPI,
    banUserAPI,
    unbanUserAPI,
    deleteUserAPI,
    updateUserRoleAPI,
    getAllReportsAPI,
    deleteReportAPI,
    getUserDetailAPI,
} from "../services/admin.api";
import "./AdminDashboard.css";

// ─── Helper ───────────────────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(d) {
    if (!d) return "—";
    const date = new Date(d);
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className="ad-stat-card" style={{ "--accent": color }}>
            <div className="ad-stat-icon">{icon}</div>
            <div className="ad-stat-info">
                <span className="ad-stat-value">{value ?? "—"}</span>
                <span className="ad-stat-label">{label}</span>
                {sub && <span className="ad-stat-sub">{sub}</span>}
            </div>
        </div>
    );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, color, title }) {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="ad-chart">
            <div className="ad-chart-title">{title}</div>
            <div className="ad-chart-bars">
                {data.map((d, i) => (
                    <div key={i} className="ad-chart-bar-wrap">
                        <div
                            className="ad-chart-bar"
                            style={{ height: `${(d.count / max) * 100}%`, background: color }}
                            title={`${MONTHS[(d._id.month || 1) - 1]} ${d._id.year}: ${d.count}`}
                        />
                        <span className="ad-chart-bar-label">{MONTHS[(d._id.month || 1) - 1]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [msg]);
    if (!msg) return null;
    return (
        <div className={`ad-toast ad-toast--${type}`}>
            {type === "success" ? "✓" : "✕"} {msg}
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ msg, onConfirm, onCancel, inputLabel, inputValue, onInputChange }) {
    return (
        <div className="ad-modal-overlay">
            <div className="ad-modal">
                <p className="ad-modal-msg">{msg}</p>
                {inputLabel && (
                    <div className="ad-modal-input-wrap">
                        <label>{inputLabel}</label>
                        <input
                            className="ad-modal-input"
                            value={inputValue}
                            onChange={e => onInputChange(e.target.value)}
                            placeholder="Enter reason..."
                        />
                    </div>
                )}
                <div className="ad-modal-actions">
                    <button className="ad-btn ad-btn--danger" onClick={onConfirm}>Confirm</button>
                    <button className="ad-btn ad-btn--ghost" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────
function UserDetailModal({ userId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserDetailAPI(userId).then(setData).finally(() => setLoading(false));
    }, [userId]);

    return (
        <div className="ad-modal-overlay" onClick={onClose}>
            <div className="ad-modal ad-modal--large" onClick={e => e.stopPropagation()}>
                <button className="ad-modal-close" onClick={onClose}>×</button>
                {loading ? <p style={{ color: "#94a3b8" }}>Loading...</p> : data && (
                    <>
                        <h3 className="ad-modal-heading">👤 {data.user.username}</h3>
                        <div className="ad-detail-grid">
                            <div className="ad-detail-item"><span>Email</span><strong>{data.user.email}</strong></div>
                            <div className="ad-detail-item"><span>Role</span><strong style={{ color: data.user.role === "admin" ? "#f59e0b" : "#60a5fa" }}>{data.user.role}</strong></div>
                            <div className="ad-detail-item"><span>Status</span><strong style={{ color: data.user.isBanned ? "#f87171" : "#34d399" }}>{data.user.isBanned ? "Banned" : "Active"}</strong></div>
                            <div className="ad-detail-item"><span>Verified</span><strong>{data.user.isVerified ? "✓ Yes" : "✗ No"}</strong></div>
                            <div className="ad-detail-item"><span>Joined</span><strong>{formatDate(data.user.createdAt)}</strong></div>
                            <div className="ad-detail-item"><span>Last Login</span><strong>{formatDate(data.user.lastLogin)}</strong></div>
                            <div className="ad-detail-item"><span>Reports</span><strong>{data.reports.length}</strong></div>
                            {data.profile && <div className="ad-detail-item"><span>Full Name</span><strong>{data.profile.fullName || "—"}</strong></div>}
                        </div>
                        {data.reports.length > 0 && (
                            <>
                                <h4 className="ad-detail-subheading">Recent Reports</h4>
                                <div className="ad-detail-reports">
                                    {data.reports.slice(0, 5).map(r => (
                                        <div key={r._id} className="ad-detail-report-item">
                                            <span>{r.title}</span>
                                            <span className="ad-badge ad-badge--blue">{r.matchScore ?? "—"}%</span>
                                            <span className="ad-text-muted">{formatDate(r.createdAt)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {data.user.isBanned && data.user.bannedReason && (
                            <div className="ad-ban-reason">🚫 Ban Reason: {data.user.bannedReason}</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState("dashboard");

    // Stats
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Users
    const [users, setUsers] = useState([]);
    const [userTotal, setUserTotal] = useState(0);
    const [userPage, setUserPage] = useState(1);
    const [userSearch, setUserSearch] = useState("");
    const [userStatus, setUserStatus] = useState("");
    const [usersLoading, setUsersLoading] = useState(false);

    // Reports
    const [reports, setReports] = useState([]);
    const [reportTotal, setReportTotal] = useState(0);
    const [reportPage, setReportPage] = useState(1);
    const [reportSearch, setReportSearch] = useState("");
    const [reportsLoading, setReportsLoading] = useState(false);

    // UI state
    const [toast, setToast] = useState({ msg: "", type: "success" });
    const [confirm, setConfirm] = useState(null); // { msg, onConfirm, inputLabel }
    const [confirmInput, setConfirmInput] = useState("");
    const [detailUserId, setDetailUserId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const showToast = (msg, type = "success") => setToast({ msg, type });

    // ── Load Stats ──
    const loadStats = useCallback(() => {
        setStatsLoading(true);
        getAdminStatsAPI()
            .then(setStats)
            .catch(() => showToast("Failed to load stats", "error"))
            .finally(() => setStatsLoading(false));
    }, []);

    // ── Load Users ──
    const loadUsers = useCallback(() => {
        setUsersLoading(true);
        getAllUsersAPI({ page: userPage, limit: 15, search: userSearch, status: userStatus })
            .then(data => { setUsers(data.users); setUserTotal(data.totalCount); })
            .catch(() => showToast("Failed to load users", "error"))
            .finally(() => setUsersLoading(false));
    }, [userPage, userSearch, userStatus]);

    // ── Load Reports ──
    const loadReports = useCallback(() => {
        setReportsLoading(true);
        getAllReportsAPI({ page: reportPage, limit: 15, search: reportSearch })
            .then(data => { setReports(data.reports); setReportTotal(data.totalCount); })
            .catch(() => showToast("Failed to load reports", "error"))
            .finally(() => setReportsLoading(false));
    }, [reportPage, reportSearch]);

    useEffect(() => { if (tab === "dashboard") loadStats(); }, [tab, loadStats]);
    useEffect(() => { if (tab === "users") loadUsers(); }, [tab, loadUsers]);
    useEffect(() => { if (tab === "reports") loadReports(); }, [tab, loadReports]);

    // ── User Actions ──
    const handleBan = (u) => {
        setConfirmInput("");
        setConfirm({
            msg: `Ban user "${u.username}"?`,
            inputLabel: "Reason for ban",
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await banUserAPI(u._id, confirmInput);
                    showToast(`User "${u.username}" banned.`);
                    loadUsers();
                    if (tab === "dashboard") loadStats();
                } catch (e) { showToast(e?.response?.data?.message || "Error banning user", "error"); }
                finally { setActionLoading(false); setConfirm(null); }
            }
        });
    };

    const handleUnban = (u) => {
        setConfirm({
            msg: `Unban user "${u.username}"?`,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await unbanUserAPI(u._id);
                    showToast(`User "${u.username}" unbanned.`);
                    loadUsers();
                    if (tab === "dashboard") loadStats();
                } catch (e) { showToast(e?.response?.data?.message || "Error", "error"); }
                finally { setActionLoading(false); setConfirm(null); }
            }
        });
    };

    const handleDeleteUser = (u) => {
        setConfirm({
            msg: `Permanently delete "${u.username}" and ALL their data? This CANNOT be undone.`,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await deleteUserAPI(u._id);
                    showToast(`User "${u.username}" deleted permanently.`);
                    loadUsers();
                    if (tab === "dashboard") loadStats();
                } catch (e) { showToast(e?.response?.data?.message || "Error", "error"); }
                finally { setActionLoading(false); setConfirm(null); }
            }
        });
    };

    const handlePromote = (u) => {
        const newRole = u.role === "admin" ? "user" : "admin";
        setConfirm({
            msg: `Change "${u.username}"'s role to "${newRole}"?`,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await updateUserRoleAPI(u._id, newRole);
                    showToast(`Role updated to "${newRole}".`);
                    loadUsers();
                } catch (e) { showToast(e?.response?.data?.message || "Error", "error"); }
                finally { setActionLoading(false); setConfirm(null); }
            }
        });
    };

    const handleDeleteReport = (r) => {
        setConfirm({
            msg: `Delete report "${r.title}"?`,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await deleteReportAPI(r._id);
                    showToast("Report deleted.");
                    loadReports();
                    if (tab === "dashboard") loadStats();
                } catch (e) { showToast(e?.response?.data?.message || "Error", "error"); }
                finally { setActionLoading(false); setConfirm(null); }
            }
        });
    };

    return (
        <div className="ad-root">
            {/* Sidebar */}
            <aside className="ad-sidebar">
                <div className="ad-brand">
                    <span className="ad-brand-icon">⚙</span>
                    <span>Admin Panel</span>
                </div>
                <nav className="ad-nav">
                    {[
                        { key: "dashboard", icon: "◎", label: "Dashboard" },
                        { key: "users", icon: "👥", label: "Users" },
                        { key: "reports", icon: "📋", label: "Reports" },
                    ].map(item => (
                        <button
                            key={item.key}
                            className={`ad-nav-item ${tab === item.key ? "ad-nav-item--active" : ""}`}
                            onClick={() => setTab(item.key)}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="ad-sidebar-footer">
                    <div className="ad-admin-badge">👑 {user?.username}</div>
                    <a href="/" className="ad-back-link">← Back to App</a>
                </div>
            </aside>

            {/* Main */}
            <main className="ad-main">
                <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "" })} />

                {confirm && (
                    <ConfirmModal
                        msg={confirm.msg}
                        inputLabel={confirm.inputLabel}
                        inputValue={confirmInput}
                        onInputChange={setConfirmInput}
                        onConfirm={confirm.onConfirm}
                        onCancel={() => setConfirm(null)}
                    />
                )}

                {detailUserId && (
                    <UserDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />
                )}

                {/* ── DASHBOARD ── */}
                {tab === "dashboard" && (
                    <div className="ad-section">
                        <h2 className="ad-section-title">📊 Dashboard Overview</h2>
                        {statsLoading ? (
                            <p className="ad-loading">Loading stats...</p>
                        ) : stats ? (
                            <>
                                <div className="ad-stat-grid">
                                    <StatCard icon="👥" label="Total Users" value={stats.totalUsers} sub={`+${stats.newUsers} this week`} color="#60a5fa" />
                                    <StatCard icon="✅" label="Verified Users" value={stats.verifiedUsers} color="#34d399" />
                                    <StatCard icon="🚫" label="Banned Users" value={stats.bannedUsers} color="#f87171" />
                                    <StatCard icon="📋" label="Interview Reports" value={stats.totalReports} sub={`+${stats.recentReports} this week`} color="#a78bfa" />
                                    <StatCard icon="🎓" label="Student Profiles" value={stats.totalProfiles} color="#fb923c" />
                                    <StatCard icon="📈" label="New Users (7d)" value={stats.newUsers} color="#38bdf8" />
                                </div>
                                <div className="ad-charts-row">
                                    <MiniBarChart data={stats.monthlyUsers} color="#60a5fa" title="User Registrations (Last 6 Months)" />
                                    <MiniBarChart data={stats.monthlyReports} color="#a78bfa" title="Reports Generated (Last 6 Months)" />
                                </div>
                            </>
                        ) : (
                            <p className="ad-loading">No data available.</p>
                        )}
                    </div>
                )}

                {/* ── USERS ── */}
                {tab === "users" && (
                    <div className="ad-section">
                        <h2 className="ad-section-title">👥 User Management <span className="ad-count">({userTotal} total)</span></h2>
                        <div className="ad-filters">
                            <input
                                className="ad-search"
                                placeholder="🔍 Search by username or email..."
                                value={userSearch}
                                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                            />
                            <select
                                className="ad-select"
                                value={userStatus}
                                onChange={e => { setUserStatus(e.target.value); setUserPage(1); }}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="banned">Banned</option>
                                <option value="verified">Verified</option>
                                <option value="unverified">Unverified</option>
                            </select>
                        </div>
                        {usersLoading ? (
                            <p className="ad-loading">Loading users...</p>
                        ) : (
                            <div className="ad-table-wrap">
                                <table className="ad-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Reports</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id} className={u.isBanned ? "ad-row--banned" : ""}>
                                                <td>
                                                    <button className="ad-username-btn" onClick={() => setDetailUserId(u._id)}>
                                                        {u.username}
                                                    </button>
                                                </td>
                                                <td className="ad-text-muted">{u.email}</td>
                                                <td>
                                                    <span className={`ad-badge ${u.role === "admin" ? "ad-badge--gold" : "ad-badge--blue"}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`ad-badge ${u.isBanned ? "ad-badge--red" : u.isVerified ? "ad-badge--green" : "ad-badge--gray"}`}>
                                                        {u.isBanned ? "Banned" : u.isVerified ? "Active" : "Unverified"}
                                                    </span>
                                                </td>
                                                <td className="ad-text-center">{u.reportCount}</td>
                                                <td className="ad-text-muted">{formatDate(u.createdAt)}</td>
                                                <td>
                                                    <div className="ad-actions">
                                                        <button className="ad-btn ad-btn--sm ad-btn--ghost" onClick={() => setDetailUserId(u._id)} title="View Details">👁</button>
                                                        {u.isBanned
                                                            ? <button className="ad-btn ad-btn--sm ad-btn--green" onClick={() => handleUnban(u)} title="Unban">✓ Unban</button>
                                                            : <button className="ad-btn ad-btn--sm ad-btn--warn" onClick={() => handleBan(u)} title="Ban">🚫 Ban</button>
                                                        }
                                                        <button className="ad-btn ad-btn--sm ad-btn--ghost" onClick={() => handlePromote(u)} title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}>
                                                            {u.role === "admin" ? "⬇ Demote" : "⬆ Admin"}
                                                        </button>
                                                        <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => handleDeleteUser(u)} title="Delete">🗑</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.length === 0 && <p className="ad-empty">No users found.</p>}
                            </div>
                        )}
                        {/* Pagination */}
                        <div className="ad-pagination">
                            <button className="ad-btn ad-btn--ghost ad-btn--sm" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>← Prev</button>
                            <span className="ad-page-info">Page {userPage} of {Math.ceil(userTotal / 15) || 1}</span>
                            <button className="ad-btn ad-btn--ghost ad-btn--sm" disabled={userPage >= Math.ceil(userTotal / 15)} onClick={() => setUserPage(p => p + 1)}>Next →</button>
                        </div>
                    </div>
                )}

                {/* ── REPORTS ── */}
                {tab === "reports" && (
                    <div className="ad-section">
                        <h2 className="ad-section-title">📋 Interview Reports <span className="ad-count">({reportTotal} total)</span></h2>
                        <div className="ad-filters">
                            <input
                                className="ad-search"
                                placeholder="🔍 Search by job title..."
                                value={reportSearch}
                                onChange={e => { setReportSearch(e.target.value); setReportPage(1); }}
                            />
                        </div>
                        {reportsLoading ? (
                            <p className="ad-loading">Loading reports...</p>
                        ) : (
                            <div className="ad-table-wrap">
                                <table className="ad-table">
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>User</th>
                                            <th>Match Score</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(r => (
                                            <tr key={r._id}>
                                                <td className="ad-report-title">{r.title}</td>
                                                <td>
                                                    <span className="ad-user-chip">
                                                        {r.user?.username || "—"}
                                                        <span className="ad-text-muted"> ({r.user?.email || "—"})</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="ad-score-wrap">
                                                        <div className="ad-score-bar" style={{ width: `${r.matchScore || 0}%`, background: (r.matchScore || 0) > 70 ? "#34d399" : (r.matchScore || 0) > 40 ? "#fbbf24" : "#f87171" }} />
                                                        <span className="ad-score-val">{r.matchScore ?? "—"}%</span>
                                                    </div>
                                                </td>
                                                <td className="ad-text-muted">{formatDate(r.createdAt)}</td>
                                                <td>
                                                    <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => handleDeleteReport(r)}>🗑 Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {reports.length === 0 && <p className="ad-empty">No reports found.</p>}
                            </div>
                        )}
                        <div className="ad-pagination">
                            <button className="ad-btn ad-btn--ghost ad-btn--sm" disabled={reportPage <= 1} onClick={() => setReportPage(p => p - 1)}>← Prev</button>
                            <span className="ad-page-info">Page {reportPage} of {Math.ceil(reportTotal / 15) || 1}</span>
                            <button className="ad-btn ad-btn--ghost ad-btn--sm" disabled={reportPage >= Math.ceil(reportTotal / 15)} onClick={() => setReportPage(p => p + 1)}>Next →</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
