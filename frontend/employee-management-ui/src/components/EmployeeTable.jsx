import React from 'react';

export default function EmployeeTable({
  employees,
  onView,
  onEdit,
  onDelete,
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!employees || employees.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-icon">📁</div>
        <h3>No employees found</h3>
        <p>No employee records matched your active search or filters. Try adjusting your query or click "Add Employee" to create one.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Status</th>
            <th>Created</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="table-row">
              <td className="fw-semibold">
                <div className="avatar-group">
                  <div className="avatar-circle">
                    {emp.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span>{emp.fullName}</span>
                </div>
              </td>
              <td className="text-muted">{emp.email}</td>
              <td>
                <span className="badge badge-department">{emp.department}</span>
              </td>
              <td className="font-mono">{formatCurrency(emp.salary)}</td>
              <td>
                <span className={`badge ${emp.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  <span className="dot"></span>
                  {emp.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="text-muted text-sm">{formatDate(emp.createdAtUtc)}</td>
              <td className="text-right actions-cell">
                <button
                  className="btn-action btn-view"
                  onClick={() => onView(emp)}
                  title="View Details"
                >
                  👁️ View
                </button>
                <button
                  className="btn-action btn-edit"
                  onClick={() => onEdit(emp)}
                  title="Edit Employee"
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-action btn-delete"
                  onClick={() => onDelete(emp)}
                  title="Delete Employee"
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
