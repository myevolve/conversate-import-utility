import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, Account, Inbox } from "./api";

interface Settings {
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  autoDetectDuplicates: boolean;
  autoCleanData: boolean;
  rateLimit: number;
}

interface AppState {
  isAuthenticated: boolean;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  accounts: Account[];
  selectedAccount: Account | null;
  inboxes: Inbox[];
  selectedInbox: Inbox | null;
  settings: Settings;
  login: (email: string, password: string) => Promise<void>;
  setSelectedAccount: (account: Account) => Promise<void>;
  setSelectedInbox: (inbox: Inbox) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  batchSize: 50,
  retryAttempts: 3,
  retryDelay: 1000,
  autoDetectDuplicates: true,
  autoCleanData: true,
  rateLimit: 10,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated:
        typeof window !== "undefined"
          ? document.cookie.includes("access-token")
          : false,
      user: null,
      accounts: [],
      selectedAccount: null,
      inboxes: [],
      selectedInbox: null,
      settings: DEFAULT_SETTINGS,

      login: async (email: string, password: string) => {
        try {
          const response = await api.login(email, password);
          const userData = response.data?.data;
          if (!userData) {
            throw new Error("Invalid response from server");
          }

          // Check if user has any accounts
          const accounts = Array.isArray(userData.accounts)
            ? userData.accounts
            : [];
          console.log("Accounts:", accounts);
          if (accounts.length === 0) {
            throw new Error(
              "Your login must be associated with at least one account to use the import service.",
            );
          }

          // Store auth state and user data
          set((state) => ({
            ...state,
            isAuthenticated: true,
            user: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
            },
            accounts,
            selectedAccount: null,
            inboxes: [],
            selectedInbox: null,
          }));

          // Redirect to import page
          window.location.href = "/import";
        } catch (error) {
          console.error("Login error in store:", error);
          throw error;
        }
      },

      setSelectedAccount: async (account: Account) => {
        try {
          const inboxes = await api.getInboxes(account.id);
          console.log("Got inboxes:", inboxes);

          // If no inboxes exist, reset auth and throw error
          if (!inboxes || inboxes.length === 0) {
            get().reset(); // Log them out
            throw new Error(
              "You must create at least one inbox in your account before using the import service. Please create an inbox and log in again.",
            );
          }

          set((state) => ({
            ...state,
            selectedAccount: account,
            inboxes,
            selectedInbox: null,
          }));
        } catch (error) {
          console.error("Error selecting account:", error);
          throw error;
        }
      },

      setSelectedInbox: (inbox: Inbox) => {
        set({ selectedInbox: inbox });
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      reset: () => {
        // Clear all cookies
        document.cookie =
          "access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "token-type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        set((state) => ({
          ...state,
          isAuthenticated: false,
          user: null,
          accounts: [],
          selectedAccount: null,
          inboxes: [],
          selectedInbox: null,
        }));

        // Redirect to login page
        window.location.href = "/";
      },
    }),
    {
      name: "conversate-import-storage",
      partialize: (state) => ({
        settings: state.settings,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accounts: state.accounts,
      }),
    },
  ),
);
