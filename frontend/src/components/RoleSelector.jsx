import React from 'react';

const ROLES = [
  { id: 'all', emoji: '🌎' },
  { id: 'student', emoji: '🎓' },
  { id: 'investor', emoji: '💼' },
  { id: 'founder', emoji: '🚀' },
];

export default function RoleSelector({ role, onRoleChange, i18n }) {
  return (
    <div className="role-pill-container" id="role-selector">
      {ROLES.map((r) => (
        <button
          key={r.id}
          id={`role-btn-${r.id}`}
          className={`role-btn ${role === r.id ? 'active' : ''}`}
          onClick={() => onRoleChange(r.id)}
        >
          <span className="role-icon">{r.emoji}</span>
          <span className="role-label">{i18n.roles[r.id]}</span>
        </button>
      ))}
    </div>
  );
}
