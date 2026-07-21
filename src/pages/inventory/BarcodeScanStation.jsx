import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../store/inventorySlice';
import * as inventoryAPI from '../../api/inventoryAPI';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import {
  ScanLine, Package, ShoppingCart, ArrowDownToLine, ArrowUpFromLine,
  Search, Printer, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Clock, Zap, Volume2, History, Trash2, Plus, Minus, Eye
} from 'lucide-react';

const SCAN_MODES = [
  { id: 'STOCK_OUT', label: 'Stock Out (Sale)', icon: ArrowDownToLine, color: 'rose', desc: 'Remove from inventory' },
  { id: 'STOCK_IN', label: 'Stock In', icon: ArrowUpFromLine, color: 'emerald', desc: 'Add to inventory' },
  { id: 'LOOKUP', label: 'Lookup Only', icon: Eye, color: 'blue', desc: 'View product details' },
];

export default function BarcodeScanStation() {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const scanSoundRef = useRef(null);
  const errorSoundRef = useRef(null);

  const [scanMode, setScanMode] = useState('STOCK_OUT');
  const [quantity, setQuantity] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const [lastScanResult, setLastScanResult] = useState(null); // 'success' | 'error' | null
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  // Keep focus on input for USB scanner
  useEffect(() => {
    const keepFocus = () => {
      if (inputRef.current && !showHistory) {
        inputRef.current.focus();
      }
    };
    keepFocus();
    const interval = setInterval(keepFocus, 1000);
    window.addEventListener('click', keepFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', keepFocus);
    };
  }, [showHistory]);

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  const playBeep = useCallback((type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.frequency.value = 1200;
        gain.gain.value = 0.15;
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.frequency.value = 400;
        gain.gain.value = 0.2;
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { /* audio not available */ }
  }, []);

  const handleScan = useCallback(async (barcode) => {
    if (!barcode.trim() || isProcessing) return;
    setIsProcessing(true);
    setLastScanResult(null);

    const { data, error } = await inventoryAPI.scanBarcode(barcode.trim(), scanMode, quantity);

    if (error) {
      setLastScanResult('error');
      setLastScannedProduct(null);
      playBeep('error');
      toast.error(typeof error === 'string' ? error : 'Product not found');
    } else {
      setLastScanResult('success');
      setLastScannedProduct(data.product);
      playBeep('success');
      setScanCount(c => c + 1);
      setScanHistory(prev => [{
        id: Date.now(),
        barcode: barcode.trim(),
        product: data.product,
        action: scanMode,
        quantity: scanMode === 'LOOKUP' ? 0 : quantity,
        newStock: data.new_stock ?? data.product?.current_stock,
        time: new Date(),
        message: data.message || 'Lookup complete',
      }, ...prev].slice(0, 100));

      if (scanMode !== 'LOOKUP') {
        toast.success(data.message || 'Scan processed');
        dispatch(fetchProducts());
      }
      
      // Auto-reset quantity back to 1 for the next scan (Standard POS behavior)
      setQuantity(1);
    }

    setBarcodeInput('');
    setIsProcessing(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [scanMode, quantity, isProcessing, playBeep, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      handleScan(barcodeInput);
    }
  };

  const handlePrintLabels = async () => {
    if (!lastScannedProduct) return;
    const { error } = await inventoryAPI.downloadBarcodeLabels([lastScannedProduct.id], 1, 'medium');
    if (error) toast.error(error);
    else toast.success('Barcode label PDF downloaded');
  };

  const modeConfig = SCAN_MODES.find(m => m.id === scanMode);
  const modeColorMap = { rose: { bg: 'bg-rose-500', ring: 'ring-rose-500/30', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200' }, emerald: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' }, blue: { bg: 'bg-blue-500', ring: 'ring-blue-500/30', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' } };
  const colors = modeColorMap[modeConfig?.color] || modeColorMap.blue;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shadow-lg`}>
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-sora">Barcode Scan Station</h1>
            <p className="text-xs text-slate-500">DMart-style POS Scanner • USB Scanner Ready</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-700">{scanCount} scans</span>
          </div>
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-all">
            <History className="w-4 h-4" /> {showHistory ? 'Scanner' : 'History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        /* ─── Scan History View ─── */
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Scan History</h2>
              <button onClick={() => setScanHistory([])} className="text-xs text-rose-500 hover:text-rose-700 font-medium">Clear All</button>
            </div>
            {scanHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400"><Clock className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No scans yet</p></div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[calc(100vh-250px)] overflow-y-auto">
                {scanHistory.map(h => (
                  <div key={h.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${h.action === 'STOCK_OUT' ? 'bg-rose-100 text-rose-600' : h.action === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {h.action === 'STOCK_OUT' ? <ArrowDownToLine className="w-4 h-4" /> : h.action === 'STOCK_IN' ? <ArrowUpFromLine className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{h.product?.name}</p>
                      <p className="text-xs text-slate-400">Barcode: {h.barcode} • SKU: {h.product?.sku}</p>
                    </div>
                    {h.quantity > 0 && <span className="text-sm font-semibold text-slate-600">×{h.quantity}</span>}
                    <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(h.time).toLocaleTimeString()}</span>
                    <span className="text-sm font-semibold text-slate-700">Stock: {h.newStock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Scanner View ─── */
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Scanner */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            {/* Mode Selector */}
            <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200 shadow-sm">
              {SCAN_MODES.map(mode => {
                const Icon = mode.icon;
                const active = scanMode === mode.id;
                const mc = modeColorMap[mode.color];
                return (
                  <button key={mode.id} onClick={() => setScanMode(mode.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? `${mc.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                    <Icon className="w-4 h-4" /> {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Scanner Input */}
            <div className={`relative w-full max-w-lg transition-all duration-300 ${isProcessing ? 'scale-[0.98] opacity-70' : ''}`}>
              <div className={`absolute inset-0 rounded-2xl ${colors.ring} ring-4 opacity-60 animate-pulse pointer-events-none`} />
              <div className="relative bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
                <div className={`px-4 py-2 ${colors.light} ${colors.border} border-b flex items-center gap-2`}>
                  <ScanLine className={`w-4 h-4 ${colors.text}`} />
                  <span className={`text-xs font-semibold ${colors.text} uppercase tracking-wider`}>
                    {isProcessing ? 'Processing...' : 'Ready — Scan or Type Barcode'}
                  </span>
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin ml-auto text-slate-400" />}
                </div>
                <input ref={inputRef} type="text" value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Scan barcode with USB scanner or type manually..."
                  autoFocus autoComplete="off"
                  className="w-full px-6 py-5 text-2xl font-mono text-center tracking-[0.15em] bg-transparent outline-none text-slate-800 placeholder:text-slate-300 placeholder:text-base placeholder:tracking-normal" />
              </div>
            </div>

            {/* Quantity (for stock operations) */}
            {scanMode !== 'LOOKUP' && (
              <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Qty:</span>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><Minus className="w-4 h-4 text-slate-600" /></button>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-lg font-bold text-slate-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><Plus className="w-4 h-4 text-slate-600" /></button>
              </div>
            )}

            {/* Scan Result Flash */}
            {lastScanResult && (
              <div className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium animate-fade-in ${lastScanResult === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {lastScanResult === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {lastScanResult === 'success' ? 'Scan processed successfully!' : 'Product not found or error occurred'}
              </div>
            )}
          </div>

          {/* Right: Product Info Panel */}
          <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
            {lastScannedProduct ? (
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{lastScannedProduct.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">SKU: {lastScannedProduct.sku}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${lastScannedProduct.current_stock === 0 ? 'bg-rose-100 text-rose-700' : lastScannedProduct.current_stock <= lastScannedProduct.minimum_stock_level ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {lastScannedProduct.current_stock === 0 ? 'Out of Stock' : lastScannedProduct.current_stock <= lastScannedProduct.minimum_stock_level ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>

                {/* Barcode Display */}
                {lastScannedProduct.barcode && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                    <Barcode value={lastScannedProduct.barcode} format="EAN13" width={1.8} height={60} fontSize={12} margin={5} background="#ffffff" lineColor="#1e293b" />
                  </div>
                )}

                {/* Product Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Selling Price</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">₹{parseFloat(lastScannedProduct.selling_price).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Cost Price</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">₹{parseFloat(lastScannedProduct.cost_price).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Current Stock</p>
                    <p className={`text-lg font-bold mt-0.5 ${lastScannedProduct.current_stock === 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {lastScannedProduct.current_stock} <span className="text-xs font-normal text-slate-400">{lastScannedProduct.unit}</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Tax</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{lastScannedProduct.tax_percentage}%</p>
                  </div>
                </div>

                {/* Extra Info */}
                <div className="space-y-2 text-sm">
                  {lastScannedProduct.category_name && (
                    <div className="flex justify-between"><span className="text-slate-400">Category</span><span className="text-slate-700 font-medium">{lastScannedProduct.category_name}</span></div>
                  )}
                  {lastScannedProduct.hsn_code && (
                    <div className="flex justify-between"><span className="text-slate-400">HSN Code</span><span className="text-slate-700 font-mono">{lastScannedProduct.hsn_code}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-slate-400">Min Stock Level</span><span className="text-slate-700">{lastScannedProduct.minimum_stock_level}</span></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button onClick={handlePrintLabels} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a2744] text-white rounded-xl text-sm font-semibold hover:bg-[#243352] transition-all shadow-lg">
                    <Printer className="w-4 h-4" /> Print Label
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-slate-500 font-medium">No Product Scanned</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Scan a barcode to see product details and manage stock instantly</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
