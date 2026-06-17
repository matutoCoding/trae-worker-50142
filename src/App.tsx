import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/dashboard/Dashboard';
import Transport from '@/pages/transport/Transport';
import Schedule from '@/pages/schedule/Schedule';
import Hall from '@/pages/hall/Hall';
import Supplies from '@/pages/supplies/Supplies';
import Cremation from '@/pages/cremation/Cremation';
import Storage from '@/pages/storage/Storage';
import Settlement from '@/pages/settlement/Settlement';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="transport" element={<Transport />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="hall" element={<Hall />} />
        <Route path="supplies" element={<Supplies />} />
        <Route path="cremation" element={<Cremation />} />
        <Route path="storage" element={<Storage />} />
        <Route path="settlement" element={<Settlement />} />
      </Route>
    </Routes>
  );
};

export default App;
