import { query, run, queryOne } from '../config/database.js';

export function mountDbBrowser(app) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) return;

    // Helper: get all tables for sidebar
    async function getTables() {
        return await query(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
    }

    // ── HOME ──────────────────────────────────────────────────────────────
    app.get('/db-browser', async (req, res) => {
        const tables = await getTables();
        res.send(layout('DB Browser', tables, null, `
            <div class="welcome">
                <div class="welcome-icon">🗄️</div>
                <h2>SQLite Database Browser</h2>
                <p>Select a table from the sidebar to browse, edit, and query your data.</p>
                <div class="table-grid">
                    ${tables.map(t => `<a href="/db-browser/${t.name}" class="table-card">${t.name}</a>`).join('')}
                </div>
                <a href="/db-browser/sql" class="sql-home-btn">⚡ Open SQL Console</a>
            </div>
        `));
    });

    // ── SQL CONSOLE ───────────────────────────────────────────────────────
    app.get('/db-browser/sql', async (req, res) => {
        const tables = await getTables();
        res.send(layout('SQL Console', tables, 'sql', `
            <div class="console-wrap">
                <div class="console-header">
                    <h2>⚡ SQL Console</h2>
                    <span class="console-hint">Run SELECT, INSERT, UPDATE, DELETE — full SQLite support</span>
                </div>
                <div class="editor-section">
                    <textarea id="sqlInput" class="sql-editor" spellcheck="false" placeholder="SELECT * FROM orders LIMIT 10;"></textarea>
                    <div class="editor-actions">
                        <button onclick="runSQL()" class="run-btn">▶ Run Query</button>
                        <button onclick="formatSQL()" class="fmt-btn">Format</button>
                        <button onclick="clearSQL()" class="clear-btn">Clear</button>
                        <div class="quick-btns">
                            ${tables.map(t => `<button onclick="setSQL('SELECT * FROM ${t.name} LIMIT 50;')" class="quick-btn">${t.name}</button>`).join('')}
                        </div>
                    </div>
                </div>
                <div id="result" class="result-area"></div>
            </div>
            <script>
            async function runSQL() {
                const sql = document.getElementById('sqlInput').value.trim();
                if (!sql) return;
                const res = document.getElementById('result');
                res.innerHTML = '<div class="loading">⏳ Running…</div>';
                try {
                    const r = await fetch('/db-browser/_sql', {
                        method: 'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({sql})
                    });
                    const data = await r.json();
                    if (!r.ok) {
                        res.innerHTML = '<div class="sql-error">❌ ' + esc(data.error) + '</div>';
                        return;
                    }
                    if (data.rows && data.rows.length > 0) {
                        const cols = Object.keys(data.rows[0]);
                        const thead = '<tr>' + cols.map(c=>'<th>'+esc(c)+'</th>').join('') + '</tr>';
                        const tbody = data.rows.map(row =>
                            '<tr>' + cols.map(c => {
                                let v = row[c];
                                if (v === null) return '<td><span class="null">NULL</span></td>';
                                let s = String(v);
                                if (s.length > 150) s = s.substring(0,150) + '…';
                                return '<td title="'+esc(String(row[c]))+'">'+esc(s)+'</td>';
                            }).join('') + '</tr>'
                        ).join('');
                        res.innerHTML = '<div class="result-meta">✅ '+data.rows.length+' row(s) returned</div><div class="table-scroll"><table><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';
                    } else if (data.changes !== undefined) {
                        res.innerHTML = '<div class="sql-success">✅ Query executed. Rows affected: ' + data.changes + '</div>';
                    } else {
                        res.innerHTML = '<div class="sql-success">✅ Query executed. No rows returned.</div>';
                    }
                } catch(e) {
                    res.innerHTML = '<div class="sql-error">❌ Network error: ' + esc(e.message) + '</div>';
                }
            }
            function setSQL(s) { document.getElementById('sqlInput').value = s; }
            function clearSQL() { document.getElementById('sqlInput').value = ''; document.getElementById('result').innerHTML = ''; }
            function formatSQL() {
                let s = document.getElementById('sqlInput').value;
                const kw = ['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','JOIN','LEFT JOIN','INNER JOIN','ON'];
                kw.forEach(k => { s = s.replace(new RegExp('\\\\b'+k+'\\\\b','gi'), '\\n'+k); });
                document.getElementById('sqlInput').value = s.trim();
            }
            function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
            document.getElementById('sqlInput').addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runSQL(); }
                if (e.key === 'Tab') { e.preventDefault(); const t=e.target; const s=t.selectionStart; t.value=t.value.substring(0,s)+'    '+t.value.substring(t.selectionEnd); t.selectionStart=t.selectionEnd=s+4; }
            });
            </script>
        `));
    });

    // ── SQL API ENDPOINT ──────────────────────────────────────────────────
    app.post('/db-browser/_sql', async (req, res) => {
        const { sql } = req.body;
        if (!sql) return res.status(400).json({ error: 'No SQL provided' });
        try {
            const trimmed = sql.trim().toUpperCase();
            if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
                const rows = await query(sql);
                return res.json({ rows });
            } else {
                const result = await run(sql);
                return res.json({ changes: result.changes, lastID: result.lastID });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    });

    // ── TABLE VIEW ────────────────────────────────────────────────────────
    app.get('/db-browser/:table', async (req, res) => {
        const { table } = req.params;
        if (table === 'sql') return;  // already handled above
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).send('Invalid table name');

        const page = Math.max(1, parseInt(req.query.page || '1'));
        const limit = 50;
        const offset = (page - 1) * limit;

        try {
            const tables = await getTables();
            const cols = await query(`PRAGMA table_info(${table})`);
            const colNames = cols.map(c => c.name);
            const pkCol = cols.find(c => c.pk === 1)?.name || colNames[0];

            const [{ total }] = await query(`SELECT COUNT(*) as total FROM "${table}"`);
            const totalPages = Math.ceil(total / limit) || 1;
            const rows = await query(`SELECT * FROM "${table}" LIMIT ${limit} OFFSET ${offset}`);

            const thead = `<tr><th class="act-col">Actions</th>${colNames.map(c => `<th>${c}</th>`).join('')}</tr>`;
            const tbody = rows.map(row => {
                const pk = row[pkCol];
                const cells = colNames.map(c => {
                    let v = row[c];
                    const raw = v === null ? '' : String(v);
                    const display = v === null ? `<span class="null">NULL</span>` : (raw.length > 100 ? raw.substring(0, 100) + '…' : raw.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
                    return `<td data-col="${c}" data-val="${raw.replace(/"/g, '&quot;')}">${display}</td>`;
                }).join('');
                const editBtn = `<button class="act-btn edit-btn" onclick="startEdit(this,'${table}','${pkCol}','${pk}')">✏️</button>`;
                const delBtn = `<button class="act-btn del-btn" onclick="deleteRow('${table}','${pkCol}','${pk}')">🗑</button>`;
                return `<tr data-pk="${pk}">${editBtn}${delBtn}${cells}</tr>`;
            }).join('') || `<tr><td colspan="${colNames.length + 1}" class="empty">No rows found</td></tr>`;

            const prevLink = page > 1 ? `<a href="/db-browser/${table}?page=${page - 1}" class="btn">← Prev</a>` : `<span class="btn disabled">← Prev</span>`;
            const nextLink = page < totalPages ? `<a href="/db-browser/${table}?page=${page + 1}" class="btn">Next →</a>` : `<span class="btn disabled">Next →</span>`;

            res.send(layout(table, tables, table, `
                <div class="table-header">
                    <div class="th-left">
                        <h2>${table}</h2>
                        <div class="table-meta">${total} row${total !== 1 ? 's' : ''} · Page ${page} of ${totalPages}</div>
                    </div>
                    <button class="add-row-btn" onclick="showAddRow('${table}',${JSON.stringify(colNames)})">+ Add Row</button>
                </div>
                <div class="table-scroll">
                    <table id="dataTable">
                        <thead>${thead}</thead>
                        <tbody>${tbody}</tbody>
                    </table>
                </div>
                <div class="pagination">
                    ${prevLink}
                    <span class="page-info">Page ${page} / ${totalPages}</span>
                    ${nextLink}
                </div>

                <!-- Add Row Modal -->
                <div id="addModal" class="modal hidden">
                    <div class="modal-box">
                        <div class="modal-title">Add New Row to <b>${table}</b></div>
                        <form id="addForm" onsubmit="submitAdd(event,'${table}')"></form>
                        <div class="modal-actions">
                            <button onclick="document.getElementById('addModal').classList.add('hidden')" class="btn">Cancel</button>
                            <button onclick="document.getElementById('addForm').requestSubmit()" class="run-btn">Insert</button>
                        </div>
                    </div>
                </div>

                <div id="toast" class="toast hidden"></div>

                <script>
                const COLS = ${JSON.stringify(colNames)};
                const PK = '${pkCol}';

                function showToast(msg, ok=true) {
                    const t = document.getElementById('toast');
                    t.textContent = msg;
                    t.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err');
                    setTimeout(() => t.className = 'toast hidden', 3000);
                }

                function startEdit(btn, table, pk, pkVal) {
                    const row = btn.closest('tr');
                    if (row.classList.contains('editing')) return;
                    row.classList.add('editing');
                    btn.textContent = '💾';
                    btn.onclick = () => saveEdit(btn, table, pk, pkVal);
                    row.querySelectorAll('td[data-col]').forEach(td => {
                        const col = td.dataset.col;
                        const val = td.dataset.val;
                        td.innerHTML = '<input class="edit-input" data-col="'+col+'" value="'+val.replace(/"/g,'&quot;')+'">';
                    });
                }

                async function saveEdit(btn, table, pk, pkVal) {
                    const row = btn.closest('tr');
                    const inputs = row.querySelectorAll('input.edit-input');
                    const sets = [];
                    const vals = [];
                    inputs.forEach(i => { sets.push(i.dataset.col + ' = ?'); vals.push(i.value); });
                    vals.push(pkVal);
                    const sql = 'UPDATE "'+table+'" SET ' + sets.join(', ') + ' WHERE "'+pk+'" = ?';
                    const r = await fetch('/db-browser/_sql', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({sql, params: vals}) });
                    if (r.ok) { showToast('✅ Row updated'); setTimeout(() => location.reload(), 800); }
                    else { const d = await r.json(); showToast('❌ ' + d.error, false); }
                }

                async function deleteRow(table, pk, pkVal) {
                    if (!confirm('Delete row where '+pk+' = '+pkVal+'?')) return;
                    const sql = 'DELETE FROM "'+table+'" WHERE "'+pk+'" = '+pkVal;
                    const r = await fetch('/db-browser/_sql', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({sql}) });
                    if (r.ok) { showToast('🗑 Row deleted'); setTimeout(() => location.reload(), 800); }
                    else { const d = await r.json(); showToast('❌ ' + d.error, false); }
                }

                function showAddRow(table, cols) {
                    const form = document.getElementById('addForm');
                    form.innerHTML = cols.filter(c => c !== PK).map(c =>
                        '<div class="form-row"><label>'+c+'</label><input name="'+c+'" class="edit-input" placeholder="NULL"></div>'
                    ).join('');
                    document.getElementById('addModal').classList.remove('hidden');
                }

                async function submitAdd(e, table) {
                    e.preventDefault();
                    const inputs = document.getElementById('addForm').querySelectorAll('input');
                    const cols = [], vals = [];
                    inputs.forEach(i => { if (i.value !== '') { cols.push('"'+i.name+'"'); vals.push("'"+i.value.replace(/'/g,"''")+"'"); }});
                    const sql = 'INSERT INTO "'+table+'" ('+cols.join(',')+') VALUES ('+vals.join(',')+')';
                    const r = await fetch('/db-browser/_sql', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({sql}) });
                    if (r.ok) { showToast('✅ Row inserted'); setTimeout(() => location.reload(), 800); }
                    else { const d = await r.json(); showToast('❌ ' + d.error, false); }
                }
                </script>
            `));
        } catch (err) {
            res.status(500).send(`<pre style="color:red">Error: ${err.message}</pre>`);
        }
    });

    // ── DELETE API (also via URL for simple delete) ───────────────────────
    app.delete('/db-browser/_row', async (req, res) => {
        const { table, pk, pkVal } = req.body;
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).json({ error: 'Invalid table' });
        try {
            const result = await run(`DELETE FROM "${table}" WHERE "${pk}" = ?`, [pkVal]);
            res.json({ changes: result.changes });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    console.log('🗄  DB Browser → http://localhost:5001/db-browser');
    console.log('⚡  SQL Console → http://localhost:5001/db-browser/sql');
}

// ── HTML LAYOUT ────────────────────────────────────────────────────────────
function layout(title, tables, activeTable, content) {
    const sideLinks = tables.map(t => {
        const isActive = t.name === activeTable;
        return `<a href="/db-browser/${t.name}" class="table-link ${isActive ? 'active' : ''}">${t.name}</a>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — DB Browser</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f1117;color:#e2e8f0;display:flex;height:100vh;overflow:hidden}

/* Sidebar */
.sidebar{width:220px;min-width:220px;background:#161b27;border-right:1px solid #1e2535;display:flex;flex-direction:column;overflow:hidden}
.sidebar-top{padding:16px;border-bottom:1px solid #1e2535}
.logo{font-size:15px;font-weight:700;color:#a78bfa;text-decoration:none;display:block}
.db-name{font-size:10px;color:#64748b;margin-top:3px;font-family:monospace}
.sql-link{display:flex;align-items:center;gap:6px;margin-top:10px;padding:7px 10px;background:#1a1040;border:1px solid #3b2d8f;border-radius:8px;color:#c4b5fd;font-size:12px;font-weight:600;text-decoration:none;transition:all .15s}
.sql-link:hover{background:#231450;color:#ddd6fe}
.sql-link.active{background:#2d1f6e;color:#f0ebff}
.tables-label{padding:10px 16px 4px;font-size:10px;font-weight:700;color:#475569;letter-spacing:.08em;text-transform:uppercase}
.tables-list{flex:1;overflow-y:auto;padding-bottom:8px}
.table-link{display:block;padding:7px 16px;font-size:12px;font-weight:500;color:#94a3b8;text-decoration:none;transition:all .15s;border-left:2px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.table-link:hover{background:#1e2535;color:#e2e8f0}
.table-link.active{color:#a78bfa;background:#1e1535;border-left-color:#a78bfa;font-weight:600}

/* Main */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.table-header{padding:18px 24px 14px;border-bottom:1px solid #1e2535;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.th-left{display:flex;align-items:baseline;gap:12px}
.table-header h2{font-size:18px;font-weight:700;color:#f1f5f9}
.table-meta{font-size:12px;color:#64748b}
.add-row-btn{padding:7px 16px;background:#1a1040;border:1px solid #3b2d8f;border-radius:8px;color:#c4b5fd;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}
.add-row-btn:hover{background:#231450}

/* Welcome */
.welcome{padding:48px 24px;text-align:center}
.welcome-icon{font-size:52px;margin-bottom:16px}
.welcome h2{font-size:22px;font-weight:700;color:#f1f5f9;margin-bottom:8px}
.welcome p{color:#64748b;font-size:13px;margin-bottom:28px}
.table-grid{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:680px;margin:0 auto 24px}
.table-card{padding:9px 16px;background:#1e2535;border:1px solid #2d3748;border-radius:8px;color:#94a3b8;font-size:12px;font-weight:500;text-decoration:none;transition:all .15s}
.table-card:hover{background:#252f40;color:#a78bfa;border-color:#4c3b99}
.sql-home-btn{display:inline-block;padding:10px 24px;background:#1a1040;border:1px solid #3b2d8f;border-radius:10px;color:#c4b5fd;font-size:13px;font-weight:700;text-decoration:none;transition:all .15s}
.sql-home-btn:hover{background:#231450;color:#ddd6fe}

/* Table data */
.table-scroll{flex:1;overflow:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
thead{position:sticky;top:0;z-index:1}
thead th{background:#161b27;color:#94a3b8;font-weight:600;padding:9px 12px;text-align:left;border-bottom:1px solid #1e2535;white-space:nowrap;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.act-col{width:72px;min-width:72px}
tbody tr{border-bottom:1px solid #1a2033;transition:background .1s}
tbody tr:hover{background:#1a2236}
tbody td{padding:8px 12px;color:#cbd5e1;vertical-align:middle;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.null{color:#475569;font-style:italic;font-size:11px}
.empty{text-align:center;color:#475569;padding:32px;font-size:13px}

/* Action buttons */
.act-btn{border:none;background:transparent;cursor:pointer;padding:3px 6px;border-radius:5px;font-size:13px;transition:background .15s;opacity:.7}
.act-btn:hover{opacity:1;background:#1e2535}
.edit-btn:hover{background:#1a1040}
.del-btn:hover{background:#3f0f0f}

/* Inline edit */
tr.editing td{background:#141028}
.edit-input{width:100%;background:#0f1117;border:1px solid #4c3b99;border-radius:5px;color:#e2e8f0;padding:4px 7px;font-size:12px;font-family:inherit;outline:none}
.edit-input:focus{border-color:#a78bfa;box-shadow:0 0 0 2px #3b2d8f55}

/* Pagination */
.pagination{padding:12px 24px;border-top:1px solid #1e2535;display:flex;align-items:center;gap:12px;flex-shrink:0}
.btn{padding:6px 14px;background:#1e2535;color:#94a3b8;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;border:1px solid #2d3748;cursor:pointer;transition:all .15s}
.btn:not(.disabled):hover{background:#252f40;color:#e2e8f0}
.btn.disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
.page-info{font-size:12px;color:#64748b;flex:1;text-align:center}

/* SQL Console */
.console-wrap{display:flex;flex-direction:column;flex:1;overflow:hidden;padding:0}
.console-header{padding:18px 24px 12px;border-bottom:1px solid #1e2535;flex-shrink:0}
.console-header h2{font-size:18px;font-weight:700;color:#f1f5f9}
.console-hint{font-size:11px;color:#64748b;margin-top:4px;display:block}
.editor-section{padding:16px 24px 0;flex-shrink:0}
.sql-editor{width:100%;height:160px;background:#0d1117;border:1px solid #2d3748;border-radius:10px;color:#93c5fd;font-family:'Fira Code','Cascadia Code','Consolas',monospace;font-size:13px;line-height:1.6;padding:14px;resize:vertical;outline:none;transition:border-color .15s}
.sql-editor:focus{border-color:#4c3b99;box-shadow:0 0 0 3px #3b2d8f33}
.editor-actions{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}
.run-btn{padding:8px 20px;background:#4c1d95;border:none;border-radius:8px;color:#f0ebff;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s}
.run-btn:hover{background:#5b21b6}
.fmt-btn,.clear-btn{padding:7px 14px;background:#1e2535;border:1px solid #2d3748;border-radius:8px;color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}
.fmt-btn:hover,.clear-btn:hover{background:#252f40;color:#e2e8f0}
.quick-btns{display:flex;gap:5px;flex-wrap:wrap;margin-left:4px}
.quick-btn{padding:5px 10px;background:#1a2236;border:1px solid #2d3748;border-radius:6px;color:#64748b;font-size:10px;font-weight:600;cursor:pointer;transition:all .15s;font-family:monospace}
.quick-btn:hover{background:#1e2a3a;color:#93c5fd;border-color:#3b5268}
.result-area{flex:1;overflow:auto;padding:12px 24px 16px}
.result-meta{font-size:12px;color:#6ee7b7;margin-bottom:8px;font-weight:600}
.sql-success{padding:14px 16px;background:#0a2a1a;border:1px solid #15583a;border-radius:8px;color:#6ee7b7;font-size:13px;font-weight:600}
.sql-error{padding:14px 16px;background:#2a0a0a;border:1px solid #7f1d1d;border-radius:8px;color:#fca5a5;font-size:13px;font-weight:600;font-family:monospace;white-space:pre-wrap}
.loading{color:#94a3b8;font-size:13px;padding:14px 0;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

/* Modal */
.modal{position:fixed;inset:0;background:#00000088;display:flex;align-items:center;justify-content:center;z-index:100}
.modal.hidden{display:none}
.modal-box{background:#161b27;border:1px solid #2d3748;border-radius:14px;padding:24px;width:480px;max-width:95vw;max-height:80vh;overflow-y:auto}
.modal-title{font-size:15px;font-weight:700;color:#f1f5f9;margin-bottom:16px}
.form-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.form-row label{width:130px;flex-shrink:0;font-size:12px;color:#94a3b8;font-weight:600;font-family:monospace}
.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid #1e2535;padding-top:14px}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;z-index:200;transition:opacity .3s;pointer-events:none}
.toast.hidden{opacity:0;pointer-events:none}
.toast-ok{background:#0a2a1a;border:1px solid #15583a;color:#6ee7b7;opacity:1}
.toast-err{background:#2a0a0a;border:1px solid #7f1d1d;color:#fca5a5;opacity:1}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#2d3748;border-radius:4px}
</style>
</head>
<body>
<div class="sidebar">
    <div class="sidebar-top">
        <a href="/db-browser" class="logo">🗄 DB Browser</a>
        <div class="db-name">ecommerce.db</div>
        <a href="/db-browser/sql" class="sql-link ${activeTable === 'sql' ? 'active' : ''}">⚡ SQL Console</a>
    </div>
    <div class="tables-label">Tables</div>
    <div class="tables-list">${sideLinks}</div>
</div>
<div class="main">${content}</div>
</body>
</html>`;
}
