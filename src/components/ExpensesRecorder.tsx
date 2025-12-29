import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import type { Item, Receipt } from '../types';
import './ExpensesRecorder.css';

const ExpensesRecorder = () => {
  const { addReceipt, categoryData } = useExpense();
  const [shop, setShop] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState('');
  const [itemLabels, setItemLabels] = useState<string[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [showLabelsPopup, setShowLabelsPopup] = useState(false);

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
      items
    };
    addReceipt(receipt);
    setShop('');
    setDate(new Date().toISOString().split('T')[0]);
    setItems([]);
  };

  const handleLabelChange = (label: string, checked: boolean) => {
    if (checked) {
      setItemLabels(prev => [...prev, label]);
    } else {
      setItemLabels(prev => prev.filter(l => l !== label));
    }
  };

  return (
    <div className="expense-recorder">
      <div className="recorder-card">
        <div className="recorder-header">
          <h1>📝 Record Expenses</h1>
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