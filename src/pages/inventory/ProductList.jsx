import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, fetchSuppliers } from '../../store/inventorySlice';
import * as inventoryAPI from '../../api/inventoryAPI';
import { getCustomerDropdown } from '../../api/customerAPI';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import { Plus, Search, Edit2, Trash2, Loader2, Package, ChevronLeft, ChevronRight, ScanLine, Printer, X, Eye } from 'lucide-react';

const UNIT_OPTIONS = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Pcs', 'Set', 'Pair', 'Dozen', 'Other'];
const TAX_OPTIONS = [0, 5, 12, 18, 28];

const initialFormData = {
  sku: '', name: '', description: '', category_name: '', supplier_id: '',
  unit: 'Nos', cost_price: 0, selling_price: 0, minimum_stock_level: 5,
  hsn_code: '', tax_percentage: 18, stock_quantity: 0, customer: '',
};

export default function ProductList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, categories, suppliers, loading } = useSelector(state => state.inventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [barcodeModal, setBarcodeModal] = useState(null); // product object
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isPrintingLabels, setIsPrintingLabels] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      category_input: formData.category_name || null,
      supplier: formData.supplier_id || null,
      customer: formData.customer || null,
      cost_price: parseFloat(formData.cost_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      minimum_stock_level: parseInt(formData.minimum_stock_level) || 0,
      tax_percentage: parseInt(formData.tax_percentage),
      current_stock: parseInt(formData.stock_quantity) || 0,
    };

    let error;
    if (editId) {
      const res = await inventoryAPI.updateProduct(editId, payload);
      error = res.error;
    } else {
      const res = await inventoryAPI.createProduct(payload);
      error = res.error;
    }

    setIsSubmitting(false);
    if (!error) {
      toast.success(editId ? 'Product updated successfully!' : 'Product added successfully!');
      dispatch(fetchProducts());
      closeModal();
    } else {
      toast.error(`Failed: ${typeof error === 'string' ? error : JSON.stringify(error)}`);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      category_name: product.category_name || '',
      supplier_id: product.supplier || '',
      unit: product.unit || 'Nos',
      cost_price: product.cost_price || 0,
      selling_price: product.selling_price || 0,
      minimum_stock_level: product.minimum_stock_level || 5,
      hsn_code: product.hsn_code || '',
      tax_percentage: product.tax_percentage ?? 18,
      stock_quantity: product.current_stock || 0,
      customer: product.customer || '',
    });
    setEditId(product.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    const { error } = await inventoryAPI.updateProduct(id, { is_active: false });
    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      dispatch(fetchProducts());
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData(initialFormData);
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchSuppliers());
    // Load customers for dropdown
    (async () => {
      const { data } = await getCustomerDropdown();
      if (data) setCustomers(data.data || data);
    })();
  }, [dispatch]);

  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.hsn_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-sm';

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-sora font-bold text-slate-800">Products & Inventory</h1>
          <p className="text-slate-500 mt-1">Manage your products, stock, and pricing</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedProducts.size > 0 && (
            <button
              onClick={async () => {
                setIsPrintingLabels(true);
                const { error } = await inventoryAPI.downloadBarcodeLabels([...selectedProducts], 1, 'medium');
                setIsPrintingLabels(false);
                if (error) toast.error(error);
                else { toast.success('Barcode labels PDF downloaded'); setSelectedProducts(new Set()); }
              }}
              disabled={isPrintingLabels}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg"
            >
              {isPrintingLabels ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Print Labels ({selectedProducts.size})
            </button>
          )}
          <button
            onClick={() => navigate('/inventory/barcode-scanner')}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-all shadow-lg"
          >
            <ScanLine className="w-4 h-4" /> Scanner
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a2744] text-white rounded-xl font-semibold hover:bg-[#243352] transition-all shadow-lg shadow-slate-300/30"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, Name, or HSN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading?.products ? (
            <div className="p-6">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg mb-2 animate-pulse" />)}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No products found.</p>
              <p className="text-sm text-slate-400 mt-1">Click "+ Add Product" to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                  <th className="font-medium p-4 w-10">
                    <input type="checkbox" onChange={e => {
                      if (e.target.checked) setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                      else setSelectedProducts(new Set());
                    }} checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    className="rounded border-slate-300" />
                  </th>
                  <th className="font-medium p-4">SKU</th>
                  <th className="font-medium p-4">Barcode</th>
                  <th className="font-medium p-4">Name</th>
                  <th className="font-medium p-4">Category</th>
                  <th className="font-medium p-4 text-right">Cost / Sell (₹)</th>
                  <th className="font-medium p-4 text-center">Stock</th>
                  <th className="font-medium p-4">Status</th>
                  <th className="font-medium p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLow = product.current_stock > 0 && product.current_stock <= product.minimum_stock_level;
                  const isOut = product.current_stock === 0;

                  return (
                    <tr key={product.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors group ${isOut ? 'bg-rose-50/30' : isLow ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={selectedProducts.has(product.id)}
                          onChange={e => {
                            const next = new Set(selectedProducts);
                            e.target.checked ? next.add(product.id) : next.delete(product.id);
                            setSelectedProducts(next);
                          }} className="rounded border-slate-300" />
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-600">{product.sku}</td>
                      <td className="p-4">
                        {product.barcode ? (
                          <button onClick={() => setBarcodeModal(product)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono text-slate-600 transition-colors flex items-center gap-1" title="View Barcode">
                            <ScanLine className="w-3 h-3" /> {product.barcode}
                          </button>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-800">{product.name}</td>
                      <td className="p-4 text-sm text-slate-500">{product.category_name || '—'}</td>
                      <td className="p-4 text-sm text-slate-600 text-right">
                        ₹{parseFloat(product.cost_price).toLocaleString('en-IN')} / ₹{parseFloat(product.selling_price).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-sm font-semibold text-center">
                        <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-700'}>
                          {product.current_stock}
                        </span>
                        <span className="text-xs font-normal text-slate-400 ml-1">{product.unit}</span>
                      </td>
                      <td className="p-4">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-100 text-rose-700">Out of Stock</span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">Low Stock</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700">In Stock</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setBarcodeModal(product)} className="p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-full transition-colors" title="View Barcode">
                            <ScanLine className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(product)} className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Unified Add / Edit Product Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl p-6 lg:p-8 my-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{editId ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Row 1: SKU + Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">SKU <span className="text-rose-500">*</span></label>
                  <input required name="sku" value={formData.sku} onChange={handleInputChange} type="text" placeholder="e.g. PRD-001" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Product Name <span className="text-rose-500">*</span></label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="Enter product name" className={inputClass} />
                </div>
              </div>

              {/* Row 2: HSN Code + Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">HSN Code <span className="text-rose-500">*</span></label>
                  <input required name="hsn_code" value={formData.hsn_code} onChange={handleInputChange} type="text" placeholder="e.g. 8471" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                  <input list="category-options" name="category_name" value={formData.category_name} onChange={handleInputChange} placeholder="Type or select category..." className={inputClass} />
                  <datalist id="category-options">
                    {categories.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
              </div>

              {/* Row 3: Supplier + Customer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Supplier</label>
                  <select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange} className={`${inputClass} bg-white`}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Customer</label>
                  <div className="flex items-center gap-2">
                    <select name="customer" value={formData.customer} onChange={handleInputChange} className={`${inputClass} bg-white flex-1`}>
                      <option value="">-- Select Customer --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => navigate('/customers/add')} className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap flex items-center gap-0.5">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Unit + Tax % + Cost Price + Sell Price */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Unit <span className="text-rose-500">*</span></label>
                  <select name="unit" value={formData.unit} onChange={handleInputChange} className={`${inputClass} bg-white`}>
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Tax % <span className="text-rose-500">*</span></label>
                  <select name="tax_percentage" value={formData.tax_percentage} onChange={handleInputChange} className={`${inputClass} bg-white`}>
                    {TAX_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Cost Price (₹)</label>
                  <input name="cost_price" value={formData.cost_price} onChange={handleInputChange} type="number" min="0" step="0.01" placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Sell Price (₹) <span className="text-rose-500">*</span></label>
                  <input required name="selling_price" value={formData.selling_price} onChange={handleInputChange} type="number" min="0" step="0.01" placeholder="0.00" className={inputClass} />
                </div>
              </div>

              {/* Row 5: Stock Qty + Min Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Stock Quantity <span className="text-rose-500">*</span></label>
                  <input required name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} type="number" min="0" placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Min Stock Level</label>
                  <input name="minimum_stock_level" value={formData.minimum_stock_level} onChange={handleInputChange} type="number" min="0" placeholder="5" className={inputClass} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} placeholder="Brief product description" className={`${inputClass} resize-none`}></textarea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-[#1a2744] text-white rounded-xl font-semibold shadow-lg shadow-slate-300/30 hover:bg-[#243352] disabled:opacity-70 transition-all">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : editId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Barcode View Modal ─── */}
      {barcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Product Barcode</h2>
              <button onClick={() => setBarcodeModal(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-1">{barcodeModal.name}</p>
            <p className="text-xs text-slate-400 mb-4">SKU: {barcodeModal.sku} • ₹{parseFloat(barcodeModal.selling_price).toLocaleString('en-IN')}</p>
            {barcodeModal.barcode && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4 inline-block">
                <Barcode value={barcodeModal.barcode} format="EAN13" width={2} height={70} fontSize={14} margin={10} background="#ffffff" lineColor="#1e293b" />
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <button onClick={async () => {
                const { error } = await inventoryAPI.downloadBarcodeLabels([barcodeModal.id], 1, 'medium');
                if (error) toast.error(error); else toast.success('Label PDF downloaded');
              }} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a2744] text-white rounded-xl font-semibold hover:bg-[#243352] transition-all">
                <Printer className="w-4 h-4" /> Print Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
