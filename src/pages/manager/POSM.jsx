
import React, { useEffect, useState } from 'react';
import { getMenu, saveMenu, resetMenu } from '../../services/mockDatabase';

const POSM = () => {
  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Beverages');
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form State
  const [currentItem, setCurrentItem] = useState({});
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    // Reset menu to ensure latest prices are loaded
    resetMenu().then(() => getMenu()).then(setMenu);
  }, []);

  // Fixed category list required by product: Beverages, Main Dishes, Side Dish, Desserts
  const categories = ['Beverages', 'Main Dishes', 'Side Dish', 'Desserts'];

  const filteredMenu = menu.filter(m => m.category === selectedCategory);

  const handleSave = async () => {
    if (!currentItem.name || currentItem.basePrice === undefined || !currentItem.category) {
        alert('Please fill all fields');
        return;
    }
    if (isNaN(Number(currentItem.basePrice))) {
        setPriceError('Only numbers allowed');
        return;
    }

    const basePrice = parseFloat(currentItem.basePrice);
    const VAT_fee = parseFloat((basePrice * 0.12).toFixed(2));
    const totalPrice = parseFloat((basePrice + VAT_fee).toFixed(2));

    const itemToSave = {
      ...currentItem,
      basePrice: basePrice,
      VAT_fee: VAT_fee,
      totalPrice: totalPrice
    };

    let updatedMenu = [...menu];
    if (currentItem.id) {
        // Edit Mode
        updatedMenu = updatedMenu.map(m => m.id === currentItem.id ? itemToSave : m);
    } else {
        // Add Mode
        updatedMenu.push({ ...itemToSave, id: crypto.randomUUID() });
    }

    await saveMenu(updatedMenu);
    setMenu(updatedMenu);
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentItem({});
    setPriceError('');
  };

  const handleDelete = async () => {
    if (!currentItem.id) return;
    const updatedMenu = menu.filter(m => m.id !== currentItem.id);
    await saveMenu(updatedMenu);
    setMenu(updatedMenu);
    setShowDeleteModal(false);
    setCurrentItem({});
  };

  const openAddModal = () => {
    setCurrentItem({ category: selectedCategory || 'Beverages', basePrice: 0, VAT_fee: 0, totalPrice: 0 });
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setCurrentItem({ ...item });
    setShowEditModal(true);
  };

  const openDeleteModal = (item) => {
    setCurrentItem(item);
    setShowDeleteModal(true);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">POS Management</h1>
            <p className="text-gray-600">Manage your menu items and pricing</p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mb-8">
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-4 rounded-xl border-2 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === cat 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-700 shadow-lg shadow-blue-500/30' 
                            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:shadow-md'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Menu Grid */}
        {selectedCategory && (
            <div>
                <h2 className="text-2xl font-bold mb-4">{selectedCategory}</h2>
                <div className="flex flex-wrap gap-4">
                    {filteredMenu.map(item => (
                        <div 
                          key={item.id} 
                          className="w-40 h-40 border-2 border-gray-200 rounded-xl flex flex-col items-center justify-between p-3 relative bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <button 
                              onClick={() => openEditModal(item)} 
                              className="absolute top-2 left-2 w-10 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg text-xs font-medium"
                            >
                              EDIT
                            </button>
                            <button 
                              onClick={() => openDeleteModal(item)} 
                              className="absolute top-2 right-2 w-12 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg text-xs font-medium"
                            >
                              DELETE
                            </button>
                            <div className="mt-8 text-center font-bold text-gray-800 truncate w-full px-1">{item.name}</div>
                            <div className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              ₱ {item.totalPrice}
                            </div>
                        </div>
                    ))}
                    {/* Add Button Placeholder */}
                    <div className="w-40 h-40 flex items-center justify-center">
                         <button 
                           onClick={openAddModal} 
                           className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full text-white text-2xl pb-1 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                         >
                           +
                         </button>
                    </div>
                </div>
            </div>
        )}

        {/* Create/Edit Modal */}
        {(showAddModal || showEditModal) && (
            <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl w-96 shadow-2xl relative">
                    <h3 className="font-bold text-lg mb-4 text-center">{showEditModal ? 'Edit A Dish' : 'Create A Dish'}</h3>
                    
                    <div className="text-left text-sm font-bold mb-1">Dish Name</div>
                    <input 
                        className="w-full border rounded p-2 mb-4" 
                        value={currentItem.name || ''} 
                        onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                        placeholder="Enter dish name"
                    />

                    <div className="text-left text-sm font-bold mb-1">Base Price (₱)</div>
                    <input 
                        type="number"
                        step="0.01"
                        className="w-full border rounded p-2 mb-2" 
                        value={currentItem.basePrice || ''} 
                        onChange={e => {
                          const basePrice = parseFloat(e.target.value) || 0;
                          const VAT_fee = parseFloat((basePrice * 0.12).toFixed(2));
                          const totalPrice = parseFloat((basePrice + VAT_fee).toFixed(2));
                          setCurrentItem({
                            ...currentItem, 
                            basePrice: basePrice,
                            VAT_fee: VAT_fee,
                            totalPrice: totalPrice
                          });
                        }}
                        placeholder="Enter base price"
                    />

                    <div className="border rounded p-3 mb-4 bg-gray-50">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Base Price:</span>
                        <span className="font-bold">₱{(currentItem.basePrice || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>VAT (12%):</span>
                        <span className="font-bold text-blue-600">₱{(currentItem.VAT_fee || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-sm font-bold bg-yellow-100 p-2 rounded">
                        <span>Total Price:</span>
                        <span className="text-green-700">₱{(currentItem.totalPrice || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="text-left text-sm font-bold mb-1">Category</div>
                    <select 
                        className="w-full border rounded p-2 mb-4"
                        value={currentItem.category || ''}
                        onChange={e => setCurrentItem({...currentItem, category: e.target.value})}
                    >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {priceError && <div className="text-red-500 text-xs mb-2 text-center">{priceError}</div>}

                    <button 
                        onClick={handleSave}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg font-bold mb-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        SAVE
                    </button>
                    <button 
                        onClick={() => { 
                          setShowAddModal(false); 
                          setShowEditModal(false); 
                          setPriceError(''); 
                          setCurrentItem({});
                        }} 
                        className="absolute top-2 right-4 text-xl hover:text-red-600"
                    >
                        ✕
                    </button>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-80 shadow-2xl text-center">
                    <h3 className="font-bold mb-4">Are you sure you want to delete it?</h3>
                    <div className="flex gap-4 justify-center">
                        <button 
                          onClick={handleDelete} 
                          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => setShowDeleteModal(false)} 
                          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          No
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default POSM;
