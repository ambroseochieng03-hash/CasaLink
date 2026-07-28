import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_USERS, 
  INITIAL_HOUSES, 
  INITIAL_BOOKINGS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_MESSAGES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ANNOUNCEMENTS 
} from './src/data/seedData.js';
import { 
  User, 
  House, 
  Booking, 
  Conversation, 
  Message, 
  AppNotification, 
  Announcement,
  UserRole,
  NotificationPreferences 
} from './src/types.js';

const PORT = 3000;

// Initialize Gemini Server AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'demo-key',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function getFirstName(fullName: string): string {
  if (!fullName) return 'there';
  const clean = fullName.trim().split(' ')[0];
  return clean ? clean : 'there';
}

// In-Memory Database Stores
let users: User[] = [...INITIAL_USERS];
let houses: House[] = [...INITIAL_HOUSES];
let bookings: Booking[] = [...INITIAL_BOOKINGS];
let conversations: Conversation[] = [...INITIAL_CONVERSATIONS];
let messages: Message[] = [...INITIAL_MESSAGES];
let notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS];
let announcements: Announcement[] = [...INITIAL_ANNOUNCEMENTS];
let savedHousesMap: Record<string, string[]> = {};

// Phone validation helper
function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.trim().replace(/\s+/g, '');
  // Matches local Kenyan format like 0748671072, 0110000000, or international +254748671072 / +1234567890
  const phoneRegex = /^(\+?\d{1,4})?[0-9]{9,12}$/;
  return phoneRegex.test(clean);
}

