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
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessMenu } from '@/types';
import { Plus, Star, UtensilsCrossed, Calendar, Edit, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MessPage() {
  const { user } = useAuth();
  const [menus, setMenus] = useState<MessMenu[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newMenu, setNewMenu] = useState({
    date: new Date().toISOString().split('T')[0],
    breakfast: [''],
    lunch: [''],
    dinner: [''],
    snacks: ['']
  });

  useEffect(() => {
    if (!user) return;

    const menusQuery = query(
      collection(db, 'messMenus'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(menusQuery, (snapshot) => {
      const menusData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as MessMenu[];
      
      setMenus(menusData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const meals = {
      breakfast: newMenu.breakfast.filter(item => item.trim()),
      lunch: newMenu.lunch.filter(item => item.trim()),
      dinner: newMenu.dinner.filter(item => item.trim()),
      snacks: newMenu.snacks.filter(item => item.trim())
    };

    try {
      await addDoc(collection(db, 'messMenus'), {
        date: newMenu.date,
        meals,
        ratings: {},
        averageRating: 0,
        createdBy: user.id,
        createdAt: new Date()
      });

      // Reset form
      setNewMenu({
        date: new Date().toISOString().split('T')[0],
        breakfast: [''],
        lunch: [''],
        dinner: [''],
        snacks: ['']
      });
      setShowAddMenu(false);
    } catch (error) {
      console.error('Error adding menu:', error);
    }
  };

  const handleRating = async (menuId: string, rating: number) => {
    if (!user) return;

    try {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return;

      const newRatings = { ...menu.ratings, [user.id]: rating };
      const ratingsArray = Object.values(newRatings);
      const averageRating = ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length;

      await updateDoc(doc(db, 'messMenus', menuId), {
        ratings: newRatings,
        averageRating
      });
    } catch (error) {
      console.error('Error rating menu:', error);
    }
  };

  const addMealItem = (mealType: keyof typeof newMenu, index: number) => {
    const newMeals = [...newMenu[mealType]];
    newMeals.splice(index + 1, 0, '');
    setNewMenu({ ...newMenu, [mealType]: newMeals });
  };

  const removeMealItem = (mealType: keyof typeof newMenu, index: number) => {
    const currentMeals = newMenu[mealType] as string[];
    const newMeals = currentMeals.filter((_: string, i: number) => i !== index);
    setNewMenu({ ...newMenu, [mealType]: newMeals.length ? newMeals : [''] });
  };

  const updateMealItem = (mealType: keyof typeof newMenu, index: number, value: string) => {
    const newMeals = [...newMenu[mealType]];
    newMeals[index] = value;
    setNewMenu({ ...newMenu, [mealType]: newMeals });
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getTodaysMenu = () => {
    const today = new Date().toISOString().split('T')[0];
    return menus.find(menu => menu.date === today);
  };

  const mealTypes = [
    { key: 'breakfast' as const, label: 'Breakfast', emoji: '🌅' },
    { key: 'lunch' as const, label: 'Lunch', emoji: '☀️' },
    { key: 'dinner' as const, label: 'Dinner', emoji: '🌙' },
    { key: 'snacks' as const, label: 'Snacks', emoji: '🍿' }
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

  const todaysMenu = getTodaysMenu();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mess Menu</h1>
            <p className="text-gray-600">Daily menu and food ratings</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddMenu(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Menu</span>
            </button>
          )}
        </div>

        {/* Today's Menu Highlight */}
        {todaysMenu && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md border border-blue-200">
            <div className="px-6 py-4 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <UtensilsCrossed className="h-5 w-5 mr-2 text-blue-600" />
                  Today's Menu
                </h2>
                <div className="flex items-center space-x-2">
                  {renderStars(todaysMenu.averageRating)}
                  <span className="text-sm text-gray-600">
                    ({Object.keys(todaysMenu.ratings).length} ratings)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mealTypes.map(({ key, label, emoji }) => (
                  <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">{emoji}</span>
                      {label}
                    </h3>
                    {todaysMenu.meals[key] && todaysMenu.meals[key].length > 0 ? (
                      <ul className="space-y-1">
                        {todaysMenu.meals[key].map((item, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No items</p>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Rating Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Rate Today's Food</h3>
                  <div className="flex items-center space-x-2">
                    {renderStars(
                      todaysMenu.ratings[user?.id || ''] || 0, 
                      true, 
                      (rating) => handleRating(todaysMenu.id, rating)
                    )}
                    {todaysMenu.ratings[user?.id || ''] && (
                      <span className="text-sm text-gray-600">
                        Your rating: {todaysMenu.ratings[user?.id || '']}★
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Menu History</h3>
          </div>
          
          {menus.length === 0 ? (
            <div className="p-8 text-center">
              <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No menus yet</h3>
              <p className="text-gray-600 mb-4">Start by adding today's mess menu</p>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAddMenu(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Menu
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {menus.map((menu) => (
                <div key={menu.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(menu.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {renderStars(menu.averageRating)}
                        <span className="text-sm text-gray-600">
                          ({Object.keys(menu.ratings).length} ratings)
                        </span>
                      </div>
                    </div>
                    
                    {/* Rating for this menu */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-2">Your rating:</p>
                      {renderStars(
                        menu.ratings[user?.id || ''] || 0, 
                        true, 
                        (rating) => handleRating(menu.id, rating)
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mealTypes.map(({ key, label, emoji }) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center">
                          <span className="mr-1">{emoji}</span>
                          {label}
                        </h4>
                        {menu.meals[key] && menu.meals[key].length > 0 ? (
                          <ul className="space-y-1">
                            {menu.meals[key].map((item, index) => (
                              <li key={index} className="text-xs text-gray-700">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No items</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Menu Modal */}
        {showAddMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add Menu</h3>
                  <button
                    onClick={() => setShowAddMenu(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddMenu} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newMenu.date}
                    onChange={(e) => setNewMenu({ ...newMenu, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {mealTypes.map(({ key, label, emoji }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {emoji} {label}
                    </label>
                    <div className="space-y-2">
                      {newMenu[key].map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateMealItem(key, index, e.target.value)}
                            placeholder={`${label} item ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => addMealItem(key, index)}
                            className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          {newMenu[key].length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMealItem(key, index)}
                              className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Menu
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