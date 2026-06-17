import React from 'react';
import { Plus } from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'danger' | 'success';
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ActionButton;
  actions?: ActionButton | ActionButton[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, actions }) => {
  const allActions: ActionButton[] = [];
  
  if (action) {
    allActions.push(action);
  }
  
  if (actions) {
    if (Array.isArray(actions)) {
      allActions.push(...actions);
    } else {
      allActions.push(actions);
    }
  }

  const getVariantClass = (variant?: ActionButton['variant']) => {
    switch (variant) {
      case 'outline': return 'btn-outline';
      case 'danger': return 'btn-danger';
      case 'success': return 'btn-success';
      default: return 'btn-primary';
    }
  };

  return (
    <div className="page-header flex items-center justify-between">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {allActions.length > 0 && (
        <div className="flex items-center gap-2">
          {allActions.map((act, index) => (
            <button 
              key={index} 
              onClick={act.onClick} 
              className={`flex items-center gap-2 ${getVariantClass(act.variant)}`}
            >
              {act.icon || <Plus className="w-4 h-4" />}
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
