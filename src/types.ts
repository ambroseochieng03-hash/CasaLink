export type UserRole = 'tenant' | 'landlord' | 'admin';

export interface NotificationPreferences {
  promotional: boolean;
  recommendations: boolean;
  reminders: boolean;
  generalEngagement: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isPhoneVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  isSuspended?: boolean;
  notificationPreferences?: NotificationPreferences;
  recentlyViewedHouseIds?: string[];
  preferredLocation?: string;
  maxBudget?: number;
}

export type HouseType = 
  | 'Apartment' 
  | 'Bungalow' 
  | 'Mansionette' 
  | 'Studio' 
  | 'Single Room' 
  | 'Villa' 
  | 'Townhouse';

export interface LocationData {
  address: string;
  city: string;
  county: string;
  lat: number;
  lng: number;
}

export interface House {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  landlordAvatar?: string;
  title: string;
  description: string;
  houseType: HouseType;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  deposit: number;
  location: LocationData;
  amenities: string[];
  photos: string[];
  videoUrl?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  createdAt: string;
  viewCount: number;
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  houseId: string;
  houseTitle: string;
  houseRent: number;
  houseImage: string;
  houseType: HouseType;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  cancellationReason?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  houseId?: string;
  houseTitle?: string;
  houseImage?: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  landlordName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountTenant: number;
  unreadCountLandlord: number;
}

export type NotificationType = 
  | 'booking_accepted' 
  | 'booking_rejected' 
  | 'booking_cancelled' 
  | 'new_booking'
  | 'new_message' 
  | 'house_updated' 
  | 'announcement' 
  | 'system'
  | 'recommendation'
  | 'engagement'
  | 'reminder'
  | 'profile_tip'
  | 'photo_tip';

export interface DescriptionEnhancementResult {
  enhancedTitle: string;
  enhancedDescription: string;
  keyHighlights: string[];
  suggestedAmenities: string[];
}

export interface PhotoQualityAnalysisResult {
  overallScore: number;
  feedback: string[];
  missingElements: string[];
  suggestions: string[];
}

export interface RecommendedHouse {
  house: House;
  matchScore: number;
  reason: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  targetRole: 'all' | 'tenant' | 'landlord';
}

export interface SearchFilterState {
  keyword: string;
  location: string;
  minRent: number;
  maxRent: number;
  houseType: string;
  bedrooms: string;
  amenities: string[];
  availabilityOnly: boolean;
  sortBy: 'newest' | 'nearest' | 'price_low' | 'price_high';
  userLat?: number;
  userLng?: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalTenants: number;
  totalLandlords: number;
  totalHouses: number;
  availableHouses: number;
  activeBookings: number;
  totalMessages: number;
}
