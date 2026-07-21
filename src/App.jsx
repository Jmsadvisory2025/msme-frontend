import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorBoundary from './components/common/ErrorBoundary';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Upload from './pages/Upload';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
// Invoice module pages
import AddInvoiceCustomer from './pages/invoice/AddInvoiceCustomer';
import EditInvoiceCustomer from './pages/invoice/EditInvoiceCustomer';
import CreateInvoice from './pages/invoice/CreateInvoice';
import EditInvoice from './pages/invoice/EditInvoice';
import InvoiceDashboard from './pages/invoice/InvoiceDashboard';
// New pages
import AddCustomer from './pages/customers/AddCustomer';
import BulkUpload from './pages/customers/BulkUpload';
// Inventory Module Pages (unified)
import InventoryDashboardComponent from './pages/inventory/InventoryDashboard';
import ProductList from './pages/inventory/ProductList';
import StockMovementLog from './pages/inventory/StockMovementLog';
import PurchaseList from './pages/inventory/PurchaseList';
import SalesList from './pages/inventory/SalesList';
import SupplierList from './pages/inventory/SupplierList';
import Reports from './pages/inventory/Reports';
import BarcodeScanStation from './pages/inventory/BarcodeScanStation';
function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-mesh">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute><AppLayout><Customers /></AppLayout></PrivateRoute>} />
        <Route path="/customers/add" element={<PrivateRoute><AppLayout><AddCustomer /></AppLayout></PrivateRoute>} />
        <Route path="/customers/edit/:id" element={<PrivateRoute><AppLayout><AddCustomer /></AppLayout></PrivateRoute>} />
        <Route path="/customers/bulk-upload" element={<PrivateRoute><AppLayout><BulkUpload /></AppLayout></PrivateRoute>} />
        <Route path="/customers/:id" element={<PrivateRoute><AppLayout><CustomerProfile /></AppLayout></PrivateRoute>} />
        <Route path="/upload" element={<PrivateRoute><AppLayout><Upload /></AppLayout></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><AppLayout><Analytics /></AppLayout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute>} />
        {/* Inventory Module (unified - no more separate InventoryList/AddInventory) */}
        <Route path="/inventory" element={<Navigate to="/inventory/products" replace />} />
        <Route path="/inventory/add" element={<Navigate to="/inventory/products" replace />} />
        <Route path="/inventory/edit/:id" element={<Navigate to="/inventory/products" replace />} />
        <Route path="/inventory/dashboard" element={<PrivateRoute><AppLayout><InventoryDashboardComponent /></AppLayout></PrivateRoute>} />
        <Route path="/inventory/products" element={<PrivateRoute><AppLayout><ProductList /></AppLayout></PrivateRoute>} />
        <Route path="/inventory/stock-movements" element={<PrivateRoute><AppLayout><StockMovementLog /></AppLayout></PrivateRoute>} />
        <Route path="/inventory/purchases" element={<PrivateRoute><AppLayout><PurchaseList /></AppLayout></PrivateRoute>} />
        <Route path="/inventory/sales" element={<PrivateRoute><AppLayout><SalesList /></AppLayout></PrivateRoute>} />
        <Route path="/inventory/suppliers" element={<PrivateRoute><AppLayout><SupplierList /></AppLayout></PrivateRoute>} />
        <Route path="/inventory/reports" element={<PrivateRoute><AppLayout><Reports /></AppLayout></PrivateRoute>} />
        <Route path="/inventory/barcode-scanner" element={<PrivateRoute><AppLayout><BarcodeScanStation /></AppLayout></PrivateRoute>} />
        {/* Invoice module routes */}
        <Route path="/invoice/add-customer" element={<PrivateRoute><AppLayout><AddInvoiceCustomer /></AppLayout></PrivateRoute>} />
        <Route path="/invoice/edit-customer/:id" element={<PrivateRoute><AppLayout><EditInvoiceCustomer /></AppLayout></PrivateRoute>} />
        <Route path="/invoice/add-inventory" element={<Navigate to="/inventory/products" replace />} />
        <Route path="/invoice/create" element={<PrivateRoute><AppLayout><CreateInvoice /></AppLayout></PrivateRoute>} />
        <Route path="/invoice/edit/:id" element={<PrivateRoute><AppLayout><EditInvoice /></AppLayout></PrivateRoute>} />
        <Route path="/invoice/dashboard" element={<PrivateRoute><AppLayout><InvoiceDashboard /></AppLayout></PrivateRoute>} />
        {/* Redirects */}
        <Route path="/invoice/customers/add" element={<Navigate to="/customers/add" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

