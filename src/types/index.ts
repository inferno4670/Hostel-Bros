export interface User {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  role: 'user' | 'admin';
  status: 'online' | 'offline' | 'away';
  roomNumber?: string;
  joinedAt: Date;
  lastSeen: Date;
  isNightOwl?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: 'food' | 'utilities' | 'entertainment' | 'groceries' | 'other';
  paidBy: string;
  sharedWith: string[];
  splitType: 'equal' | 'custom';
  customSplits?: { [userId: string]: number };
  createdAt: Date;
  settledBy?: string[];
  isSettled: boolean;
}

export interface MessMenu {
  id: string;
  date: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks?: string[];
  };
  ratings: { [userId: string]: number };
  averageRating: number;
  createdBy: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'study' | 'chill' | 'sports' | 'birthday' | 'other';
  date: Date;
  location: string;
  participants: string[];
  maxParticipants?: number;
  createdBy: string;
  createdAt: Date;
}

export interface LaundrySlot {
  id: string;
  machineId: string;
  date: string;
  timeSlot: string;
  bookedBy: string;
  status: 'booked' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Post {
  id: string;
  type: 'text' | 'image' | 'doc' | 'link' | 'meme';
  content: string;
  fileUrl?: string;
  fileName?: string;
  postedBy: string;
  likes: string[];
  comments: Comment[];
  tags?: string[];
  createdAt: Date;
  isApproved: boolean;
}

export interface Comment {
  id: string;
  content: string;
  postedBy: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  type: 'group' | 'private';
  name?: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'doc' | 'voice' | 'link';
  fileUrl?: string;
  fileName?: string;
  sentBy: string;
  sentAt: Date;
  readBy: string[];
  reactions?: { [emoji: string]: string[] };
}

export interface AdminLog {
  id: string;
  action: string;
  performedBy: string;
  targetId?: string;
  details: string;
  timestamp: Date;
}