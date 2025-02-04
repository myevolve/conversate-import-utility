import axios from "axios";

const BASE_URL =
  typeof window === "undefined" ? "https://app.conversate.us" : "/api";
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export interface AuthResponse {
  data: {
    data: {
      access_token: string;
      account_id: number;
      id: number;
      name: string;
      email: string;
      accounts: Account[];
    };
  };
}

export interface Account {
  id: number;
  name: string;
  role: string;
  availability: string;
  availability_status: string;
  auto_offline: boolean;
  stripe: boolean;
  stripe_account: boolean;
}

export interface Inbox {
  id: number;
  name: string;
  channel_type?: string;
  avatar_url?: string;
  channel_id?: number;
  greeting_enabled?: boolean;
  greeting_message?: string;
  working_hours_enabled?: boolean;
  enable_email_collect?: boolean;
  csat_survey_enabled?: boolean;
  enable_auto_assignment?: boolean;
  out_of_office_message?: string | null;
  working_hours?: Record<string, unknown>[];
  timezone?: string;
  callback_webhook_url?: string | null;
  unavailable_time?: number;
  missed_redirect_time?: number;
  is_sms_bot_enabled?: boolean;
  sms_service?: boolean;
  email_service?: boolean;
  signalwire_link_inbox?: string | null;
  automated_reply?: string | null;
  widget_color?: string;
  website_url?: string;
  hmac_mandatory?: boolean;
  welcome_title?: string;
  welcome_tagline?: string;
  web_widget_script?: string;
  website_token?: string;
  selected_feature_flags?: string[];
  reply_time?: string;
  is_video_available?: boolean;
  launcher_title?: string;
  inbox_signature?: string | null;
  signature_avatar_url?: string | null;
  c_type?: string | null;
  hmac_token?: string;
  pre_chat_form_enabled?: boolean;
  pre_chat_form_options?: Record<string, unknown>;
  ivr_tree?: string | null;
  ai_ivr_tree?: string | null;
  ivr_agent_tree?: string | null;
  communication_type?: string | null;
  missed_sms_enabled?: boolean | null;
  missed_sms_text?: string | null;
  assignment_order_status?: string | null;
  is_queue_enabled?: boolean | null;
  queue_size?: number | null;
  is_recording_enabled?: boolean | null;
  is_ivr_enabled?: boolean | null;
  is_new_ivr_enabled?: boolean | null;
  is_ai_ivr_enabled?: boolean | null;
  is_ai_agent_enabled?: boolean | null;
  page_id?: string | null;
  phone_number?: string | null;
  inbox_id?: number;
  agent_limit?: number;
  conversations_count?: number;
  inbox_members_count?: number;
}

export interface Contact {
  id?: number;
  inbox_id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  identifier?: string;
  custom_attributes?: Record<string, string | number | boolean>;
}

export interface AuthHeaders {
  "access-token": string;
  client: string;
  uid: string;
}

class ConversateAPI {
  private static instance: ConversateAPI;
  private authHeaders: AuthHeaders | null = null;

  private constructor() {
    // Initialize auth headers from cookies if available
    if (typeof window !== "undefined") {
      const accessToken = document.cookie.match(/access-token=([^;]+)/)?.[1];
      const client = document.cookie.match(/client=([^;]+)/)?.[1];
      const uid = document.cookie.match(/uid=([^;]+)/)?.[1];

      if (accessToken && client && uid) {
        this.authHeaders = { "access-token": accessToken, client, uid };
      }
    }
  }

  static getInstance(): ConversateAPI {
    if (!ConversateAPI.instance) {
      ConversateAPI.instance = new ConversateAPI();
    }
    return ConversateAPI.instance;
  }

