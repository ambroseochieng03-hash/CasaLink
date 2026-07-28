import { House, User, Booking, Conversation, Message, AppNotification, Announcement } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    fullName: 'System Administrator',
    email: 'admin@casalink.com',
    phoneNumber: '+254700000000',
    role: 'admin',
    isPhoneVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-01T08:00:00Z',
  }
];

export const INITIAL_HOUSES: House[] = [];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_CONVERSATIONS: Conversation[] = [];

export const INITIAL_MESSAGES: Message[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'ntf_1',
    userId: 'usr_admin',
    title: 'Welcome to CasaLink System Console',
    message: 'System operational. Ready to handle real property listings uploaded by verified landlords.',
    type: 'system',
    read: false,
    createdAt: '2026-07-27T00:00:00Z',
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc_1',
    title: 'Welcome to CasaLink Housing Platform',
    body: 'We are thrilled to launch CasaLink! Find genuine rental properties directly with landlords without agent commissions or deposit holding fees.',
    date: '2026-07-20',
    targetRole: 'all',
  },
  {
    id: 'anc_2',
    title: 'Landlord Phone Verification Requirement',
    body: 'Please ensure your phone number is verified in your profile to keep your listings active and publish new properties.',
    date: '2026-07-22',
    targetRole: 'landlord',
  }
];

