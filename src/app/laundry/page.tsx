'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LaundrySlot, User } from '@/types';
import { Plus, Shirt, Clock, User as UserIcon, Trash2, RefreshCw, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function LaundryPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<LaundrySlot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showBookSlot, setShowBookSlot] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newSlot, setNewSlot] = useState({
    machineId: 'machine1',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '08:00-10:00'
  });

  const machines = [
    { id: 'machine1', name: 'Washing Machine 1', location: 'Ground Floor' },
    { id: 'machine2', name: 'Washing Machine 2', location: 'Ground Floor' },
    { id: 'machine3', name: 'Washing Machine 3', location: 'First Floor' }
  ];

  const timeSlots = [
    '06:00-08:00',
    '08:00-10:00',
    '10:00-12:00',
    '12:00-14:00',
    '14:00-16:00',
    '16:00-18:00',
    '18:00-20:00',
    '20:00-22:00'
  ];

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

    // Listen to laundry slots
    const slotsQuery = query(
      collection(db, 'laundrySlots'),
      orderBy('date', 'asc'),
      orderBy('timeSlot', 'asc')
    );

    const unsubscribe = onSnapshot(slotsQuery, (snapshot) => {
      const slotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as LaundrySlot[];
      
      setSlots(slotsData);
      setLoading(false);
    });

    fetchUsers();
    return () => unsubscribe();
  }, [user]);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check if slot is already booked
    const existingSlot = slots.find(slot => 
      slot.machineId === newSlot.machineId && 
      slot.date === newSlot.date && 
      slot.timeSlot === newSlot.timeSlot &&
      slot.status !== 'cancelled'
    );

    if (existingSlot) {
      alert('This slot is already booked!');
      return;
    }

    try {
      await addDoc(collection(db, 'laundrySlots'), {
        machineId: newSlot.machineId,
        date: newSlot.date,
        timeSlot: newSlot.timeSlot,
        bookedBy: user.id,
        status: 'booked',
        createdAt: new Date()
      });

      // Reset form
      setNewSlot({
        machineId: 'machine1',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '08:00-10:00'
      });
      setShowBookSlot(false);
    } catch (error) {
      console.error('Error booking slot:', error);
    }
  };

  const handleUpdateStatus = async (slotId: string, status: LaundrySlot['status']) => {
    try {
      await updateDoc(doc(db, 'laundrySlots', slotId), { status });
    } catch (error) {
      console.error('Error updating slot status:', error);
    }
  };

  const handleCancelSlot = async (slotId: string) => {
    try {
      await deleteDoc(doc(db, 'laundrySlots', slotId));
    } catch (error) {
      console.error('Error cancelling slot:', error);
    }
  };

  const getSlotsByDate = (date: string) => {
    return slots.filter(slot => slot.date === date);
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const getStatusColor = (status: LaundrySlot['status']) => {
    const colors = {
      booked: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: LaundrySlot['status']) => {
    const icons = {
      booked: Clock,
      'in-progress': RefreshCw,
      completed: '✓',
      cancelled: X
    };
    return icons[status];
  };

  const isSlotAvailable = (machineId: string, date: string, timeSlot: string) => {
    return !slots.some(slot => 
      slot.machineId === machineId && 
      slot.date === date && 
      slot.timeSlot === timeSlot &&
      slot.status !== 'cancelled'
    );
  };

  const getUserSlots = () => {
    return slots.filter(slot => slot.bookedBy === user?.id);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const userSlots = getUserSlots();
  const next7Days = getNext7Days();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laundry Queue</h1>
            <p className="text-gray-600">Book washing machine slots and manage your laundry</p>
          </div>
          <button
            onClick={() => setShowBookSlot(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Book Slot</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <Shirt className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{machines.length}</h3>
                <p className="text-gray-600">Machines</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{userSlots.length}</h3>
                <p className="text-gray-600">Your Bookings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {slots.filter(s => s.status === 'in-progress').length}
                </h3>
                <p className="text-gray-600">In Progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {slots.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
                </h3>
                <p className="text-gray-600">Today's Slots</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Bookings */}
        {userSlots.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Your Bookings</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {userSlots.map((slot) => {
                const machine = machines.find(m => m.id === slot.machineId);
                const StatusIcon = getStatusIcon(slot.status);
                const canUpdateStatus = slot.bookedBy === user?.id;
                
                return (
                  <div key={slot.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 rounded-lg p-3">
                          <Shirt className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{machine?.name}</h4>
                          <p className="text-sm text-gray-600">{machine?.location}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{new Date(slot.date).toLocaleDateString()}</span>
                            <span>{slot.timeSlot}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(slot.status)}`}>
                          {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                        </span>
                        
                        {canUpdateStatus && slot.status === 'booked' && (
                          <button
                            onClick={() => handleUpdateStatus(slot.id, 'in-progress')}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        
                        {canUpdateStatus && slot.status === 'in-progress' && (
                          <button
                            onClick={() => handleUpdateStatus(slot.id, 'completed')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        
                        {canUpdateStatus && slot.status !== 'completed' && (
                          <button
                            onClick={() => handleCancelSlot(slot.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {next7Days.map((date) => {
                const daySlots = getSlotsByDate(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                
                return (
                  <div key={date} className={`border rounded-lg p-4 ${isToday ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {isToday && <span className="ml-2 text-blue-600">(Today)</span>}
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {machines.map((machine) => (
                        <div key={machine.id} className="border border-gray-200 rounded-lg p-3">
                          <h5 className="font-medium text-gray-900 mb-2">{machine.name}</h5>
                          <p className="text-xs text-gray-600 mb-3">{machine.location}</p>
                          
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {timeSlots.map((timeSlot) => {
                              const isAvailable = isSlotAvailable(machine.id, date, timeSlot);
                              const slotData = daySlots.find(s => 
                                s.machineId === machine.id && s.timeSlot === timeSlot
                              );
                              const bookedUser = slotData ? users.find(u => u.id === slotData.bookedBy) : null;
                              
                              return (
                                <div
                                  key={timeSlot}
                                  className={`p-2 rounded text-center ${
                                    isAvailable 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                  title={slotData ? `Booked by ${bookedUser?.name}` : 'Available'}
                                >
                                  <div className="font-medium">{timeSlot}</div>
                                  {slotData && (
                                    <div className="text-xs truncate">
                                      {bookedUser?.name?.split(' ')[0]}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Book Slot Modal */}
        {showBookSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Book Laundry Slot</h3>
                  <button
                    onClick={() => setShowBookSlot(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleBookSlot} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Washing Machine
                  </label>
                  <select
                    value={newSlot.machineId}
                    onChange={(e) => setNewSlot({ ...newSlot, machineId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {machines.map(machine => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name} - {machine.location}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot
                  </label>
                  <select
                    value={newSlot.timeSlot}
                    onChange={(e) => setNewSlot({ ...newSlot, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeSlots.map(timeSlot => {
                      const isAvailable = isSlotAvailable(newSlot.machineId, newSlot.date, timeSlot);
                      return (
                        <option key={timeSlot} value={timeSlot} disabled={!isAvailable}>
                          {timeSlot} {!isAvailable ? '(Booked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Guidelines:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Each slot is 2 hours long</li>
                    <li>• Please start your laundry on time</li>
                    <li>• Remove clothes immediately after completion</li>
                    <li>• Cancel if you can't use your slot</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookSlot(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Book Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}