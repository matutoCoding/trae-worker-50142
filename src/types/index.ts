export interface Deceased {
  id: string;
  name: string;
  gender: '男' | '女';
  birthDate: string;
  deathDate: string;
  idCard: string;
  causeOfDeath: string;
  cremationCertificateNo?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  idCard?: string;
  address: string;
}

export type TransportOrderStatus = '待派车' | '已派车' | '已接运' | '已完成' | '已取消';

export interface TransportOrder {
  id: string;
  orderNo: string;
  deceasedId: string;
  familyId: string;
  pickupAddress: string;
  pickupTime: string;
  status: TransportOrderStatus;
  vehicleId?: string;
  driverId?: string;
  driverName?: string;
  vehiclePlate?: string;
  arrivalTime?: string;
  completedTime?: string;
  remark?: string;
  createdAt: string;
}

export type HallType = '告别厅' | '守灵间';
export type HallStatus = '空闲' | '使用中' | '维修中' | '已预约';

export interface Hall {
  id: string;
  name: string;
  type: HallType;
  capacity: number;
  pricePerHour: number;
  status: HallStatus;
  facilities: string[];
}

export type BookingStatus = '待确认' | '已确认' | '进行中' | '已完成' | '已取消';

export interface HallBooking {
  id: string;
  orderId: string;
  hallId: string;
  hallName: string;
  startTime: string;
  endTime: string;
  hostId?: string;
  hostName?: string;
  ceremonyType: string;
  status: BookingStatus;
  remark?: string;
}

export type FurnaceType = '普通炉' | '豪华炉' | '拣灰炉';
export type FurnaceStatus = '空闲' | '使用中' | '维修中';

export interface CremationFurnace {
  id: string;
  name: string;
  type: FurnaceType;
  status: FurnaceStatus;
  lastMaintenanceDate: string;
  totalUsageCount: number;
}

export type CremationStatus = '待火化' | '火化中' | '已完成' | '已取消';

export interface CremationSchedule {
  id: string;
  orderId: string;
  furnaceId: string;
  furnaceName: string;
  deceasedName: string;
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
  status: CremationStatus;
  ashCollected: boolean;
  collectorName?: string;
  collectorRelation?: string;
  remark?: string;
}

export type UnitType = '普通格' | '中档格' | '高档格' | '家族格';
export type UnitStatus = '空闲' | '已占用' | '维修中' | '已预留';

export interface StorageUnit {
  id: string;
  area: string;
  row: number;
  col: number;
  level: number;
  type: UnitType;
  status: UnitStatus;
  annualFee: number;
  location: string;
}

export type StorageStatus = '有效' | '即将到期' | '已过期' | '已取出';

export interface AshStorage {
  id: string;
  orderId: string;
  unitId: string;
  unitLocation: string;
  deceasedName: string;
  startDate: string;
  endDate: string;
  status: StorageStatus;
  renewCount: number;
  lastRenewDate?: string;
  contractNo: string;
  remark?: string;
}

export type SuppliesCategory = '寿衣' | '寿盒' | '花圈' | '鲜花' | '其他';

export interface SuppliesItem {
  id: string;
  name: string;
  category: SuppliesCategory;
  specification: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  unit: string;
  supplier?: string;
  lastPurchaseDate?: string;
}

export interface SuppliesUsage {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  usedAt: string;
  operator: string;
  remark?: string;
}

export type StaffRole = '司机' | '司仪' | '礼仪师' | '火化师' | '管理员';
export type StaffStatus = '在岗' | '休假' | '离岗';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  status: StaffStatus;
  specialty?: string[];
}

export type PaymentMethod = '现金' | '微信' | '支付宝' | '银行卡' | '记账';
export type PaymentStatus = '待支付' | '部分支付' | '已支付' | '已退款';
export type PaymentItemType = '接运费' | '厅房费' | '火化费' | '寄存费' | '用品费' | '服务费' | '其他';

export interface PaymentItem {
  id: string;
  name: string;
  type: PaymentItemType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNo: string;
  deceasedName: string;
  items: PaymentItem[];
  totalAmount: number;
  subsidyAmount: number;
  discountAmount: number;
  actualAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  invoiceNo?: string;
  operator: string;
  remark?: string;
  createdAt: string;
}

export type SubsidyType = '社保补贴' | '民政补贴' | '其他补贴';

export interface Subsidy {
  id: string;
  name: string;
  type: SubsidyType;
  amount: number;
  conditions: string;
  requiredDocuments: string[];
  enabled: boolean;
}

export interface ScheduleItem {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  orderId?: string;
  remark?: string;
}

export interface AppState {
  currentUser: Staff | null;
  transportOrders: TransportOrder[];
  hallBookings: HallBooking[];
  halls: Hall[];
  cremationSchedules: CremationSchedule[];
  furnaces: CremationFurnace[];
  ashStorages: AshStorage[];
  storageUnits: StorageUnit[];
  supplies: SuppliesItem[];
  suppliesUsages: SuppliesUsage[];
  payments: Payment[];
  staffs: Staff[];
  deceasedList: Deceased[];
  familyList: FamilyMember[];
  schedules: ScheduleItem[];
  subsidies: Subsidy[];
}

export interface AppActions {
  setCurrentUser: (user: Staff | null) => void;
  addTransportOrder: (order: TransportOrder) => void;
  updateTransportOrder: (id: string, updates: Partial<TransportOrder>) => void;
  addHallBooking: (booking: HallBooking) => void;
  updateHallBooking: (id: string, updates: Partial<HallBooking>) => void;
  addCremationSchedule: (schedule: CremationSchedule) => void;
  updateCremationSchedule: (id: string, updates: Partial<CremationSchedule>) => void;
  addAshStorage: (storage: AshStorage) => void;
  updateAshStorage: (id: string, updates: Partial<AshStorage>) => void;
  updateSuppliesStock: (id: string, quantity: number) => void;
  addSuppliesUsage: (usage: SuppliesUsage) => void;
  addPayment: (payment: Payment) => void;
  addSchedule: (schedule: ScheduleItem) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleItem>) => void;
  addDeceased: (deceased: Deceased) => void;
  addFamily: (family: FamilyMember) => void;
}
