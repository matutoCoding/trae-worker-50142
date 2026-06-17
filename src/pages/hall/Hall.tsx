import React, { useState } from 'react';
import { Plus, Search, Filter, Building2, Users, Clock, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/store';
import { formatDateTime, formatDate, getToday, getNow } from '@/utils/dateUtils';
import { formatCurrency, generateId } from '@/utils/formatUtils';
import { HallBooking } from '@/types';

const Hall: React.FC = () => {
  const { halls, hallBookings, staffs, transportOrders, deceasedList, addHallBooking, updateHallBooking } = useAppStore();
  
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<HallBooking | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'halls'>('bookings');

  const [formData, setFormData] = useState({
    orderId: '',
    hallId: '',
    startTime: '',
    endTime: '',
    hostId: '',
    ceremonyType: '',
    remark: '',
  });

  const hosts = staffs.filter(s => s.role === '司仪' && s.status === '在岗');
  const availableOrders = transportOrders.filter(o => o.status !== '已取消');

  const filteredBookings = hallBookings.filter(booking => {
    const hall = halls.find(h => h.id === booking.hallId);
    const deceased = deceasedList.find(d => d.id === transportOrders.find(o => o.id === booking.orderId)?.deceasedId);
    const matchSearch = !searchText || 
      booking.hallName.includes(searchText) ||
      deceased?.name.includes(searchText) ||
      booking.ceremonyType.includes(searchText);
    const matchType = typeFilter === 'all' || hall?.type === typeFilter;
    const matchStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hall = halls.find(h => h.id === formData.hallId);
    const host = staffs.find(s => s.id === formData.hostId);
    
    if (selectedBooking) {
      updateHallBooking(selectedBooking.id, {
        ...formData,
        hallName: hall?.name || '',
        hostName: host?.name,
      });
    } else {
      const newBooking: HallBooking = {
        id: generateId(),
        ...formData,
        hallName: hall?.name || '',
        hostName: host?.name,
        status: '待确认',
      };
      addHallBooking(newBooking);
    }
    
    setShowModal(false);
    setSelectedBooking(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      hallId: '',
      startTime: '',
      endTime: '',
      hostId: '',
      ceremonyType: '',
      remark: '',
    });
  };

  const handleStatusChange = (booking: HallBooking, status: HallBooking['status']) => {
    updateHallBooking(booking.id, { status });
  };

  const bookingsColumns = [
    {
      key: 'hallName',
      header: '厅房',
      render: (row: HallBooking) => {
        const hall = halls.find(h => h.id === row.hallId);
        return (
          <div>
            <p className="font-medium">{row.hallName}</p>
            <p className="text-xs text-gray-500">{hall?.type}</p>
          </div>
        );
      },
    },
    {
      key: 'deceased',
      header: '逝者',
      render: (row: HallBooking) => {
        const order = transportOrders.find(o => o.id === row.orderId);
        const deceased = deceasedList.find(d => d.id === order?.deceasedId);
        return deceased ? deceased.name : '-';
      },
    },
    {
      key: 'time',
      header: '使用时间',
      render: (row: HallBooking) => (
        <div className="text-sm">
          <p>{formatDateTime(row.startTime)}</p>
          <p className="text-gray-500">至 {formatDateTime(row.endTime, 'HH:mm')}</p>
        </div>
      ),
    },
    {
      key: 'ceremonyType',
      header: '仪式类型',
    },
    {
      key: 'host',
      header: '主持司仪',
      render: (row: HallBooking) => row.hostName || '-',
    },
    {
      key: 'status',
      header: '状态',
      render: (row: HallBooking) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      width: '180px',
      render: (row: HallBooking) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedBooking(row);
              const order = transportOrders.find(o => o.id === row.orderId);
              setFormData({
                orderId: row.orderId,
                hallId: row.hallId,
                startTime: row.startTime,
                endTime: row.endTime,
                hostId: row.hostId || '',
                ceremonyType: row.ceremonyType,
                remark: row.remark || '',
              });
              setShowModal(true);
            }}
            className="btn-sm btn-secondary"
          >
            编辑
          </button>
          {row.status === '待确认' && (
            <button
              onClick={() => handleStatusChange(row, '已确认')}
              className="btn-sm btn-success"
            >
              确认
            </button>
          )}
          {row.status === '已确认' && (
            <button
              onClick={() => handleStatusChange(row, '进行中')}
              className="btn-sm btn-primary"
            >
              开始
            </button>
          )}
          {row.status === '进行中' && (
            <button
              onClick={() => handleStatusChange(row, '已完成')}
              className="btn-sm btn-success"
            >
              完成
            </button>
          )}
        </div>
      ),
    },
  ];

  const ceremonyTypes = ['传统告别仪式', '现代追思会', '佛教仪式', '基督教仪式', '天主教仪式', '守灵', '其他'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="厅房调度"
        subtitle="告别厅时段预约、守灵间分配和设施使用状态监控"
        action={{
          label: '新增预约',
          onClick: () => setShowModal(true),
        }}
      />

      {/* 标签切换 */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'bookings'
              ? 'bg-white text-primary-800 border border-b-0 border-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('bookings')}
        >
          预约管理
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'halls'
              ? 'bg-white text-primary-800 border border-b-0 border-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('halls')}
        >
          厅房状态
        </button>
      </div>

      {activeTab === 'bookings' ? (
        <>
          {/* 筛选栏 */}
          <div className="card">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索厅房、逝者姓名、仪式类型..."
                  className="input pl-10"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  className="select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">全部类型</option>
                  <option value="告别厅">告别厅</option>
                  <option value="守灵间">守灵间</option>
                </select>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">全部状态</option>
                  <option value="待确认">待确认</option>
                  <option value="已确认">已确认</option>
                  <option value="进行中">进行中</option>
                  <option value="已完成">已完成</option>
                  <option value="已取消">已取消</option>
                </select>
              </div>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '今日预约', count: hallBookings.filter(b => b.startTime.startsWith(getToday())).length, color: 'bg-blue-50 text-blue-600' },
              { label: '进行中', count: hallBookings.filter(b => b.status === '进行中').length, color: 'bg-purple-50 text-purple-600' },
              { label: '待确认', count: hallBookings.filter(b => b.status === '待确认').length, color: 'bg-yellow-50 text-yellow-600' },
              { label: '今日完成', count: hallBookings.filter(b => b.status === '已完成' && b.startTime.startsWith(getToday())).length, color: 'bg-green-50 text-green-600' },
            ].map((item, idx) => (
              <div key={idx} className="card p-4">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>

          {/* 预约列表 */}
          <div className="card">
            <DataTable
              columns={bookingsColumns}
              data={filteredBookings.sort((a, b) => a.startTime.localeCompare(b.startTime))}
              rowKey="id"
            />
          </div>
        </>
      ) : (
        /* 厅房状态 */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {halls.map(hall => {
              const currentBooking = hallBookings.find(
                b => b.hallId === hall.id && 
                (b.status === '进行中' || 
                 (b.status === '已确认' && b.startTime.startsWith(getToday())))
              );
              
              return (
                <div key={hall.id} className="card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{hall.name}</h4>
                      <span className="text-sm text-gray-500">{hall.type}</span>
                    </div>
                    <StatusBadge status={hall.status} />
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>容纳 {hall.capacity} 人</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatCurrency(hall.pricePerHour)}/小时</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hall.facilities.map((f, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {currentBooking && (
                    <div className={`p-3 rounded-lg ${currentBooking.status === '进行中' ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {currentBooking.status === '进行中' ? (
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="font-medium text-sm">
                          {currentBooking.status === '进行中' ? '使用中' : '今日预约'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatDateTime(currentBooking.startTime, 'HH:mm')} - {formatDateTime(currentBooking.endTime, 'HH:mm')}
                      </p>
                      <p className="text-xs text-gray-500">{currentBooking.ceremonyType}</p>
                    </div>
                  )}

                  {!currentBooking && hall.status === '空闲' && (
                    <div className="p-3 rounded-lg bg-green-50 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">当前可预约</span>
                    </div>
                  )}

                  {hall.status === '维修中' && (
                    <div className="p-3 rounded-lg bg-red-50 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">设备维护中</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 预约弹窗 */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedBooking(null);
          resetForm();
        }}
        title={selectedBooking ? '编辑预约' : '新增厅房预约'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">关联订单 *</label>
            <select
              className="select"
              value={formData.orderId}
              onChange={(e) => setFormData({...formData, orderId: e.target.value})}
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
            <label className="label">选择厅房 *</label>
            <select
              className="select"
              value={formData.hallId}
              onChange={(e) => setFormData({...formData, hallId: e.target.value})}
              required
            >
              <option value="">请选择厅房</option>
              {halls.filter(h => h.status !== '维修中').map(hall => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} ({hall.type}, {hall.capacity}人, {formatCurrency(hall.pricePerHour)}/小时)
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">开始时间 *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">结束时间 *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">仪式类型 *</label>
              <select
                className="select"
                value={formData.ceremonyType}
                onChange={(e) => setFormData({...formData, ceremonyType: e.target.value})}
                required
              >
                <option value="">请选择</option>
                {ceremonyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">主持司仪</label>
              <select
                className="select"
                value={formData.hostId}
                onChange={(e) => setFormData({...formData, hostId: e.target.value})}
              >
                <option value="">请选择（可选）</option>
                {hosts.map(host => (
                  <option key={host.id} value={host.id}>{host.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">备注</label>
            <textarea
              className="textarea"
              placeholder="特殊要求、布置需求等"
              value={formData.remark}
              onChange={(e) => setFormData({...formData, remark: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedBooking(null);
                resetForm();
              }}
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {selectedBooking ? '保存修改' : '创建预约'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Hall;
