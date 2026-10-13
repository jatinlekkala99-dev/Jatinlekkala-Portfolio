import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Seed data for client-side demo mode (when ASP.NET Core API is not locally running)
const DEFAULT_DEMO_EMPLOYEES = [
  {
    id: 1,
    fullName: "Alex Rivera",
    email: "alex.rivera@enterprise.com",
    department: "Engineering",
    salary: 115000,
    isActive: true,
    createdAtUtc: new Date(Date.now() - 86400000 * 14).toISOString()
  },
  {
    id: 2,
    fullName: "Elena Rostova",
    email: "elena.rostova@enterprise.com",
    department: "Product",
    salary: 98000,
    isActive: true,
    createdAtUtc: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 3,
    fullName: "Marcus Chen",
    email: "marcus.chen@enterprise.com",
    department: "Design",
    salary: 92000,
    isActive: true,
    createdAtUtc: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 4,
    fullName: "Samantha Vance",
    email: "samantha.vance@enterprise.com",
    department: "HR",
    salary: 76000,
    isActive: false,
    createdAtUtc: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 5,
    fullName: "Devin K. Patel",
    email: "devin.patel@enterprise.com",
    department: "Engineering",
    salary: 125000,
    isActive: true,
    createdAtUtc: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const LOCAL_STORAGE_KEY = 'ems_demo_employees_v1';

function getStoredEmployees() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_EMPLOYEES));
      return [...DEFAULT_DEMO_EMPLOYEES];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_DEMO_EMPLOYEES];
  }
}

function saveStoredEmployees(employees) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(employees));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }
}

// Request interceptor: Attach client correlation ID for tracing
apiClient.interceptors.request.use((config) => {
  const correlationId = 'web-' + Math.random().toString(36).substring(2, 10);
  config.headers['X-Correlation-ID'] = correlationId;
  return config;
});

// Centralized error parsing
export function parseApiError(error) {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 400 && data.errors) {
      // ASP.NET Core ValidationProblemDetails
      const messages = Object.values(data.errors).flat();
      return messages.join(' ');
    }
    if (data && data.detail) {
      return data.detail;
    }
    if (data && data.title) {
      return data.title;
    }
    return `Server returned HTTP ${status}`;
  }
  if (error.request) {
    return "Unable to connect to the backend API. Using client interactive simulation mode.";
  }
  return error.message || "An unexpected error occurred.";
}

// Simulated backend latency for realistic demo
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const employeeApi = {
  async getEmployees(params = {}) {
    try {
      const response = await apiClient.get('/api/employees', { params });
      return { data: response.data, isSimulated: false };
    } catch (err) {
      // In-browser mock fallback
      await delay(250);
      let list = getStoredEmployees();
      const { search, department, isActive } = params;

      if (search) {
        const q = search.toLowerCase().trim();
        list = list.filter(e => e.fullName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
      }

      if (department) {
        list = list.filter(e => e.department === department);
      }

      if (isActive !== undefined && isActive !== null && isActive !== '') {
        const boolActive = isActive === true || isActive === 'true';
        list = list.filter(e => e.isActive === boolActive);
      }

      return { data: list, isSimulated: true };
    }
  },

  async getEmployeeById(id) {
    try {
      const response = await apiClient.get(`/api/employees/${id}`);
      return { data: response.data, isSimulated: false };
    } catch (err) {
      await delay(200);
      const list = getStoredEmployees();
      const found = list.find(e => e.id === Number(id));
      if (!found) {
        throw new Error(`Employee with ID ${id} was not found.`);
      }
      return { data: found, isSimulated: true };
    }
  },

  async createEmployee(payload) {
    try {
      const response = await apiClient.post('/api/employees', payload);
      return { data: response.data, isSimulated: false };
    } catch (err) {
      // If error is genuine backend response (e.g. 409 or 400 validation error), throw it!
      if (err.response) {
        throw err;
      }
      // If network error, simulate backend validation and persistence
      await delay(300);
      const list = getStoredEmployees();
      const normalizedEmail = payload.email.trim().toLowerCase();

      if (list.some(e => e.email.toLowerCase() === normalizedEmail)) {
        const error = new Error(`An employee with email '${normalizedEmail}' already exists.`);
        error.response = { status: 409, data: { detail: `An employee with email '${normalizedEmail}' already exists.` } };
        throw error;
      }

      const newId = list.length > 0 ? Math.max(...list.map(e => e.id)) + 1 : 1;
      const created = {
        id: newId,
        fullName: payload.fullName.trim(),
        email: normalizedEmail,
        department: payload.department.trim(),
        salary: Number(payload.salary),
        isActive: payload.isActive ?? true,
        createdAtUtc: new Date().toISOString()
      };

      list.unshift(created);
      saveStoredEmployees(list);
      return { data: created, isSimulated: true };
    }
  },

  async updateEmployee(id, payload) {
    try {
      const response = await apiClient.put(`/api/employees/${id}`, payload);
      return { data: response.data, isSimulated: false };
    } catch (err) {
      if (err.response) {
        throw err;
      }
      await delay(300);
      const list = getStoredEmployees();
      const numId = Number(id);
      const index = list.findIndex(e => e.id === numId);

      if (index === -1) {
        const error = new Error(`Employee with ID ${id} was not found.`);
        error.response = { status: 404, data: { detail: `Employee with ID ${id} was not found.` } };
        throw error;
      }

      const normalizedEmail = payload.email.trim().toLowerCase();
      if (list.some(e => e.id !== numId && e.email.toLowerCase() === normalizedEmail)) {
        const error = new Error(`An employee with email '${normalizedEmail}' already exists.`);
        error.response = { status: 409, data: { detail: `An employee with email '${normalizedEmail}' already exists.` } };
        throw error;
      }

      const updated = {
        ...list[index],
        fullName: payload.fullName.trim(),
        email: normalizedEmail,
        department: payload.department.trim(),
        salary: Number(payload.salary),
        isActive: payload.isActive
      };

      list[index] = updated;
      saveStoredEmployees(list);
      return { data: updated, isSimulated: true };
    }
  },

  async deleteEmployee(id) {
    try {
      await apiClient.delete(`/api/employees/${id}`);
      return { success: true, isSimulated: false };
    } catch (err) {
      if (err.response) {
        throw err;
      }
      await delay(300);
      const list = getStoredEmployees();
      const numId = Number(id);
      const filtered = list.filter(e => e.id !== numId);

      if (filtered.length === list.length) {
        const error = new Error(`Employee with ID ${id} was not found.`);
        error.response = { status: 404, data: { detail: `Employee with ID ${id} was not found.` } };
        throw error;
      }

      saveStoredEmployees(filtered);
      return { success: true, isSimulated: true };
    }
  }
};