  setAuthHeaders(headers: AuthHeaders) {
    this.authHeaders = headers;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post("/auth/sign_in", {
        email,
        password,
      });

      // Get auth headers from Set-Cookie headers
      const cookies = response.headers["set-cookie"] || [];
      const accessToken = cookies
        .find((c) => c.startsWith("access-token="))
        ?.split("=")[1]
        ?.split(";")[0];
      const client = cookies
        .find((c) => c.startsWith("client="))
        ?.split("=")[1]
        ?.split(";")[0];
      const uid = cookies
        .find((c) => c.startsWith("uid="))
        ?.split("=")[1]
        ?.split(";")[0];
      const expiry = cookies
        .find((c) => c.startsWith("expiry="))
        ?.split("=")[1]
        ?.split(";")[0];
      const tokenType = cookies
        .find((c) => c.startsWith("token-type="))
        ?.split("=")[1]
        ?.split(";")[0];

      if (!accessToken || !client || !uid) {
        throw new Error("Missing authentication headers in response");
      }

      this.authHeaders = {
        "access-token": accessToken,
        client: client,
        uid: uid,
      };

      // Store auth headers in cookies
      document.cookie = `access-token=${accessToken}; path=/`;
      document.cookie = `client=${client}; path=/`;
      document.cookie = `uid=${uid}; path=/`;
      if (expiry) document.cookie = `expiry=${expiry}; path=/`;
      if (tokenType) document.cookie = `token-type=${tokenType}; path=/`;

      return { data: response.data };
    } catch (err) {
      const error = err as Error;
      console.error("Login error:", error);
      throw error;
    }
  }

  private get headers() {
    if (!this.authHeaders) {
      throw new Error("Not authenticated. Please login first.");
    }

    return {
      ...this.authHeaders,
      "Content-Type": "application/json",
    };
  }

  async getInboxes(accountId: number): Promise<Inbox[]> {
    try {
      const response = await axiosInstance.get<{
        payload?: Inbox[];
        inboxes?: Inbox[];
      }>(`/api/v1/accounts/${accountId}/inboxes`, {
        headers: this.headers,
      });
      console.log("Get inboxes response:", response);
      return response.data.payload || response.data.inboxes || [];
    } catch (error) {
      console.error("Get inboxes error:", error);
      throw error;
    }
  }

  async createInbox(accountId: number, name: string): Promise<Inbox> {
    try {
      const response = await axiosInstance.post(
        `/api/v1/accounts/${accountId}/inboxes`,
        {
          name,
          channel: {
            type: "web_widget",
            website_url: "conversate.us",
            welcome_title: "Welcome to Conversate AI",
            welcome_tagline:
              "We make it simple to conversate, how can I help you?",
            widget_color: "#009CE0",
          },
        },
        {
          headers: this.headers,
        },
      );
      return response.data.payload || response.data;
    } catch (error) {
      console.error("Create inbox error:", error);
      throw error;
    }
  }

  async addLabelsToContact(
    accountId: number,
    contactId: number,
    labels: string[],
  ): Promise<void> {
    try {
      console.log("Adding labels:", { accountId, contactId, labels });
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          contactId,
          labels,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add labels");
      }

      console.log("Labels added successfully");
    } catch (error) {
      console.error("Add labels error:", error);
      throw error;
    }
  }

  async createContact(
    accountId: number,
    contact: Contact,
  ): Promise<{
    success: boolean;
    contact?: Contact;
    error?: {
      type: "duplicate_phone" | "duplicate_email" | "other";
      message: string;
    };
  }> {
    try {
      console.log("Creating contact:", { accountId, contact });
      const response = await axiosInstance.post(
        `/api/v1/accounts/${accountId}/contacts`,
        {
          contact,
        },
        {
          headers: this.headers,
        },
      );
      console.log("Create contact response:", {
        status: response.status,
        data: response.data,
      });

      return {
        success: true,
        contact: response.data.payload?.contact || response.data.contact,
      };
    } catch (err) {
      const error = err as Error & {
        response?: { status: number; data: { message?: string } };
      };
      console.error("Create contact error:", error);

      if (error.response?.status === 422) {
        // Handle validation errors (duplicates)
        const message = error.response.data.message?.toLowerCase() || "";
        if (message.includes("phone number") && message.includes("taken")) {
          return {
            success: false,
            error: {
              type: "duplicate_phone",
              message: "Phone number already exists",
            },
          };
        } else if (message.includes("email") && message.includes("taken")) {
          return {
            success: false,
            error: {
              type: "duplicate_email",
              message: "Email already exists",
            },
          };
        }
      }

      return {
        success: false,
        error: {
          type: "other",
          message:
            error.response?.data?.message ||
            error.message ||
            "Unknown error occurred",
        },
      };
    }
  }
}

export const api = ConversateAPI.getInstance();
