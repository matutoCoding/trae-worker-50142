import React, { useState } from 'react';
import { Search, Filter, Package, AlertTriangle, TrendingDown, TrendingUp, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/store';
import { formatCurrency, generateId } from '@/utils/formatUtils';
import { formatDate, getNow } from '@/utils/dateUtils';
import { SuppliesItem, SuppliesUsage } from '@/types';

const Supplies: React.FC = () => {
  const { supplies, suppliesUsages, transportOrders, deceasedList, addSuppliesUsage, updateSuppliesStock, currentUser } = useAppStore();
  
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'usage'>('stock');
  const [selectedItem, setSelectedItem] = useState<SuppliesItem | null>(null);

  const [usageForm, setUsageForm] = useState({
    orderId: '',
    itemId: '',
    quantity: 1,
    remark: '',
  });

  const [stockForm, setStockForm] = useState({
    itemId: '',
    quantity: 0,
    supplier: '',
  });

  const categories: SuppliesItem['category'][] = ['寿衣', '寿盒', '花圈', '鲜花', '其他'];
  
  const filteredItems = supplies.filter(item => {
    const matchSearch = !searchText || 
      item.name.includes(searchText) ||
      item.specification.includes(searchText) ||
      item.supplier?.includes(searchText);
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const availableOrders = transportOrders.filter(o => o.status !== '已取消' && o.status !== '已完成');

  const handleUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = supplies.find(s => s.id === usageForm.itemId);
    if (!item) return;

    const newUsage: SuppliesUsage = {
      id: generateId(),
      orderId: usageForm.orderId,
      itemId: usageForm.itemId,
      itemName: item.name,
      quantity: usageForm.quantity,
      unitPrice: item.price,
      totalPrice: item.price * usageForm.quantity,
      usedAt: getNow(),
      operator: currentUser?.name || '系统',
      remark: usageForm.remark,
    };

    addSuppliesUsage(newUsage);
    setShowUsageModal(false);
    setSelectedItem(null);
    setUsageForm({ orderId: '', itemId: '', quantity: 1, remark: '' });
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSuppliesStock(stockForm.itemId, stockForm.quantity);
    setShowStockModal(false);
    setStockForm({ itemId: '', quantity: 0, supplier: '' });
  };

  const stockColumns = [
    {
      key: 'name',
      header: '物品名称',
      render: (row: SuppliesItem) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-gray-500">{row.specification}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: '分类',
      render: (row: SuppliesItem) => (
        <span className="badge bg-primary-100 text-primary-800">{row.category}</span>
      ),
    },
    {
      key: 'stock',
      header: '库存',
      render: (row: SuppliesItem) => {
        const isLow = row.stock <= row.minStock;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
              {row.stock} {row.unit}
            </span>
            {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      key: 'minStock',
      header: '最低库存',
      render: (row: SuppliesItem) => `${row.minStock} ${row.unit}`,
    },
    {
      key: 'price',
      header: '售价',
      render: (row: SuppliesItem) => formatCurrency(row.price),
    },
    {
      key: 'cost',
      header: '成本',
      render: (row: SuppliesItem) => formatCurrency(row.cost),
    },
    {
      key: 'supplier',
      header: '供应商',
      render: (row: SuppliesItem) => row.supplier || '-',
    },
    {
      key: 'lastPurchaseDate',
      header: '最近采购',
      render: (row: SuppliesItem) => row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : '-',
    },
    {
      key: 'actions',
      header: '操作',
      width: '180px',
      render: (row: SuppliesItem) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedItem(row);
              setUsageForm(prev => ({ ...prev, itemId: row.id }));
              setShowUsageModal(true);
            }}
            className="btn-sm btn-primary"
          >
            <ShoppingCart className="w-3 h-3 mr-1" /> 领用
          </button>
          <button
            onClick={() => {
              setStockForm(prev => ({ ...prev, itemId: row.id, supplier: row.supplier || '' }));
              setShowStockModal(true);
            }}
            className="btn-sm btn-secondary"
          >
            <TrendingUp className="w-3 h-3 mr-1" /> 入库
          </button>
        </div>
      ),
    },
  ];

  const usageColumns = [
    {
      key: 'itemName',
      header: '物品名称',
    },
    {
      key: 'deceased',
      header: '使用对象',
      render: (row: SuppliesUsage) => {
        const order = transportOrders.find(o => o.id === row.orderId);
        const deceased = deceasedList.find(d => d.id === order?.deceasedId);
        return deceased ? deceased.name : '-';
      },
    },
    {
      key: 'quantity',
      header: '数量',
      render: (row: SuppliesUsage) => `${row.quantity}`,
    },
    {
      key: 'unitPrice',
      header: '单价',
      render: (row: SuppliesUsage) => formatCurrency(row.unitPrice),
    },
    {
      key: 'totalPrice',
      header: '金额',
      render: (row: SuppliesUsage) => (
        <span className="font-medium">{formatCurrency(row.totalPrice)}</span>
      ),
    },
    {
      key: 'usedAt',
      header: '领用时间',
      render: (row: SuppliesUsage) => formatDate(row.usedAt, 'YYYY-MM-DD HH:mm'),
    },
    {
      key: 'operator',
      header: '操作人',
    },
    {
      key: 'remark',
      header: '备注',
      render: (row: SuppliesUsage) => row.remark || '-',
    },
  ];

  const lowStockItems = supplies.filter(item => item.stock <= item.minStock);
  const totalValue = supplies.reduce((sum, item) => sum + item.stock * item.cost, 0);
  const totalUsageValue = suppliesUsages.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="礼仪用品"
        subtitle="寿衣花圈库存管理、骨灰盒领用登记和物资采购入库"
        action={{
          label: '物品领用',
          onClick: () => setShowUsageModal(true),
        }}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supplies.length}</p>
          <p className="text-sm text-gray-500">物品种类</p>
        </div>
        <div className="card p-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
          <p className="text-sm text-gray-500">库存预警</p>
        </div>
        <div className="card p-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-2">
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          <p className="text-sm text-gray-500">库存总值</p>
        </div>
        <div className="card p-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalUsageValue)}</p>
          <p className="text-sm text-gray-500">累计领用</p>
        </div>
      </div>

      {/* 库存预警 */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800">库存预警</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span key={item.id} className="bg-white text-red-700 px-3 py-1 rounded-full text-sm border border-red-200">
                {item.name}：仅剩 {item.stock} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 标签切换 */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'stock'
              ? 'bg-white text-primary-800 border border-b-0 border-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('stock')}
        >
          库存管理
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'usage'
              ? 'bg-white text-primary-800 border border-b-0 border-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('usage')}
        >
          领用记录
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* 筛选栏 */}
          <div className="card">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索物品名称、规格、供应商..."
                  className="input pl-10"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  className="select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">全部分类</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setShowStockModal(true)}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                采购入库
              </button>
            </div>
          </div>

          {/* 库存列表 */}
          <div className="card">
            <DataTable
              columns={stockColumns}
              data={filteredItems.sort((a, b) => a.category.localeCompare(b.category))}
              rowKey="id"
            />
          </div>
        </>
      ) : (
        /* 领用记录 */
        <div className="card">
          <DataTable
            columns={usageColumns}
            data={suppliesUsages.sort((a, b) => b.usedAt.localeCompare(a.usedAt))}
            rowKey="id"
          />
        </div>
      )}

      {/* 领用弹窗 */}
      <Modal
        isOpen={showUsageModal}
        onClose={() => {
          setShowUsageModal(false);
          setSelectedItem(null);
          setUsageForm({ orderId: '', itemId: '', quantity: 1, remark: '' });
        }}
        title="物品领用登记"
      >
        <form onSubmit={handleUsageSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">选择物品 *</label>
            <select
              className="select"
              value={usageForm.itemId}
              onChange={(e) => setUsageForm({...usageForm, itemId: e.target.value})}
              required
            >
              <option value="">请选择物品</option>
              {supplies.filter(s => s.stock > 0).map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.specification} (库存: {item.stock} {item.unit}, 单价: {formatCurrency(item.price)})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="label">关联订单 *</label>
            <select
              className="select"
              value={usageForm.orderId}
              onChange={(e) => setUsageForm({...usageForm, orderId: e.target.value})}
              required
            >
              <option value="">请选择接运订单</option>
              {availableOrders.map(order => {
                const deceased = deceasedList.find(d => d.id === order.deceasedId);
                return (
                  <option key={order.id} value={order.id}>
                    {order.orderNo} - {deceased?.name || '未知'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="label">领用数量 *</label>
            <input
              type="number"
              className="input"
              min="1"
              max={selectedItem?.stock || 999}
              value={usageForm.quantity}
              onChange={(e) => setUsageForm({...usageForm, quantity: parseInt(e.target.value) || 1})}
              required
            />
            {usageForm.itemId && (
              <p className="text-xs text-gray-500 mt-1">
                当前库存: {supplies.find(s => s.id === usageForm.itemId)?.stock || 0}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="label">备注</label>
            <textarea
              className="textarea"
              placeholder="领用说明"
              value={usageForm.remark}
              onChange={(e) => setUsageForm({...usageForm, remark: e.target.value})}
            />
          </div>

          {usageForm.itemId && usageForm.quantity > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-gray-600">领用金额：</span>
                <span className="font-semibold text-lg text-primary-800">
                  {formatCurrency((supplies.find(s => s.id === usageForm.itemId)?.price || 0) * usageForm.quantity)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowUsageModal(false);
                setSelectedItem(null);
                setUsageForm({ orderId: '', itemId: '', quantity: 1, remark: '' });
              }}
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              确认领用
            </button>
          </div>
        </form>
      </Modal>

      {/* 入库弹窗 */}
      <Modal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setStockForm({ itemId: '', quantity: 0, supplier: '' });
        }}
        title="物资采购入库"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">选择物品 *</label>
            <select
              className="select"
              value={stockForm.itemId}
              onChange={(e) => setStockForm({...stockForm, itemId: e.target.value})}
              required
            >
              <option value="">请选择物品</option>
              {supplies.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.specification} (当前库存: {item.stock} {item.unit})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="label">入库数量 *</label>
            <input
              type="number"
              className="input"
              min="1"
              value={stockForm.quantity}
              onChange={(e) => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 0})}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">供应商</label>
            <input
              type="text"
              className="input"
              placeholder="供应商名称"
              value={stockForm.supplier}
              onChange={(e) => setStockForm({...stockForm, supplier: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowStockModal(false);
                setStockForm({ itemId: '', quantity: 0, supplier: '' });
              }}
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              确认入库
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Supplies;
