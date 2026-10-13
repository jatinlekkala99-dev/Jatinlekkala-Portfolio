import React, { useState, useEffect } from 'react';

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'HR',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Legal'
];

export default function EmployeeForm({
  employee, // null for create, object for edit
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const isEditMode = Boolean(employee);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Engineering',
    salary: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || '',
        email: employee.email || '',
        department: employee.department || 'Engineering',
        salary: employee.salary !== undefined ? String(employee.salary) : '',
        isActive: employee.isActive ?? true,
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        department: 'Engineering',
        salary: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    } else if (formData.email.trim().length > 150) {
      newErrors.email = 'Email cannot exceed 150 characters.';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required.';
    }

    const parsedSalary = parseFloat(formData.salary);
    if (formData.salary === '' || isNaN(parsedSalary)) {
      newErrors.salary = 'Salary is required and must be a valid number.';
    } else if (parsedSalary <= 0) {
      newErrors.salary = 'Salary must be greater than zero.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      department: formData.department.trim(),
      salary: parseFloat(formData.salary),
      isActive: formData.isActive,
    };

    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-badge">{isEditMode ? 'EDIT' : 'NEW'}</span>
            <h2>{isEditMode ? 'Edit Employee Details' : 'Add New Employee'}</h2>
          </div>
          <button className="btn-close" onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name <span className="req">*</span></label>
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Sarah Connor"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={errors.fullName ? 'input-error' : ''}
                disabled={isSubmitting}
                maxLength={100}
                autoFocus
              />
              {errors.fullName && <p className="field-error">{errors.fullName}</p>}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="email">Email Address <span className="req">*</span></label>
              <input
                id="email"
                type="email"
                placeholder="e.g. sarah.connor@enterprise.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'input-error' : ''}
                disabled={isSubmitting}
                maxLength={150}
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
              <span className="field-hint">Must be unique across all active and inactive employees.</span>
            </div>

            {/* Department */}
            <div className="form-row">
              <div className="form-group col-6">
                <label htmlFor="department">Department <span className="req">*</span></label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={isSubmitting}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="field-error">{errors.department}</p>}
              </div>

              {/* Salary */}
              <div className="form-group col-6">
                <label htmlFor="salary">Annual Salary (USD) <span className="req">*</span></label>
                <input
                  id="salary"
                  type="number"
                  step="1000"
                  min="1"
                  placeholder="e.g. 95000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className={errors.salary ? 'input-error' : ''}
                  disabled={isSubmitting}
                />
                {errors.salary && <p className="field-error">{errors.salary}</p>}
              </div>
            </div>

            {/* Status (IsActive) */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={isSubmitting}
                />
                <span className="checkbox-custom"></span>
                <span>Active Employee (Eligible for active payroll and organizational assignment)</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span> Saving...
                </span>
              ) : isEditMode ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
