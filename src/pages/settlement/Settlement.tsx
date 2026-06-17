import React, { useState } from 'react';
import { Plus, Search, FileText, Calculator, Receipt, User, Clock, DollarSign, TrendingUp, Eye, Download, Printer, Trash2, Edit2, Check } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import StatCard from '@/components/ui/StatCard';
import { useAppStore } from '@/store';
import { formatDateTime, formatDate, getNow, getToday } from '@/utils/dateUtils';
import { formatCurrency, generateId } from '@/utils/formatUtils';
import { Payment, PaymentItem } from '@/types';

const Settlement: React.FC = () => {
  const { payments, subsidies, transportOrders, deceasedList, hallBookings, cremationSchedules, ashStorages, suppliesUsages, addPayment, currentUser } = useAppStore();
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'payments' | 'subsidies' | 'archives'>('payments');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{ name: string; type: PaymentItem['type']; quantity: number; unitPrice: number }>({
    name: '',
    type: '其他',
    quantity: 1,
    unitPrice: 0,
  });

  const [formData, setFormData] = useState({
    orderId: '',
    items: [] as PaymentItem[],
    subsidyIds: [] as string[],
    discountAmount: 0,
    paymentMethod: '现金' as const,
    remark: '',
  });

  const today = getToday();
  const todayPayments = payments.filter(p => p.createdAt.startsWith(today));
  const totalRevenue = payments.filter(p => p.status === '已支付').reduce((sum, p) => sum + p.actualAmount, 0);
  const pendingPayment = payments.filter(p => p.status === '待支付').reduce((sum, p) => sum + p.actualAmount, 0);
  const totalSubsidy = payments.reduce((sum, p) => sum + p.subsidyAmount, 0);

  const availableOrders = transportOrders.filter(o => {
    const hasPayment = payments.some(p => p.orderId === o.id);
    return !hasPayment && (o.status === '已完成' || o.status === '已接运');
  });

  const filteredPayments = payments.filter(payment => {
    const deceased = deceasedList.find(d => d.id === transportOrders.find(o => o.id === payment.orderId)?.deceasedId);
    const matchSearch = !searchText || 
      payment.orderNo.includes(searchText) ||
      payment.deceasedName.includes(searchText) ||
      deceased?.name.includes(searchText);
    const matchStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const calculateOrderItems = (orderId: string): PaymentItem[] => {
    const items: PaymentItem[] = [];
    const order = transportOrders.find(o => o.id === orderId);
    if (!order) return items;

    items.push({
      id: generateId(),
      name: '遗体接运费',
      type: '接运费',
      quantity: 1,
      unitPrice: 800,
      totalPrice: 800,
    });

    const booking = hallBookings.find(b => b.orderId === orderId);
    if (booking) {
      const hall = useAppStore.getState().halls.find(h => h.id === booking.hallId);
      const hours = Math.ceil(
        (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
      );
      const price = (hall?.pricePerHour || 500) * Math.max(hours, 1);
      items.push({
        id: generateId(),
        name: `${booking.hallName}使用费`,
        type: '厅房费',
        quantity: Math.max(hours, 1),
        unitPrice: hall?.pricePerHour || 500,
        totalPrice: price,
      });
    }

    const cremation = cremationSchedules.find(c => c.orderId === orderId);
    if (cremation) {
      const furnace = useAppStore.getState().furnaces.find(f => f.id === cremation.furnaceId);
      let price = 1000;
      if (furnace?.type === '豪华炉') price = 3000;
      else if (furnace?.type === '拣灰炉') price = 5000;
      items.push({
        id: generateId(),
        name: `火化费(${furnace?.name || '普通炉'})`,
        type: '火化费',
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
      });
    }

    const storage = ashStorages.find(s => s.orderId === orderId && s.status !== '已取出');
    if (storage) {
      const unit = useAppStore.getState().storageUnits.find(u => u.id === storage.unitId);
      items.push({
        id: generateId(),
        name: '骨灰寄存费(首年)',
        type: '寄存费',
        quantity: 1,
        unitPrice: unit?.annualFee || 300,
        totalPrice: unit?.annualFee || 300,
      });
    }

    const usages = suppliesUsages.filter(u => u.orderId === orderId);
    usages.forEach(usage => {
      items.push({
        id: generateId(),
        name: usage.itemName,
        type: '用品费',
        quantity: usage.quantity,
        unitPrice: usage.unitPrice,
        totalPrice: usage.totalPrice,
      });
    });

    const hasHost = booking?.hostId;
    if (hasHost) {
      items.push({
        id: generateId(),
        name: '司仪服务费',
        type: '服务费',
        quantity: 1,
        unitPrice: 600,
        totalPrice: 600,
      });
    }

    return items;
  };

  const handleOrderSelect = (orderId: string) => {
    const items = calculateOrderItems(orderId);
    setFormData({
      ...formData,
      orderId,
      items,
      subsidyIds: [],
    });
    setSelectedOrderId(orderId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = transportOrders.find(o => o.id === formData.orderId);
    const deceased = deceasedList.find(d => d.id === order?.deceasedId);
    
    const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const subsidyAmount = formData.subsidyIds.reduce((sum, id) => {
      const subsidy = subsidies.find(s => s.id === id);
      return sum + (subsidy?.amount || 0);
    }, 0);
    const actualAmount = Math.max(0, totalAmount - subsidyAmount - formData.discountAmount);

    const newPayment: Payment = {
      id: generateId(),
      orderId: formData.orderId,
      orderNo: order?.orderNo || '',
      deceasedName: deceased?.name || '',
      items: formData.items,
      totalAmount,
      subsidyAmount,
      discountAmount: formData.discountAmount,
      actualAmount,
      paymentMethod: formData.paymentMethod,
      status: '已支付',
      paidAt: getNow(),
      invoiceNo: `FP${Date.now()}`,
      operator: currentUser?.name || '管理员',
      remark: formData.remark,
      createdAt: getNow(),
    };

    addPayment(newPayment);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      items: [],
      subsidyIds: [],
      discountAmount: 0,
      paymentMethod: '现金',
      remark: '',
    });
    setSelectedOrderId('');
    setEditingItemId(null);
    setNewItem({ name: '', type: '其他', quantity: 1, unitPrice: 0 });
  };

  const toggleSubsidy = (subsidyId: string) => {
    setFormData(prev => ({
      ...prev,
      subsidyIds: prev.subsidyIds.includes(subsidyId)
        ? prev.subsidyIds.filter(id => id !== subsidyId)
        : [...prev.subsidyIds, subsidyId],
    }));
  };

  const handleAddCustomItem = () => {
    if (!newItem.name || newItem.quantity <= 0) return;
    const item: PaymentItem = {
      id: generateId(),
      name: newItem.name,
      type: newItem.type,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalPrice: newItem.quantity * newItem.unitPrice,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    setNewItem({ name: '', type: '其他', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
    if (editingItemId === itemId) setEditingItemId(null);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<{ name: string; type: PaymentItem['type']; quantity: number; unitPrice: number }>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id !== itemId) return i;
        const next = { ...i, ...updates };
        next.totalPrice = next.quantity * next.unitPrice;
        return next;
      }),
    }));
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const selectedSubsidyAmount = formData.subsidyIds.reduce((sum, id) => {
    const subsidy = subsidies.find(s => s.id === id);
    return sum + (subsidy?.amount || 0);
  }, 0);
  const finalAmount = totalAmount - selectedSubsidyAmount - formData.discountAmount;

  const paymentColumns = [
    {
      key: 'deceasedName',
      header: '逝者姓名',
      render: (row: Payment) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={16} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{row.deceasedName}</p>
            <p className="text-xs text-gray-500">订单号: {row.orderNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: '费用明细',
      render: (row: Payment) => (
        <div className="text-sm">
          <p>总金额: {formatCurrency(row.totalAmount)}</p>
          {row.subsidyAmount > 0 && (
            <p className="text-success-600">补贴: -{formatCurrency(row.subsidyAmount)}</p>
          )}
          {row.discountAmount > 0 && (
            <p className="text-warning-600">优惠: -{formatCurrency(row.discountAmount)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'actualAmount',
      header: '实收金额',
      render: (row: Payment) => (
        <span className="text-lg font-bold text-primary-700">{formatCurrency(row.actualAmount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: '支付方式',
      render: (row: Payment) => row.paymentMethod,
    },
    {
      key: 'status',
      header: '状态',
      render: (row: Payment) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: '结算时间',
      render: (row: Payment) => formatDateTime(row.createdAt),
    },
    {
      key: 'operator',
      header: '经办人',
      render: (row: Payment) => row.operator,
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: Payment) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedPayment(row);
              setShowDetailModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1 text-xs text-primary-700 border border-primary-500 rounded hover:bg-primary-800-50"
          >
            <Eye size={12} />
            详情
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            <Printer size={12} />
            打印
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="费用结算"
        subtitle="管理丧葬补贴核算、收费明细和治丧档案查询"
        actions={
          <button
            onClick={() => {
              setSelectedPayment(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            新增结算
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="今日结算"
          value={todayPayments.length}
          icon={Receipt}
          color="primary"
          subtitle={`笔数`}
        />
        <StatCard
          title="累计营收"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          color="success"
          subtitle="已支付金额"
        />
        <StatCard
          title="待收金额"
          value={formatCurrency(pendingPayment)}
          icon={DollarSign}
          color="warning"
          subtitle="待支付"
        />
        <StatCard
          title="累计补贴"
          value={formatCurrency(totalSubsidy)}
          icon={Calculator}
          color="accent"
          subtitle="政策减免"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-primary-800 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Receipt size={18} />
            收费记录
          </div>
        </button>
        <button
          onClick={() => setActiveTab('subsidies')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'subsidies'
              ? 'bg-primary-800 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator size={18} />
            补贴政策
          </div>
        </button>
        <button
          onClick={() => setActiveTab('archives')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'archives'
              ? 'bg-primary-800 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={18} />
            治丧档案
          </div>
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="搜索订单号、逝者姓名..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">全部状态</option>
                <option value="待支付">待支付</option>
                <option value="已支付">已支付</option>
                <option value="部分支付">部分支付</option>
                <option value="已退款">已退款</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={paymentColumns}
            data={filteredPayments}
            emptyMessage="暂无收费记录"
          />
        </div>
      )}

      {activeTab === 'subsidies' && (
        <div className="card">
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">丧葬补贴政策</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subsidies.filter(s => s.enabled).map(subsidy => (
                <div
                  key={subsidy.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{subsidy.name}</h4>
                      <span className="text-xs text-gray-500">{subsidy.type}</span>
                    </div>
                    <span className="text-2xl font-bold text-success-600">
                      {formatCurrency(subsidy.amount)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">申请条件：</span>
                      {subsidy.conditions}
                    </p>
                    <p>
                      <span className="text-gray-500">所需材料：</span>
                      {subsidy.requiredDocuments.join('、')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'archives' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索逝者姓名、订单号..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {transportOrders
                .filter(o => {
                  const deceased = deceasedList.find(d => d.id === o.deceasedId);
                  return !searchText || 
                    o.orderNo.includes(searchText) ||
                    deceased?.name.includes(searchText);
                })
                .map(order => {
                  const deceased = deceasedList.find(d => d.id === order.deceasedId);
                  const family = useAppStore.getState().familyList.find(f => f.id === order.familyId);
                  const payment = payments.find(p => p.orderId === order.id);
                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-primary-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary-800-100 flex items-center justify-center">
                            <User size={24} className="text-primary-700" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{deceased?.name || '未知'}</h4>
                            <p className="text-sm text-gray-500">
                              {order.orderNo} | {deceased?.gender} | {formatDate(deceased?.deathDate || '')}
                            </p>
                            <p className="text-xs text-gray-400">
                              家属: {family?.name} ({family?.relation}) | {family?.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <StatusBadge status={order.status} />
                            {payment && (
                              <p className="text-sm text-success-600 mt-1">
                                已结算: {formatCurrency(payment.actualAmount)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment || null);
                              setSelectedOrderId(order.id);
                              setShowArchiveModal(true);
                            }}
                            className="flex items-center gap-1 px-4 py-2 text-sm text-primary-700 border border-primary-500 rounded hover:bg-primary-800-50"
                          >
                            <FileText size={16} />
                            查看档案
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPayment(null);
          resetForm();
        }}
        title="费用结算"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择订单 <span className="text-danger-600">*</span>
            </label>
            <select
              value={formData.orderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="input"
              required
            >
              <option value="">请选择订单</option>
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

          {formData.orderId && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">费用明细（可调整）</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">点击数量/单价可直接编辑</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">项目名称</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">类型</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">数量</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">单价</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">金额</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map(item => (
                        <tr key={item.id} className={editingItemId === item.id ? 'bg-primary-800-50' : ''}>
                          <td className="px-4 py-3 text-sm">
                            {editingItemId === item.id ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                                className="input !py-1 !text-sm"
                              />
                            ) : (
                              <span>{item.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {editingItemId === item.id ? (
                              <select
                                value={item.type}
                                onChange={(e) => handleUpdateItem(item.id, { type: e.target.value as PaymentItem['type'] })}
                                className="input !py-1 !text-sm"
                              >
                                <option value="接运费">接运费</option>
                                <option value="厅房费">厅房费</option>
                                <option value="火化费">火化费</option>
                                <option value="寄存费">寄存费</option>
                                <option value="用品费">用品费</option>
                                <option value="服务费">服务费</option>
                                <option value="其他">其他</option>
                              </select>
                            ) : (
                              item.type
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
                              className="w-20 text-center input !py-1 !text-sm inline-block"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, { unitPrice: Number(e.target.value) })}
                              className="w-24 text-right input !py-1 !text-sm inline-block"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(item.totalPrice)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {editingItemId === item.id ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="p-1.5 text-success-600 hover:bg-success-50 rounded"
                                  title="完成编辑"
                                >
                                  <Check size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(item.id)}
                                  className="p-1.5 text-primary-700 hover:bg-primary-800-50 rounded"
                                  title="编辑名称"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1.5 text-danger-600 hover:bg-danger-50 rounded"
                                title="删除此项"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {formData.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">
                            暂无费用项，请先选择订单或手动添加
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right font-medium">合计：</td>
                        <td className="px-4 py-3 text-right text-lg font-bold">{formatCurrency(totalAmount)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                  <h5 className="text-sm font-medium mb-3 flex items-center gap-1 text-gray-700">
                    <Plus size={14} className="text-primary-700" />
                    添加自定义费用项
                  </h5>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="项目名称，如：鲜花布置"
                        value={newItem.name}
                        onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                        className="input !py-2 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={newItem.type}
                        onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as PaymentItem['type'] }))}
                        className="input !py-2 !text-sm"
                      >
                        <option value="接运费">接运费</option>
                        <option value="厅房费">厅房费</option>
                        <option value="火化费">火化费</option>
                        <option value="寄存费">寄存费</option>
                        <option value="用品费">用品费</option>
                        <option value="服务费">服务费</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="数量"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
                        className="input !py-2 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="单价"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                        className="input !py-2 !text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        disabled={!newItem.name}
                        className="btn-primary w-full !py-2 !text-sm disabled:opacity-50"
                      >
                        + 添加
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">丧葬补贴</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {subsidies.filter(s => s.enabled).map(subsidy => (
                    <label
                      key={subsidy.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.subsidyIds.includes(subsidy.id)
                          ? 'border-success-500 bg-success-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={formData.subsidyIds.includes(subsidy.id)}
                          onChange={() => toggleSubsidy(subsidy.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium">{subsidy.name}</h5>
                            <span className="text-success-600 font-bold">{formatCurrency(subsidy.amount)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{subsidy.conditions}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优惠金额
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                      className="input pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支付方式 <span className="text-danger-600">*</span>
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="input"
                    required
                  >
                    <option value="现金">现金</option>
                    <option value="微信">微信</option>
                    <option value="支付宝">支付宝</option>
                    <option value="银行卡">银行卡</option>
                    <option value="记账">记账</option>
                  </select>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-primary-800-50 border border-primary-500-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">总金额</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  {selectedSubsidyAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-success-600">补贴减免</span>
                      <span className="text-success-600">-{formatCurrency(selectedSubsidyAmount)}</span>
                    </div>
                  )}
                  {formData.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-warning-600">优惠减免</span>
                      <span className="text-warning-600">-{formatCurrency(formData.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-primary-500-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">应收金额</span>
                      <span className="text-2xl font-bold text-primary-700">{formatCurrency(Math.max(0, finalAmount))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="input min-h-[80px]"
              placeholder="请输入备注信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setSelectedPayment(null);
                resetForm();
              }}
              className="btn-outline"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!formData.orderId}
            >
              确认结算
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPayment(null);
        }}
        title="收费详情"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-lg">{selectedPayment.deceasedName}</h4>
                <p className="text-sm text-gray-500">{selectedPayment.orderNo}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedPayment.status} />
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateTime(selectedPayment.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">费用明细</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">项目名称</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">数量</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">单价</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPayment.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">{item.name}</td>
                        <td className="px-4 py-3 text-center text-sm">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-primary-800-50 border border-primary-500-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">总金额</span>
                  <span>{formatCurrency(selectedPayment.totalAmount)}</span>
                </div>
                {selectedPayment.subsidyAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success-600">补贴减免</span>
                    <span className="text-success-600">-{formatCurrency(selectedPayment.subsidyAmount)}</span>
                  </div>
                )}
                {selectedPayment.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-warning-600">优惠减免</span>
                    <span className="text-warning-600">-{formatCurrency(selectedPayment.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-primary-500-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">实收金额</span>
                    <span className="text-2xl font-bold text-primary-700">{formatCurrency(selectedPayment.actualAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">支付方式</p>
                <p className="font-medium">{selectedPayment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500">发票号码</p>
                <p className="font-medium">{selectedPayment.invoiceNo || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">经办人</p>
                <p className="font-medium">{selectedPayment.operator}</p>
              </div>
              <div>
                <p className="text-gray-500">支付时间</p>
                <p className="font-medium">{selectedPayment.paidAt ? formatDateTime(selectedPayment.paidAt) : '-'}</p>
              </div>
            </div>

            {selectedPayment.remark && (
              <div>
                <p className="text-sm text-gray-500 mb-1">备注</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedPayment.remark}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button className="btn-outline flex items-center gap-2">
                <Printer size={16} />
                打印收据
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPayment(null);
                }}
                className="btn-primary"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setSelectedPayment(null);
          setSelectedOrderId('');
        }}
        title="治丧档案"
        size="xl"
      >
        {selectedOrderId && (
          <div className="space-y-6">
            {(() => {
              const order = transportOrders.find(o => o.id === selectedOrderId);
              const deceased = deceasedList.find(d => d.id === order?.deceasedId);
              const family = useAppStore.getState().familyList.find(f => f.id === order?.familyId);
              const booking = hallBookings.find(b => b.orderId === selectedOrderId);
              const cremation = cremationSchedules.find(c => c.orderId === selectedOrderId);
              const storage = ashStorages.find(s => s.orderId === selectedOrderId);
              const usages = suppliesUsages.filter(u => u.orderId === selectedOrderId);

              return (
                <>
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-700 mb-2">治丧档案</h3>
                    <p className="text-gray-600">档案编号: {order?.orderNo}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <User size={18} className="text-primary-700" />
                        逝者信息
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">姓名</span>
                          <span className="font-medium">{deceased?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">性别</span>
                          <span className="font-medium">{deceased?.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">出生日期</span>
                          <span className="font-medium">{formatDate(deceased?.birthDate || '')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">死亡日期</span>
                          <span className="font-medium">{formatDate(deceased?.deathDate || '')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">身份证号</span>
                          <span className="font-medium">{deceased?.idCard}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">死亡原因</span>
                          <span className="font-medium">{deceased?.causeOfDeath}</span>
                        </div>
                        {deceased?.cremationCertificateNo && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">火化证明号</span>
                            <span className="font-medium">{deceased.cremationCertificateNo}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <User size={18} className="text-primary-700" />
                        家属信息
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">姓名</span>
                          <span className="font-medium">{family?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">与逝者关系</span>
                          <span className="font-medium">{family?.relation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">联系电话</span>
                          <span className="font-medium">{family?.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">身份证号</span>
                          <span className="font-medium">{family?.idCard || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">联系地址</span>
                          <span className="font-medium text-right">{family?.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock size={18} className="text-primary-700" />
                      服务流程
                    </h4>
                    <div className="relative pl-6 space-y-4">
                      <div className="relative">
                        <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-success-500" />
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">遗体接运</p>
                            <p className="text-sm text-gray-500">{order?.pickupAddress}</p>
                          </div>
                          <span className="text-sm text-gray-500">{formatDateTime(order?.pickupTime || '')}</span>
                        </div>
                        {order?.driverName && (
                          <p className="text-sm text-gray-500">
                            司机: {order.driverName} | 车牌: {order.vehiclePlate}
                          </p>
                        )}
                        <StatusBadge status={order?.status || ''} className="mt-1" />
                      </div>

                      {booking && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-primary-800" />
                          <div className="w-0.5 h-full absolute -left-[21px] top-6 bg-gray-200" />
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{booking.ceremonyType}</p>
                              <p className="text-sm text-gray-500">{booking.hallName}</p>
                              {booking.hostName && (
                                <p className="text-sm text-gray-500">司仪: {booking.hostName}</p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                            </span>
                          </div>
                          <StatusBadge status={booking.status} className="mt-1" />
                        </div>
                      )}

                      {cremation && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-warning-500" />
                          {booking && <div className="w-0.5 h-full absolute -left-[21px] top-6 bg-gray-200" />}
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">火化</p>
                              <p className="text-sm text-gray-500">{cremation.furnaceName}</p>
                              {cremation.ashCollected && (
                                <p className="text-sm text-success-600">
                                  骨灰已领取: {cremation.collectorName} ({cremation.collectorRelation})
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{formatDateTime(cremation.scheduledTime)}</span>
                          </div>
                          <StatusBadge status={cremation.status} className="mt-1" />
                        </div>
                      )}

                      {storage && (
                        <div className="relative">
                          <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-accent-600" />
                          {cremation && <div className="w-0.5 h-full absolute -left-[21px] top-6 bg-gray-200" />}
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">骨灰寄存</p>
                              <p className="text-sm text-gray-500">{storage.unitLocation}</p>
                              <p className="text-sm text-gray-500">合同号: {storage.contractNo}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(storage.startDate)} - {formatDate(storage.endDate)}
                            </span>
                          </div>
                          <StatusBadge status={storage.status} className="mt-1" />
                        </div>
                      )}
                    </div>
                  </div>

                  {usages.length > 0 && (
                    <div className="card p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-primary-700" />
                        用品领用
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">物品名称</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">数量</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">单价</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">金额</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">领用人</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">领用时间</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {usages.map(usage => (
                              <tr key={usage.id}>
                                <td className="px-4 py-3 text-sm">{usage.itemName}</td>
                                <td className="px-4 py-3 text-center text-sm">{usage.quantity}</td>
                                <td className="px-4 py-3 text-right text-sm">{formatCurrency(usage.unitPrice)}</td>
                                <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(usage.totalPrice)}</td>
                                <td className="px-4 py-3 text-center text-sm">{usage.operator}</td>
                                <td className="px-4 py-3 text-center text-sm">{formatDateTime(usage.usedAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedPayment && (
                    <div className="card p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Receipt size={18} className="text-primary-700" />
                        费用结算
                      </h4>
                      <div className="p-4 rounded-lg bg-gray-50">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">总金额</span>
                            <span>{formatCurrency(selectedPayment.totalAmount)}</span>
                          </div>
                          {selectedPayment.subsidyAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-success-600">补贴减免</span>
                              <span className="text-success-600">-{formatCurrency(selectedPayment.subsidyAmount)}</span>
                            </div>
                          )}
                          {selectedPayment.discountAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-warning-600">优惠减免</span>
                              <span className="text-warning-600">-{formatCurrency(selectedPayment.discountAmount)}</span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">实收金额</span>
                              <span className="text-xl font-bold text-primary-700">{formatCurrency(selectedPayment.actualAmount)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-4 text-sm">
                          <span className="text-gray-500">支付方式: {selectedPayment.paymentMethod}</span>
                          <span className="text-gray-500">经办人: {selectedPayment.operator}</span>
                        </div>
                        <StatusBadge status={selectedPayment.status} className="mt-2" />
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button className="btn-outline flex items-center gap-2">
                <Download size={16} />
                导出档案
              </button>
              <button className="btn-outline flex items-center gap-2">
                <Printer size={16} />
                打印档案
              </button>
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setSelectedPayment(null);
                  setSelectedOrderId('');
                }}
                className="btn-primary"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Settlement;
