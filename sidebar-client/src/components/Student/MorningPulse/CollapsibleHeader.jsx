import { ChevronDown } from 'lucide-react';

export const CollapsibleHeader = ({
  isExpanded,
  onToggle,
  icon: Icon,
  title,
  subtitle,
  iconColor = "text-gray-600",
  className = "w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
}) => (
  <div onClick={onToggle} className={className}>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        </div>
      </div>
      <ChevronDown
        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
          }`}
      />
    </div>

  </div>
);
