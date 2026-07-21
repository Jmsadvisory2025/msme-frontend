import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Upload, BarChart3, Settings, LogOut,
  Menu, X, CreditCard, ChevronRight, FileText, Package,
  Plus, ArrowUpFromLine, ChevronDown, Box, Truck, ShoppingCart, PieChart, ScanLine
} from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

const mainNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/upload', label: 'Upload Data', icon: Upload },
];

const invoiceNavItems = [
  { path: '/invoice/dashboard', label: 'Invoices', icon: FileText },
  { 
    path: '/inventory', 
    label: 'Inventory', 
    icon: Package,
    subItems: [
      { path: '/inventory/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/inventory/products', label: 'Products', icon: Box },
      { path: '/inventory/stock-movements', label: 'Stock Movements', icon: ArrowUpFromLine },
      { path: '/inventory/purchases', label: 'Purchases', icon: Truck },
      { path: '/inventory/sales', label: 'Sales', icon: ShoppingCart },
      { path: '/inventory/suppliers', label: 'Suppliers', icon: Users },
      { path: '/inventory/reports', label: 'Reports', icon: PieChart },
      { path: '/inventory/barcode-scanner', label: 'Barcode Scanner', icon: ScanLine },
    ]
  },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleExpand = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    
    // If not manually toggled yet, it's expanded if it's active
    const isExpanded = expandedItems[item.path] !== undefined 
      ? expandedItems[item.path] 
      : active;

    return (
      <div key={item.path}>
        <div className="flex items-center group">
          {hasSubItems ? (
            <button
              onClick={(e) => toggleExpand(e, item.path)}
              className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${active
                  ? 'bg-brand-50 text-brand-600 border border-brand-100 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-500' : 'group-hover:text-slate-700'}`} />
              {!collapsed && <span className="font-medium text-sm text-left flex-1">{item.label}</span>}
              {!collapsed && (
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </button>
          ) : (
            <Link
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${active
                  ? 'bg-brand-50 text-brand-600 border border-brand-100 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-500' : 'group-hover:text-slate-700'}`} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              {!collapsed && active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          )}
        </div>

        {/* Sub-items */}
        {!collapsed && hasSubItems && isExpanded && (
          <div className="ml-2 mt-0.5 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
            {item.subItems.map((sub) => {
              const SubIcon = sub.icon;
              const subActive = isActive(sub.path);
              return (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 ml-5 rounded-lg transition-all duration-200 text-xs
                    ${subActive
                      ? 'text-brand-600 bg-brand-50/60 font-semibold border-l-2 border-brand-500 pl-2'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-l-2 border-transparent pl-2'
                    }`}
                >
                  <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-sora font-bold text-lg text-slate-800 leading-tight">{APP_NAME}</h1>
            <p className="text-[10px] text-brand-500 font-medium tracking-wider uppercase">Credit Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {mainNavItems.map(renderNavItem)}

        {/* Section divider for Invoicing */}
        <div className="pt-3 pb-1 px-3">
          <div className="border-t border-slate-200"></div>
          {!collapsed && (
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-3 mb-1">
              Invoicing
            </p>
          )}
        </div>

        {invoiceNavItems.map(renderNavItem)}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 p-4">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-700 truncate">{user?.first_name || user?.email}</p>
            <p className="text-xs text-slate-400 truncate">{user?.company_name || user?.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-slate-400 
                     hover:bg-rose-50 hover:text-rose-500 transition-all duration-200 text-sm"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
             onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-2xl
        transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60
        transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} flex-shrink-0 relative`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm
                     text-slate-400 hover:text-brand-500 flex items-center justify-center text-xs z-10
                     hidden lg:flex transition-colors"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </>
  );
}
