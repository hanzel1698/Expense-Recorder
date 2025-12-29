import { useState, useMemo, useEffect } from 'react';
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
  const [globalCategory, setGlobalCategory] = useState('');
  const [globalSubCategory, setGlobalSubCategory] = useState('');
  const [globalLabels, setGlobalLabels] = useState<string[]>([]);
  const [globalGst, setGlobalGst] = useState<number | ''>('');
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState('');
  const [itemLabels, setItemLabels] = useState<string[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [itemGst, setItemGst] = useState<number | ''>('');
  const [roundingMode, setRoundingMode] = useState<'none' | 'up' | 'down'>('none');

  // Persist rounding mode to localStorage and restore on load
  useEffect(() => {
    const saved = localStorage.getItem('roundingMode');
    if (saved === 'none' || saved === 'up' || saved === 'down') {
      setRoundingMode(saved as 'none' | 'up' | 'down');
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('roundingMode', roundingMode); } catch {}
  }, [roundingMode]);
  const [showLabelsPopup, setShowLabelsPopup] = useState(false);
  const [labelsPopupMode, setLabelsPopupMode] = useState<'item' | 'global'>('item');
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
    // Use global defaults if item-level values are not set
    const finalCategory = itemCategory || globalCategory;
    const finalSubCategory = itemSubCategory || globalSubCategory;
    const finalLabels = itemLabels.length > 0 ? itemLabels : globalLabels;
    const finalGst = itemGst !== '' ? itemGst : globalGst;
    
    if (!itemName || !itemPrice || !finalCategory) return;
    const baseItem = {
      name: itemName,
      price: parseFloat(itemPrice),
      category: finalCategory,
      subCategory: finalSubCategory,
      labels: finalLabels,
    } as Item;
    
    // Add GST if set
    if (finalGst !== '' && finalGst !== undefined) {
      baseItem.gst = typeof finalGst === 'number' ? finalGst : parseFloat(String(finalGst));
    }
    
    const newItem: Item = itemNotes.trim()
      ? { ...baseItem, notes: itemNotes }
      : baseItem;
    setItems(prev => [...prev, newItem]);
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemSubCategory('');
    setItemLabels([]);
    setItemNotes('');
    setItemGst('');
  };

  const saveReceipt = () => {
    if (!shop || items.length === 0) return;
    const receipt: Receipt = {
      id: Date.now().toString(),
      date: date,
      shop,
      items,
      ...(paymentMode ? { paymentMode } : {}),
      ...(globalGst !== '' ? { gst: typeof globalGst === 'number' ? globalGst : parseFloat(String(globalGst)) } : {})
    };
    addReceipt(receipt);
    setShop('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('');
    setGlobalCategory('');
    setGlobalSubCategory('');
    setGlobalLabels([]);
    setGlobalGst('');
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

  // Live GST-inclusive total for current in-progress receipt
  const computedTotal = useMemo(() => {
    try {
      return items.reduce((sum, item) => {
        const rate = typeof item.gst === 'number' ? item.gst : (typeof globalGst === 'number' ? globalGst : 0);
        return sum + item.price * (1 + rate / 100);
      }, 0);
    } catch {
      return 0;
    }
  }, [items, globalGst]);

  const displayedTotal = useMemo(() => {
    if (roundingMode === 'up') return Math.ceil(computedTotal);
    if (roundingMode === 'down') return Math.floor(computedTotal);
    return computedTotal;
  }, [computedTotal, roundingMode]);

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
          <div className="form-row">
            <div className="form-group">
              <label>Global Category</label>
              <select 
                value={globalCategory} 
                onChange={e => { setGlobalCategory(e.target.value); setGlobalSubCategory(''); }}
              >
                <option value="">No Default Category</option>
                {Object.keys(categoryData.categories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button type="button" onClick={() => { const name = prompt('Enter new category'); const trimmed = (name || '').trim(); if (!trimmed) return; addCategory(trimmed); setGlobalCategory(trimmed); setGlobalSubCategory(''); }} className="add-inline-btn">➕ Add New</button>
            </div>
            <div className="form-group">
              <label>Global Sub-Category</label>
              <select 
                value={globalSubCategory} 
                onChange={e => setGlobalSubCategory(e.target.value)}
                disabled={!globalCategory}
              >
                <option value="">No Default Sub-Category</option>
                {(categoryData.categories[globalCategory] || []).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <button type="button" onClick={() => { if (!globalCategory) { alert('Please select a category first'); return; } const name = prompt(`Enter new sub-category for "${globalCategory}"`); const trimmed = (name || '').trim(); if (!trimmed) return; addSubCategory(globalCategory, trimmed); setGlobalSubCategory(trimmed); }} className="add-inline-btn" disabled={!globalCategory}>➕ Add New</button>
            </div>
            <div className="form-group">
              <label>Global Labels</label>
              <button 
                type="button"
                onClick={() => { setLabelsPopupMode('global'); setShowLabelsPopup(true); }} 
                className="labels-btn"
              >
                🏷️ Select Labels {globalLabels.length > 0 && `(${globalLabels.length})`}
              </button>
              <button type="button" onClick={() => { const name = prompt('Enter new label'); const trimmed = (name || '').trim(); if (!trimmed) return; addLabel(trimmed); setGlobalLabels(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed])); }} className="add-inline-btn">➕ Add Label</button>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Global GST %</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {[0, 5, 12, 18, 28, 40].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGlobalGst(rate)}
                    className={globalGst === rate ? 'gst-btn active' : 'gst-btn'}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <input 
                type="number" 
                placeholder="Custom GST %" 
                value={globalGst} 
                onChange={e => setGlobalGst(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                step="0.01"
                min="0"
                max="100"
              />
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
              <div className="form-group">
                <label>GST %</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {[0, 5, 12, 18, 28, 40].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setItemGst(rate)}
                      className={itemGst === rate ? 'gst-btn active' : 'gst-btn'}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                <input 
                  type="number" 
                  placeholder="Custom or leave blank" 
                  value={itemGst} 
                  onChange={e => setItemGst(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                  step="0.01"
                  min="0"
                  max="100"
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
                  onClick={() => { setLabelsPopupMode('item'); setShowLabelsPopup(true); }} 
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
                    <div className="item-price">
                      ₹{i.price.toFixed(2)}
                      {i.gst !== undefined && i.gst !== null && (
                        <span style={{ fontSize: '0.85em', opacity: 0.7, marginLeft: '0.5rem' }}>
                          (GST: {i.gst}%)
                        </span>
                      )}
                    </div>
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

        <div className="items-total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
          <div style={{ fontWeight: 700 }}>
            Total: ₹{displayedTotal.toFixed(2)}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="add-inline-btn" onClick={() => setRoundingMode('none')} title="Show exact total">
              Exact
            </button>
            <button type="button" className="add-inline-btn" onClick={() => setRoundingMode('up')} title="Round up to next rupee">
              Round Up
            </button>
            <button type="button" className="add-inline-btn" onClick={() => setRoundingMode('down')} title="Round down to previous rupee">
              Round Down
            </button>
          </div>
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
                
                // Calculate total for search (GST-inclusive)
                const totalAmount = r.items.reduce((sum, item) => {
                  const rate = typeof item.gst === 'number' ? item.gst : (typeof r.gst === 'number' ? r.gst : 0);
                  return sum + item.price * (1 + rate / 100);
                }, 0);
                
                // Search in shop name
                if (r.shop.toLowerCase().includes(query)) return true;
                
                // Search in date (both original format and display format)
                if (r.date && r.date.includes(query)) return true;
                if (r.date && r.date.split('-').reverse().join('-').includes(query)) return true;
                
                // Search in total amount
                if (totalAmount.toString().includes(query)) return true;
                if (totalAmount.toFixed(2).includes(query)) return true;
                
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
              .map(r => {
                const rawTotal = r.items.reduce((sum, item) => {
                  const rate = typeof item.gst === 'number' ? item.gst : (typeof r.gst === 'number' ? r.gst : 0);
                  return sum + item.price * (1 + rate / 100);
                }, 0);
                const roundedTotal = roundingMode === 'up' ? Math.ceil(rawTotal) : roundingMode === 'down' ? Math.floor(rawTotal) : rawTotal;
                return (
              <div key={r.id} className="receipt-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>🛒 {r.shop} - {r.date ? r.date.split('-').reverse().join('-') : ''} - ₹{roundedTotal.toFixed(2)}</h3>
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
                );
              })}

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
            <h3>🏷️ Select {labelsPopupMode === 'global' ? 'Global ' : ''}Labels</h3>
            <div className="labels-grid">
              {categoryData.labels.map(label => (
                <div key={label} className="label-checkbox">
                  <input
                    type="checkbox"
                    id={`label-${label}`}
                    checked={labelsPopupMode === 'global' ? globalLabels.includes(label) : itemLabels.includes(label)}
                    onChange={e => {
                      if (labelsPopupMode === 'global') {
                        if (e.target.checked) {
                          setGlobalLabels(prev => [...prev, label]);
                        } else {
                          setGlobalLabels(prev => prev.filter(l => l !== label));
                        }
                      } else {
                        handleLabelChange(label, e.target.checked);
                      }
                    }}
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