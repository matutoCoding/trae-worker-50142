import React from 'react';
import {
  Truck,
  Building2,
  Flame,
  Archive,
  AlertTriangle,
  Clock,
  Users,
  DollarSign,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store';
import { formatDateTime, getToday } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatUtils';

const Dashboard: React.FC = () => {
  const {
    transportOrders,
    hallBookings,
    cremationSchedules,
    ashStorages,
    payments,
    staffs,
    halls,
  } = useAppStore();

  const todayOrders = transportOrders.filter(
    (o) => o.pickupTime.startsWith(getToday())
  );
  const pendingTransport = transportOrders.filter((o) => o.status === '待派车');
  const expiringSoon = ashStorages.filter(
    (s) => s.status === '即将到期' || s.status === '已过期'
  );
  const todayCremation = cremationSchedules.filter(
    (s) => s.scheduledTime.startsWith(getToday())
  );
  const pendingPayment = payments.filter((p) => p.status === '待支付');
  const onDutyStaff = staffs.filter((s) => s.status === '在岗');

  const weeklyData = [
    { day: '周一', 接运: 8, 火化: 6 },
    { day: '周二', 接运: 12, 火化: 10 },
    { day: '周三', 接运: 6, 火化: 5 },
    { day: '周四', 接运: 9, 火化: 7 },
    { day: '周五', 接运: 11, 火化: 9 },
    { day: '周六', 接运: 5, 火化: 4 },
    { day: '今日', 接运: todayOrders.length, 火化: todayCremation.length },
  ];

  const revenueData = [
    { month: '1月', 收入: 125000 },
    { month: '2月', 收入: 142000 },
    { month: '3月', 收入: 138000 },
    { month: '4月', 收入: 156000 },
    { month: '5月', 收入: 168000 },
    { month: '6月', 收入: 175000 },
  ];

  const serviceTypeData = [
    { name: '接运服务', value: 35 },
    { name: '厅房使用', value: 25 },
    { name: '火化服务', value: 20 },
    { name: '骨灰寄存', value: 12 },
    { name: '礼仪用品', value: 8 },
  ];

  const COLORS = ['#1E3A5F', '#C9A962', '#334E68', '#486581', '#627D98'];

  const recentOrdersColumns = [
    {
      key: 'orderNo',
      header: '订单号',
    },
    {
      key: 'deceasedName',
      header: '逝者姓名',
      render: (row: typeof transportOrders[0]) => {
        const deceased = useAppStore.getState().deceasedList.find(
          (d) => d.id === row.deceasedId
        );
        return deceased?.name || '-';
      },
    },
    {
      key: 'pickupAddress',
      header: '接运地点',
    },
    {
      key: 'pickupTime',
      header: '接运时间',
      render: (row: typeof transportOrders[0]) => formatDateTime(row.pickupTime),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: typeof transportOrders[0]) => (
        <StatusBadge status={row.status} />
      ),
    },
  ];

  const todoItems = [
    {
      id: 1,
      title: '待派车订单',
      count: pendingTransport.length,
      description: `${pendingTransport.length} 个订单等待派车`,
      icon: Truck,
      color: 'yellow',
      link: '/transport',
    },
    {
      id: 2,
      title: '今日火化',
      count: todayCremation.length,
      description: `${todayCremation.length} 个火化安排`,
      icon: Flame,
      color: 'orange',
      link: '/cremation',
    },
    {
      id: 3,
      title: '寄存到期',
      count: expiringSoon.length,
      description: `${expiringSoon.length} 个寄存即将到期`,
      icon: AlertTriangle,
      color: 'red',
      link: '/storage',
    },
    {
      id: 4,
      title: '待收费',
      count: pendingPayment.length,
      description: `${pendingPayment.length} 笔费用待收取`,
      icon: DollarSign,
      color: 'purple',
      link: '/settlement',
    },
  ];

  const quickActions = [
    { id: 1, label: '新增接运', icon: Truck, link: '/transport' },
    { id: 2, label: '厅房预约', icon: Building2, link: '/hall' },
    { id: 3, label: '火化排程', icon: Flame, link: '/cremation' },
    { id: 4, label: '费用结算', icon: DollarSign, link: '/settlement' },
  ];

  const totalRevenue = payments.reduce((sum, p) => sum + p.actualAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        subtitle="欢迎回来，查看今日工作概览"
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日接运"
          value={todayOrders.length}
          icon={Truck}
          color="blue"
          change={{ value: '较昨日', positive: true }}
        />
        <StatCard
          title="厅房使用率"
          value={halls.length > 0 ? `${Math.round((halls.filter(h => h.status === '使用中' || h.status === '已预约').length / halls.length * 100)}%` : '0%'}
          icon={Building2}
          color="green"
          subtitle={`共 ${halls.length} 个厅房`}
        />
        <StatCard
          title="在岗人员"
          value={onDutyStaff.length}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="本月收入"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="orange"
          change={{ value: '12%', positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 待办事项 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 font-serif">待办事项</h3>
          <div className="space-y-3">
            {todoItems.map((item) => (
              <a
              key={item.id}
              href={item.link}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : item.color === 'orange' ? 'bg-orange-100 text-orange-600' : item.color === 'red' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary-800">{item.count}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </a>
          ))}
          </div>
        </div>

        {/* 本周业务统计 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 font-serif">本周业务统计</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" fontSize={12} stroke="#64748B" />
              <YAxis fontSize={12} stroke="#64748B" />
              <Tooltip />
              <Bar dataKey="接运" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="火化" fill="#C9A962" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 业务类型分布 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 font-serif">业务类型分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={serviceTypeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {serviceTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {serviceTypeData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近接运订单 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold font-serif">最近接运订单</h3>
            <a href="/transport" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              查看全部 <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <DataTable
            columns={recentOrdersColumns}
            data={transportOrders.slice(0, 5)}
            rowKey="id"
          />
        </div>

        <div className="space-y-6">
          {/* 快捷操作 */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 font-serif">快捷操作</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <a
                  key={action.id}
                  href={action.link}
                  className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <div className="p-2 bg-primary-800 text-white rounded-lg">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-primary-800">{action.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* 收入趋势 */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 font-serif">收入趋势</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" fontSize={12} stroke="#64748B" />
                <YAxis fontSize={12} stroke="#64748B" tickFormatter={(value) => `${value / 10000}万`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="收入"
                  stroke="#C9A962"
                  strokeWidth={2}
                  dot={{ fill: '#C9A962' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 今日安排 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold font-serif">今日厅房预约</h3>
          <a href="/hall" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
            查看全部 <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hallBookings.filter((b) => b.startTime.startsWith(getToday())).map((booking) => (
            <div
              key={booking.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{booking.hallName}</span>
                <StatusBadge status={booking.status} />
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatDateTime(booking.startTime)} - {booking.endTime.slice(11, 16)}
                </p>
                <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {booking.ceremonyType}
                </p>
                {booking.hostName && (
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    主持：{booking.hostName}
                  </p>
                )}
              </div>
            </div>
          ))}
          {hallBookings.filter((b) => b.startTime.startsWith(getToday())).length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
            今日暂无厅房预约
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
