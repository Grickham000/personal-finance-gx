import axios from 'axios';
import { auth } from './auth';
import { CONFIG } from '../constants/config';

// Create Axios instance pointing to Azure Functions
const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Interceptor to attach Firebase Bearer token to all authenticated requests
apiClient.interceptors.request.use(
  async (config) => {
    // If it's registration, we don't need a token
    if (config.url === '/user_registration') {
      return config;
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Fetch JWT ID token from Firebase auth (force refresh if close to expiry)
        const idToken = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      } catch (err) {
        console.error('Error fetching Firebase ID token:', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response error handler (e.g., auto-logout on 401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request! Signing out...');
      await auth.signOut();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ============================================================================
// API ENDPOINTS CLIENT SERVICE
// ============================================================================

export const apiService = {
  // --- Auth / User Registration ---
  registerUser: async (email: string, password: string) => {
    const response = await apiClient.post('/user_registration', { email, password });
    return response.data;
  },

  // --- User Profile Management ---
  getUserProfile: async () => {
    const response = await apiClient.get('/user_profile');
    return response.data;
  },
  
  createUserProfile: async (profileData: {
    user_name: string;
    expense_types: string[];
    payment_methods: Array<{
      id?: string;
      name: string;
      is_immediate: boolean;
      cut_date?: number;
      days_to_pay?: number;
    }>;
    monthly_income: number;
  }) => {
    const response = await apiClient.post('/user_profile', profileData);
    return response.data;
  },

  updateUserProfile: async (id: string, profileData: any) => {
    const response = await apiClient.put(`/user_profile/${id}`, profileData);
    return response.data;
  },

  // --- Expenses (Variable) Management ---
  getExpenses: async (filters?: {
    expense_type?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await apiClient.get('/expenses', { params: filters });
    return response.data;
  },

  createExpense: async (expenseData: {
    expense: number;
    expense_type: string;
    payment_method: string;
    expense_description: string;
    expense_date: string;
    payment_method_cut_date?: number | null;
    payment_method_id?: string | null;
  }) => {
    const response = await apiClient.post('/expenses', expenseData);
    return response.data;
  },

  updateExpense: async (id: string, expenseData: any) => {
    const response = await apiClient.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },

  // --- Fixed Expenses Management ---
  getFixedExpenses: async (filters?: { fexpense_type?: string; expire?: boolean }) => {
    const response = await apiClient.get('/fixed_expenses', { params: filters });
    return response.data;
  },

  createFixedExpense: async (fixedExpenseData: {
    fixed_expense: number;
    fexpense_type: string;
    fexpense_start_date: string;
    fexpense_end_date: string;
    fexpense_description: string;
    expire: boolean;
  }) => {
    const response = await apiClient.post('/fixed_expenses', fixedExpenseData);
    return response.data;
  },

  updateFixedExpense: async (id: string, fixedExpenseData: any) => {
    const response = await apiClient.put(`/fixed_expenses/${id}`, fixedExpenseData);
    return response.data;
  },

  deleteFixedExpense: async (id: string) => {
    const response = await apiClient.delete(`/fixed_expenses/${id}`);
    return response.data;
  },

  // --- Money Balance / Cash Flow ---
  getMoneyBalance: async (month?: string) => {
    const response = await apiClient.get('/money_balance', { params: { month } });
    return response.data;
  },

  // --- Credit Card Payments ---
  getCreditCardPayments: async () => {
    const response = await apiClient.get('/credit_card_payments');
    return response.data;
  },

  createCreditCardPayment: async (paymentData: {
    payment_method_id: string;
    statement_month: string;
    payment_date: string;
    amount_paid: number;
  }) => {
    const response = await apiClient.post('/credit_card_payments', paymentData);
    return response.data;
  },

  deleteCreditCardPayment: async (id: string) => {
    const response = await apiClient.delete(`/credit_card_payments/${id}`);
    return response.data;
  },

  // --- Savings Accounts ---
  getSavingsAccounts: async () => {
    const response = await apiClient.get('/savings_accounts');
    return response.data;
  },

  createSavingsAccount: async (accountData: {
    name: string;
    interest_rate: number;
    balance: number;
    description?: string;
  }) => {
    const response = await apiClient.post('/savings_accounts', accountData);
    return response.data;
  },

  updateSavingsAccount: async (id: string, accountData: any) => {
    const response = await apiClient.put(`/savings_accounts/${id}`, accountData);
    return response.data;
  },

  deleteSavingsAccount: async (id: string) => {
    const response = await apiClient.delete(`/savings_accounts/${id}`);
    return response.data;
  },

  // --- Investments ---
  getInvestments: async (filters?: { has_end_date?: boolean; is_released?: boolean }) => {
    const response = await apiClient.get('/investments', { params: filters });
    return response.data;
  },

  createInvestment: async (investmentData: {
    name: string;
    interest_rate: number;
    amount: number;
    has_end_date: boolean;
    end_date?: string | null;
    is_released: boolean;
    description?: string;
  }) => {
    const response = await apiClient.post('/investments', investmentData);
    return response.data;
  },

  updateInvestment: async (id: string, investmentData: any) => {
    const response = await apiClient.put(`/investments/${id}`, investmentData);
    return response.data;
  },

  deleteInvestment: async (id: string) => {
    const response = await apiClient.delete(`/investments/${id}`);
    return response.data;
  },
};
