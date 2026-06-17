import React, { useState } from 'react';
import { Plus, Search, AlertTriangle, Calendar, Clock, RefreshCw, FileText, User, Building, Grid, List, Bell, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import StatCard from '@/components/ui/StatCard';
import { useAppStore } from '@/store';
import { formatDateTime, formatDate, getNow, getToday, isExpiringSoon, addYears } from '@/utils/dateUtils';
import { formatCurrency, generateId } from '@/utils/formatUtils';
import { AshStorage, StorageUnit, StorageStatus, UnitStatus, UnitType } from '@/types';

const Storage: React.FC = () => {
  const { ashStorages, storageUnits, transportOrders, deceasedList, addAshStorage, updateAshStorage } = useAppStore();
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'records' | 'units'>('records');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<AshStorage | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnit | null>(null);
  const [renewYears, setRenewYears] = useState(1);

  const [formData, setFormData] = useState({
    orderId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    remark: '',
  });

  const today = getToday();
  const expiringSoonCount = ashStorages.filter(s => isExpiringSoon(s.endDate, 30)).length;
  const expiredCount = ashStorages.filter(s => s.status === '已过期').length;
  const totalUnits = storageUnits.length;
  const occupiedUnits = storageUnits.filter(u => u.status === '已占用').length;
  const availableUnitsCount = storageUnits.filter(u => u.status === '空闲').length;

  const availableOrders = transportOrders.filter(o => o.status === '已完成');
  const availableUnits = storageUnits.filter(u => u.status === '空闲');

  const areas = [...new Set(storageUnits.map(u => u.area))];
  const unitTypes: UnitType[] = ['普通格', '中档格', '高档格', '家族格'];

  const filteredStorages = ashStorages.filter(storage => {
    const matchSearch = !searchText || 
      storage.deceasedName.includes(searchText) ||
      storage.unitLocation.includes(searchText) ||
      storage.contractNo.includes(searchText);
    const matchStatus = statusFilter === 'all' || storage.status === statusFilter;
    const unit = storageUnits.find(u => u.id === storage.unitId);
    const matchArea = areaFilter === 'all' || unit?.area === areaFilter;
    return matchSearch && matchStatus && matchArea;
  });

  const filteredUnits = storageUnits.filter(unit => {
    const matchSearch = !searchText || 
      unit.location.includes(searchText) ||
      unit.area.includes(searchText);
    const matchType = typeFilter === 'all' || unit.type === typeFilter;
    const matchStatus = statusFilter === 'all' || unit.status === statusFilter;
    const matchArea = areaFilter === 'all' || unit.area === areaFilter;
    return matchSearch && matchType && matchStatus && matchArea;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unit = storageUnits.find(u => u.id === formData.unitId);
    const order = transportOrders.find(o => o.id === formData.orderId);
    const deceased = deceasedList.find(d => d.id === order?.deceasedId);
    
    if (selectedStorage) {
      updateAshStorage(selectedStorage.id, {
        ...formData,
        unitLocation: unit?.location || '',
      });
    } else {
      const newStorage: AshStorage = {
        id: generateId(),
        ...formData,
        unitLocation: unit?.location || '',
        deceasedName: deceased?.name || '',
        status: '有效',
        renewCount: 0,
        contractNo: `HT${Date.now()}`,
      };
      addAshStorage(newStorage);
      if (unit) {
        unit.status = '已占用';
      }
    }
    
    setShowModal(false);
    setSelectedStorage(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      unitId: '',
      startDate: today,
      endDate: addYears(today, 1),
      remark: '',
    });
  };

  const handleRenew = () => {
    if (!selectedStorage) return;
    
    const unit = storageUnits.find(u => u.id === selectedStorage.unitId);
    const newEndDate = addYears(selectedStorage.endDate, renewYears);
    
    updateAshStorage(selectedStorage.id, {
      endDate: newEndDate,
      status: '有效',
      renewCount: selectedStorage.renewCount + 1,
      lastRenewDate: getNow(),
    });
    
    setShowRenewModal(false);
    setSelectedStorage(null);
    setRenewYears(1);
  };

  const handleTakeOut = (storage: AshStorage) => {
    updateAshStorage(storage.id, {
      status: '已取出',
    });
    const unit = storageUnits.find(u => u.id === storage.unitId);
    if (unit) {
      unit.status = '空闲';
    }
  };

  const handleEdit = (storage: AshStorage) => {
    setSelectedStorage(storage);
    setFormData({
      orderId: storage.orderId,
      unitId: storage.unitId,
      startDate: storage.startDate,
      endDate: storage.endDate,
      remark: storage.remark || '',
    });
    setShowModal(true);
  };

  const getUnitStatusColor = (status: UnitStatus) => {
    switch (status) {
      case '空闲': return 'bg-success';
      case '已占用': return 'bg-primary';
      case '维修中': return 'bg-danger';
      case '已预留': return 'bg-warning';
      default: return 'bg-gray-400';
    }
  };

  const storageColumns = [
    {
      key: 'deceasedName',
      header: '逝者姓名',
      render: (row: AshStorage) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={16} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{row.deceasedName}</p>
            <p className="text-xs text-gray-500">合同号: {row.contractNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'unitLocation',
      header: '格位位置',
      render: (row: AshStorage) => {
        const unit = storageUnits.find(u => u.id === row.unitId);
        return (
          <div>
            <p className="font-medium">{row.unitLocation}</p>
            <p className="text-xs text-gray-500">{unit?.type}</p>
          </div>
        );
      },
    },
    {
      key: 'period',
      header: '寄存期限',
      render: (row: AshStorage) => (
        <div className="text-sm">
          <p>起: {formatDate(row.startDate)}</p>
          <p>止: {formatDate(row.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: AshStorage) => {
        const isExpiring = isExpiringSoon(row.endDate, 30);
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={row.status} />
            {isExpiring && row.status === '有效' && (
              <div className="flex items-center gap-1 text-warning text-xs">
                <Bell size={12} />
                即将到期
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'renewCount',
      header: '续费次数',
      render: (row: AshStorage) => (
        <div className="text-sm">
          <p>{row.renewCount} 次</p>
          {row.lastRenewDate && (
            <p className="text-xs text-gray-500">上次: {formatDate(row.lastRenewDate)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: AshStorage) => (
        <div className="flex items-center gap-2">
          {(row.status === '有效' || row.status === '即将到期' || row.status === '已过期') && (
            <>
              <button
                onClick={() => {
                  setSelectedStorage(row);
                  setShowRenewModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90"
              >
                <RefreshCw size={12} />
                续费
              </button>
              <button
                onClick={() => handleTakeOut(row)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-danger text-white rounded hover:bg-danger/90"
              >
                <XCircle size={12} />
                取出
              </button>
            </>
          )}
          <button
            onClick={() => {
              setSelectedStorage(row);
              setShowDetailModal(true);
            }}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            详情
          </button>
        </div>
      ),
    },
  ];

  const unitColumns = [
    {
      key: 'location',
      header: '格位位置',
      render: (row: StorageUnit) => (
        <div>
          <p className="font-medium">{row.location}</p>
          <p className="text-xs text-gray-500">{row.area}区 {row.row}排 {row.col}列 {row.level}层</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: '格位类型',
      render: (row: StorageUnit) => row.type,
    },
    {
      key: 'annualFee',
      header: '年管理费',
      render: (row: StorageUnit) => formatCurrency(row.annualFee),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: StorageUnit) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getUnitStatusColor(row.status)}`} />
          <StatusBadge status={row.status} />
        </div>
      ),
    },
    {
      key: 'currentUser',
      header: '当前使用人',
      render: (row: StorageUnit) => {
        const storage = ashStorages.find(s => s.unitId === row.id && (s.status === '有效' || s.status === '即将到期'));
        return storage ? (
          <div>
            <p className="font-medium">{storage.deceasedName}</p>
            <p className="text-xs text-gray-500">至 {formatDate(storage.endDate)}</p>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="骨灰寄存"
        subtitle="管理寄存格位、寄存到期提醒和寄存续费"
        actions={
          <button
            onClick={() => {
              setSelectedStorage(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            新增寄存
          </button>
        }
      />

      {expiringSoonCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertTriangle className="text-warning" size={24} />
          <div>
            <p className="font-medium text-warning">寄存到期提醒</p>
            <p className="text-sm text-gray-600">
              有 <span className="font-bold text-warning">{expiringSoonCount}</span> 个寄存格位将在30天内到期，
              有 <span className="font-bold text-danger">{expiredCount}</span> 个寄存已过期，请及时处理。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="总格位数"
          value={totalUnits}
          icon={Grid}
          color="primary"
          subtitle={`已用: ${occupiedUnits}`}
        />
        <StatCard
          title="可用格位"
          value={availableUnitsCount}
          icon={Building}
          color="success"
          subtitle={`可用率: ${((availableUnitsCount / totalUnits) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="即将到期"
          value={expiringSoonCount}
          icon={Bell}
          color="warning"
          subtitle="30天内到期"
        />
        <StatCard
          title="已过期"
          value={expiredCount}
          icon={AlertTriangle}
          color="danger"
          subtitle="需及时处理"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'records'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <List size={18} />
            寄存记录
          </div>
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'units'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Grid size={18} />
            格位管理
          </div>
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={activeTab === 'records' ? '搜索逝者姓名、格位位置、合同号...' : '搜索格位位置、区域...'}
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
              {activeTab === 'records' ? (
                <>
                  <option value="有效">有效</option>
                  <option value="即将到期">即将到期</option>
                  <option value="已过期">已过期</option>
                  <option value="已取出">已取出</option>
                </>
              ) : (
                <>
                  <option value="空闲">空闲</option>
                  <option value="已占用">已占用</option>
                  <option value="维修中">维修中</option>
                  <option value="已预留">已预留</option>
                </>
              )}
            </select>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">全部区域</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}区</option>
              ))}
            </select>
            {activeTab === 'units' && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">全部类型</option>
                {unitTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {activeTab === 'records' ? (
          <DataTable
            columns={storageColumns}
            data={filteredStorages}
            emptyMessage="暂无寄存记录"
          />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 mb-6">
              {areas.map(area => (
                <div key={area} className="col-span-full mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">{area}区</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1">
                    {filteredUnits.filter(u => u.area === area).map(unit => (
                      <div
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit)}
                        className={`aspect-square flex items-center justify-center rounded cursor-pointer text-xs font-medium transition-all hover:scale-105 ${
                          unit.status === '空闲' ? 'bg-success/20 text-success hover:bg-success/30' :
                          unit.status === '已占用' ? 'bg-primary/20 text-primary hover:bg-primary/30' :
                          unit.status === '维修中' ? 'bg-danger/20 text-danger hover:bg-danger/30' :
                          'bg-warning/20 text-warning hover:bg-warning/30'
                        } ${selectedUnit?.id === unit.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        title={`${unit.location} - ${unit.type} - ${unit.status}`}
                      >
                        {unit.row}-{unit.col}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/20 border border-success" />
                <span className="text-sm">空闲</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20 border border-primary" />
                <span className="text-sm">已占用</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning/20 border border-warning" />
                <span className="text-sm">已预留</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-danger/20 border border-danger" />
                <span className="text-sm">维修中</span>
              </div>
            </div>

            {selectedUnit && (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-semibold mb-3">格位详情</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">格位位置</p>
                    <p className="font-medium">{selectedUnit.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">格位类型</p>
                    <p className="font-medium">{selectedUnit.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">年管理费</p>
                    <p className="font-medium">{formatCurrency(selectedUnit.annualFee)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">状态</p>
                    <StatusBadge status={selectedUnit.status} />
                  </div>
                </div>
                {selectedUnit.status === '已占用' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">当前使用信息</p>
                    {(() => {
                      const storage = ashStorages.find(s => s.unitId === selectedUnit?.id && (s.status === '有效' || s.status === '即将到期'));
                      return storage ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">使用人</p>
                            <p className="font-medium">{storage.deceasedName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">合同号</p>
                            <p className="font-medium">{storage.contractNo}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">到期日期</p>
                            <p className="font-medium">{formatDate(storage.endDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">操作</p>
                            <button
                              onClick={() => {
                                setSelectedStorage(storage);
                                setShowDetailModal(true);
                                setSelectedUnit(null);
                              }}
                              className="text-primary text-sm hover:underline"
                            >
                              查看详情
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400">无使用记录</p>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedStorage(null);
          resetForm();
        }}
        title={selectedStorage ? '编辑寄存' : '新增寄存'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联订单 <span className="text-danger">*</span>
              </label>
              <select
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                格位 <span className="text-danger">*</span>
              </label>
              <select
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="input"
                required
              >
                <option value="">请选择格位</option>
                {availableUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.location} - {unit.type} ({formatCurrency(unit.annualFee)}/年)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期 <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                到期日期 <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
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
                setSelectedStorage(null);
                resetForm();
              }}
              className="btn-outline"
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {selectedStorage ? '保存修改' : '创建寄存'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showRenewModal}
        onClose={() => {
          setShowRenewModal(false);
          setSelectedStorage(null);
          setRenewYears(1);
        }}
        title="寄存续费"
        size="sm"
      >
        {selectedStorage && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <p className="font-medium">{selectedStorage.deceasedName}</p>
              <p className="text-sm text-gray-500">{selectedStorage.unitLocation}</p>
              <p className="text-sm text-gray-500 mt-1">
                当前到期: {formatDate(selectedStorage.endDate)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                续费年限
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 10].map(years => (
                  <button
                    key={years}
                    type="button"
                    onClick={() => setRenewYears(years)}
                    className={`flex-1 py-2 rounded border-2 font-medium transition-colors ${
                      renewYears === years
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {years}年
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">续费金额</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(
                    (storageUnits.find(u => u.id === selectedStorage.unitId)?.annualFee || 0) * renewYears
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                新到期日期: {formatDate(addYears(selectedStorage.endDate, renewYears))}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRenewModal(false);
                  setSelectedStorage(null);
                  setRenewYears(1);
                }}
                className="btn-outline"
              >
                取消
              </button>
              <button onClick={handleRenew} className="btn-primary">
                确认续费
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedStorage(null);
        }}
        title="寄存详情"
        size="md"
      >
        {selectedStorage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">逝者姓名</p>
                <p className="font-semibold text-lg">{selectedStorage.deceasedName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">合同号</p>
                <p className="font-semibold">{selectedStorage.contractNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">格位位置</p>
                <p className="font-medium">{selectedStorage.unitLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">格位类型</p>
                <p className="font-medium">
                  {storageUnits.find(u => u.id === selectedStorage.unitId)?.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">开始日期</p>
                <p className="font-medium">{formatDate(selectedStorage.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">到期日期</p>
                <p className={`font-medium ${isExpiringSoon(selectedStorage.endDate, 30) ? 'text-warning' : ''}`}>
                  {formatDate(selectedStorage.endDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">当前状态</p>
                <StatusBadge status={selectedStorage.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">续费次数</p>
                <p className="font-medium">{selectedStorage.renewCount} 次</p>
              </div>
            </div>
            {selectedStorage.lastRenewDate && (
              <div>
                <p className="text-sm text-gray-500">上次续费日期</p>
                <p className="font-medium">{formatDate(selectedStorage.lastRenewDate)}</p>
              </div>
            )}
            {selectedStorage.remark && (
              <div>
                <p className="text-sm text-gray-500 mb-1">备注</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedStorage.remark}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              {(selectedStorage.status === '有效' || selectedStorage.status === '即将到期' || selectedStorage.status === '已过期') && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRenewModal(true);
                    }}
                    className="btn-primary"
                  >
                    立即续费
                  </button>
                  <button
                    onClick={() => handleTakeOut(selectedStorage)}
                    className="btn-outline text-danger border-danger hover:bg-danger/5"
                  >
                    取出骨灰
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedStorage(null);
                }}
                className="btn-outline"
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

export default Storage;
