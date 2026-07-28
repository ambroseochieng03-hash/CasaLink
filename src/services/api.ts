import { 
  User, 
  House, 
  Booking, 
  Conversation, 
  Message, 
  AppNotification, 
  Announcement,
  PlatformStats,
  SearchFilterState,
  NotificationPreferences,
  DescriptionEnhancementResult,
  PhotoQualityAnalysisResult,
  RecommendedHouse 
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'An unexpected API error occurred');
  }
  return data as T;
}

export const api = {
  // Auth
  register: (payload: Record<string, any>) => 
    fetchJson<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: Record<string, any>) => 
    fetchJson<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: (token: string) => 
    fetchJson<{ user: User }>('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    }),

  verifyPhone: (userId: string, otp: string) => 
    fetchJson<{ success: boolean; user: User }>('/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    }),

  requestOtp: (userId: string) => 
    fetchJson<{ message: string; demoOtp: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  forgotPassword: (email: string) => 
    fetchJson<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: Record<string, any>) => 
    fetchJson<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProfile: (payload: Record<string, any>) => 
    fetchJson<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Houses
  getHouses: (filters?: Partial<SearchFilterState> & { landlordId?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          if (Array.isArray(val)) {
            val.forEach(item => params.append(key, item));
          } else {
            params.append(key, String(val));
          }
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<House[]>(`/houses${query}`);
  },

  getHouseById: (id: string) => fetchJson<House>(`/houses/${id}`),

  createHouse: (payload: Record<string, any>) => 
    fetchJson<House>('/houses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateHouse: (id: string, payload: Record<string, any>) => 
    fetchJson<House>(`/houses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteHouse: (id: string) => 
    fetchJson<{ success: boolean }>(`/houses/${id}`, {
      method: 'DELETE',
    }),

  // Bookings
  createBooking: (houseId: string, tenantId: string) => 
    fetchJson<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify({ houseId, tenantId }),
    }),

  getBookings: (userId: string, role: string) => 
    fetchJson<Booking[]>(`/bookings?userId=${userId}&role=${role}`),

  updateBookingStatus: (id: string, action: 'accept' | 'reject', reason?: string) => 
    fetchJson<{ success: boolean; booking: Booking }>([`/bookings/${id}/status`].join(''), {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    }),

  cancelBooking: (id: string, reason?: string) => 
    fetchJson<{ success: boolean; booking: Booking }>(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  // Chat
  getConversations: (userId: string) => 
    fetchJson<Conversation[]>(`/conversations?userId=${userId}`),

  getMessages: (conversationId: string) => 
    fetchJson<Message[]>(`/messages/${conversationId}`),

  sendMessage: (payload: Record<string, any>) => 
    fetchJson<{ message: Message; conversation: Conversation }>('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Notifications
  getNotifications: (userId: string) => 
    fetchJson<AppNotification[]>(`/notifications?userId=${userId}`),

  markNotificationRead: (id: string) => 
    fetchJson<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: (userId: string) => 
    fetchJson<{ success: boolean }>('/notifications/read-all', {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    }),

  // Saved Houses
  getSavedHouses: (userId: string) => 
    fetchJson<House[]>(`/saved-houses?userId=${userId}`),

  toggleSavedHouse: (userId: string, houseId: string) => 
    fetchJson<{ isSaved: boolean; houseIds: string[] }>('/saved-houses/toggle', {
      method: 'POST',
      body: JSON.stringify({ userId, houseId }),
    }),

  // Admin
  getAdminStats: () => fetchJson<PlatformStats>('/admin/stats'),
  getAdminUsers: () => fetchJson<User[]>('/admin/users'),
  suspendUser: (id: string) => fetchJson<{ user: User }>(`/admin/users/${id}/suspend`, { method: 'PATCH' }),
  getAnnouncements: () => fetchJson<Announcement[]>('/admin/announcements'),
  createAnnouncement: (payload: Record<string, any>) => 
    fetchJson<Announcement>('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // AI & Engagement
  updateNotificationPreferences: (userId: string, preferences: NotificationPreferences) =>
    fetchJson<{ user: User }>(`/users/${userId}/notification-preferences`, {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),

  trackRecentlyViewed: (userId: string, houseId: string) =>
    fetchJson<{ success: boolean; recentlyViewedHouseIds: string[] }>(`/users/${userId}/recently-viewed`, {
      method: 'POST',
      body: JSON.stringify({ houseId }),
    }),

  enhanceDescription: (payload: { title?: string; houseType?: string; bedrooms?: number; rent?: number; location?: any; description: string; amenities?: string[] }) =>
    fetchJson<DescriptionEnhancementResult>('/ai/enhance-description', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  analyzePhotos: (payload: { photoUrls: string[]; houseType?: string; title?: string }) =>
    fetchJson<PhotoQualityAnalysisResult>('/ai/analyze-photos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getRecommendations: (userId: string) =>
    fetchJson<RecommendedHouse[]>(`/ai/recommendations?userId=${userId}`),

  getChatSuggestions: (conversationId: string, userId: string) =>
    fetchJson<{ suggestions: string[] }>('/ai/chat-suggestions', {
      method: 'POST',
      body: JSON.stringify({ conversationId, userId }),
    }),

  triggerEngagement: (userId?: string) =>
    fetchJson<{ success: boolean; createdCount: number }>('/ai/trigger-engagement', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};
