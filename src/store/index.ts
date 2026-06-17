import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AppActions } from '@/types';
import { getInitialData } from '@/data/mockData';

const initialData = getInitialData();

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialData,
      
      setCurrentUser: (user) => set({ currentUser: user }),
      
      addTransportOrder: (order) =>
        set((state) => ({
          transportOrders: [order, ...state.transportOrders],
        })),
      
      updateTransportOrder: (id, updates) =>
        set((state) => ({
          transportOrders: state.transportOrders.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),
      
      addHallBooking: (booking) =>
        set((state) => ({
          hallBookings: [booking, ...state.hallBookings],
        })),
      
      updateHallBooking: (id, updates) =>
        set((state) => ({
          hallBookings: state.hallBookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      
      addCremationSchedule: (schedule) =>
        set((state) => ({
          cremationSchedules: [schedule, ...state.cremationSchedules],
        })),
      
      updateCremationSchedule: (id, updates) =>
        set((state) => ({
          cremationSchedules: state.cremationSchedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      
      addAshStorage: (storage) =>
        set((state) => ({
          ashStorages: [storage, ...state.ashStorages],
        })),
      
      updateAshStorage: (id, updates) =>
        set((state) => ({
          ashStorages: state.ashStorages.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      
      updateSuppliesStock: (id, quantity) =>
        set((state) => ({
          supplies: state.supplies.map((s) =>
            s.id === id ? { ...s, stock: s.stock + quantity } : s
          ),
        })),
      
      addSuppliesUsage: (usage) =>
        set((state) => ({
          suppliesUsages: [usage, ...state.suppliesUsages],
          supplies: state.supplies.map((s) =>
            s.id === usage.itemId ? { ...s, stock: s.stock - usage.quantity } : s
          ),
        })),
      
      addPayment: (payment) =>
        set((state) => ({
          payments: [payment, ...state.payments],
        })),
      
      addSchedule: (schedule) =>
        set((state) => ({
          schedules: [schedule, ...state.schedules],
        })),
      
      updateSchedule: (id, updates) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      
      addDeceased: (deceased) =>
        set((state) => ({
          deceasedList: [deceased, ...state.deceasedList],
        })),
      
      addFamily: (family) =>
        set((state) => ({
          familyList: [family, ...state.familyList],
        })),
    }),
    {
      name: 'funeral-service-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        transportOrders: state.transportOrders,
        hallBookings: state.hallBookings,
        halls: state.halls,
        cremationSchedules: state.cremationSchedules,
        furnaces: state.furnaces,
        ashStorages: state.ashStorages,
        storageUnits: state.storageUnits,
        supplies: state.supplies,
        suppliesUsages: state.suppliesUsages,
        payments: state.payments,
        staffs: state.staffs,
        deceasedList: state.deceasedList,
        familyList: state.familyList,
        schedules: state.schedules,
        subsidies: state.subsidies,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<typeof currentState>;
        return {
          ...currentState,
          ...persisted,
          halls: persisted.halls && persisted.halls.length > 0 ? persisted.halls : currentState.halls,
          staffs: persisted.staffs && persisted.staffs.length > 0 ? persisted.staffs : currentState.staffs,
          furnaces: persisted.furnaces && persisted.furnaces.length > 0 ? persisted.furnaces : currentState.furnaces,
          subsidies: persisted.subsidies && persisted.subsidies.length > 0 ? persisted.subsidies : currentState.subsidies,
        };
      },
    }
  )
);

export default useAppStore;
