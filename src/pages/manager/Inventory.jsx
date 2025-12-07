import React, { useState, useEffect } from 'react';
import {
  getInventory,
  getSuppliers,
  saveSuppliers,
  getMenu,
  getRecipes,
  saveRecipe,
  addInventoryItem,
  updateInventoryItem,
  getUsageLogs,
} from '../../services/mockDatabase';

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState('Inventory');
  const [inventorySubTab, setInventorySubTab] = useState('General');

  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [menu, setMenu] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [usageLogs, setUsageLogs] = useState([]);

  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  const [addItemData, setAddItemData] = useState({
    name: '',
    stock: '',
    cost: '',
    type: 'Perishable',
    measurementUnit: 'g',
    measurementQty: '1000',
    lowStockThreshold: '5',
  });

  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    stock: '',
    cost: '',
    type: '',
    measurementUnit: '',
    measurementQty: '',
    openStock: '',
    lowStockThreshold: '',
  });

  const [selectedCategory, setSelectedCategory] = useState('Beverages');
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [invData, supData, menuData, recipeData, logData] = await Promise.all([
      getInventory(),
      getSuppliers(),
      getMenu(),
      getRecipes(),
      getUsageLogs(),
    ]);
    setInventory(invData);
    setSuppliers(supData);
    setMenu(menuData);
    setRecipes(recipeData);
    setUsageLogs(logData);
  };

  const handleAddSupplier = async () => {
    if (!supplierEmail.includes('@') || !supplierEmail.endsWith('.com')) {
      alert('Needs to be a valid email');
      setSupplierEmail('');
      return;
    }
    const newSupplier = { id: crypto.randomUUID(), name: supplierName, email: supplierEmail };
    const updated = [...suppliers, newSupplier];
    await saveSuppliers(updated);
    setSuppliers(updated);
    setShowSupplierModal(false);
    setSupplierName('');
    setSupplierEmail('');
  };

  const handleAddItemChange = (e) => {
    const { name, value } = e.target;
    setAddItemData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNewItem = async () => {
    if (!addItemData.name || !addItemData.stock || !addItemData.cost) {
      alert('Please fill in all fields.');
      return;
    }

    const newItem = {
      name: addItemData.name,
      inStock: parseInt(addItemData.stock, 10),
      cost: parseFloat(addItemData.cost),
      type: addItemData.type,
      measurementUnit: addItemData.measurementUnit,
      measurementQty: parseInt(addItemData.measurementQty, 10) || 1,
      openStock: 0,
      lowStockThreshold: parseInt(addItemData.lowStockThreshold, 10) || 5,
    };

    await addInventoryItem(newItem);
    await refreshData();
    handleClearNewItem();
  };

  const handleClearNewItem = () => {
    setAddItemData({
      name: '',
      stock: '',
      cost: '',
      type: 'Perishable',
      measurementUnit: 'g',
      measurementQty: '1000',
      lowStockThreshold: '5',
    });
  };

  const handleSelectForEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name || '',
      stock: (item.inStock ?? '').toString(),
      cost: (item.cost ?? '').toString(),
      type: item.type || 'Perishable',
      measurementUnit: item.measurementUnit || 'g',
      measurementQty: (item.measurementQty ?? '').toString(),
      openStock: (item.openStock ?? '').toString(),
      lowStockThreshold: (item.lowStockThreshold ?? 5).toString(),
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEditItem = async () => {
    if (!editingItem) return;

    await updateInventoryItem(editingItem.id, {
      name: editFormData.name,
      inStock: parseInt(editFormData.stock, 10) || 0,
      cost: parseFloat(editFormData.cost) || 0,
      type: editFormData.type,
      measurementUnit: editFormData.measurementUnit,
      measurementQty: parseInt(editFormData.measurementQty, 10) || 1,
      openStock: parseInt(editFormData.openStock, 10) || 0,
      lowStockThreshold: parseInt(editFormData.lowStockThreshold, 10) || 5,
    });

    await refreshData();
    setEditingItem(null);
    setEditFormData({
      name: '',
      stock: '',
      cost: '',
      type: '',
      measurementUnit: '',
      measurementQty: '',
      openStock: '',
      lowStockThreshold: '',
    });
  };

  const handleOpenAutoModal = (dish) => {
    setSelectedDish(dish);
    setCurrentRecipe(recipes[dish.id] ? [...recipes[dish.id]] : []);
    setShowAutoModal(true);
    setRecipeSearch('');
  };

  const handleAddToRecipe = (inventoryItem) => {
    if (currentRecipe.find((r) => r.inventoryId === inventoryItem.id)) return;
    const defaultQty = inventoryItem.measurementUnit === 'pcs' ? 1 : 10;

    const newItem = {
      inventoryId: inventoryItem.id,
      name: inventoryItem.name,
      quantity: defaultQty,
    };
    setCurrentRecipe([...currentRecipe, newItem]);
  };

  const handleSetRecipeQuantity = (inventoryId, value) => {
    const newQty = parseFloat(value);
    if (isNaN(newQty)) return;

    setCurrentRecipe((prev) =>
      prev.map((item) =>
        item.inventoryId === inventoryId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveFromRecipe = (inventoryId) => {
    setCurrentRecipe((prev) => prev.filter((item) => item.inventoryId !== inventoryId));
  };

  const handleSaveRecipe = async () => {
    if (!selectedDish) return;
    await saveRecipe(selectedDish.id, currentRecipe);
    await refreshData();
    setShowAutoModal(false);
    setSelectedDish(null);
    setCurrentRecipe([]);
  };

  const filteredInventory = inventory
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'most') return b.inStock - a.inStock;
      if (sortOrder === 'least') return a.inStock - b.inStock;
      return 0;
    });

  const filteredKitchenInventory = inventory
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'most') return b.openStock - a.openStock;
      if (sortOrder === 'least') return a.openStock - b.openStock;
      return 0;
    });

  const filteredUsageLogs = usageLogs
    .filter((l) => l.itemName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'most') return b.quantityUsed - a.quantityUsed;
      if (sortOrder === 'least') return a.quantityUsed - b.quantityUsed;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const categories = ['Beverages', 'Main Dishes', 'Side Dish', 'Desserts'];
  const filteredMenuByCat = menu.filter(
    (m) => m.category === selectedCategory || (m.category === 'Main Dishes' && selectedCategory === 'Main Dish')
  );

  const modalInventoryList = inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(recipeSearch.toLowerCase()) &&
      i.type !== 'Not Food'
  );

  const editInventoryList = inventory.filter((i) =>
    i.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Inventory Management</h1>
        <p className="text-gray-600">Manage stock, suppliers, and recipes</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full overflow-hidden flex shadow-lg">
          {['Inventory', 'Suppliers', 'Management'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSortOrder(null);
                setSearch('');
              }}
              className={`px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Inventory' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => {
                  setInventorySubTab('General');
                  setSortOrder(null);
                  setSearch('');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  inventorySubTab === 'General'
                    ? 'bg-white shadow-md text-gray-900 transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                General
              </button>
              <button
                onClick={() => {
                  setInventorySubTab('Used');
                  setSortOrder(null);
                  setSearch('');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  inventorySubTab === 'Used'
                    ? 'bg-white shadow-md text-gray-900 transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                Used
              </button>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder={
                  inventorySubTab === 'General' ? 'Search packs...' : 'Search kitchen...'
                }
                className="border border-gray-200 rounded-xl px-4 py-2 w-full md:w-64 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="border border-gray-200 rounded-xl px-4 py-2 bg-white/80 backdrop-blur-sm text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                value={sortOrder || ''}
                onChange={(e) => setSortOrder(e.target.value || null)}
              >
                <option value="">Sort By...</option>
                <option value="most">
                  Most {inventorySubTab === 'General' ? 'Stock' : 'Quantity'}
                </option>
                <option value="least">
                  Least {inventorySubTab === 'General' ? 'Stock' : 'Quantity'}
                </option>
              </select>
            </div>
          </div>

          {inventorySubTab === 'General' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-700">Item Name</th>
                    <th className="p-4 text-center font-semibold text-gray-700">Packs</th>
                    <th className="p-4 text-center font-semibold text-gray-700">Alert At</th>
                    <th className="p-4 text-center font-semibold text-gray-700">Amount per Pack</th>
                    <th className="p-4 text-center font-semibold text-gray-700">Unit Cost</th>
                    <th className="p-4 font-semibold text-gray-700">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200">
                      <td className="p-4 font-medium text-gray-800">{item.name}</td>
                      <td
                        className={`p-4 font-semibold text-center ${
                          item.inStock <= item.lowStockThreshold ? 'text-red-600 bg-red-50 rounded-lg' : ''
                        }`}
                      >
                        {item.inStock}
                      </td>
                      <td className="p-4 text-center text-gray-500 text-xs">
                        {item.lowStockThreshold}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {item.measurementQty} {item.measurementUnit}
                      </td>
                      <td className="p-4 text-center font-medium text-gray-800">{item.cost}</td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {item.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {inventorySubTab === 'Used' && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Kitchen Stock (Open)</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 text-blue-900">
                      <tr>
                        <th className="p-4 font-semibold">Item Name</th>
                        <th className="p-4 text-center font-semibold">Open Amount</th>
                        <th className="p-4 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKitchenInventory.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3 font-semibold text-blue-700 text-center">
                            {item.openStock} {item.measurementUnit}
                          </td>
                          <td className="p-3 text-center">
                            {item.openStock <= 0 ? (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                                Empty
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">
                                In Use
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Recent Usage History</h3>
                <div className="border rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="p-3">Item Name</th>
                        <th className="p-3 text-center">Quantity Deducted</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Date/Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsageLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500">
                            No usage logs found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsageLogs.map((log) => (
                          <tr key={log.id} className="border-b last:border-b-0">
                            <td className="p-3 font-medium">{log.itemName}</td>
                            <td className="p-3 font-semibold text-red-600 text-center">
                              -{log.quantityUsed}
                            </td>
                            <td className="p-3">{log.unit}</td>
                            <td className="p-3 text-xs text-gray-600">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Suppliers' && (
        <div className="relative">
          <div className="flex flex-wrap gap-4">
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="w-64 h-40 border rounded-2xl p-4 flex flex-col justify-between bg-white"
              >
                <div className="text-center font-semibold">{sup.name}</div>
                <div className="text-xs text-gray-600 break-words">Email: {sup.email}</div>
              </div>
            ))}

            <button
              onClick={() => setShowSupplierModal(true)}
              className="w-16 h-16 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center self-center"
            >
              +
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Management' && (
        <div className="flex flex-col w-full pb-10 gap-10">
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-center">Add Inventory Item</h2>
            <div className="border rounded-xl p-6 bg-white">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Item Name</label>
                  <input
                    name="name"
                    value={addItemData.name}
                    onChange={handleAddItemChange}
                    className="w-full border rounded p-2"
                    placeholder="e.g. Sugar, Flour, Milk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Cost (Per Pack)</label>
                  <input
                    name="cost"
                    type="number"
                    value={addItemData.cost}
                    onChange={handleAddItemChange}
                    className="w-full border rounded p-2"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Stock (Packs)</label>
                  <input
                    name="stock"
                    type="number"
                    value={addItemData.stock}
                    onChange={handleAddItemChange}
                    className="w-full border rounded p-2"
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Unit Type</label>
                  <select
                    name="measurementUnit"
                    value={addItemData.measurementUnit}
                    onChange={handleAddItemChange}
                    className="w-full border rounded p-2 bg-white"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Amount per Pack</label>
                  <input
                    name="measurementQty"
                    type="number"
                    value={addItemData.measurementQty}
                    onChange={handleAddItemChange}
                    className="w-full border rounded p-2"
                    placeholder="e.g. 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-red-600">
                    Alert Threshold (Packs)
                  </label>
                  <input
                    name="lowStockThreshold"
                    type="number"
                    value={addItemData.lowStockThreshold}
                    onChange={handleAddItemChange}
                    className="w-full border rounded p-2"
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Category Type</label>
                  <select
                    name="type"
                    value={addItemData.type}
                    onChange={handleAddItemChange}
                    className="w-full border rounded p-2 bg-white"
                  >
                    <option value="Perishable">Perishables</option>
                    <option value="Non-Perishable">Non-Perishables</option>
                    <option value="Supplies">Supplies</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 justify-center mt-4">
                <button
                  onClick={handleSaveNewItem}
                  className="bg-green-700 text-white px-8 py-2 rounded text-sm font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={handleClearNewItem}
                  className="bg-red-600 text-white px-8 py-2 rounded text-sm font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-center">Edit Inventory Item</h2>
            <div className="border rounded-xl p-6 bg-white flex flex-col md:flex-row gap-6 h-[450px]">
              <div className="w-full md:w-1/2 flex flex-col border-r md:pr-4">
                {editingItem ? (
                  <div className="flex flex-col h-full overflow-y-auto">
                    <div className="mb-3">
                      <div className="text-xs text-gray-500">Item Name</div>
                      <div className="text-xl font-semibold">{editingItem.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Warehouse Stock (Packs)
                        </label>
                        <input
                          name="stock"
                          type="number"
                          value={editFormData.stock}
                          onChange={handleEditFormChange}
                          className="w-full border rounded p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Cost</label>
                        <input
                          name="cost"
                          type="number"
                          value={editFormData.cost}
                          onChange={handleEditFormChange}
                          className="w-full border rounded p-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold mb-1">
                        Used Amount ({editFormData.measurementUnit})
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          name="openStock"
                          type="number"
                          value={editFormData.openStock}
                          onChange={handleEditFormChange}
                          className="w-full border rounded p-2 text-sm"
                        />
                        <span className="text-xs text-gray-600">
                          {editFormData.measurementUnit}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold mb-1 text-red-600">
                        Alert Threshold (Packs)
                      </label>
                      <input
                        name="lowStockThreshold"
                        type="number"
                        value={editFormData.lowStockThreshold}
                        onChange={handleEditFormChange}
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold mb-1">
                        Pack Size ({editFormData.measurementUnit})
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="measurementQty"
                          type="number"
                          value={editFormData.measurementQty}
                          onChange={handleEditFormChange}
                          className="w-full border rounded p-2 text-sm"
                        />
                        <select
                          name="measurementUnit"
                          value={editFormData.measurementUnit}
                          onChange={handleEditFormChange}
                          className="w-full border rounded p-2 text-sm bg-white"
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="pcs">pcs</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-center">
                      <button
                        onClick={handleSaveEditItem}
                        className="bg-green-700 text-white text-sm font-semibold py-2 px-10 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center">
                    Select an item from the list to edit its details.
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    className="w-full border rounded-full px-4 py-2 text-sm"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto border rounded-xl relative">
                  {editInventoryList.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                      No items found
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-2 border-b">Item Name</th>
                          <th className="p-2 text-center border-b">Warehouse</th>
                          <th className="p-2 text-center border-b">Kitchen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editInventoryList.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => handleSelectForEdit(item)}
                            className={`cursor-pointer border-b last:border-b-0 hover:bg-gray-50 ${
                              editingItem?.id === item.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="p-2 font-medium">{item.name}</td>
                            <td
                              className={`p-2 text-center ${
                                item.inStock <= item.lowStockThreshold
                                  ? 'text-red-600 font-semibold'
                                  : ''
                              }`}
                            >
                              {item.inStock}
                            </td>
                            <td className="p-2 text-center text-blue-600">
                              {item.openStock} {item.measurementUnit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-center">Automate Inventory</h2>
            <div className="flex justify-end mb-4">
              <select
                className="border rounded-full px-4 py-1 bg-white text-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="border rounded-xl overflow-hidden bg-white">
              {filteredMenuByCat.length > 0 ? (
                filteredMenuByCat.map((dish) => {
                  const hasRecipe = recipes[dish.id] && recipes[dish.id].length > 0;
                  const ingredientCount = hasRecipe ? recipes[dish.id].length : 0;
                  return (
                    <div
                      key={dish.id}
                      className="flex justify-between items-center p-4 border-b last:border-b-0"
                    >
                      <span className="font-semibold text-sm w-1/3">{dish.name}</span>
                      <span className="text-xs text-gray-500 w-1/3 text-center">
                        {hasRecipe ? `${ingredientCount} Ingredients` : 'No Ingredients'}
                      </span>
                      <div className="w-1/3 flex justify-end">
                        <button
                          onClick={() => handleOpenAutoModal(dish)}
                          className="border rounded px-3 py-1 text-xs hover:bg-gray-50"
                        >
                          Edit Recipe
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No dishes found in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 border shadow relative">
            <h3 className="text-lg mb-2 font-semibold">Name of Company</h3>
            <input
              className="w-full p-2 mb-3 border rounded text-sm"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Santos Co."
            />
            <h3 className="text-lg mb-2 font-semibold">Email Info:</h3>
            <input
              className="w-full p-2 mb-4 border rounded text-sm"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
              placeholder="santos@gmail.com"
            />
            <div className="flex justify-center">
              <button
                onClick={handleAddSupplier}
                className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-semibold"
              >
                Confirm
              </button>
            </div>
            <button
              onClick={() => setShowSupplierModal(false)}
              className="absolute top-2 right-4 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showAutoModal && selectedDish && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow w-[900px] h-[600px] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">Edit Recipe: {selectedDish.name}</h3>
              <button
                onClick={() => setShowAutoModal(false)}
                className="text-lg text-gray-600 hover:text-red-500"
              >
                ×
              </button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/2 p-4 border-r flex flex-col bg-white">
                <div className="flex-1 overflow-y-auto space-y-2 text-sm">
                  {currentRecipe.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                      No ingredients added yet.
                    </div>
                  ) : (
                    currentRecipe.map((ing) => {
                      const originalItem = inventory.find((i) => i.id === ing.inventoryId);
                      const unit = originalItem ? originalItem.measurementUnit : '';
                      return (
                        <div
                          key={ing.inventoryId}
                          className="flex justify-between items-center border rounded p-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{ing.name}</span>
                            <span className="text-xs text-gray-500">Unit: {unit}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              className="w-20 border rounded p-1 text-right text-xs"
                              value={ing.quantity}
                              onChange={(e) =>
                                handleSetRecipeQuantity(ing.inventoryId, e.target.value)
                              }
                            />
                            <span className="text-xs font-semibold">{unit}</span>
                            <button
                              onClick={() => handleRemoveFromRecipe(ing.inventoryId)}
                              className="w-7 h-7 bg-red-100 text-red-600 rounded text-xs flex items-center justify-center border"
                            >
                              x
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-center gap-4">
                  <button
                    onClick={handleSaveRecipe}
                    className="bg-green-700 text-white px-6 py-2 rounded text-sm font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowAutoModal(false)}
                    className="text-red-600 text-sm font-semibold"
                  >
                    Back
                  </button>
                </div>
              </div>

              <div className="w-1/2 p-4 bg-gray-50 flex flex-col">
                <div className="mb-3">
                  <h4 className="font-semibold mb-1 text-sm">Choose Inventory Item</h4>
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    className="w-full border rounded-full px-4 py-2 text-sm"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto border rounded bg-white relative text-sm">
                  {modalInventoryList.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                      No suitable food items found
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-2">Item Name</th>
                          <th className="p-2 text-center">Kitchen</th>
                          <th className="p-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalInventoryList.map((item) => (
                          <tr key={item.id} className="border-b last:border-b-0">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-center">
                              {item.openStock} {item.measurementUnit}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleAddToRecipe(item)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                              >
                                Add
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;