import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Truck, MapPin, Clock, User, Phone, FileText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/store';
import { formatDateTime, generateOrderNo, getNow } from '@/utils/dateUtils';
import { TransportOrder, Deceased, FamilyMember } from '@/types';
import { generateId } from '@/utils/formatUtils';

const Transport: React.FC = () => {
  const {
    transportOrders,
    deceasedList,
    familyList,
    staffs,
    addTransportOrder,
    updateTransportOrder,
    addDeceased,
    addFamily,
  } = useAppStore();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TransportOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [formData, setFormData] = useState({
    deceasedName: '',
    deceasedGender: '男' as '男' | '女',
    deceasedBirthDate: '',
    deceasedDeathDate: '',
    deceasedIdCard: '',
    causeOfDeath: '',
    familyName: '',
    familyRelation: '',
    familyPhone: '',
    familyAddress: '',
    pickupAddress: '',
    pickupTime: '',
    remark: '',
  });

  const drivers = staffs.filter(s => s.role === '司机' && s.status === '在岗');

  const filteredOrders = transportOrders.filter(order => {
    const deceased = deceasedList.find(d => d.id === order.deceasedId);
    const family = familyList.find(f => f.id === order.familyId);
    const matchSearch = !searchText || 
      order.orderNo.includes(searchText) ||
      deceased?.name.includes(searchText) ||
      family?.name.includes(searchText) ||
      order.pickupAddress.includes(searchText);
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDeceased: Deceased = {
      id: generateId(),
      name: formData.deceasedName,
      gender: formData.deceasedGender,
      birthDate: formData.deceasedBirthDate,
      deathDate: formData.deceasedDeathDate,
      idCard: formData.deceasedIdCard,
      causeOfDeath: formData.causeOfDeath,
    };
    addDeceased(newDeceased);

    const newFamily: FamilyMember = {
      id: generateId(),
      name: formData.familyName,
      relation: formData.familyRelation,
      phone: formData.familyPhone,
      address: formData.familyAddress,
    };
    addFamily(newFamily);

    const newOrder: TransportOrder = {
      id: generateId(),
      orderNo: generateOrderNo('JY'),
      deceasedId: newDeceased.id,
      familyId: newFamily.id,
      pickupAddress: formData.pickupAddress,
      pickupTime: formData.pickupTime,
      status: '待派车',
      remark: formData.remark,
      createdAt: getNow(),
    };
    addTransportOrder(newOrder);

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      deceasedName: '',
      deceasedGender: '男',
      deceasedBirthDate: '',
      deceasedDeathDate: '',
      deceasedIdCard: '',
      causeOfDeath: '',
      familyName: '',
      familyRelation: '',
      familyPhone: '',
      familyAddress: '',
      pickupAddress: '',
      pickupTime: '',
      remark: '',
    });
  };

  const handleAssignDriver = (order: TransportOrder, driverId: string) => {
    const driver = staffs.find(s => s.id === driverId);
    if (driver) {
      updateTransportOrder(order.id, {
        status: '已派车',
        driverId: driver.id,
        driverName: driver.name,
        vehiclePlate: driver.id === 's2' ? '京A·88888' : '京A·66666',
      });
    }
  };

  const handleStatusUpdate = (order: TransportOrder, status: TransportOrder['status']) => {
    const updates: Partial<TransportOrder> = { status };
    if (status === '已接运') {
      updates.arrivalTime = getNow();
    } else if (status === '已完成') {
      updates.completedTime = getNow();
    }
    updateTransportOrder(order.id, updates);
  };

  const columns = [
    {
      key: 'orderNo',
      header: '订单号',
      render: (row: TransportOrder) => (
        <span className="font-mono text-sm text-primary-800">{row.orderNo}</span>
      ),
    },
    {
      key: 'deceasedName',
      header: '逝者姓名',
      render: (row: TransportOrder) => {
        const deceased = deceasedList.find(d => d.id === row.deceasedId);
        return deceased ? `${deceased.gender === '男' ? '先生' : '女士'} ${deceased.name}` : '-';
      },
    },
    {
      key: 'familyName',
      header: '家属姓名',
      render: (row: TransportOrder) => {
        const family = familyList.find(f => f.id === row.familyId);
        return family ? (
          <div>
            <p>{family.name}</p>
            <p className="text-xs text-gray-500">{family.relation}</p>
          </div>
        ) : '-';
      },
    },
    {
      key: 'pickupAddress',
      header: '接运地点',
      render: (row: TransportOrder) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{row.pickupAddress}</span>
        </div>
      ),
    },
    {
      key: 'pickupTime',
      header: '接运时间',
      render: (row: TransportOrder) => (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm">{formatDateTime(row.pickupTime)}</span>
        </div>
      ),
    },
    {
      key: 'driver',
      header: '司机/车辆',
      render: (row: TransportOrder) => (
        row.driverName ? (
          <div>
            <p className="text-sm">{row.driverName}</p>
            <p className="text-xs text-gray-500">{row.vehiclePlate}</p>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">未分配</span>
        )
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: TransportOrder) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      width: '200px',
      render: (row: TransportOrder) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedOrder(row);
              setShowDetail(true);
            }}
            className="btn-sm btn-secondary"
          >
            <Eye className="w-3 h-3 mr-1" /> 详情
          </button>
          {row.status === '待派车' && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAssignDriver(row, e.target.value);
                }
              }}
              className="btn-sm btn-primary"
              defaultValue=""
            >
              <option value="" disabled>派车</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          {row.status === '已派车' && (
            <button
              onClick={() => handleStatusUpdate(row, '已接运')}
              className="btn-sm btn-success"
            >
              确认接运
            </button>
          )}
          {row.status === '已接运' && (
            <button
              onClick={() => handleStatusUpdate(row, '已完成')}
              className="btn-sm btn-success"
            >
              完成
            </button>
          )}
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: '待派车', label: '待派车' },
    { value: '已派车', label: '已派车' },
    { value: '已接运', label: '已接运' },
    { value: '已完成', label: '已完成' },
    { value: '已取消', label: '已取消' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="接运登记"
        subtitle="管理遗体接运订单、派车和家属信息"
        action={{
          label: '新增接运',
          onClick: () => setShowModal(true),
        }}
      />

      {/* 筛选栏 */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、逝者姓名、家属姓名..."
              className="input pl-10"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '全部订单', count: transportOrders.length, color: 'bg-blue-50 text-blue-600' },
          { label: '待派车', count: transportOrders.filter(o => o.status === '待派车').length, color: 'bg-yellow-50 text-yellow-600' },
          { label: '已派车', count: transportOrders.filter(o => o.status === '已派车').length, color: 'bg-blue-50 text-blue-600' },
          { label: '已接运', count: transportOrders.filter(o => o.status === '已接运').length, color: 'bg-purple-50 text-purple-600' },
          { label: '已完成', count: transportOrders.filter(o => o.status === '已完成').length, color: 'bg-green-50 text-green-600' },
        ].map((item, idx) => (
          <div key={idx} className="card p-4">
            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
              <Truck className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.count}</p>
            <p className="text-sm text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="card">
        <DataTable
          columns={columns}
          data={filteredOrders}
          rowKey="id"
        />
      </div>

      {/* 新增接运弹窗 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="新增接运登记"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">逝者姓名 *</label>
              <input
                type="text"
                className="input"
                value={formData.deceasedName}
                onChange={(e) => setFormData({...formData, deceasedName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">性别 *</label>
              <select
                className="select"
                value={formData.deceasedGender}
                onChange={(e) => setFormData({...formData, deceasedGender: e.target.value as '男' | '女'})}
                required
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">出生日期 *</label>
              <input
                type="date"
                className="input"
                value={formData.deceasedBirthDate}
                onChange={(e) => setFormData({...formData, deceasedBirthDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">死亡日期 *</label>
              <input
                type="date"
                className="input"
                value={formData.deceasedDeathDate}
                onChange={(e) => setFormData({...formData, deceasedDeathDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">身份证号</label>
              <input
                type="text"
                className="input"
                value={formData.deceasedIdCard}
                onChange={(e) => setFormData({...formData, deceasedIdCard: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">死亡原因 *</label>
              <input
                type="text"
                className="input"
                value={formData.causeOfDeath}
                onChange={(e) => setFormData({...formData, causeOfDeath: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="divider" />
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4" /> 家属信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">家属姓名 *</label>
              <input
                type="text"
                className="input"
                value={formData.familyName}
                onChange={(e) => setFormData({...formData, familyName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">与逝者关系 *</label>
              <input
                type="text"
                className="input"
                placeholder="如：长子、配偶、女儿等"
                value={formData.familyRelation}
                onChange={(e) => setFormData({...formData, familyRelation: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">联系电话 *</label>
              <input
                type="tel"
                className="input"
                value={formData.familyPhone}
                onChange={(e) => setFormData({...formData, familyPhone: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">联系地址</label>
              <input
                type="text"
                className="input"
                value={formData.familyAddress}
                onChange={(e) => setFormData({...formData, familyAddress: e.target.value})}
              />
            </div>
          </div>

          <div className="divider" />
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> 接运信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="label">接运地点 *</label>
              <input
                type="text"
                className="input"
                placeholder="请输入详细地址"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">接运时间 *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.pickupTime}
                onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">备注</label>
              <input
                type="text"
                className="input"
                placeholder="特殊要求等"
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              提交登记
            </button>
          </div>
        </form>
      </Modal>

      {/* 订单详情弹窗 */}
      {selectedOrder && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title="接运订单详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">订单号</p>
                <p className="font-mono text-lg font-semibold">{selectedOrder.orderNo}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 逝者信息
                </h5>
                {(() => {
                  const d = deceasedList.find(d => d.id === selectedOrder.deceasedId);
                  return d ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">姓名：</span>{d.name}（{d.gender === '男' ? '先生' : '女士'}）</p>
                      <p><span className="text-gray-500">出生日期：</span>{d.birthDate}</p>
                      <p><span className="text-gray-500">死亡日期：</span>{d.deathDate}</p>
                      <p><span className="text-gray-500">死亡原因：</span>{d.causeOfDeath}</p>
                      {d.idCard && <p><span className="text-gray-500">身份证：</span>{d.idCard}</p>}
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> 家属信息
                </h5>
                {(() => {
                  const f = familyList.find(f => f.id === selectedOrder.familyId);
                  return f ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">姓名：</span>{f.name}</p>
                      <p><span className="text-gray-500">关系：</span>{f.relation}</p>
                      <p><span className="text-gray-500">电话：</span>{f.phone}</p>
                      <p><span className="text-gray-500">地址：</span>{f.address}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> 接运信息
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">接运地点</p>
                  <p className="font-medium">{selectedOrder.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-gray-500">预约接运时间</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.pickupTime)}</p>
                </div>
                {selectedOrder.arrivalTime && (
                  <div>
                    <p className="text-gray-500">实际接运时间</p>
                    <p className="font-medium">{formatDateTime(selectedOrder.arrivalTime)}</p>
                  </div>
                )}
                {selectedOrder.completedTime && (
                  <div>
                    <p className="text-gray-500">完成时间</p>
                    <p className="font-medium">{formatDateTime(selectedOrder.completedTime)}</p>
                  </div>
                )}
                {selectedOrder.driverName && (
                  <>
                    <div>
                      <p className="text-gray-500">司机</p>
                      <p className="font-medium">{selectedOrder.driverName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">车牌号</p>
                      <p className="font-medium">{selectedOrder.vehiclePlate}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedOrder.remark && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="font-semibold mb-2">备注</h5>
                <p className="text-sm">{selectedOrder.remark}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                className="btn-secondary"
                onClick={() => setShowDetail(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Transport;
