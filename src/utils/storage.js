// LocalStorage utility for persistent data
const STORAGE_KEYS = {
  GOALS: 'metaflow_goals',
  TRANSACTIONS: 'metaflow_transactions',
  ROUTINES: 'metaflow_routines',
  PROFILE: 'metaflow_profile',
};

export const storage = {
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  // Goals
  getGoals() {
    return this.get(STORAGE_KEYS.GOALS) || [];
  },
  saveGoals(goals) {
    return this.set(STORAGE_KEYS.GOALS, goals);
  },

  // Transactions
  getTransactions() {
    return this.get(STORAGE_KEYS.TRANSACTIONS) || [];
  },
  saveTransactions(transactions) {
    return this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  // Routines
  getRoutines() {
    return this.get(STORAGE_KEYS.ROUTINES) || [];
  },
  saveRoutines(routines) {
    return this.set(STORAGE_KEYS.ROUTINES, routines);
  },

  // Profile
  getProfile() {
    return this.get(STORAGE_KEYS.PROFILE) || {
      name: '',
      email: '',
      incomeSources: [],
      currency: 'CLP',
    };
  },
  saveProfile(profile) {
    return this.set(STORAGE_KEYS.PROFILE, profile);
  },
};

export { STORAGE_KEYS };
