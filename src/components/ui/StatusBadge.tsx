import React from 'react';
import { getStatusColor } from '@/utils/formatUtils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span className={`status-badge ${getStatusColor(status)} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
