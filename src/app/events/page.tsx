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
  arrayUnion,
  arrayRemove,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event, User } from '@/types';
import { Plus, Calendar, Users, MapPin, Clock, UserPlus, UserMinus, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'study' as const,
    date: '',
    time: '',
    location: '',
    maxParticipants: ''
  });

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

    // Listen to events
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        date: doc.data().date?.toDate() || new Date()
      })) as Event[];
      
      setEvents(eventsData);
      setLoading(false);
    });

    fetchUsers();
    return () => unsubscribe();
  }, [user]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEvent.title || !newEvent.date) return;

    const eventDateTime = new Date(`${newEvent.date}T${newEvent.time || '12:00'}`);

    try {
      await addDoc(collection(db, 'events'), {
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        date: eventDateTime,
        location: newEvent.location,
        participants: [user.id],
        maxParticipants: newEvent.maxParticipants ? parseInt(newEvent.maxParticipants) : null,
        createdBy: user.id,
        createdAt: new Date()
      });

      // Reset form
      setNewEvent({
        title: '',
        description: '',
        type: 'study',
        date: '',
        time: '',
        location: '',
        maxParticipants: ''
      });
      setShowAddEvent(false);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'events', eventId), {
        participants: arrayUnion(user.id)
      });
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'events', eventId), {
        participants: arrayRemove(user.id)
      });
    } catch (error) {
      console.error('Error leaving event:', error);
    }
  };

  const getEventTypeInfo = (type: string) => {
    const types = {
      study: { emoji: '📚', color: 'bg-blue-100 text-blue-800', label: 'Study Session' },
      chill: { emoji: '🎮', color: 'bg-green-100 text-green-800', label: 'Chill Time' },
      sports: { emoji: '⚽', color: 'bg-orange-100 text-orange-800', label: 'Sports' },
      birthday: { emoji: '🎂', color: 'bg-pink-100 text-pink-800', label: 'Birthday' },
      other: { emoji: '🎉', color: 'bg-purple-100 text-purple-800', label: 'Other' }
    };
    return types[type as keyof typeof types] || types.other;
  };

  const isEventFull = (event: Event) => {
    return event.maxParticipants && event.participants.length >= event.maxParticipants;
  };

  const isEventPast = (event: Event) => {
    return event.date < new Date();
  };

  const getUpcomingEvents = () => {
    return events.filter(event => !isEventPast(event));
  };

  const getPastEvents = () => {
    return events.filter(event => isEventPast(event));
  };

  const eventTypes = [
    { value: 'study', label: 'Study Session', emoji: '📚' },
    { value: 'chill', label: 'Chill Time', emoji: '🎮' },
    { value: 'sports', label: 'Sports', emoji: '⚽' },
    { value: 'birthday', label: 'Birthday', emoji: '🎂' },
    { value: 'other', label: 'Other', emoji: '🎉' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Plan study sessions, parties, and activities</p>
          </div>
          <button
            onClick={() => setShowAddEvent(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</h3>
                <p className="text-gray-600">Upcoming Events</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {upcomingEvents.reduce((total, event) => total + event.participants.length, 0)}
                </h3>
                <p className="text-gray-600">Total Participants</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {upcomingEvents.filter(event => event.participants.includes(user?.id || '')).length}
                </h3>
                <p className="text-gray-600">Your Events</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
          </div>
          
          {upcomingEvents.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-600 mb-4">Create your first event to get started</p>
              <button
                onClick={() => setShowAddEvent(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Event
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {upcomingEvents.map((event) => {
                const typeInfo = getEventTypeInfo(event.type);
                const isParticipant = event.participants.includes(user?.id || '');
                const canJoin = !isParticipant && !isEventFull(event);
                const organizer = users.find(u => u.id === event.createdBy);
                
                return (
                  <div key={event.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <span className="text-2xl">{typeInfo.emoji}</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                            
                            {event.description && (
                              <p className="text-gray-600 mb-3">{event.description}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(event.date)}
                              </span>
                              {event.location && (
                                <span className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {event.location}
                                </span>
                              )}
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {event.participants.length}
                                {event.maxParticipants && ` / ${event.maxParticipants}`} participants
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              Organized by {organizer?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        {isParticipant ? (
                          <button
                            onClick={() => handleLeaveEvent(event.id)}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 text-sm"
                          >
                            <UserMinus className="h-4 w-4" />
                            <span>Leave</span>
                          </button>
                        ) : canJoin ? (
                          <button
                            onClick={() => handleJoinEvent(event.id)}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 text-sm"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Join</span>
                          </button>
                        ) : (
                          <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm text-center">
                            {isEventFull(event) ? 'Event Full' : 'Already Joined'}
                          </div>
                        )}
                        
                        {isParticipant && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs text-center">
                            Joined
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Past Events</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {pastEvents.slice(0, 5).map((event) => {
                const typeInfo = getEventTypeInfo(event.type);
                const organizer = users.find(u => u.id === event.createdBy);
                
                return (
                  <div key={event.id} className="p-6 opacity-75">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <span className="text-lg">{typeInfo.emoji}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>{formatDate(event.date)}</span>
                          <span>{event.participants.length} participants</span>
                          <span>by {organizer?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Event Modal */}
        {showAddEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Event</h3>
                  <button
                    onClick={() => setShowAddEvent(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Study session, birthday party, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="What's this event about?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Common room, ground floor, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEvent.maxParticipants}
                    onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddEvent(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Event
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