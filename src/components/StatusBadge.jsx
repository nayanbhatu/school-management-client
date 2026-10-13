import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = String(status).trim().toUpperCase();

  let badgeClass = 'badge-neutral';
  let label = status;

  if (['APPROVED', 'PAID', 'ACTIVE', 'DELIVERED'].includes(normalized)) {
    badgeClass = 'badge-approved';
    label = normalized === 'ACTIVE' ? 'Active' : normalized;
  } else if (['PENDING', 'SIMULATED'].includes(normalized)) {
    badgeClass = 'badge-pending';
    label = normalized;
  } else if (['REJECTED', 'INACTIVE', 'FAILED', 'OVERDUE'].includes(normalized)) {
    badgeClass = 'badge-rejected';
    label = normalized === 'INACTIVE' ? 'Inactive' : normalized;
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      <span className="badge-dot" style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        display: 'inline-block'
      }} />
      {label}
    </span>
  );
};

export default StatusBadge;
