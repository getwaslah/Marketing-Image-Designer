
import React from 'react';
import { MarketingStyle } from '../types';

interface StyleCardProps {
  style: MarketingStyle;
  isSelected: boolean;
  onClick: () => void;
}

const StyleCard: React.FC<StyleCardProps> = ({ style, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-right flex flex-col gap-2 ${
        isSelected
          ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100'
          : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
      }`}
    >
      <div className="text-3xl mb-1">{style.icon}</div>
      <h3 className="font-bold text-gray-800 text-lg leading-tight">{style.name}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{style.description}</p>
    </button>
  );
};

export default StyleCard;
