import React, { useState } from 'react';
import { Plus, Search, Flame, AlertTriangle, CheckCircle2, Package, Calendar, User, Play, Square } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import StatCard from '@/components/ui/StatCard';
import { useAppStore } from '@/store';
import { formatDateTime, formatDate, getNow, getToday } from '@/utils/dateUtils';
import { generateId } from '@/utils/formatUtils';
import { CremationSchedule, FurnaceStatus } from '@/types';

const Cremation: React.FC = () => {
  const { cremationSchedules, furnaces, transportOrders, deceasedList, addCremationSchedule, updateCremationSchedule, updateFurnace } = useAppStore();
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [furnaceFilter, setFurnaceFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CremationSchedule | null>(null);

  const [formData, setFormData] = useState({
    orderId: '',
    furnaceId: '',
    scheduledTime: '',
    remark: '',
  });

  const today = getToday();
  const todaySchedules = cremationSchedules.filter(s => s.scheduledTime.startsWith(today));
  const pendingCount = cremationSchedules.filter(s => s.status === '待火化').length;
  const inProgressCount = cremationSchedules.filter(s => s.status === '火化中').length;
  const completedTodayCount = todaySchedules.filter(s => s.status === '已完成').length;
  const pendingAshCount = cremationSchedules.filter(s => s.status === '已完成' && !s.ashCollected).length;

  const availableOrders = transportOrders.filter(o => o.status === '已完成' || o.status === '已接运');
  const availableFurnaces = furnaces.filter(f => f.status !== '维修中');

  const filteredSchedules = cremationSchedules.filter(schedule => {
    const deceased = deceasedList.find(d => d.id === transportOrders.find(o => o.id === schedule.orderId)?.deceasedId);
    const matchSearch = !searchText || 
      schedule.deceasedName.includes(searchText) ||
      schedule.furnaceName.includes(searchText) ||
      deceased?.name.includes(searchText);
    const matchStatus = statusFilter === 'all' || schedule.status === statusFilter;
    const matchFurnace = furnaceFilter === 'all' || schedule.furnaceId === furnaceFilter;
    return matchSearch && matchStatus && matchFurnace;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const furnace = furnaces.find(f => f.id === formData.furnaceId);
    const order = transportOrders.find(o => o.id === formData.orderId);
    const deceased = deceasedList.find(d => d.id === order?.deceasedId);
    
    if (selectedSchedule) {
      updateCremationSchedule(selectedSchedule.id, {
        ...formData,
        furnaceName: furnace?.name || '',
      });
    } else {
      const newSchedule: CremationSchedule = {
        id: generateId(),
        ...formData,
        furnaceName: furnace?.name || '',
        deceasedName: deceased?.name || '',
        status: '待火化',
        ashCollected: false,
      };
      addCremationSchedule(newSchedule);
    }
    
    setShowModal(false);
    setSelectedSchedule(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      furnaceId: '',
      scheduledTime: '',
      remark: '',
    });
  };

  const handleStartCremation = (schedule: CremationSchedule) => {
    updateCremationSchedule(schedule.id, {
      status: '火化中',
      startTime: getNow(),
    });
    updateFurnace(schedule.furnaceId, { status: '使用中' });
  };

  const handleCompleteCremation = (schedule: CremationSchedule) => {
    updateCremationSchedule(schedule.id, {
      status: '已完成',
      endTime: getNow(),
    });
    updateFurnace(schedule.furnaceId, { status: '空闲' });
  };

  const handleCollectAsh = (schedule: CremationSchedule) => {
    updateCremationSchedule(schedule.id, {
      ashCollected: true,
      collectorName: '家属',
      collectorRelation: '子女',
    });
    setShowDetailModal(false);
  };

  const handleEdit = (schedule: CremationSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      orderId: schedule.orderId,
      furnaceId: schedule.furnaceId,
      scheduledTime: schedule.scheduledTime,
      remark: schedule.remark || '',
    });
    setShowModal(true);
  };

  const getStatusActions = (schedule: CremationSchedule) => {
    switch (schedule.status) {
      case '待火化':
        return (
          <button
            onClick={() => handleStartCremation(schedule)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-primary-800 text-white rounded hover:bg-primary-700"
          >
            <Play size={12} />
            开始火化
          </button>
        );
      case '火化中':
        return (
          <button
            onClick={() => handleCompleteCremation(schedule)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-success-600 text-white rounded hover:bg-success-700"
          >
            <Square size={12} />
            完成火化
          </button>
        );
      case '已完成':
        if (!schedule.ashCollected) {
          return (
            <button
              onClick={() => handleCollectAsh(schedule)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-accent-600 text-white rounded hover:bg-accent-700"
            >
              <Package size={12} />
              骨灰领取
            </button>
          );
        }
        return <span className="text-xs text-gray-500">骨灰已领取</span>;
      default:
        return null;
    }
  };

  const scheduleColumns = [
    {
      key: 'deceasedName',
      header: '逝者姓名',
      render: (row: CremationSchedule) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={16} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{row.deceasedName}</p>
            <p className="text-xs text-gray-500">订单号: {row.orderId.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'furnaceName',
      header: '火化炉',
      render: (row: CremationSchedule) => {
        const furnace = furnaces.find(f => f.id === row.furnaceId);
        return (
          <div>
            <p className="font-medium">{row.furnaceName}</p>
            <p className="text-xs text-gray-500">{furnace?.type}</p>
          </div>
        );
      },
    },
    {
      key: 'scheduledTime',
      header: '排期时间',
      render: (row: CremationSchedule) => formatDateTime(row.scheduledTime),
    },
    {
      key: 'actualTime',
      header: '实际时间',
      render: (row: CremationSchedule) => (
        <div className="text-sm">
          {row.startTime && <p>开始: {formatDateTime(row.startTime)}</p>}
          {row.endTime && <p>结束: {formatDateTime(row.endTime)}</p>}
          {!row.startTime && <span className="text-gray-400">-</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: CremationSchedule) => <StatusBadge status={row.status} />,
    },
    {
      key: 'ashCollected',
      header: '骨灰领取',
      render: (row: CremationSchedule) => (
        row.ashCollected ? (
          <div className="flex items-center gap-1 text-success-600">
            <CheckCircle2 size={16} />
            <span className="text-sm">已领取</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-warning-600">
            <Package size={16} />
            <span className="text-sm">待领取</span>
          </div>
        )
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: CremationSchedule) => (
        <div className="flex items-center gap-2">
          {getStatusActions(row)}
          {row.status === '待火化' && (
            <button
              onClick={() => handleEdit(row)}
              className="px-3 py-1 text-xs text-primary-700 border border-primary-500 rounded hover:bg-primary-50"
            >
              编辑
            </button>
          )}
          <button
            onClick={() => {
              setSelectedSchedule(row);
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

  const getFurnaceStatusColor = (status: FurnaceStatus) => {
    switch (status) {
      case '空闲': return 'bg-success-500';
      case '使用中': return 'bg-warning-500';
      case '维修中': return 'bg-danger-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="火化排程"
        subtitle="管理火化炉排期、火化状态追踪和骨灰领取登记"
        actions={
          <button
            onClick={() => {
              setSelectedSchedule(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            新增排程
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="今日排期"
          value={todaySchedules.length}
          icon={Calendar}
          color="primary"
          subtitle={`待火化: ${pendingCount}`}
        />
        <StatCard
          title="火化中"
          value={inProgressCount}
          icon={Flame}
          color="warning"
          subtitle="进行中火化"
        />
        <StatCard
          title="今日完成"
          value={completedTodayCount}
          icon={CheckCircle2}
          color="success"
          subtitle="已完成火化"
        />
        <StatCard
          title="待领骨灰"
          value={pendingAshCount}
          icon={Package}
          color="danger"
          subtitle="等待家属领取"
        />
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 mb-4">火化炉状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {furnaces.map(furnace => (
            <div
              key={furnace.id}
              className={`p-4 rounded-lg border-2 ${
                furnace.status === '使用中' ? 'border-warning-500 bg-warning-50' :
                furnace.status === '维修中' ? 'border-danger-500 bg-danger-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{furnace.name}</span>
                <div className={`w-3 h-3 rounded-full ${getFurnaceStatusColor(furnace.status)}`} />
              </div>
              <p className="text-sm text-gray-500">{furnace.type}</p>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">累计使用: {furnace.totalUsageCount}次</p>
                <p className="text-xs text-gray-400">上次维护: {formatDate(furnace.lastMaintenanceDate)}</p>
              </div>
              <StatusBadge status={furnace.status} className="mt-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索逝者姓名、火化炉..."
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
              <option value="待火化">待火化</option>
              <option value="火化中">火化中</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
            </select>
            <select
              value={furnaceFilter}
              onChange={(e) => setFurnaceFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">全部火化炉</option>
              {furnaces.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={scheduleColumns}
          data={filteredSchedules}
          emptyMessage="暂无火化排程记录"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedSchedule(null);
          resetForm();
        }}
        title={selectedSchedule ? '编辑火化排程' : '新增火化排程'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联订单 <span className="text-danger-600">*</span>
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
                火化炉 <span className="text-danger-600">*</span>
              </label>
              <select
                value={formData.furnaceId}
                onChange={(e) => setFormData({ ...formData, furnaceId: e.target.value })}
                className="input"
                required
              >
                <option value="">请选择火化炉</option>
                {availableFurnaces.map(furnace => (
                  <option key={furnace.id} value={furnace.id}>
                    {furnace.name} - {furnace.type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              排期时间 <span className="text-danger-600">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              className="input"
              required
            />
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
                setSelectedSchedule(null);
                resetForm();
              }}
              className="btn-outline"
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {selectedSchedule ? '保存修改' : '创建排程'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSchedule(null);
        }}
        title="火化详情"
        size="md"
      >
        {selectedSchedule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">逝者姓名</p>
                <p className="font-semibold text-lg">{selectedSchedule.deceasedName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">火化炉</p>
                <p className="font-semibold">{selectedSchedule.furnaceName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">排期时间</p>
                <p className="font-medium">{formatDateTime(selectedSchedule.scheduledTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">当前状态</p>
                <StatusBadge status={selectedSchedule.status} />
              </div>
              {selectedSchedule.startTime && (
                <div>
                  <p className="text-sm text-gray-500">开始时间</p>
                  <p className="font-medium">{formatDateTime(selectedSchedule.startTime)}</p>
                </div>
              )}
              {selectedSchedule.endTime && (
                <div>
                  <p className="text-sm text-gray-500">结束时间</p>
                  <p className="font-medium">{formatDateTime(selectedSchedule.endTime)}</p>
                </div>
              )}
            </div>
            
            {selectedSchedule.status === '已完成' && (
              <div className="p-4 rounded-lg bg-gray-50 space-y-2">
                <h4 className="font-semibold">骨灰领取信息</h4>
                {selectedSchedule.ashCollected ? (
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-500">领取人：</span>
                      {selectedSchedule.collectorName}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">与逝者关系：</span>
                      {selectedSchedule.collectorRelation}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-warning-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm">骨灰尚未领取</span>
                  </div>
                )}
              </div>
            )}

            {selectedSchedule.remark && (
              <div>
                <p className="text-sm text-gray-500 mb-1">备注</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedSchedule.remark}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSchedule(null);
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

export default Cremation;