// Email validation helper
function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API ROUTE LOGGING
  app.use('/api', (req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // Register
  app.post('/api/auth/register', (req, res) => {
    const { fullName, email, phoneNumber, password, confirmPassword, role, avatarUrl } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please enter your email address.' });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ error: 'Please enter your phone number.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Please enter a password.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match. Please verify your password.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Please enter a valid number (e.g. 0748671072 or +254748671072).' 
      });
    }

    // Check Email Uniqueness across ALL accounts regardless of role
    const existingEmail = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: 'This email is already registered. Please log in or use another email address.' });
    }

    // Check Phone Number Uniqueness across ALL accounts regardless of role
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const existingPhone = users.find(u => u.phoneNumber.replace(/[^0-9+]/g, '') === cleanPhone);
    if (existingPhone) {
      return res.status(400).json({ error: 'This phone number is already registered. Please log in or use another phone number.' });
    }

    const newUserRole: UserRole = role === 'landlord' ? 'landlord' : 'tenant';

    const newUser: User = {
      id: `usr_${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      role: newUserRole,
      // Landlords start unverified until OTP check; tenants are auto-verified
      isPhoneVerified: newUserRole === 'tenant',
      avatarUrl: avatarUrl && avatarUrl.trim() ? avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // Initial system welcome notification
    notifications.unshift({
      id: `ntf_${Date.now()}`,
      userId: newUser.id,
      title: `Welcome to CasaLink, ${newUser.fullName}!`,
      message: newUserRole === 'landlord' 
        ? 'Please verify your phone number to start publishing rental properties.'
        : 'Explore verified homes, bookmark favorites, and connect with landlords directly.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      user: newUser,
      token: `token_${newUser.id}`,
    });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
    }

    return res.json({
      user,
      token: `token_${user.id}`,
    });
  });

  // Verify Landlord Phone Number (OTP)
  app.post('/api/auth/verify-phone', (req, res) => {
    const { userId, otp } = req.body;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // OTP verification logic (accepts 123456 or any 6-digit code for demo)
    if (otp && (otp === '123456' || otp.length === 6)) {
      user.isPhoneVerified = true;

      notifications.unshift({
        id: `ntf_${Date.now()}`,
        userId: user.id,
        title: 'Phone Verified Successfully!',
        message: 'You are now fully verified as a landlord and can list up to 10 rental properties.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({ success: true, user });
    } else {
      return res.status(400).json({ error: 'Invalid OTP code. Enter 123456 for testing.' });
    }
  });

  // Request Phone Verification OTP code trigger
  app.post('/api/auth/request-otp', (req, res) => {
    const { userId } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.json({ 
      message: `OTP sent to ${user.phoneNumber}. Use verification code 123456 for testing.`,
      demoOtp: '123456' 
    });
  });

  // Get Current User (Session Restoration & Token Validation)
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided.' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const userId = token.replace('token_', '');
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({ error: 'Session invalid or account no longer exists.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Your account has been suspended by system administrator.' });
    }

    return res.json({ user });
  });

  // Forgot Password
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Lookup user internally without leaking status
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      // In production, dispatch email reset code
    }

    // Always return neutral response to prevent account enumeration
    return res.json({ 
      message: 'If an account exists for this email address, you will receive password reset instructions shortly.' 
    });
  });

  // Reset Password
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  });

  // Update Profile
  app.put('/api/auth/profile', (req, res) => {
    const { userId, fullName, phoneNumber, avatarUrl } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (phoneNumber) {
      if (!isValidPhone(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number format.' });
      }

      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      const existingPhone = users.find(u => u.id !== userId && u.phoneNumber.replace(/[^0-9+]/g, '') === cleanPhone);
      if (existingPhone) {
        return res.status(400).json({ error: 'This phone number is already registered with another account. Please use a different phone number.' });
      }
      user.phoneNumber = phoneNumber.trim();
    }

    if (fullName) {
      user.fullName = fullName.trim();
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    return res.json({ user });
  });

  // ==========================================
  // HOUSES LISTINGS ENDPOINTS
  // ==========================================

  // Get all houses with search filters
  app.get('/api/houses', (req, res) => {
    let result = [...houses];
    const { 
      keyword, 
      location, 
      houseType, 
      minRent, 
      maxRent, 
      bedrooms, 
      amenity, 
      availability, 
      sort,
      landlordId,
      userLat,
      userLng
    } = req.query;

    // Filter by landlord
    if (landlordId) {
      result = result.filter(h => h.landlordId === landlordId);
    }

    // Filter by search keyword
    if (keyword) {
      const q = (keyword as string).toLowerCase().trim();
      result = result.filter(h => 
        h.title.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.location.address.toLowerCase().includes(q) ||
        h.location.city.toLowerCase().includes(q) ||
        h.location.county.toLowerCase().includes(q)
      );
    }

    // Filter by location
    if (location) {
      const loc = (location as string).toLowerCase().trim();
      result = result.filter(h => 
        h.location.address.toLowerCase().includes(loc) ||
        h.location.city.toLowerCase().includes(loc) ||
        h.location.county.toLowerCase().includes(loc)
      );
    }

    // Filter by house type
    if (houseType && houseType !== 'All') {
      result = result.filter(h => h.houseType.toLowerCase() === (houseType as string).toLowerCase());
    }

    // Filter by rent range
    if (minRent) {
      result = result.filter(h => h.rent >= Number(minRent));
    }
    if (maxRent) {
      result = result.filter(h => h.rent <= Number(maxRent));
    }

    // Filter by bedrooms
    if (bedrooms && bedrooms !== 'Any') {
      if (bedrooms === '4+') {
        result = result.filter(h => h.bedrooms >= 4);
      } else {
        result = result.filter(h => h.bedrooms === Number(bedrooms));
      }
    }

    // Filter by amenity
    if (amenity) {
      const am = (amenity as string).toLowerCase();
      result = result.filter(h => h.amenities.some(a => a.toLowerCase().includes(am)));
    }

    // Filter by availability
    if (availability === 'true') {
      result = result.filter(h => h.isAvailable);
    }

    // Sorting
    if (sort === 'nearest' && userLat && userLng) {
      const uLat = Number(userLat);
      const uLng = Number(userLng);
      result.sort((a, b) => {
        const distA = Math.hypot(a.location.lat - uLat, a.location.lng - uLng);
        const distB = Math.hypot(b.location.lat - uLat, b.location.lng - uLng);
        return distA - distB;
      });
    } else if (sort === 'price_low') {
      result.sort((a, b) => a.rent - b.rent);
    } else if (sort === 'price_high') {
      result.sort((a, b) => b.rent - a.rent);
    } else {
      // Default: Newest first
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.json(result);
  });

  // Get single house details
  app.get('/api/houses/:id', (req, res) => {
    const house = houses.find(h => h.id === req.params.id);
    if (!house) {
      return res.status(404).json({ error: 'House listing not found.' });
    }
    // Increment view count
    house.viewCount = (house.viewCount || 0) + 1;
    return res.json(house);
  });

  // Create House (Landlord only)
  app.post('/api/houses', (req, res) => {
    const { 
      landlordId, 
      title, 
      description, 
      houseType, 
      bedrooms, 
      bathrooms, 
      rent, 
      deposit, 
      location, 
      amenities, 
      photos, 
      videoUrl 
    } = req.body;

    const landlord = users.find(u => u.id === landlordId);
    if (!landlord) {
      return res.status(404).json({ error: 'Landlord profile not found.' });
    }

    if (landlord.role !== 'landlord') {
      return res.status(403).json({ error: 'Only registered landlords can publish listings.' });
    }

    // LANDLORD PHONE VERIFICATION REQUIREMENT
    if (!landlord.isPhoneVerified) {
      return res.status(403).json({ 
        error: 'Landlord phone verification incomplete! Please verify your phone number before publishing any property listing.' 
      });
    }

    // UPLOAD LIMITS: Max 10 active houses per landlord
    const existingLandlordHouses = houses.filter(h => h.landlordId === landlordId);
    if (existingLandlordHouses.length >= 10) {
      return res.status(400).json({ 
        error: 'Active house limit reached! A landlord can publish a maximum of 10 houses to optimize hosting usage.' 
      });
    }

    // UPLOAD LIMITS: Max 15 photos per house
    const photoList = Array.isArray(photos) ? photos.slice(0, 15) : [];
    if (!photoList || photoList.length === 0) {
      return res.status(400).json({ error: 'At least 1 photo is required for a house listing.' });
    }

    const newHouse: House = {
      id: `hs_${Date.now()}`,
      landlordId: landlord.id,
      landlordName: landlord.fullName,
      landlordPhone: landlord.phoneNumber,
      landlordAvatar: landlord.avatarUrl,
      title: title || 'Untitled Property',
      description: description || 'No description provided.',
      houseType: houseType || 'Apartment',
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      rent: Number(rent) || 10000,
      deposit: Number(deposit) || 10000,
      location: location || {
        address: 'Nairobi CBD',
        city: 'Nairobi',
        county: 'Nairobi',
        lat: -1.286389,
        lng: 36.817223,
      },
      amenities: Array.isArray(amenities) ? amenities : ['Water', 'Security'],
      photos: photoList,
      videoUrl: videoUrl || undefined,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      viewCount: 1,
    };

    houses.unshift(newHouse);

    return res.status(201).json(newHouse);
  });

  // Edit House
  app.put('/api/houses/:id', (req, res) => {
    const house = houses.find(h => h.id === req.params.id);
    if (!house) return res.status(404).json({ error: 'House not found.' });

    const { 
      title, 
      description, 
      houseType, 
      bedrooms, 
      bathrooms, 
      rent, 
      deposit, 
      location, 
      amenities, 
      photos, 
      videoUrl,
      isAvailable 
    } = req.body;

    if (title !== undefined) house.title = title;
    if (description !== undefined) house.description = description;
    if (houseType !== undefined) house.houseType = houseType;
    if (bedrooms !== undefined) house.bedrooms = Number(bedrooms);
    if (bathrooms !== undefined) house.bathrooms = Number(bathrooms);
    if (rent !== undefined) house.rent = Number(rent);
    if (deposit !== undefined) house.deposit = Number(deposit);
    if (location !== undefined) house.location = location;
    if (amenities !== undefined) house.amenities = amenities;
    if (photos !== undefined) house.photos = Array.isArray(photos) ? photos.slice(0, 15) : house.photos;
    if (videoUrl !== undefined) house.videoUrl = videoUrl;
    if (isAvailable !== undefined) house.isAvailable = Boolean(isAvailable);

    // Notify interested tenants if updated
    return res.json(house);
  });

  // Delete House
  app.delete('/api/houses/:id', (req, res) => {
    const houseIndex = houses.findIndex(h => h.id === req.params.id);
    if (houseIndex === -1) return res.status(404).json({ error: 'House not found.' });

    const deletedHouse = houses.splice(houseIndex, 1)[0];

    // Reject all pending bookings for this house
    bookings.forEach(b => {
      if (b.houseId === deletedHouse.id && b.status === 'pending') {
        b.status = 'rejected';
        b.rejectionReason = 'The house listing was removed by the owner or administrator.';
      }
    });

    return res.json({ success: true, deletedHouse });
  });

  // ==========================================
  // BOOKINGS WORKFLOW ENDPOINTS
  // ==========================================

  // Create Booking Request (Tenant)
  app.post('/api/bookings', (req, res) => {
    const { houseId, tenantId } = req.body;

    const house = houses.find(h => h.id === houseId);
    if (!house) return res.status(404).json({ error: 'House not found.' });

    if (!house.isAvailable) {
      return res.status(400).json({ error: 'This house is currently occupied or booked by another tenant.' });
    }

    const tenant = users.find(u => u.id === tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant profile not found.' });

    // Check if tenant already has an active pending or accepted booking for this house
    const existing = bookings.find(b => b.houseId === houseId && b.tenantId === tenantId && (b.status === 'pending' || b.status === 'accepted'));
    if (existing) {
      return res.status(400).json({ error: 'You already have an active booking request for this house.' });
    }

    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      houseId: house.id,
      houseTitle: house.title,
      houseRent: house.rent,
      houseImage: house.photos[0] || '',
      houseType: house.houseType,
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phoneNumber,
      landlordId: house.landlordId,
      landlordName: house.landlordName,
      landlordPhone: house.landlordPhone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.unshift(newBooking);

    // Notify Landlord
    notifications.unshift({
      id: `ntf_${Date.now()}`,
      userId: house.landlordId,
      title: 'New Booking Request',
      message: `${tenant.fullName} submitted a booking request for "${house.title}".`,
      type: 'new_booking',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json(newBooking);
  });

  // Get Bookings
  app.get('/api/bookings', (req, res) => {
    const { userId, role } = req.query;

    if (!userId) return res.status(400).json({ error: 'userId parameter required.' });

    let userBookings: Booking[] = [];
    if (role === 'landlord') {
      userBookings = bookings.filter(b => b.landlordId === userId);
    } else {
      userBookings = bookings.filter(b => b.tenantId === userId);
    }

    return res.json(userBookings);
  });

  // Landlord Accept / Reject Booking
  app.patch('/api/bookings/:id/status', (req, res) => {
    const { action } = req.body; // 'accept' | 'reject'
    const booking = bookings.find(b => b.id === req.params.id);

    if (!booking) return res.status(404).json({ error: 'Booking request not found.' });

    const house = houses.find(h => h.id === booking.houseId);

    if (action === 'accept') {
      if (!house) return res.status(404).json({ error: 'Associated house listing not found.' });

      // 1. Set this booking status to accepted
      booking.status = 'accepted';
      booking.updatedAt = new Date().toISOString();

      // 2. House immediately disappears from public search (isAvailable = false)
      house.isAvailable = false;

      // 3. AUTOMATICALLY REJECT all other pending bookings for this house!
      bookings.forEach(otherB => {
        if (otherB.houseId === house.id && otherB.id !== booking.id && otherB.status === 'pending') {
          otherB.status = 'rejected';
          otherB.rejectionReason = 'The house has been booked by another tenant and is no longer available.';
          otherB.updatedAt = new Date().toISOString();

          // Notify rejected tenant
          notifications.unshift({
            id: `ntf_${Date.now()}_${otherB.id}`,
            userId: otherB.tenantId,
            title: 'Booking Unavailable',
            message: `Your booking request for "${house.title}" was automatically closed because the landlord accepted another tenant.`,
            type: 'booking_rejected',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      });

      // 4. Notify accepted tenant
      notifications.unshift({
        id: `ntf_${Date.now()}`,
        userId: booking.tenantId,
        title: 'Booking Accepted! 🎉',
        message: `Great news! Landlord ${booking.landlordName} accepted your booking request for "${house.title}". Contact landlord at ${booking.landlordPhone}.`,
        type: 'booking_accepted',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({ success: true, booking, house });

    } else if (action === 'reject') {
      booking.status = 'rejected';
      booking.rejectionReason = req.body.reason || 'Landlord declined the request.';
      booking.updatedAt = new Date().toISOString();

      // Notify tenant
      notifications.unshift({
        id: `ntf_${Date.now()}`,
        userId: booking.tenantId,
        title: 'Booking Request Declined',
        message: `Landlord ${booking.landlordName} declined your booking request for "${booking.houseTitle}".`,
        type: 'booking_rejected',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({ success: true, booking });
    }

    return res.status(400).json({ error: 'Invalid action parameter.' });
  });

  // Tenant Cancel Booking (Allowed at ANY time!)
  app.patch('/api/bookings/:id/cancel', (req, res) => {
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const wasAccepted = booking.status === 'accepted';

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by tenant.';
    booking.updatedAt = new Date().toISOString();

    const house = houses.find(h => h.id === booking.houseId);

    // CRITICAL: If the tenant cancels, house automatically returns to search results!
    if (house && wasAccepted) {
      house.isAvailable = true;
    }

    // Notify Landlord
    notifications.unshift({
      id: `ntf_${Date.now()}`,
      userId: booking.landlordId,
      title: 'Booking Cancelled by Tenant',
      message: `${booking.tenantName} cancelled their booking for "${booking.houseTitle}". The property has been automatically relisted as available.`,
      type: 'booking_cancelled',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, booking, house });
  });

  // ==========================================
  // MESSAGES & CHAT ENDPOINTS
  // ==========================================

  // Get User Conversations
  app.get('/api/conversations', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required.' });

    const userConvs = conversations.filter(c => c.tenantId === userId || c.landlordId === userId);
    return res.json(userConvs);
  });

  // Get Messages in Conversation
  app.get('/api/messages/:conversationId', (req, res) => {
    const convMsgs = messages.filter(m => m.conversationId === req.params.conversationId);
    convMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return res.json(convMsgs);
  });

  // Send Message
  app.post('/api/messages', (req, res) => {
    const { conversationId, senderId, receiverId, houseId, text, imageUrl } = req.body;

    if (!senderId || !receiverId || (!text && !imageUrl)) {
      return res.status(400).json({ error: 'Sender, receiver, and message text/image are required.' });
    }

    const sender = users.find(u => u.id === senderId);
    const receiver = users.find(u => u.id === receiverId);
    if (!sender || !receiver) return res.status(404).json({ error: 'User not found.' });

    let conv = conversations.find(c => c.id === conversationId);

    if (!conv) {
      const house = houseId ? houses.find(h => h.id === houseId) : undefined;
      const tenant = sender.role === 'tenant' ? sender : receiver;
      const landlord = sender.role === 'landlord' ? sender : receiver;

      conv = {
        id: `conv_${Date.now()}`,
        houseId: house?.id,
        houseTitle: house?.title || 'Direct Inquiry',
        houseImage: house?.photos[0],
        tenantId: tenant.id,
        tenantName: tenant.fullName,
        landlordId: landlord.id,
        landlordName: landlord.fullName,
        lastMessage: text || '📷 Image attachment',
        lastMessageTime: new Date().toISOString(),
        unreadCountTenant: sender.role === 'landlord' ? 1 : 0,
        unreadCountLandlord: sender.role === 'tenant' ? 1 : 0,
      };
      conversations.unshift(conv);
    } else {
      conv.lastMessage = text || '📷 Image attachment';
      conv.lastMessageTime = new Date().toISOString();
      if (sender.role === 'tenant') {
        conv.unreadCountLandlord += 1;
      } else {
        conv.unreadCountTenant += 1;
      }
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: conv.id,
      senderId: sender.id,
      senderName: sender.fullName,
      senderRole: sender.role,
      receiverId: receiver.id,
      text: text || '',
      imageUrl: imageUrl || undefined,
      createdAt: new Date().toISOString(),
      read: false,
    };

    messages.push(newMsg);

    // Notify receiver
    notifications.unshift({
      id: `ntf_${Date.now()}`,
      userId: receiver.id,
      title: `New Message from ${sender.fullName}`,
      message: text ? (text.length > 60 ? text.substring(0, 60) + '...' : text) : 'Sent an image attachment.',
      type: 'new_message',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ message: newMsg, conversation: conv });
  });

  // ==========================================
  // NOTIFICATIONS ENDPOINTS
  // ==========================================

  app.get('/api/notifications', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required.' });

    const userNotifs = notifications.filter(n => n.userId === userId);
    userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(userNotifs);
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    const notif = notifications.find(n => n.id === req.params.id);
    if (notif) notif.read = true;
    return res.json({ success: true, notif });
  });

  app.patch('/api/notifications/read-all', (req, res) => {
    const { userId } = req.body;
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    return res.json({ success: true });
  });

  // ==========================================
  // SAVED HOUSES (BOOKMARKS) ENDPOINTS
  // ==========================================

  app.get('/api/saved-houses', (req, res) => {
    const { userId } = req.query;
    const houseIds = savedHousesMap[userId as string] || [];
    const saved = houses.filter(h => houseIds.includes(h.id));
    return res.json(saved);
  });

  app.post('/api/saved-houses/toggle', (req, res) => {
    const { userId, houseId } = req.body;
    if (!userId || !houseId) return res.status(400).json({ error: 'userId and houseId required.' });

    if (!savedHousesMap[userId]) {
      savedHousesMap[userId] = [];
    }

    const index = savedHousesMap[userId].indexOf(houseId);
    let isSaved = false;

    if (index > -1) {
      savedHousesMap[userId].splice(index, 1);
      isSaved = false;
    } else {
      savedHousesMap[userId].push(houseId);
      isSaved = true;
    }

    return res.json({ isSaved, houseIds: savedHousesMap[userId] });
  });

  // ==========================================
  // ADMIN DASHBOARD ENDPOINTS
  // ==========================================

  app.get('/api/admin/stats', (req, res) => {
    const totalTenants = users.filter(u => u.role === 'tenant').length;
    const totalLandlords = users.filter(u => u.role === 'landlord').length;
    const availableHouses = houses.filter(h => h.isAvailable).length;
    const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'accepted').length;

    return res.json({
      totalUsers: users.length,
      totalTenants,
      totalLandlords,
      totalHouses: houses.length,
      availableHouses,
      activeBookings,
      totalMessages: messages.length,
    });
  });

  app.get('/api/admin/users', (req, res) => {
    return res.json(users);
  });

  app.patch('/api/admin/users/:id/suspend', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.isSuspended = !user.isSuspended;
    return res.json({ user });
  });

  app.get('/api/admin/announcements', (req, res) => {
    return res.json(announcements);
  });

  app.post('/api/admin/announcements', (req, res) => {
    const { title, body, targetRole } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' });

    const newAnnouncement: Announcement = {
      id: `anc_${Date.now()}`,
      title,
      body,
      date: new Date().toISOString().split('T')[0],
      targetRole: targetRole || 'all',
    };

    announcements.unshift(newAnnouncement);

    // Send broadcast notification to users
    users.forEach(u => {
      if (targetRole === 'all' || u.role === targetRole) {
        notifications.unshift({
          id: `ntf_anc_${Date.now()}_${u.id}`,
          userId: u.id,
          title: `📢 Announcement: ${title}`,
          message: body,
          type: 'announcement',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    return res.status(201).json(newAnnouncement);
  });

  // ==========================================
  // AI INTELLIGENCE & ENGAGEMENT ENDPOINTS
  // ==========================================

  // Update Notification Preferences
  app.put('/api/users/:id/notification-preferences', (req, res) => {
    const { preferences } = req.body;
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.notificationPreferences = {
      promotional: preferences?.promotional ?? true,
      recommendations: preferences?.recommendations ?? true,
      reminders: preferences?.reminders ?? true,
      generalEngagement: preferences?.generalEngagement ?? true,
    };

    return res.json({ user });
  });

  // Save Recently Viewed House
  app.post('/api/users/:id/recently-viewed', (req, res) => {
    const { houseId } = req.body;
    const user = users.find(u => u.id === req.params.id);
    if (!user || !houseId) return res.status(400).json({ error: 'User and houseId required.' });

    if (!user.recentlyViewedHouseIds) {
      user.recentlyViewedHouseIds = [];
    }

    if (!user.recentlyViewedHouseIds.includes(houseId)) {
      user.recentlyViewedHouseIds.unshift(houseId);
      if (user.recentlyViewedHouseIds.length > 10) user.recentlyViewedHouseIds.pop();
    }

    return res.json({ success: true, recentlyViewedHouseIds: user.recentlyViewedHouseIds });
  });

  // AI Property Description Assistant
  app.post('/api/ai/enhance-description', async (req, res) => {
    const { title, houseType, bedrooms, rent, location, description, amenities } = req.body;
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Initial description string is required.' });
    }

    const prompt = `You are an expert real estate copywriter in Kenya.
Improve the following short property description for a ${bedrooms || 1}-bedroom ${houseType || 'House'} in ${location?.address || location?.city || 'Nairobi'} listed at KSh ${rent || 0}/month.

Raw Landlord Description: "${description.trim()}"
Selected Amenities: ${Array.isArray(amenities) ? amenities.join(', ') : 'Water, Security'}

Generate a compelling, professional, friendly, and structured listing copy.
Return ONLY a valid JSON object matching this schema:
{
  "enhancedTitle": "string",
  "enhancedDescription": "string",
  "keyHighlights": ["string", "string", "string"],
  "suggestedAmenities": ["string", "string"]
}`;

    try {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json(parsed);
        }
      }
    } catch (err: any) {
      console.error('Gemini description enhancement error:', err?.message || err);
    }

    // Fallback enhancement
    const cityStr = location?.city || 'Nairobi';
    const cleanDesc = description.trim();
    const fallbackTitle = title || `Spacious ${bedrooms || 1} Bedroom ${houseType || 'Apartment'} in ${cityStr}`;
    const fallbackDesc = `Welcome to this beautifully maintained ${bedrooms || 1}-bedroom ${houseType || 'apartment'} situated in the accessible area of ${cityStr}. ${cleanDesc}\n\nKey features include reliable water supply, round-the-clock perimeter security, well-lit airy room layout, and convenient access to public transport hubs and local shopping centers. Ideal for working professionals and families seeking a serene living space.`;

    return res.json({
      enhancedTitle: fallbackTitle,
      enhancedDescription: fallbackDesc,
      keyHighlights: ['24/7 Security & Perimeter Wall', 'Constant Water Backup Supply', 'Close Proximity to Public Transit'],
      suggestedAmenities: ['Borehole Water', 'CCTV Security', 'Dedicated Parking'],
    });
  });

  // Photo Quality Assistant
  app.post('/api/ai/analyze-photos', async (req, res) => {
    const { photoUrls, houseType, title } = req.body;
    const count = Array.isArray(photoUrls) ? photoUrls.length : 0;

    const prompt = `You are a real estate listing photo optimization expert.
A landlord uploaded ${count} photo(s) for a property titled "${title || 'Rental House'}" (${houseType || 'Apartment'}).
Photo URLs: ${JSON.stringify(photoUrls || [])}.

Provide polite, actionable photo feedback to help the landlord attract tenant inquiries in Kenya.
Return ONLY a JSON object:
{
  "overallScore": number (1 to 10),
  "feedback": ["string"],
  "missingElements": ["string"],
  "suggestions": ["string"]
}`;

    try {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json(parsed);
        }
      }
    } catch (err: any) {
      console.error('Gemini photo analysis error:', err?.message || err);
    }

    // Fallback photo quality analysis
    let score = count >= 5 ? 9 : count >= 3 ? 7 : count >= 1 ? 5 : 2;
    const feedback: string[] = [];
    const missingElements: string[] = [];
    const suggestions: string[] = [];

    if (count === 0) {
      feedback.push('No photos uploaded yet. Listings with photos receive 5x more viewing requests!');
      missingElements.push('Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Exterior/Compound');
      suggestions.push('Upload at least 4 bright, high-resolution photos showing living areas, kitchen, and bathroom.');
    } else if (count < 3) {
      feedback.push(`You have uploaded ${count} photo(s). Adding more room angles will significantly boost tenant trust.`);
      missingElements.push('Clean bathroom photo', 'Kitchen close-up', 'Parking / Gate entry');
      suggestions.push('Add a photo of the bathroom and kitchen — tenants rank these as top decision factors.');
    } else {
      feedback.push(`Great job adding ${count} photos! Your listing displays good visual detail.`);
      suggestions.push('Set your brightest living room or balcony photo as the main cover photo for maximum click-throughs.');
    }

    return res.json({
      overallScore: score,
      feedback,
      missingElements,
      suggestions,
    });
  });

  // Smart House Recommendations
  app.get('/api/ai/recommendations', async (req, res) => {
    const { userId } = req.query;
    const user = users.find(u => u.id === String(userId));
    const firstName = user ? getFirstName(user.fullName) : 'there';

    // Respect user recommendation toggle
    if (user?.notificationPreferences && user.notificationPreferences.recommendations === false) {
      return res.json([]);
    }

    const savedIds = user ? (savedHousesMap[user.id] || []) : [];
    const recentlyViewed = user?.recentlyViewedHouseIds || [];

    const availableHouses = houses.filter(h => h.isAvailable);

    const recommendations = availableHouses.map(house => {
      let score = 80;
      let reasons: string[] = [];

      if (savedIds.includes(house.id)) {
        score += 15;
        reasons.push('Saved in your favorite bookmarks');
      }
      if (recentlyViewed.includes(house.id)) {
        score += 10;
        reasons.push('Similar to houses you recently viewed');
      }
      if (user?.maxBudget && house.rent <= user.maxBudget) {
        score += 8;
        reasons.push(`Fits your KSh ${user.maxBudget.toLocaleString()} budget`);
      }
      if (user?.preferredLocation && house.location.address.toLowerCase().includes(user.preferredLocation.toLowerCase())) {
        score += 8;
        reasons.push(`Located in your preferred area (${user.preferredLocation})`);
      }

      if (reasons.length === 0) {
        reasons.push(`Popular ${house.houseType} with zero commission fees in ${house.location.city}`);
      }

      return {
        house,
        matchScore: Math.min(score, 98),
        reason: `Hi ${firstName} 👋, ${reasons[0]}.`,
      };
    });

    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    return res.json(recommendations.slice(0, 6));
  });

  // AI Chat Assistant (Quick Replies)
  app.post('/api/ai/chat-suggestions', async (req, res) => {
    const { conversationId, userId } = req.body;
    const conv = conversations.find(c => c.id === conversationId);
    const user = users.find(u => u.id === userId);

    if (!conv || !user) {
      return res.json({ suggestions: ["I'm interested.", "Can I visit tomorrow?", "Is the house available?", "Thank you."] });
    }

    const isTenant = user.id === conv.tenantId;
    const convMsgs = messages.filter(m => m.conversationId === conversationId).slice(-4);
    const lastMsg = convMsgs[convMsgs.length - 1]?.text || '';

    const prompt = `You are CasaLink AI Chat Assistant in Kenya.
User Role: ${isTenant ? 'Tenant inquiring about a house' : 'Landlord answering a tenant'}.
House Title: ${conv.houseTitle || 'Rental House'}.
Last message received: "${lastMsg}".

Generate 4 concise, polite, natural quick reply suggestions for the user to tap and send.
Return ONLY a valid JSON array of strings, e.g. ["reply 1", "reply 2", "reply 3", "reply 4"]`;

    try {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (Array.isArray(parsed) && parsed.length >= 2) {
            return res.json({ suggestions: parsed.slice(0, 4) });
          }
        }
      }
    } catch (err: any) {
      console.error('Gemini chat suggestions error:', err?.message || err);
    }

    if (isTenant) {
      return res.json({
        suggestions: [
          "Hi! Is this house still available for viewing?",
          "Can I visit tomorrow at 2:00 PM?",
          "Does the rent include water and garbage charges?",
          "Thank you! I will confirm shortly."
        ]
      });
    } else {
      return res.json({
        suggestions: [
          "Hello! Yes, the house is available for viewing.",
          "You are welcome to inspect it tomorrow afternoon.",
          "The deposit is equivalent to 1 month rent.",
          "Feel free to call or WhatsApp me directly."
        ]
      });
    }
  });

  // Trigger Smart Engagement & Booking Reminders
  app.post('/api/ai/trigger-engagement', (req, res) => {
    const { userId } = req.body;
    const targetUsers = userId ? users.filter(u => u.id === userId) : users;
    let createdCount = 0;

    targetUsers.forEach(u => {
      const firstName = getFirstName(u.fullName);
      const prefs = u.notificationPreferences || {
        promotional: true,
        recommendations: true,
        reminders: true,
        generalEngagement: true,
      };

      // 1. Booking Reminders
      if (prefs.reminders) {
        const acceptedBookings = bookings.filter(
          b => (b.tenantId === u.id || b.landlordId === u.id) && b.status === 'accepted'
        );
        acceptedBookings.forEach(b => {
          const notifId = `ntf_rem_${b.id}_${u.id}`;
          if (!notifications.some(n => n.id === notifId)) {
            const isTenant = u.id === b.tenantId;
            notifications.unshift({
              id: notifId,
              userId: u.id,
              title: `⏰ Scheduled Viewing Reminder`,
              message: isTenant
                ? `Hi ${firstName} 👋, don't forget your scheduled viewing for ${b.houseTitle}! Contact landlord: ${b.landlordPhone}`
                : `Hi ${firstName} 👋, tenant ${b.tenantName} is scheduled to view your house ${b.houseTitle}! Phone: ${b.tenantPhone}`,
              type: 'reminder',
              read: false,
              createdAt: new Date().toISOString(),
            });
            createdCount++;
          }
        });
      }

      // 2. Profile Completion Hint
      if (prefs.generalEngagement && (!u.isPhoneVerified || !u.avatarUrl)) {
        const notifId = `ntf_prof_tip_${u.id}`;
        if (!notifications.some(n => n.id === notifId)) {
          notifications.unshift({
            id: notifId,
            userId: u.id,
            title: `👤 Smart Profile Tip`,
            message: `Hi ${firstName} 👋, complete your profile photo and verify your phone number to speed up house viewing approvals!`,
            type: 'profile_tip',
            read: false,
            createdAt: new Date().toISOString(),
          });
          createdCount++;
        }
      }

      // 3. Smart Daily Engagement Greeting & Advice
      if (prefs.generalEngagement) {
        const todayStr = new Date().toISOString().split('T')[0];
        const notifId = `ntf_eng_daily_${u.id}_${todayStr}`;
        if (!notifications.some(n => n.id === notifId)) {
          let engagementMsg = `Good morning ${firstName} ☀️! We're always looking for great homes for you. Your dream home could be just around the corner.`;
          if (u.role === 'landlord') {
            engagementMsg = `Good morning ${firstName} ☀️! Pro tip: Adding walkthrough video tours attracts 40% more genuine viewing bookings.`;
          }
          notifications.unshift({
            id: notifId,
            userId: u.id,
            title: `✨ Friendly Daily Check-in`,
            message: engagementMsg,
            type: 'engagement',
            read: false,
            createdAt: new Date().toISOString(),
          });
          createdCount++;
        }
      }
    });

    return res.json({ success: true, createdCount });
  });

  // ==========================================
  // VITE & PRODUCTION MIDDLEWARE
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CasaLink Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start CasaLink server:', err);
});
