'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  DollarSign, 
  UtensilsCrossed, 
  Calendar, 
  Shirt, 
  Moon, 
  Users, 
  MessageCircle,
  Settings,
  Cog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Expenses', href: '/expenses', icon: DollarSign },
  { name: 'Mess Menu', href: '/mess', icon: UtensilsCrossed },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Laundry', href: '/laundry', icon: Shirt },
  { name: 'Night Owls', href: '/night-owls', icon: Moon },
  { name: 'Social Wall', href: '/wall', icon: Users },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Settings', href: '/settings', icon: Cog },
  { name: 'Admin', href: '/admin', icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="flex flex-col h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hostel-Bros</h1>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}