import { useState, useMemo, useEffect } from 'react';
import type { Receipt, Item } from '../types';
import { useExpense } from '../context/ExpenseContext';
import EditReceipt from './EditReceipt';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { receipts, categoryData, pushToFirestore, pullFromFirestore, isPushing, isPulling, lastPushTime, lastPullTime, deleteReceipt } = useExpense();
  const [showReceiptsPopup, setShowReceiptsPopup] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartView, setChartView] = useState<'category' | 'subcategory' | 'label' | 'month'>('category');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [showChartCategoryFilters, setShowChartCategoryFilters] = useState(false);
  const [showChartSubFilters, setShowChartSubFilters] = useState(false);
  const [showChartLabelFilters, setShowChartLabelFilters] = useState(false);
  const [showChartPaymentModeFilters, setShowChartPaymentModeFilters] = useState(false);
  const [showReceiptCategoryFilters, setShowReceiptCategoryFilters] = useState(false);
  const [showReceiptSubFilters, setShowReceiptSubFilters] = useState(false);
  const [showReceiptLabelFilters, setShowReceiptLabelFilters] = useState(false);
  const [showReceiptPaymentModeFilters, setShowReceiptPaymentModeFilters] = useState(false);
  const [roundingMode, setRoundingMode] = useState<'none' | 'up' | 'down'>('none');

  // Load rounding preference from localStorage set on Record Expenses page
  useEffect(() => {
    const saved = localStorage.getItem('roundingMode');
    if (saved === 'none' || saved === 'up' || saved === 'down') {
      setRoundingMode(saved as 'none' | 'up' | 'down');
    }
  }, []);

  const handlePush = async () => {
    try {
      await pushToFirestore();
    } catch (error) {
      console.error('Push failed:', error);
      alert('Failed to push to Firestore. Check console for details.');
    }
  };

  const handlePull = async () => {
    try {
      await pullFromFirestore();
    } catch (error) {
      console.error('Pull failed:', error);
      alert('Failed to pull from Firestore. Check console for details.');
    }
  };

  const formatLastTime = (time: Date | null, label: string) => {
    if (!time) return `Never ${label}`;
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return time.toLocaleString();
  };

  const total = receipts.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.price, 0), 0);

  // Aggregate totals by category
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const d = r.date || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [receipts, startDate, endDate]);

  const categoryAgg = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredReceipts) {
      // Filter by payment mode at receipt level
      if (selectedPaymentModes.length && (!r.paymentMode || !selectedPaymentModes.includes(r.paymentMode))) continue;
      
      for (const i of r.items) {
        if (selectedCategories.length && !selectedCategories.includes(i.category)) continue;
        if (selectedSubCategories.length && !selectedSubCategories.includes(i.subCategory)) continue;
        if (selectedLabels.length && !i.labels.some(l => selectedLabels.includes(l))) continue;
        map.set(i.category, (map.get(i.category) || 0) + i.price);
      }
    }
    const arr = Array.from(map.entries()).map(([name, total]) => ({ name, total }));
    // Provide defaults if empty
    return arr.length ? arr : [
      { name: 'Food', total: 0 },
      { name: 'Transportation', total: 0 },
      { name: 'Entertainment', total: 0 },
    ];
  }, [filteredReceipts, selectedCategories, selectedPaymentModes]);

  // Aggregate totals by month (YYYY-MM)
  const monthlyAgg = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredReceipts) {
      // Filter by payment mode at receipt level
      if (selectedPaymentModes.length && (!r.paymentMode || !selectedPaymentModes.includes(r.paymentMode))) continue;
      
      const key = (r.date || '').slice(0, 7); // YYYY-MM
      if (!key) continue;
      const subtotal = r.items.reduce((s, i) => {
        if (selectedCategories.length && !selectedCategories.includes(i.category)) return s;
        if (selectedSubCategories.length && !selectedSubCategories.includes(i.subCategory)) return s;
        if (selectedLabels.length && !i.labels.some(l => selectedLabels.includes(l))) return s;
        return s + i.price;
      }, 0);
      map.set(key, (map.get(key) || 0) + subtotal);
    }
    const arr = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
    // Provide last 3 months defaults if empty
    if (!arr.length) {
      return [
        { month: '2025-10', total: 0 },
        { month: '2025-11', total: 0 },
        { month: '2025-12', total: 0 },
      ];
    }
    return arr;
  }, [filteredReceipts, selectedCategories, selectedPaymentModes]);

  // Aggregate totals by subcategory
  const subCategoryAgg = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredReceipts) {
      // Filter by payment mode at receipt level
      if (selectedPaymentModes.length && (!r.paymentMode || !selectedPaymentModes.includes(r.paymentMode))) continue;
      
      for (const i of r.items) {
        if (selectedCategories.length && !selectedCategories.includes(i.category)) continue;
        if (selectedSubCategories.length && !selectedSubCategories.includes(i.subCategory)) continue;
        if (selectedLabels.length && !i.labels.some(l => selectedLabels.includes(l))) continue;
        if (i.subCategory) {
          map.set(i.subCategory, (map.get(i.subCategory) || 0) + i.price);
        }
      }
    }
    const arr = Array.from(map.entries()).map(([name, total]) => ({ name, total }));
    return arr.length ? arr : [{ name: 'No Data', total: 0 }];
  }, [filteredReceipts, selectedCategories, selectedSubCategories, selectedLabels, selectedPaymentModes]);

  // Aggregate totals by label
  const labelAgg = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredReceipts) {
      // Filter by payment mode at receipt level
      if (selectedPaymentModes.length && (!r.paymentMode || !selectedPaymentModes.includes(r.paymentMode))) continue;
      
      for (const i of r.items) {
        if (selectedCategories.length && !selectedCategories.includes(i.category)) continue;
        if (selectedSubCategories.length && !selectedSubCategories.includes(i.subCategory)) continue;
        if (selectedLabels.length && !i.labels.some(l => selectedLabels.includes(l))) continue;
        // When filtering by labels, only aggregate the selected labels
        const labelsToAggregate = selectedLabels.length > 0 ? selectedLabels : i.labels;
        for (const label of labelsToAggregate) {
          if (i.labels.includes(label)) {
            map.set(label, (map.get(label) || 0) + i.price);
          }
        }
      }
    }
    const arr = Array.from(map.entries()).map(([name, total]) => ({ name, total }));
    return arr.length ? arr : [{ name: 'No Data', total: 0 }];
  }, [filteredReceipts, selectedCategories, selectedSubCategories, selectedLabels, selectedPaymentModes]);

  const chartData = chartView === 'category' ? categoryAgg : chartView === 'subcategory' ? subCategoryAgg : chartView === 'label' ? labelAgg : monthlyAgg;
  const xKey = chartView === 'month' ? 'month' : 'name';

  // Calculate total for current chart view
  const chartTotal = useMemo(() => {
    return chartData.reduce((sum, item: any) => sum + (item.total || 0), 0);
  }, [chartData]);

  const subCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    const cats = selectedCategories.length ? selectedCategories : Object.keys(categoryData.categories);
    for (const cat of cats) {
      for (const sub of categoryData.categories[cat] || []) set.add(sub);
    }
    return Array.from(set).sort();
  }, [categoryData, selectedCategories]);

  const [selectedBar, setSelectedBar] = useState<{ type: 'category' | 'subcategory' | 'label' | 'month'; key: string } | null>(null);

  const selectedBarItems = useMemo((): Array<{ receipt: Receipt; item: Item }> => {
    if (!selectedBar) return [];
    const results: Array<{ receipt: Receipt; item: Item }> = [];
    for (const r of filteredReceipts) {
      // Filter by payment mode at receipt level
      if (selectedPaymentModes.length && (!r.paymentMode || !selectedPaymentModes.includes(r.paymentMode))) continue;
      
      // month guard when needed
      if (selectedBar.type === 'month') {
        const monthKey = (r.date || '').slice(0, 7);
        if (monthKey !== selectedBar.key) continue;
      }
      for (const i of r.items) {
        // Apply chart filters
        if (selectedBar.type === 'category' && i.category !== selectedBar.key) continue;
        if (selectedBar.type === 'subcategory' && i.subCategory !== selectedBar.key) continue;
        if (selectedBar.type === 'label' && !i.labels.includes(selectedBar.key)) continue;
        if (selectedCategories.length && !selectedCategories.includes(i.category)) continue;
        if (selectedSubCategories.length && !selectedSubCategories.includes(i.subCategory)) continue;
        if (selectedLabels.length && !i.labels.some(l => selectedLabels.includes(l))) continue;
        results.push({ receipt: r, item: i });
      }
    }
    return results;
  }, [filteredReceipts, selectedBar, selectedCategories, selectedSubCategories, selectedLabels, selectedPaymentModes]);
  // Custom label to show percentage on bars
  const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    const percentage = chartTotal > 0 ? ((value / chartTotal) * 100).toFixed(1) : '0';
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#64748b" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="600"
      >
        {percentage}%
      </text>
    );
  };
  const renderTooltip = (props: any) => {
    if (!props?.active || !props?.payload?.length) return null;
    const p = props.payload[0]?.payload;
    const key = chartView === 'month' ? p?.month : p?.name;
    const total = p?.total ?? 0;
    const percentage = chartTotal > 0 ? ((total / chartTotal) * 100).toFixed(1) : '0';
    return (
      <div style={{ background: 'white', color: 'black', border: '1px solid #ccc', padding: 8, borderRadius: 6 }}>
        <div style={{ marginBottom: 6 }}>
          <strong>{chartView === 'category' ? 'Category' : chartView === 'subcategory' ? 'Sub-Category' : chartView === 'label' ? 'Label' : 'Month'}:</strong> {key}
        </div>
        <div style={{ marginBottom: 6 }}>
          <strong>Total:</strong> ₹{Number(total).toFixed(2)}
        </div>
        <div>
          <strong>Percentage:</strong> {percentage}%
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <div className="total-expenses">
          Total Expenses: ₹{total.toFixed(2)}
        </div>
        <div className="header-actions">
          <button 
            onClick={handlePush} 
            className="push-btn"
            disabled={isPushing}
            title="Push local data to Firestore"
          >
            {isPushing ? '🔄 Pushing...' : '⬆️ Push'}
          </button>
          <span className="last-sync">{formatLastTime(lastPushTime, 'pushed')}</span>
          <button 
            onClick={handlePull} 
            className="pull-btn"
            disabled={isPulling}
            title="Pull data from Firestore"
          >
            {isPulling ? '🔄 Pulling...' : '⬇️ Pull'}
          </button>
          <span className="last-sync">{formatLastTime(lastPullTime, 'pulled')}</span>
          <button onClick={() => setShowReceiptsPopup(true)} className="receipts-btn">
            📄 View Receipts
          </button>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h2>Expense Analysis</h2>
          <div className="view-selector">
            <label htmlFor="chartView">View:</label>
            <select 
              id="chartView" 
              value={chartView} 
              onChange={(e) => setChartView(e.target.value as 'category' | 'subcategory' | 'label' | 'month')}
            >
              <option value="category">By Category</option>
              <option value="subcategory">By Sub-Category</option>
              <option value="label">By Labels</option>
              <option value="month">By Month</option>
            </select>
          </div>
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
            <button onClick={() => setShowChartCategoryFilters((v) => !v)} className="filter-btn">
              📂 Categories
            </button>
            <button onClick={() => setShowChartSubFilters((v) => !v)} className="filter-btn">
              📁 Sub-categories
            </button>
            <button onClick={() => setShowChartLabelFilters((v) => !v)} className="filter-btn">
              🏷️ Labels
            </button>
            <button onClick={() => setShowChartPaymentModeFilters((v) => !v)} className="filter-btn">
              💳 Payment Modes
            </button>
            <button 
              onClick={() => { 
                setStartDate(''); 
                setEndDate(''); 
                setSelectedCategories([]); 
                setSelectedSubCategories([]); 
                setSelectedLabels([]); 
                setSelectedPaymentModes([]);
              }} 
              className="clear-btn"
            >
              🔄 Clear Filters
            </button>
          </div>
        </div>

        {showChartCategoryFilters && (
          <div className="filter-options">
            {Object.keys(categoryData.categories).map((cat) => (
              <div key={cat} className="filter-option">
                <input
                  type="checkbox"
                  id={`chart-cat-${cat}`}
                  checked={selectedCategories.includes(cat)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories((prev) => [...prev, cat]);
                    } else {
                      setSelectedCategories((prev) => prev.filter((c) => c !== cat));
                    }
                  }}
                />
                <label htmlFor={`chart-cat-${cat}`}>{cat}</label>
              </div>
            ))}
          </div>
        )}

        {showChartSubFilters && (
          <div className="filter-options">
            {subCategoryOptions.map((sub) => (
              <div key={sub} className="filter-option">
                <input
                  type="checkbox"
                  id={`chart-sub-${sub}`}
                  checked={selectedSubCategories.includes(sub)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSubCategories((prev) => [...prev, sub]);
                    } else {
                      setSelectedSubCategories((prev) => prev.filter((s) => s !== sub));
                    }
                  }}
                />
                <label htmlFor={`chart-sub-${sub}`}>{sub}</label>
              </div>
            ))}
          </div>
        )}

        {showChartLabelFilters && (
          <div className="filter-options">
            {categoryData.labels.map((label) => (
              <div key={label} className="filter-option">
                <input
                  type="checkbox"
                  id={`chart-label-${label}`}
                  checked={selectedLabels.includes(label)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLabels((prev) => [...prev, label]);
                    } else {
                      setSelectedLabels((prev) => prev.filter((l) => l !== label));
                    }
                  }}
                />
                <label htmlFor={`chart-label-${label}`}>{label}</label>
              </div>
            ))}
          </div>
        )}

        {showChartPaymentModeFilters && (
          <div className="filter-options">
            {categoryData.paymentModes.map((mode) => (
              <div key={mode} className="filter-option">
                <input
                  type="checkbox"
                  id={`chart-mode-${mode}`}
                  checked={selectedPaymentModes.includes(mode)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPaymentModes((prev) => [...prev, mode]);
                    } else {
                      setSelectedPaymentModes((prev) => prev.filter((m) => m !== mode));
                    }
                  }}
                />
                <label htmlFor={`chart-mode-${mode}`}>{mode}</label>
              </div>
            ))}
          </div>
        )}
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={xKey} stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip content={renderTooltip} />
            <Bar
              dataKey="total"
              name="Total"
              fill={chartView === 'category' ? '#6366f1' : chartView === 'subcategory' ? '#8b5cf6' : chartView === 'label' ? '#ec4899' : '#14b8a6'}
              radius={[8, 8, 0, 0]}
              label={renderBarLabel}
              onClick={(data: any) => {
                const key = chartView === 'month' ? data?.payload?.month : data?.payload?.name;
                if (key) setSelectedBar({ type: chartView, key });
              }}
            >
              {chartData.map((entry: any, index: number) => {
                const key = entry[xKey];
                const isSelected = selectedBar && selectedBar.type === chartView && selectedBar.key === key;
                const baseFill = chartView === 'category' ? '#6366f1' : chartView === 'subcategory' ? '#8b5cf6' : chartView === 'label' ? '#ec4899' : '#14b8a6';
                const fill = isSelected ? '#f59e0b' : baseFill;
                const stroke = isSelected ? '#92400e' : undefined;
                return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} strokeWidth={isSelected ? 3 : 0} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="chart-total">
          <strong>{chartView === 'category' ? 'Category' : chartView === 'subcategory' ? 'Sub-Category' : chartView === 'label' ? 'Label' : 'Monthly'} Total:</strong> ₹{chartTotal.toFixed(2)}
        </div>
        
        {selectedBar && (
          <div className="selected-bar-info">
            <div className="selected-bar-header">
              <strong>
                Selected {selectedBar.type === 'category' ? 'Category' : 'Month'}: {selectedBar.key}
              </strong>
              <button onClick={() => setSelectedBar(null)} className="clear-selection-btn">
                Clear Selection
              </button>
            </div>
            {selectedBarItems.length ? (
              <div className="items-list">
                {selectedBarItems.map(({ receipt, item }, idx) => (
                  <div key={idx} className="item-entry">
                    <span><strong>{receipt.shop}</strong> • {receipt.date ? receipt.date.split('-').reverse().join('-') : ''}</span>
                    <br />
                    <span>{item.name}: <strong>₹{item.price.toFixed(2)}</strong> ({item.category} / {item.subCategory})</span>
                    {item.labels.length ? (<span> • 🏷️ {item.labels.join(', ')}</span>) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-items">No items match this selection.</div>
            )}
          </div>
        )}
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
    </div>
  );
};

export default Dashboard;