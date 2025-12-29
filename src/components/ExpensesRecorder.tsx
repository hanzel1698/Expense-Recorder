import { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import type { Item, Receipt } from '../types';
import EditReceipt from './EditReceipt';
import './ExpensesRecorder.css';

const ExpensesRecorder = () => {
  const { addReceipt, categoryData, receipts, deleteReceipt, addPaymentMode, addCategory, addSubCategory, addLabel } = useExpense();
  const [shop, setShop] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const knownShops = useMemo(() => {
    try {
      const set = new Set<string>();
      for (const r of receipts) {
        if (r.shop) set.add(r.shop);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    } catch {
      return [] as string[];
    }
  }, [receipts]);
  const filteredShopSuggestions = useMemo(() => {
    const q = shop.trim().toLowerCase();
    if (!q) return [] as string[];
    return knownShops.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
  }, [knownShops, shop]);
  const [paymentMode, setPaymentMode] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState('');
  const [itemLabels, setItemLabels] = useState<string[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [showLabelsPopup, setShowLabelsPopup] = useState(false);
  const [showReceiptsPopup, setShowReceiptsPopup] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [showReceiptCategoryFilters, setShowReceiptCategoryFilters] = useState(false);
  const [showReceiptSubFilters, setShowReceiptSubFilters] = useState(false);
  const [showReceiptLabelFilters, setShowReceiptLabelFilters] = useState(false);
  const [showReceiptPaymentModeFilters, setShowReceiptPaymentModeFilters] = useState(false);

  const handleAddNewPaymentMode = () => {
    const name = prompt('Enter new payment mode');
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    addPaymentMode(trimmed);
    setPaymentMode(trimmed);
  };

  const handleAddNewCategory = () => {
    const name = prompt('Enter new category');
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setItemCategory(trimmed);
    setItemSubCategory('');
  };

  const handleAddNewSubCategory = () => {
    if (!itemCategory) {
      alert('Please select a category first');
      return;
    }
    const name = prompt(`Enter new sub-category for "${itemCategory}"`);
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    addSubCategory(itemCategory, trimmed);
    setItemSubCategory(trimmed);
  };

  const handleAddNewLabel = () => {
    const name = prompt('Enter new label');
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    addLabel(trimmed);
    setItemLabels(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  };

  const addItem = () => {
    if (!itemName || !itemPrice || !itemCategory) return;
    const newItem: Item = {
      name: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      subCategory: itemSubCategory,
      labels: itemLabels,
      notes: itemNotes || undefined
    };
    setItems(prev => [...prev, newItem]);
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemSubCategory('');
    setItemLabels([]);
    setItemNotes('');
  };

  const saveReceipt = () => {
    if (!shop || items.length === 0) return;
    const receipt: Receipt = {
      id: Date.now().toString(),
      date: date,
      shop,
      items,
      paymentMode: paymentMode || undefined
    };
    addReceipt(receipt);
    setShop('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('');
    setItems([]);
  };

  const handleLabelChange = (label: string, checked: boolean) => {
    if (checked) {
      setItemLabels(prev => [...prev, label]);
    } else {
      setItemLabels(prev => prev.filter(l => l !== label));
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    const d = r.date || '';
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  const subCategoryOptions = Array.from(
    new Set(
      Object.values(categoryData.categories)
        .flat()
        .filter((s) => s)
    )
  ).sort();

  return (
    <div className="expense-recorder">
      <div className="recorder-card">
        <div className="recorder-header">
          <h1>📝 Record Expenses</h1>
          <button onClick={() => setShowReceiptsPopup(true)} className="view-receipts-btn">
            📄 View Receipts
          </button>
        </div>

        <div className="receipt-info-section">
          <h2>Receipt Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Shop Name</label>
              <input 
                type="text" 
                placeholder="Where did you shop?" 
                value={shop} 
                onChange={e => setShop(e.target.value)} 
              />
              {shop && filteredShopSuggestions.length > 0 && (
                <ul className="suggestions-list" role="listbox" aria-label="Shop suggestions">
                  {filteredShopSuggestions.map((s) => (
                    <li
                      key={s}
                      className="suggestion-item"
                      role="option"
                      onMouseDown={() => setShop(s)}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="date-input">Date</label>
              <input
                id="date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Payment Mode</label>
              <select 
                value={paymentMode} 
                onChange={e => setPaymentMode(e.target.value)}
              >
                <option value="">Select Payment Mode</option>
                {categoryData.paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
              <button type="button" onClick={handleAddNewPaymentMode} className="add-inline-btn">➕ Add New</button>
            </div>
          </div>
        </div>

        <div className="add-items-section">
          <h2>Add Items</h2>
          <div className="item-form">
            <div className="item-form-row">
              <div className="form-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  placeholder="What did you buy?" 
                  value={itemName} 
                  onChange={e => setItemName(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={itemPrice} 
                  onChange={e => setItemPrice(e.target.value)} 
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="item-form-row-full">
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={itemCategory} 
                  onChange={e => { setItemCategory(e.target.value); setItemSubCategory(''); }}
                >
                  <option value="">Select Category</option>
                  {Object.keys(categoryData.categories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button type="button" onClick={handleAddNewCategory} className="add-inline-btn">➕ Add New</button>
              </div>
              <div className="form-group">
                <label>Sub Category</label>
                <select 
                  value={itemSubCategory} 
                  onChange={e => setItemSubCategory(e.target.value)} 
                  disabled={!itemCategory}
                >
                  <option value="">Select Sub Category</option>
                  {(categoryData.categories[itemCategory] || []).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                <button type="button" onClick={handleAddNewSubCategory} className="add-inline-btn" disabled={!itemCategory}>➕ Add New</button>
              </div>
              <div className="form-group">
                <label>Labels</label>
                <button 
                  type="button"
                  onClick={() => setShowLabelsPopup(true)} 
                  className="labels-btn"
                >
                  🏷️ Select Labels {itemLabels.length > 0 && `(${itemLabels.length})`}
                </button>
                <button type="button" onClick={handleAddNewLabel} className="add-inline-btn">➕ Add Label</button>
              </div>
            </div>
            <div className="item-form-row-full">
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea 
                  placeholder="Add any additional notes about this item..." 
                  value={itemNotes} 
                  onChange={e => setItemNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <button onClick={addItem} className="add-item-btn">
              ➕ Add Item to Receipt
            </button>
          </div>
        </div>

        <div className="items-preview">
          <h2>📋 Items ({items.length})</h2>
          {items.length > 0 ? (
            <ul className="items-list">
              {items.map((i, idx) => (
                <li key={idx} className="item-card">
                  <div className="item-details">
                    <div className="item-name">{i.name}</div>
                    <div className="item-price">₹{i.price.toFixed(2)}</div>
                    <div className="item-meta">
                      {i.category} / {i.subCategory}
                    </div>
                    {i.notes && (
                      <div className="item-notes">
                        📝 {i.notes}
                      </div>
                    )}
                    {i.labels.length > 0 && (
                      <div className="item-labels">
                        {i.labels.map(label => (
                          <span key={label} className="label-tag">{label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No items added yet. Add items above to start building your receipt.
            </div>
          )}
        </div>

        <button 
          onClick={saveReceipt} 
          className="save-receipt-btn"
          disabled={!shop || items.length === 0}
        >
          💾 Save Receipt
        </button>
      </div>

      {showReceiptsPopup && (
        <>
          <div className="modal-overlay" onClick={() => setShowReceiptsPopup(false)} />
          <div className="modal">
            <h2>📄 Saved Receipts</h2>
            
            <div className="search-container">
              <input 
                type="text" 
                placeholder="🔍 Search receipts, items, categories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters-container">
              <div className="date-filter">
                <label>Start Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="date-filter">
                <label>End Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="filter-buttons">
                <button onClick={() => setShowReceiptCategoryFilters((v) => !v)} className="filter-btn">
                  📂 Categories
                </button>
                <button onClick={() => setShowReceiptSubFilters((v) => !v)} className="filter-btn">
                  📁 Sub-categories
                </button>
                <button onClick={() => setShowReceiptLabelFilters((v) => !v)} className="filter-btn">
                  🏷️ Labels
                </button>
                <button onClick={() => setShowReceiptPaymentModeFilters((v) => !v)} className="filter-btn">
                  💳 Payment Modes
                </button>
                <button 
                  onClick={() => { 
                    setSearchQuery('');
                    setStartDate(''); 
                    setEndDate(''); 
                    setSelectedCategories([]); 
                    setSelectedSubCategories([]); 
                    setSelectedLabels([]); 
                    setSelectedPaymentModes([]);
                  }}
                  className="clear-btn"
                >
                  🔄 Clear
                </button>
              </div>
            </div>

            {showReceiptCategoryFilters && (
              <div className="filter-options">
                {Object.keys(categoryData.categories).map((cat) => (
                  <div key={cat} className="filter-option">
                    <input
                      type="checkbox"
                      id={`receipt-cat-${cat}`}
                      checked={selectedCategories.includes(cat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories((prev) => [...prev, cat]);
                        } else {
                          setSelectedCategories((prev) => prev.filter((c) => c !== cat));
                        }
                      }}
                    />
                    <label htmlFor={`receipt-cat-${cat}`}>{cat}</label>
                  </div>
                ))}
              </div>
            )}

            {showReceiptSubFilters && (
              <div className="filter-options">
                {subCategoryOptions.map((sub) => (
                  <div key={sub} className="filter-option">
                    <input
                      type="checkbox"
                      id={`receipt-sub-${sub}`}
                      checked={selectedSubCategories.includes(sub)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubCategories((prev) => [...prev, sub]);
                        } else {
                          setSelectedSubCategories((prev) => prev.filter((s) => s !== sub));
                        }
                      }}
                    />
                    <label htmlFor={`receipt-sub-${sub}`}>{sub}</label>
                  </div>
                ))}
              </div>
            )}

            {showReceiptLabelFilters && (
              <div className="filter-options">
                {categoryData.labels.map((label) => (
                  <div key={label} className="filter-option">
                    <input
                      type="checkbox"
                      id={`receipt-label-${label}`}
                      checked={selectedLabels.includes(label)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLabels((prev) => [...prev, label]);
                        } else {
                          setSelectedLabels((prev) => prev.filter((l) => l !== label));
                        }
                      }}
                    />
                    <label htmlFor={`receipt-label-${label}`}>{label}</label>
                  </div>
                ))}
              </div>
            )}

            {showReceiptPaymentModeFilters && (
              <div className="filter-options">
                {categoryData.paymentModes.map((mode) => (
                  <div key={mode} className="filter-option">
                    <input
                      type="checkbox"
                      id={`receipt-mode-${mode}`}
                      checked={selectedPaymentModes.includes(mode)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPaymentModes((prev) => [...prev, mode]);
                        } else {
                          setSelectedPaymentModes((prev) => prev.filter((m) => m !== mode));
                        }
                      }}
                    />
                    <label htmlFor={`receipt-mode-${mode}`}>{mode}</label>
                  </div>
                ))}
              </div>
            )}

            {filteredReceipts
              .filter(r => {
                // Filter by payment mode
                if (selectedPaymentModes.length && (!r.paymentMode || !selectedPaymentModes.includes(r.paymentMode))) return false;
                
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                
                // Search in shop name
                if (r.shop.toLowerCase().includes(query)) return true;
                
                // Search in date
                if (r.date && r.date.includes(query)) return true;
                
                // Search in payment mode
                if (r.paymentMode && r.paymentMode.toLowerCase().includes(query)) return true;
                
                // Search in items
                return r.items.some(item => 
                  item.name.toLowerCase().includes(query) ||
                  item.category.toLowerCase().includes(query) ||
                  item.subCategory.toLowerCase().includes(query) ||
                  item.price.toString().includes(query) ||
                  item.labels.some(label => label.toLowerCase().includes(query))
                );
              })
              .map(r => (
              <div key={r.id} className="receipt-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>🛒 {r.shop} - {r.date ? r.date.split('-').reverse().join('-') : ''}</h3>
                    {r.paymentMode && (
                      <div style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '0.25rem' }}>
                        💳 {r.paymentMode}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setEditingReceipt(r)}
                      className="edit-receipt-btn"
                      title="Edit Receipt"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Delete receipt from ${r.shop}?`)) {
                          deleteReceipt(r.id);
                        }
                      }}
                      className="delete-receipt-btn"
                      title="Delete Receipt"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <ul className="receipt-items">
                  {r.items
                    .filter((i) => {
                      if (selectedCategories.length && !selectedCategories.includes(i.category)) return false;
                      if (selectedSubCategories.length && !selectedSubCategories.includes(i.subCategory)) return false;
                      if (selectedLabels.length && !i.labels.some(l => selectedLabels.includes(l))) return false;
                      return true;
                    })
                    .map((i, idx) => (
                      <li key={idx}>
                        <strong>{i.name}</strong>: ₹{i.price.toFixed(2)} 
                        <span style={{ opacity: 0.8 }}> ({i.category}, {i.subCategory})</span>
                        {i.labels.length > 0 && (
                          <span style={{ opacity: 0.8 }}> • 🏷️ {i.labels.join(', ')}</span>
                        )}
                        {i.notes && (
                          <div style={{ fontSize: '0.9em', opacity: 0.7, marginTop: '0.25rem' }}>
                            📝 {i.notes}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}

            <button onClick={() => setShowReceiptsPopup(false)} className="modal-close-btn">
              Close
            </button>
          </div>
        </>
      )}

      {editingReceipt && (
        <EditReceipt 
          receipt={editingReceipt} 
          onClose={() => setEditingReceipt(null)} 
        />
      )}

      {showLabelsPopup && (
        <>
          <div className="labels-modal-overlay" onClick={() => setShowLabelsPopup(false)} />
          <div className="labels-modal">
            <h3>🏷️ Select Labels</h3>
            <div className="labels-grid">
              {categoryData.labels.map(label => (
                <div key={label} className="label-checkbox">
                  <input
                    type="checkbox"
                    id={`label-${label}`}
                    checked={itemLabels.includes(label)}
                    onChange={e => handleLabelChange(label, e.target.checked)}
                  />
                  <label htmlFor={`label-${label}`}>{label}</label>
                </div>
              ))}
            </div>
            <button onClick={() => setShowLabelsPopup(false)} className="labels-done-btn">
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpensesRecorder;