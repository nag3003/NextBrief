import React from 'react';

const ROLES = [
  { id: 'all', emoji: '🌎', label: 'All' },
  { id: 'student', emoji: '🎓', label: 'Student' },
  { id: 'investor', emoji: '💼', label: 'Investor' },
  { id: 'founder', emoji: '🚀', label: 'Founder' },
];

export default function RoleSelector({ role, onRoleChange }) {
  return (
    <div className="role-selector" id="role-selector">
      {ROLES.map((r) => (
        <button
          key={r.id}
          id={`role-btn-${r.id}`}
          className={`role-selector__btn ${role === r.id ? 'role-selector__btn--active' : ''}`}
          onClick={() => onRoleChange(r.id)}
        >
          <span>{r.emoji}</span>
          <span>{r.label}</span>
        </button>
      ))}
    </div>
  );
}
