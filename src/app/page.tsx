'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/components/LoginPage';
import { DollarSign, UtensilsCrossed, Calendar, Users, MessageCircle, Shirt } from 'lucide-react';

const quickActions = [
  {
    name: 'Split Expense',
    description: 'Add and split bills with friends',
    icon: DollarSign,
    href: '/expenses',
    color: 'bg-green-500',
  },
  {
    name: 'Check Menu',
    description: 'Today\'s mess menu and ratings',
    icon: UtensilsCrossed,
    href: '/mess',
    color: 'bg-orange-500',
  },
  {
    name: 'Plan Event',
    description: 'Organize study sessions or parties',
    icon: Calendar,
    href: '/events',
    color: 'bg-blue-500',
  },
  {
    name: 'Social Wall',
    description: 'Share memes and connect',
    icon: Users,
    href: '/wall',
    color: 'bg-purple-500',
  },
  {
    name: 'Group Chat',
    description: 'Chat with hostel mates',
    icon: MessageCircle,
    href: '/chat',
    color: 'bg-indigo-500',
  },
  {
    name: 'Laundry Queue',
    description: 'Book washing machine slots',
    icon: Shirt,
    href: '/laundry',
    color: 'bg-cyan-500',
  },
];

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to Hostel-Bros. What would you like to do today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.name}
                href={action.href}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${action.color} rounded-lg p-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">No recent expenses to split</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Welcome to Hostel-Bros!</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Pending Bills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Events This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">1</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Unread Messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
