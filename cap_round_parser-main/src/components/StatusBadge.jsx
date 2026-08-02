import React from 'react';

export const STATUS_CONFIG = {
  '*': {
    label: 'Betterment in Choice Code',
    shortLabel: 'Choice Betterment',
    symbol: '*',
    bg: 'bg-zinc-900',
    text: 'text-white',
    border: 'border-zinc-500',
    badgeDot: 'bg-white',
    description: 'Choice code improved in this round'
  },
  '@': {
    label: 'Betterment in Seat Type',
    shortLabel: 'Seat Betterment',
    symbol: '@',
    bg: 'bg-zinc-900',
    text: 'text-zinc-200',
    border: 'border-zinc-600',
    badgeDot: 'bg-zinc-300',
    description: 'Seat type improved in this round'
  },
  '~': {
    label: 'No Change',
    shortLabel: 'No Change',
    symbol: '~',
    bg: 'bg-zinc-950',
    text: 'text-zinc-400',
    border: 'border-zinc-700',
    badgeDot: 'bg-zinc-500',
    description: 'Retained allotment from previous round'
  },
  '^': {
    label: 'Admitted to Institute',
    shortLabel: 'Admitted',
    symbol: '^',
    bg: 'bg-zinc-800',
    text: 'text-white',
    border: 'border-zinc-600',
    badgeDot: 'bg-white',
    description: 'Candidate has already confirmed/admitted'
  },
  '&': {
    label: 'Newly Allotted',
    shortLabel: 'Newly Allotted',
    symbol: '&',
    bg: 'bg-zinc-900',
    text: 'text-zinc-100',
    border: 'border-zinc-400',
    badgeDot: 'bg-white',
    description: 'Fresh allotment in this round'
  },
  'Standard / Direct Allotment': {
    label: 'Standard / Direct Allotment',
    shortLabel: 'Standard Allotment',
    symbol: null,
    bg: 'bg-zinc-900',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
    badgeDot: 'bg-zinc-400',
    description: 'Default allotment without status flag'
  },
  'Vacant': {
    label: 'Vacant Seat',
    shortLabel: 'Vacant',
    symbol: '∅',
    bg: 'bg-black',
    text: 'text-zinc-500',
    border: 'border-zinc-800',
    badgeDot: 'bg-zinc-600',
    description: 'Seat remains vacant'
  }
};

const StatusBadge = ({ symbol, label, isVacant, showDescription = false }) => {
  let key = symbol || label || 'Standard / Direct Allotment';
  if (isVacant) key = 'Vacant';
  
  const config = STATUS_CONFIG[key] || STATUS_CONFIG['Standard / Direct Allotment'];

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${config.bg} ${config.text} ${config.border}`}
      title={showDescription ? config.description : undefined}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.badgeDot}`} />
      {config.symbol && (
        <span className="font-mono font-bold opacity-80">{config.symbol}</span>
      )}
      <span>{config.shortLabel}</span>
    </span>
  );
};

export default StatusBadge;
