import React from 'react';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="page-header flex items-center justify-between">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.icon || <Plus className="w-4 h-4 mr-2" />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
