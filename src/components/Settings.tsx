import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import './Settings.css';

const Settings = () => {
  const { receipts, categoryData, addCategory, addSubCategory, addLabel, resetAll, updateCategory, updateSubCategory, updateLabel, removeCategory, removeSubCategory, removeLabel } = useExpense();
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [categoryEditError, setCategoryEditError] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [reassignCategoryTo, setReassignCategoryTo] = useState('');
  const categoryUsage = (cat: string) => receipts.reduce((count, r) => count + r.items.filter(i => i.category === cat).length, 0);

  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editingSubValue, setEditingSubValue] = useState('');
  const [subEditError, setSubEditError] = useState('');
  const [deletingSub, setDeletingSub] = useState<string | null>(null);
  const [reassignSubTo, setReassignSubTo] = useState('');
  const subUsage = (cat: string, sub: string) => receipts.reduce((count, r) => count + r.items.filter(i => i.category === cat && i.subCategory === sub).length, 0);

  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  const [labelEditError, setLabelEditError] = useState('');
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);
  const labelUsage = (label: string) => receipts.reduce((count, r) => count + r.items.filter(i => i.labels.includes(label)).length, 0);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleAddSubCategory = () => {
    if (selectedCategoryForSub && newSubCategory.trim()) {
      addSubCategory(selectedCategoryForSub, newSubCategory.trim());
      setNewSubCategory('');
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      addLabel(newLabel.trim());
      setNewLabel('');
    }
  };

  // Data backup: export and import
  const [importNotice, setImportNotice] = useState('');
  const exportData = () => {
    try {
      const payload = {
        receipts,
        categoryData,
        exportedAt: new Date().toISOString(),
        version: 1,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expense-recorder-backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const { importData, autoBackup, setAutoBackup, restoreFromLocalBackup } = useExpense();
  const importFromFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file');
      if (!Array.isArray(parsed.receipts) || !parsed.categoryData) throw new Error('Missing required keys');
      importData({ receipts: parsed.receipts, categoryData: parsed.categoryData });
      setImportNotice('Data imported successfully.');
      setTimeout(() => setImportNotice(''), 3000);
    } catch (err) {
      setImportNotice('Import failed. Please select a valid backup JSON.');
      setTimeout(() => setImportNotice(''), 4000);
    }
  };

  return (
    <div className="settings-container">
      <h1>⚙️ Settings</h1>

      <h2>Categories</h2>
      <ul className="category-list">
        {Object.entries(categoryData.categories).map(([cat, subs]) => (
          <li key={cat} className="category-item">
            {editingCategory === cat ? (
              <div className="edit-controls">
                <input value={editingCategoryValue} onChange={e => setEditingCategoryValue(e.target.value)} />
                {categoryEditError && (<span className="error-text">{categoryEditError}</span>)}
                <button onClick={() => {
                  const trimmed = editingCategoryValue.trim();
                  setCategoryEditError('');
                  if (!trimmed) { setCategoryEditError('Name cannot be empty'); return; }
                  if (trimmed === cat) { setCategoryEditError('No changes to save'); return; }
                  if (categoryData.categories[trimmed]) { setCategoryEditError('Category already exists'); return; }
                  if (confirm(`Rename category "${cat}" to "${trimmed}"?`)) {
                    updateCategory(cat, trimmed);
                    setEditingCategory(null);
                  }
                }}>Save</button>
                <button onClick={() => { setEditingCategory(null); setCategoryEditError(''); }}>Cancel</button>
              </div>
            ) : (
              <div className="item-header">
                <div className="item-title">
                  <strong>{cat}</strong>
                  <button onClick={() => { setEditingCategory(cat); setEditingCategoryValue(cat); }} title="Edit">✏️</button>
                </div>
                <div className="item-actions">
                  {cat !== 'Uncategorized' ? (
                    <button onClick={() => {
                      setDeletingCategory(cat);
                      const usage = categoryUsage(cat);
                      if (usage > 0 && Object.keys(categoryData.categories).includes('Uncategorized')) {
                        setReassignCategoryTo('Uncategorized');
                      } else {
                        setReassignCategoryTo('');
                      }
                    }} title="Delete">🗑️</button>
                  ) : (
                    <span className="default-note">(Default; cannot delete)</span>
                  )}
                </div>
              </div>
            )}
            <div className="category-details">Subs: {subs.join(', ') || '(none)'}</div>
            <div className="usage-info">Usage: {categoryUsage(cat)} items</div>
            {deletingCategory === cat ? (
              <div className="delete-dialog">
                <label>Reassign items to:&nbsp;
                  <select value={reassignCategoryTo} onChange={e => setReassignCategoryTo(e.target.value)}>
                    <option value="">-- Select --</option>
                    {Object.keys(categoryData.categories).filter(c => c !== cat).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <button style={{ marginLeft: 8 }} onClick={() => {
                  const usage = categoryUsage(cat);
                  if (usage > 0 && !reassignCategoryTo) { alert('Category is in use. Please select a reassignment category.'); return; }
                  if (confirm(`Delete category "${cat}"${usage ? ` and reassign ${usage} items to "${reassignCategoryTo}"` : ''}?`)) {
                    removeCategory(cat, reassignCategoryTo || undefined);
                    setDeletingCategory(null);
                    setReassignCategoryTo('');
                  }
                }}>Confirm Delete</button>
                <button style={{ marginLeft: 8 }} onClick={() => { setDeletingCategory(null); setReassignCategoryTo(''); }}>Cancel</button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <input type="text" placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
      <button onClick={handleAddCategory}>Add Category</button>

      <h2>Sub Categories</h2>
      <select value={selectedCategoryForSub} onChange={e => { setSelectedCategoryForSub(e.target.value); setEditingSub(null); }}>
        <option value="">Select Category</option>
        {Object.keys(categoryData.categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <input type="text" placeholder="New Sub Category" value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} disabled={!selectedCategoryForSub} />
      <button onClick={handleAddSubCategory} disabled={!selectedCategoryForSub}>Add Sub Category</button>
      {selectedCategoryForSub && (
        <ul className="category-list">
          {(categoryData.categories[selectedCategoryForSub] || []).map((sub) => (
            <li
              key={sub}
              className="category-item"
            >
              {editingSub === sub ? (
                <div className="edit-controls">
                  <input value={editingSubValue} onChange={e => setEditingSubValue(e.target.value)} />
                  {subEditError && (<span className="error-text">{subEditError}</span>)}
                  <button onClick={() => {
                    const trimmed = editingSubValue.trim();
                    setSubEditError('');
                    if (!trimmed) { setSubEditError('Name cannot be empty'); return; }
                    if (trimmed === sub) { setSubEditError('No changes to save'); return; }
                    const subs = categoryData.categories[selectedCategoryForSub] || [];
                    if (subs.includes(trimmed)) { setSubEditError('Sub-category already exists'); return; }
                    if (confirm(`Rename sub-category "${sub}" to "${trimmed}"?`)) {
                      updateSubCategory(selectedCategoryForSub, sub, trimmed);
                      setEditingSub(null);
                    }
                  }}>Save</button>
                  <button onClick={() => { setEditingSub(null); setSubEditError(''); }}>Cancel</button>
                </div>
              ) : (
                <div className="item-header">
                  <div className="item-title">
                    <span>{sub}</span>
                    <button onClick={() => { setEditingSub(sub); setEditingSubValue(sub); }} title="Edit">✏️</button>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => setDeletingSub(sub)} title="Delete">🗑️</button>
                  </div>
                </div>
              )}
              <div className="usage-info">Usage: {subUsage(selectedCategoryForSub, sub)} items</div>
              {deletingSub === sub ? (
                <div className="delete-dialog">
                  <label>Reassign items to:&nbsp;
                    <select value={reassignSubTo} onChange={e => setReassignSubTo(e.target.value)}>
                      <option value="">-- Select --</option>
                      {(categoryData.categories[selectedCategoryForSub] || []).filter(s => s !== sub).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <button style={{ marginLeft: 8 }} onClick={() => {
                    const usage = subUsage(selectedCategoryForSub, sub);
                    if (usage > 0 && !reassignSubTo) { alert('Sub-category is in use. Please select a reassignment sub-category.'); return; }
                    if (confirm(`Delete sub-category "${sub}"${usage ? ` and reassign ${usage} items to "${reassignSubTo}"` : ''}?`)) {
                      removeSubCategory(selectedCategoryForSub, sub, reassignSubTo || undefined);
                      setDeletingSub(null);
                      setReassignSubTo('');
                    }
                  }}>Confirm Delete</button>
                  <button style={{ marginLeft: 8 }} onClick={() => { setDeletingSub(null); setReassignSubTo(''); }}>Cancel</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h2>Labels</h2>
      <ul className="category-list">
        {categoryData.labels.map((label) => (
          <li
            key={label}
            className="category-item"
          >
            {editingLabel === label ? (
              <div className="edit-controls">
                <input value={editingLabelValue} onChange={e => setEditingLabelValue(e.target.value)} />
                {labelEditError && (<span className="error-text">{labelEditError}</span>)}
                <button onClick={() => {
                  const trimmed = editingLabelValue.trim();
                  setLabelEditError('');
                  if (!trimmed) { setLabelEditError('Label cannot be empty'); return; }
                  if (trimmed === label) { setLabelEditError('No changes to save'); return; }
                  if (categoryData.labels.includes(trimmed)) { setLabelEditError('Label already exists'); return; }
                  if (confirm(`Rename label "${label}" to "${trimmed}"?`)) {
                    updateLabel(label, trimmed);
                    setEditingLabel(null);
                  }
                }}>Save</button>
                <button onClick={() => { setEditingLabel(null); setLabelEditError(''); }}>Cancel</button>
              </div>
            ) : (
              <div className="item-header">
                <div className="item-title">
                  <span>{label}</span>
                  <button onClick={() => { setEditingLabel(label); setEditingLabelValue(label); }} title="Edit">✏️</button>
                </div>
                <div className="item-actions">
                  <button onClick={() => setDeletingLabel(label)} title="Delete">🗑️</button>
                </div>
              </div>
            )}
            <div className="usage-info">Usage: {labelUsage(label)} items</div>
            {deletingLabel === label ? (
              <div className="delete-dialog">
                <button onClick={() => {
                  if (confirm(`Delete label "${label}" and remove it from all items?`)) {
                    removeLabel(label);
                    setDeletingLabel(null);
                  }
                }}>Confirm Delete</button>
                <button style={{ marginLeft: 8 }} onClick={() => setDeletingLabel(null)}>Cancel</button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <input type="text" placeholder="New Label" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
      <button onClick={handleAddLabel}>Add Label</button>

      <hr style={{ margin: '20px 0' }} />
      <h2>Data Backup</h2>
      {importNotice && (
        <div style={{ background: '#dff0d8', color: '#2e7d32', padding: '10px 12px', borderRadius: 6, marginBottom: 10 }}>
          {importNotice}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={exportData}>Export Data (JSON)</button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span>Import Data:</span>
          <input type="file" accept="application/json" onChange={e => importFromFile(e.target.files?.[0])} />
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} />
          <span>Auto backup to localStorage</span>
        </label>
        <button onClick={restoreFromLocalBackup}>Restore from Local Backup</button>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Last backup: {(() => { try { const raw = localStorage.getItem('expenseRecorder.backup'); if (!raw) return '—'; const j = JSON.parse(raw); return j?.updatedAt || '—'; } catch { return '—'; } })()}</span>
      </div>

      <hr style={{ margin: '20px 0' }} />
      <h2>Danger Zone</h2>
      <p>This will remove all saved receipts and reset categories, sub-categories, and labels to defaults.</p>
      {resetNotice && (
        <div style={{ background: '#dff0d8', color: '#2e7d32', padding: '10px 12px', borderRadius: 6, marginBottom: 10 }}>
          {resetNotice}
        </div>
      )}
      <button
        style={{ backgroundColor: '#b00020', color: 'white' }}
        onClick={() => {
          if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            resetAll();
            setResetNotice('All data has been reset to defaults.');
            setTimeout(() => setResetNotice(''), 3000);
          }
        }}
      >
        Reset All
      </button>
    </div>
  );
};

export default Settings;