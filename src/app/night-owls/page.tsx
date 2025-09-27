'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot,
  doc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { db, rtdb } from '@/lib/firebase';
import { User } from '@/types';
import { Moon, Sun, Users, Clock, Eye, EyeOff, Zap } from 'lucide-react';
import { getRelativeTime, isNightTime } from '@/lib/utils';

export default function NightOwlsPage() {
  const { user, updateUserStatus } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [presenceData, setPresenceData] = useState<{ [userId: string]: { state: string; lastSeen: number } }>({});
  const [isNightOwl, setIsNightOwl] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch all users
    const fetchUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    };

    // Listen to presence data from Realtime Database
    const presenceRef = ref(rtdb, 'status');
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      setPresenceData(data);
    });

    // Listen to user's night owl status
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
      
      const currentUser = usersData.find(u => u.id === user.id);
      if (currentUser) {
        setIsNightOwl(currentUser.isNightOwl || false);
      }
      setLoading(false);
    });

    fetchUsers();
    return () => {
      unsubscribePresence();
      unsubscribeUsers();
    };
  }, [user]);

  const toggleNightOwlStatus = async () => {
    if (!user) return;

    try {
      const newStatus = !isNightOwl;
      await updateDoc(doc(db, 'users', user.id), {
        isNightOwl: newStatus
      });
      setIsNightOwl(newStatus);
    } catch (error) {
      console.error('Error updating night owl status:', error);
    }
  };

  const getOnlineUsers = () => {
    return users.filter(u => {
      const presence = presenceData[u.id];
      return presence?.state === 'online';
    });
  };

  const getNightOwls = () => {
    return users.filter(u => u.isNightOwl);
  };

  const getActiveNightOwls = () => {
    const nightOwls = getNightOwls();
    return nightOwls.filter(u => {
      const presence = presenceData[u.id];
      if (!presence) return false;
      
      // Consider active if online or last seen within 30 minutes
      const isOnline = presence.state === 'online';
      const lastSeenRecent = presence.lastSeen && (Date.now() - presence.lastSeen) < 30 * 60 * 1000;
      
      return isOnline || lastSeenRecent;
    });
  };

  const getUserStatus = (userId: string) => {
    const presence = presenceData[userId];
    if (!presence) return { status: 'offline', lastSeen: 'Unknown' };
    
    if (presence.state === 'online') {
      return { status: 'online', lastSeen: 'Now' };
    }
    
    const lastSeen = presence.lastSeen ? new Date(presence.lastSeen) : null;
    return {
      status: 'offline',
      lastSeen: lastSeen ? getRelativeTime(lastSeen) : 'Unknown'
    };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500'
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  const getCurrentHour = () => new Date().getHours();
  const isLateNight = isNightTime();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const onlineUsers = getOnlineUsers();
  const nightOwls = getNightOwls();
  const activeNightOwls = getActiveNightOwls();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Moon className="h-8 w-8 mr-3 text-purple-600" />
              Night Owls
            </h1>
            <p className="text-gray-600">See who's awake during late hours</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Current time</div>
              <div className="text-lg font-semibold">
                {new Date().toLocaleTimeString('en-US', { 
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            {isLateNight && (
              <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center">
                <Moon className="h-4 w-4 mr-1" />
                Night Time
              </div>
            )}
          </div>
        </div>

        {/* Night Owl Toggle */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 rounded-full p-3">
                {isNightOwl ? (
                  <Moon className="h-6 w-6 text-purple-600" />
                ) : (
                  <Sun className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isNightOwl ? 'You are a Night Owl! 🦉' : 'Join the Night Owls'}
                </h3>
                <p className="text-gray-600">
                  {isNightOwl 
                    ? 'Others can see when you\'re active during late hours'
                    : 'Let others know when you\'re awake late at night'
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleNightOwlStatus}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                isNightOwl
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isNightOwl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{isNightOwl ? 'Stop Tracking' : 'Start Tracking'}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{onlineUsers.length}</h3>
                <p className="text-gray-600">Online Now</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <Moon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{nightOwls.length}</h3>
                <p className="text-gray-600">Night Owls</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{activeNightOwls.length}</h3>
                <p className="text-gray-600">Active Now</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{getCurrentHour()}</h3>
                <p className="text-gray-600">Current Hour</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Night Owls */}
        {isLateNight && activeNightOwls.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Active Night Owls ({activeNightOwls.length})
              </h3>
              <p className="text-sm text-gray-600">People who are currently active during night hours</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeNightOwls.map((nightOwl) => {
                  const status = getUserStatus(nightOwl.id);
                  
                  return (
                    <div key={nightOwl.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="bg-purple-500 rounded-full p-2">
                            <span className="text-white font-semibold text-sm">
                              {nightOwl.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(status.status)}`}></div>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{nightOwl.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(status.status)}`}></span>
                            <span className="capitalize">{status.status}</span>
                            {status.status === 'offline' && (
                              <span>• {status.lastSeen}</span>
                            )}
                          </div>
                          {nightOwl.roomNumber && (
                            <p className="text-xs text-gray-500 mt-1">Room {nightOwl.roomNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* All Night Owls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Moon className="h-5 w-5 mr-2 text-purple-600" />
              All Night Owls ({nightOwls.length})
            </h3>
            <p className="text-sm text-gray-600">Users who have opted in to night owl tracking</p>
          </div>
          
          {nightOwls.length === 0 ? (
            <div className="p-8 text-center">
              <Moon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Night Owls Yet</h3>
              <p className="text-gray-600 mb-4">Be the first to join the night owl community!</p>
              {!isNightOwl && (
                <button
                  onClick={toggleNightOwlStatus}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Become a Night Owl
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {nightOwls.map((nightOwl) => {
                const status = getUserStatus(nightOwl.id);
                const isActive = status.status === 'online' || 
                  (presenceData[nightOwl.id]?.lastSeen && 
                   (Date.now() - presenceData[nightOwl.id].lastSeen) < 30 * 60 * 1000);
                
                return (
                  <div key={nightOwl.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {nightOwl.profilePic ? (
                            <img
                              src={nightOwl.profilePic}
                              alt={nightOwl.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {nightOwl.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(status.status)}`}></div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">{nightOwl.name}</h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(status.status)}`}></span>
                              <span className="capitalize">{status.status}</span>
                            </span>
                            {status.status === 'offline' && (
                              <span>Last seen {status.lastSeen}</span>
                            )}
                            {nightOwl.roomNumber && (
                              <span>Room {nightOwl.roomNumber}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isActive && isLateNight && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            Active
                          </div>
                        )}
                        
                        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <Moon className="h-3 w-3 mr-1" />
                          Night Owl
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">How Night Owl Tracking Works</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Opt-in to let others see when you're active during night hours (11 PM - 6 AM)</li>
                <li>• Your online status is automatically tracked when you're using the app</li>
                <li>• Perfect for finding study buddies or people to chat with late at night</li>
                <li>• You can turn off tracking anytime to maintain privacy</li>
                <li>• Only shows activity status, not what you're doing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}