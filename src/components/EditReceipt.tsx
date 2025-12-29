import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import type { Item, Receipt } from '../types';
import './ExpensesRecorder.css';

interface EditReceiptProps {
  receipt: Receipt;
  onClose: () => void;
}

const EditReceipt = ({ receipt, onClose }: EditReceiptProps) => {
  const { updateReceipt, categoryData } = useExpense();
  const [shop, setShop] = useState(receipt.shop);
  const [date, setDate] = useState(receipt.date);
  const [items, setItems] = useState<Item[]>(receipt.items);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState('');
  const [itemLabels, setItemLabels] = useState<string[]>([]);
  const [showLabelsPopup, setShowLabelsPopup] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const addItem = () => {
    if (!itemName || !itemPrice || !itemCategory) return;
    const newItem: Item = {
      name: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      subCategory: itemSubCategory,
      labels: itemLabels
    };
    
    if (editingItemIndex !== null) {
      setItems(prev => prev.map((item, idx) => idx === editingItemIndex ? newItem : item));
      setEditingItemIndex(null);
    } else {
      setItems(prev => [...prev, newItem]);
    }
    
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemSubCategory('');
    setItemLabels([]);
  };

  const editItem = (index: number) => {
    const item = items[index];
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemCategory(item.category);
    setItemSubCategory(item.subCategory);
    setItemLabels(item.labels);
    setEditingItemIndex(index);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const saveReceipt = () => {
    if (!shop || items.length === 0) return;
    const updatedReceipt: Receipt = {
      id: receipt.id,
      date: date,
      shop,
      items
    };
    updateReceipt(updatedReceipt);
    onClose();
  };

  const handleLabelChange = (label: string, checked: boolean) => {
    if (checked) {
      setItemLabels(prev => [...prev, label]);
    } else {
      setItemLabels(prev => prev.filter(l => l !== label));
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal large-modal">
        <div className="expense-recorder">
          <div className="recorder-card" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <div className="recorder-header">
              <h1>✏️ Edit Receipt</h1>
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
                  <label htmlFor="edit-date-input">Date</label>
                  <input
                    id="edit-date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="add-items-section">
              <h2>{editingItemIndex !== null ? 'Edit Item' : 'Add Items'}</h2>
              <div className="item-form">
                <div className="item-form-row">
                  <div className="form-group">
                    <label>Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Milk" 
                      value={itemName} 
                      onChange={e => setItemName(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={itemPrice} 
                      onChange={e => setItemPrice(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="item-form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      value={itemCategory} 
                      onChange={e => {
                        setItemCategory(e.target.value);
                        setItemSubCategory('');
                      }}
                    >
                      <option value="">Select category</option>
                      {Object.keys(categoryData.categories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subcategory</label>
                    <select 
                      value={itemSubCategory} 
                      onChange={e => setItemSubCategory(e.target.value)}
                      disabled={!itemCategory}
                    >
                      <option value="">Select subcategory</option>
                      {itemCategory && categoryData.categories[itemCategory]?.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="item-form-row-full">
                  <div className="form-group">
                    <label>Labels (Optional)</label>
                    <button 
                      type="button" 
                      className="select-labels-btn"
                      onClick={() => setShowLabelsPopup(true)}
                    >
                      Select Labels {itemLabels.length > 0 && `(${itemLabels.length} selected)`}
                    </button>
                    {itemLabels.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        🏷️ {itemLabels.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={addItem} className="add-item-btn">
                  {editingItemIndex !== null ? '💾 Update Item' : '➕ Add Item'}
                </button>
                {editingItemIndex !== null && (
                  <button 
                    onClick={() => {
                      setEditingItemIndex(null);
                      setItemName('');
                      setItemPrice('');
                      setItemCategory('');
                      setItemSubCategory('');
                      setItemLabels([]);
                    }} 
                    className="cancel-edit-btn"
                    style={{ marginLeft: '1rem', background: 'var(--text-secondary)' }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {items.length > 0 && (
                <div className="items-list">
                  <h3>Items ({items.length})</h3>
                  {items.map((item, idx) => (
                    <div key={idx} className="item-card">
                      <div className="item-info">
                        <strong>{item.name}</strong>
                        <span className="item-price">₹{item.price.toFixed(2)}</span>
                      </div>
                      <div className="item-meta">
                        <span className="item-category">{item.category} → {item.subCategory}</span>
                        {item.labels.length > 0 && (
                          <span className="item-labels">🏷️ {item.labels.join(', ')}</span>
                        )}
                      </div>
                      <div className="item-actions">
                        <button onClick={() => editItem(idx)} className="icon-btn" title="Edit Item">✏️</button>
                        <button onClick={() => removeItem(idx)} className="icon-btn delete" title="Remove Item">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button onClick={saveReceipt} className="save-btn" disabled={!shop || items.length === 0}>
                💾 Save Changes
              </button>
              <button onClick={onClose} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLabelsPopup && (
        <>
          <div className="labels-modal-overlay" onClick={() => setShowLabelsPopup(false)}></div>
          <div className="labels-modal">
            <h3>Select Labels</h3>
            <div className="labels-grid">
              {categoryData.labels.map(label => (
                <div key={label} className="label-checkbox">
                  <input 
                    type="checkbox" 
                    id={`label-edit-${label}`}
                    checked={itemLabels.includes(label)}
                    onChange={e => handleLabelChange(label, e.target.checked)}
                  />
                  <label htmlFor={`label-edit-${label}`}>{label}</label>
                </div>
              ))}
            </div>
            <button onClick={() => setShowLabelsPopup(false)} className="labels-done-btn">
              Done
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default EditReceipt;
