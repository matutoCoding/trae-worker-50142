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
  actions?: ActionButton | ActionButton[] | React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, actions }) => {
  const allActions: ActionButton[] = [];
  
  if (action) {
    allActions.push(action);
  }
  
  const isActionButton = (val: unknown): val is ActionButton => {
    return typeof val === 'object' && val !== null && 'label' in val && 'onClick' in val;
  };

  const isActionButtonArray = (val: unknown): val is ActionButton[] => {
    return Array.isArray(val) && val.every(isActionButton);
  };

  if (actions) {
    if (isActionButtonArray(actions)) {
      allActions.push(...actions);
    } else if (isActionButton(actions)) {
      allActions.push(actions);
    }
  }

  const hasReactNodeActions = actions && !isActionButton(actions) && !isActionButtonArray(actions);

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
      {hasReactNodeActions && actions}
    </div>
  );
};

export default PageHeader;
