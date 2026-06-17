import React, { useState } from 'react';
import { Plus, Calendar, Clock, User, Users, ChevronLeft, ChevronRight, Mic2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/store';
import { formatDate, formatTime, getWeekDates, getToday, addDays, getNow } from '@/utils/dateUtils';
import { generateId } from '@/utils/formatUtils';
import { ScheduleItem } from '@/types';

const Schedule: React.FC = () => {
  const { schedules, staffs, hallBookings, addSchedule, updateSchedule } = useAppStore();
  const [currentDate, setCurrentDate] = useState(getToday());
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');

  const [formData, setFormData] = useState({
    staffId: '',
    date: getToday(),
    startTime: '09:00',
    endTime: '11:00',
    type: '',
    orderId: '',
    remark: '',
  });

  const weekDates = getWeekDates(currentDate);
  const hosts = staffs.filter(s => s.role === '司仪' && s.status === '在岗');
  const ritualStaff = staffs.filter(s => (s.role === '司仪' || s.role === '礼仪师') && s.status === '在岗');

  const weekSchedules = schedules.filter(s => 
    weekDates.some(d => formatDate(d) === s.date)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffs.find(s => s.id === formData.staffId);
    
    if (selectedSchedule) {
      updateSchedule(selectedSchedule.id, {
        ...formData,
        staffName: staff?.name || '',
      });
    } else {
      const newSchedule: ScheduleItem = {
        id: generateId(),
        ...formData,
        staffName: staff?.name || '',
      };
      addSchedule(newSchedule);
    }
    
    setShowModal(false);
    setSelectedSchedule(null);
    setFormData({
      staffId: '',
      date: getToday(),
      startTime: '09:00',
      endTime: '11:00',
      type: '',
      orderId: '',
      remark: '',
    });
  };

  const timeSlots = Array.from({ length: 13 }, (_, i) => 
    `${String(i + 7).padStart(2, '0')}:00`
  );

  const columns = [
    {
      key: 'date',
      header: '日期',
      render: (row: ScheduleItem) => formatDate(row.date),
    },
    {
      key: 'staffName',
      header: '人员',
      render: (row: ScheduleItem) => (
        <div>
          <p className="font-medium">{row.staffName}</p>
          <p className="text-xs text-gray-500">{row.type}</p>
        </div>
      ),
    },
    {
      key: 'time',
      header: '时间',
      render: (row: ScheduleItem) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: 'orderId',
      header: '关联订单',
      render: (row: ScheduleItem) => row.orderId || '-',
    },
    {
      key: 'remark',
      header: '备注',
      render: (row: ScheduleItem) => row.remark || '-',
    },
  ];

  const scheduleTypes = ['告别仪式主持', '守灵服务', '火化仪式主持', '追悼会主持', '佛教仪式', '基督教仪式', '其他'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="治丧排期"
        subtitle="司仪主持排班、治丧流程安排和服务人员调配"
        action={{
          label: '新增排期',
          onClick: () => setShowModal(true),
        }}
      />

      {/* 视图切换和日期导航 */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              className={`btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('week')}
            >
              周视图
            </button>
            <button
              className={`btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              列表视图
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold min-w-[200px] text-center">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              className="btn-sm btn-secondary"
              onClick={() => setCurrentDate(getToday())}
            >
              今天
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'week' ? (
        /* 周视图日历 */
        <div className="card overflow-x-auto">
          <div className="grid grid-cols-8 min-w-[800px]">
            {/* 时间列 */}
            <div className="border-r border-gray-200">
              <div className="h-12 border-b border-gray-200 flex items-center justify-center font-semibold text-gray-500">
                时间
              </div>
              {timeSlots.map(time => (
                <div key={time} className="h-16 border-b border-gray-100 flex items-start justify-center pt-2 text-xs text-gray-500">
                  {time}
                </div>
              ))}
            </div>
            
            {/* 日期列 */}
            {weekDates.map((date, dateIdx) => {
              const dateStr = formatDate(date);
              const isToday = dateStr === getToday();
              const daySchedules = weekSchedules.filter(s => s.date === dateStr);
              const dayBookings = hallBookings.filter(b => b.startTime.startsWith(dateStr));
              
              return (
                <div key={dateIdx} className={`border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-primary-50/30' : ''}`}>
                  <div className={`h-12 border-b border-gray-200 flex flex-col items-center justify-center ${isToday ? 'bg-primary-100/50' : ''}`}>
                    <span className={`text-sm font-semibold ${isToday ? 'text-primary-800' : ''}`}>
                      {formatDate(date, 'MM月DD日')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(date, 'dddd')}
                    </span>
                  </div>
                  
                  <div className="relative">
                    {timeSlots.map(time => (
                      <div key={time} className="h-16 border-b border-gray-100 p-1">
                        {daySchedules
                          .filter(s => s.startTime <= time && s.endTime > time)
                          .map(schedule => (
                            <div
                              key={schedule.id}
                              className="bg-primary-100 text-primary-800 rounded px-2 py-1 text-xs mb-1 cursor-pointer hover:bg-primary-200 transition-colors"
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setFormData({
                                  staffId: schedule.staffId,
                                  date: schedule.date,
                                  startTime: schedule.startTime,
                                  endTime: schedule.endTime,
                                  type: schedule.type,
                                  orderId: schedule.orderId || '',
                                  remark: schedule.remark || '',
                                });
                                setShowModal(true);
                              }}
                            >
                              <p className="font-medium truncate">{schedule.staffName}</p>
                              <p className="text-primary-600 truncate">{schedule.type}</p>
                            </div>
                          ))}
                        
                        {dayBookings
                          .filter(b => {
                            const bookingHour = formatTime(b.startTime, 'HH:00');
                            return bookingHour === time;
                          })
                          .slice(0, 1)
                          .map(booking => (
                            <div
                              key={booking.id}
                              className="bg-accent-100 text-accent-700 rounded px-2 py-1 text-xs mb-1"
                            >
                              <p className="font-medium truncate">{booking.hallName}</p>
                              <p className="text-accent-600 truncate">{booking.ceremonyType}</p>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 列表视图 */
        <div className="card">
          <DataTable
            columns={columns}
            data={schedules.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))}
            rowKey="id"
          />
        </div>
      )}

      {/* 司仪排班状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ritualStaff.map(staff => {
          const todaySchedule = schedules.filter(
            s => s.date === getToday() && s.staffId === staff.id
          );
          
          return (
            <div key={staff.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-800" />
                </div>
                <div>
                  <p className="font-semibold">{staff.name}</p>
                  <p className="text-sm text-gray-500">{staff.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block w-2 h-2 rounded-full ${staff.status === '在岗' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm">{staff.status}</span>
              </div>
              {staff.specialty && staff.specialty.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {staff.specialty.map((spec, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                今日排班: {todaySchedule.length} 项
              </p>
              {todaySchedule.length > 0 && (
                <div className="mt-2 pt-2 border-t text-xs space-y-1">
                  {todaySchedule.map(s => (
                    <div key={s.id} className="flex justify-between">
                      <span className="text-gray-600">{s.startTime}-{s.endTime}</span>
                      <span className="text-primary-600">{s.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 排期弹窗 */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedSchedule(null);
        }}
        title={selectedSchedule ? '编辑排期' : '新增排期'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-row">
            <div className="form-group">
              <label className="label">服务人员 *</label>
              <select
                className="select"
                value={formData.staffId}
                onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                required
              >
                <option value="">请选择</option>
                {ritualStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.role}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">日期 *</label>
              <input
                type="date"
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">开始时间 *</label>
              <input
                type="time"
                className="input"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">结束时间 *</label>
              <input
                type="time"
                className="input"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">服务类型 *</label>
            <select
              className="select"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              required
            >
              <option value="">请选择</option>
              {scheduleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">关联订单号</label>
            <input
              type="text"
              className="input"
              placeholder="关联的接运订单号（可选）"
              value={formData.orderId}
              onChange={(e) => setFormData({...formData, orderId: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="label">备注</label>
            <textarea
              className="textarea"
              placeholder="特殊要求、注意事项等"
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
                setSelectedSchedule(null);
              }}
            >
              取消
            </button>
            <button type="submit" className="btn-primary">
              {selectedSchedule ? '保存修改' : '创建排期'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schedule;
