import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { employeeApi, parseApiError } from '../api/employeeApi';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeForm from '../components/EmployeeForm';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorMessage from '../components/ErrorMessage';

const DEPARTMENTS = [
  'All Departments',
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all', 'active', 'inactive'

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Details Modal
  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Delete Confirmation Modal
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {};
    if (search.trim()) params.search = search.trim();
    if (selectedDepartment !== 'All Departments') params.department = selectedDepartment;
    if (selectedStatus === 'active') params.isActive = true;
    if (selectedStatus === 'inactive') params.isActive = false;

    try {
      const response = await employeeApi.getEmployees(params);
      setEmployees(response.data || []);
      setIsSimulatedMode(response.isSimulated);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [search, selectedDepartment, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  // Toast auto-dismiss
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Metrics
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.isActive).length;
    const inactive = total - active;
    const avgSalary = total > 0
      ? Math.round(employees.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0) / total)
      : 0;

    return { total, active, inactive, avgSalary };
  }, [employees]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingEmployee) {
        await employeeApi.updateEmployee(editingEmployee.id, payload);
        setSuccessMessage(`Successfully updated employee: ${payload.fullName}`);
      } else {
        await employeeApi.createEmployee(payload);
        setSuccessMessage(`Successfully created new employee: ${payload.fullName}`);
      }
      setIsFormOpen(false);
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setIsDeleting(true);
    setError(null);

    try {
      await employeeApi.deleteEmployee(deletingEmployee.id);
      setSuccessMessage(`Successfully deleted employee: ${deletingEmployee.fullName}`);
      setDeletingEmployee(null);
      await fetchEmployees();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="ems-layout">
      {/* Top Banner for Architecture Transparency */}
      {isSimulatedMode && (
        <div className="demo-banner">
          <div className="demo-banner-content">
            <span className="demo-badge">LIVE DEMO MODE</span>
            <span>
              Running on client-side simulation. All CRUD operations persist in in-browser storage. 
              The production ASP.NET Core 8 Web API, EF Core configurations, SQL Server migrations, and xUnit test suite are available in the solution backend.
            </span>
          </div>
          <a
            href="https://github.com/jatinlekkala99-dev/Jatinlekkala-Portfolio"
            target="_blank"
            rel="noreferrer"
            className="demo-link"
          >
            View C# Backend Code →
          </a>
        </div>
      )}

      {/* Main Container */}
      <div className="ems-container">
        {/* Header Section */}
        <header className="ems-header">
          <div className="header-titles">
            <div className="logo-badge">
              <span className="logo-icon">🏢</span>
              <span>ENTERPRISE EMS</span>
            </div>
            <h1>Employee Management System</h1>
            <p className="subtitle">
              ASP.NET Core Web API + Entity Framework Core + SQL Server + React Enterprise Architecture
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary btn-add" onClick={handleOpenCreate}>
              <span className="plus-icon">+</span> Add Employee
            </button>
          </div>
        </header>

        {/* Global Alert Messages */}
        {successMessage && (
          <div className="alert-banner alert-success">
            <div className="alert-content">
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
            <button className="btn-icon" onClick={() => setSuccessMessage(null)}>✕</button>
          </div>
        )}

        <ErrorMessage message={error} onDismiss={() => setError(null)} onRetry={fetchEmployees} />

        {/* Metrics Overview Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Total Employees</span>
            <div className="metric-value">{stats.total}</div>
            <span className="metric-subtext">Registered in database</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Active Employees</span>
            <div className="metric-value text-success">{stats.active}</div>
            <span className="metric-subtext">On active payroll</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Inactive Employees</span>
            <div className="metric-value text-muted">{stats.inactive}</div>
            <span className="metric-subtext">Archived or on leave</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Average Annual Salary</span>
            <div className="metric-value font-mono">
              ${stats.avgSalary.toLocaleString()}
            </div>
            <span className="metric-subtext">Across all departments</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="filter-panel">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-search" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="filters-row">
            <div className="filter-item">
              <label>Department:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {(search || selectedDepartment !== 'All Departments' || selectedStatus !== 'all') && (
              <button
                className="btn-reset"
                onClick={() => {
                  setSearch('');
                  setSelectedDepartment('All Departments');
                  setSelectedStatus('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="table-card">
          {loading ? (
            <LoadingIndicator message="Retrieving employee records from database..." />
          ) : (
            <EmployeeTable
              employees={employees}
              onView={(emp) => setViewingEmployee(emp)}
              onEdit={handleOpenEdit}
              onDelete={(emp) => setDeletingEmployee(emp)}
            />
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <EmployeeForm
        isOpen={isFormOpen}
        employee={editingEmployee}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* View Details Modal */}
      {viewingEmployee && (
        <div className="modal-overlay" onClick={() => setViewingEmployee(null)}>
          <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <span className="modal-badge">DETAILS</span>
                <h2>Employee Record</h2>
              </div>
              <button className="btn-close" onClick={() => setViewingEmployee(null)}>✕</button>
            </div>
            <div className="modal-body details-body">
              <div className="details-header">
                <div className="avatar-large">
                  {viewingEmployee.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{viewingEmployee.fullName}</h3>
                  <p className="text-muted">{viewingEmployee.email}</p>
                </div>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Employee ID</span>
                  <span className="detail-value font-mono">#{viewingEmployee.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{viewingEmployee.department}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Annual Salary</span>
                  <span className="detail-value font-mono">
                    ${Number(viewingEmployee.salary).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Employment Status</span>
                  <span className="detail-value">
                    <span className={`badge ${viewingEmployee.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {viewingEmployee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">Created At (UTC)</span>
                  <span className="detail-value text-muted">
                    {new Date(viewingEmployee.createdAtUtc).toUTCString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setViewingEmployee(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const toEdit = viewingEmployee;
                  setViewingEmployee(null);
                  handleOpenEdit(toEdit);
                }}
              >
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="modal-overlay" onClick={() => !isDeleting && setDeletingEmployee(null)}>
          <div className="modal-dialog modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <span className="modal-badge badge-danger">CONFIRMATION</span>
                <h2>Delete Employee</h2>
              </div>
              <button
                className="btn-close"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete this employee record?</p>
              <div className="delete-target-card">
                <strong>{deletingEmployee.fullName}</strong>
                <span>{deletingEmployee.email}</span>
                <span className="text-muted text-sm">{deletingEmployee.department} Department</span>
              </div>
              <p className="text-danger-note">
                ⚠️ This action cannot be undone and will delete the record from SQL Server.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
