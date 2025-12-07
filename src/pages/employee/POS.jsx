import React, { useState, useEffect } from 'react';
import { getMenu, saveTransaction, getTransactions, resetMenu, getBusinessInfo } from '../../services/mockDatabase';
import { generateReceiptPDF } from '../../services/receiptServices';
import { useNavigate } from 'react-router-dom';

const POS = () => {
  const [menu, setMenu] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('All');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentInput, setPaymentInput] = useState('');
  const [orderType, setOrderType] = useState('Dine In');
  const [discountType, setDiscountType] = useState('None'); // 'None', 'PWD', or 'Senior'
  const navigate = useNavigate();

  useEffect(() => {
    // Reset menu to ensure latest prices are loaded
    resetMenu().then(() => getMenu()).then(setMenu);
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.menuItem.id === itemId) {
          const newQ = i.quantity + delta;
          return newQ > 0 ? { ...i, quantity: newQ } : i;
        }
        return i;
      });
    });
  };

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) && 
    (category === 'All' || item.category === category)
  );

  // Calculate totals based on totalPrice (VAT-inclusive price shown to customers)
  const baseAmount = cart.reduce((sum, item) => sum + (item.menuItem.totalPrice * item.quantity), 0);
  
  // Calculate discount on the total (which already includes VAT)
  const hasDiscount = discountType !== 'None';
  const discountAmount = hasDiscount ? baseAmount * 0.2 : 0; // 20% discount
  const discountedAmount = baseAmount - discountAmount;
  
  // If customer has discount (PWD/Senior), they are exempted from VAT
  // So we subtract the VAT portion from the discounted amount
  const vatPortion = hasDiscount ? cart.reduce((sum, item) => sum + (item.menuItem.VAT_fee * item.quantity), 0) : cart.reduce((sum, item) => sum + (item.menuItem.VAT_fee * item.quantity), 0);
  // Note: For regular customers, VAT is inside the total, so we display it but don't deduct it from the total payable.
  // The logic in provided code: `amountAfterDiscount = hasDiscount ? (discountedAmount - vatPortion) : discountedAmount;` implies VAT exemption logic.
  const amountAfterDiscount = hasDiscount ? (discountedAmount - vatPortion) : discountedAmount;
  
  // Service fee is fixed: 25 for Dine In, 50 for Takeout (only if cart has items)
  const serviceFee = cart.length > 0 ? (orderType === 'Dine In' ? 25 : 50) : 0;
  const totalAmount = amountAfterDiscount + serviceFee;
  
  const change = paymentInput ? parseFloat(paymentInput) - totalAmount : 0;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    
    try {
        const transactions = await getTransactions();
        const nextOrderNum = transactions.length + 1;
        const timeNow = new Date().toLocaleTimeString();

        // 1. Construct Transaction Object
        const newTransaction = {
            id: crypto.randomUUID(),
            orderNumber: nextOrderNum,
            items: cart,
            baseAmount: baseAmount,
            discountType: discountType,
            discountAmount: discountAmount,
            vatPortion: vatPortion, // This is the VAT amount component
            serviceFee: serviceFee,
            totalAmount: totalAmount,
            cashProvided: parseFloat(paymentInput),
            change: change,
            type: orderType,
            timeOrdered: timeNow,
            status: 'No'
        };

        // 2. Save Transaction
        await saveTransaction(newTransaction);

        // 3. Generate PDF Receipt
        let pdfError = false;
        try {
            const businessInfo = await getBusinessInfo();
            generateReceiptPDF(newTransaction, businessInfo);
        } catch (error) {
            console.error("Error generating receipt PDF:", error);
            pdfError = true;
        }

        // 4. Reset UI
        setCart([]);
        setShowCheckoutModal(false);
        setPaymentInput('');
        setDiscountType('None');
        
        // setTimeout to ensure the alert doesn't block the download initiation immediately
        setTimeout(() => {
            if (pdfError) {
                alert('Order Placed Successfully!\n\nNote: Receipt PDF generation failed. Please check console for details.');
            } else {
                alert('Order Placed Successfully! Receipt downloading...');
            }
        }, 500);

    } catch (error) {
        console.error("Error placing order", error);
        alert("Failed to place order");
    }
  };

  return (
    <div className="flex h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Left Side: Checkout */}
        <div className="w-1/3 border-r border-gray-200 bg-white/80 backdrop-blur-sm p-6 flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={() => navigate('/')}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                </button>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        className="w-64 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg font-medium bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="absolute left-3 top-3.5 w-5 h-5 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['Beverages', 'Main Dishes', 'Side Dish', 'Desserts'].map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`group relative px-4 py-2 border rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 ${
                            category === cat 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg' 
                                : 'bg-white/80 backdrop-blur-sm hover:bg-white border-gray-200 text-gray-700'
                        }`}
                    >
                        <span className="relative z-10">{cat}</span>
                        {category === cat && (
                            <div className="absolute inset-0 bg-blue-400 rounded-xl animate-pulse opacity-20"></div>
                        )}
                    </button>
                ))}
                <button 
                    onClick={() => setCategory('All')}
                    className={`group relative px-4 py-2 border rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 ${
                        category === 'All' 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 shadow-lg' 
                            : 'bg-white/80 backdrop-blur-sm hover:bg-white border-gray-200 text-gray-700'
                    }`}
                >
                    <span className="relative z-10">All Items</span>
                    {category === 'All' && (
                        <div className="absolute inset-0 bg-green-400 rounded-xl animate-pulse opacity-20"></div>
                    )}
                </button>
            </div>

            {/* Order Details List */}
            <div className="flex-1 border border-gray-200 p-4 overflow-y-auto mb-6 rounded-2xl bg-gradient-to-b from-white to-gray-50 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-center font-bold text-xl text-gray-800">Order Details</h3>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </div>
                </div>
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="text-lg font-medium">Cart is empty</p>
                        <p className="text-sm">Add items from the menu</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.menuItem.id} className="flex justify-between items-center border border-gray-200 p-3 mb-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">{item.menuItem.name}</span>
                                <span className="text-sm text-gray-600 font-medium">P. {item.menuItem.totalPrice}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-lg">x{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(item.menuItem.id, 1)} 
                                    className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md flex items-center justify-center font-semibold transform hover:scale-110"
                                >
                                    +
                                </button>
                                <button 
                                    onClick={() => updateQuantity(item.menuItem.id, -1)} 
                                    className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-md flex items-center justify-center font-semibold transform hover:scale-110"
                                >
                                    -
                                </button>
                                <button 
                                    onClick={() => removeFromCart(item.menuItem.id)} 
                                    className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md flex items-center justify-center font-semibold transform hover:scale-110"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-gray-200 pt-6 bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-bold text-gray-800">Total:</span>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">P. {totalAmount.toFixed(2)}</span>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                    </div>
                </div>
                <button 
                    onClick={() => setShowCheckoutModal(true)}
                    disabled={cart.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-600 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    PLACE ORDER
                </button>
            </div>
        </div>

        {/* Right Side: Menu Grid */}
        <div className="w-2/3 p-6 bg-gradient-to-br from-white via-blue-50 to-green-50">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Menu Items</h2>
                <p className="text-gray-600">Click to add items to cart</p>
            <div className="grid grid-cols-3 gap-4 overflow-y-auto h-full pb-24">
                {filteredMenu.length > 0 ? filteredMenu.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => addToCart(item)}
                        className="group bg-white/80 backdrop-blur-sm border border-gray-200 h-40 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gradient-to-br hover:from-green-50 hover:to-blue-50 hover:border-green-400 hover:shadow-xl transition-all duration-300 rounded-2xl transform hover:scale-105 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-blue-400/0 group-hover:from-green-400/10 group-hover:to-blue-400/10 transition-all duration-300"></div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <span className="font-semibold text-gray-800 text-lg mb-2">{item.name}</span>
                            <div className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                P. {item.totalPrice}
                            </div>
                        </div>
                        {cart.find(i => i.menuItem.id === item.id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold animate-bounce shadow-lg">
                                {cart.find(i => i.menuItem.id === item.id)?.quantity || 0}
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="col-span-3 flex flex-col items-center justify-center py-20 text-gray-400">
                        <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-xl font-medium mb-2">No items found</p>
                        <p className="text-sm">Try adjusting your search or category filter</p>
                    </div>
                )}
            </div>
        </div>

        {/* Checkout Modal */}
        {showCheckoutModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
                {/* ... (rest of the code remains the same) */}
                    <div className="mb-4">
                        <div className="border-b pb-3 mb-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Subtotal (VAT-Inclusive):</span>
                                <span className="font-bold">P. {baseAmount.toFixed(2)}</span>
                            </div>
                            
                            {/* Discount Section */}
                            <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-bold mb-2">Discount:</p>
                                <div className="flex gap-2 mb-2">
                                    <button 
                                        onClick={() => setDiscountType('None')}
                                        className={`flex-1 py-1 text-xs rounded border border-black font-semibold ${discountType === 'None' ? 'bg-white' : 'bg-gray-300'}`}
                                    >
                                        NONE
                                    </button>
                                    <button 
                                        onClick={() => setDiscountType('PWD')}
                                        className={`flex-1 py-1 text-xs rounded border border-black font-semibold ${discountType === 'PWD' ? 'bg-white' : 'bg-gray-300'}`}
                                    >
                                        PWD (20%)
                                    </button>
                                    <button 
                                        onClick={() => setDiscountType('Senior')}
                                        className={`flex-1 py-1 text-xs rounded border border-black font-semibold ${discountType === 'Senior' ? 'bg-white' : 'bg-gray-300'}`}
                                    >
                                        SENIOR (20%)
                                    </button>
                                </div>
                                {hasDiscount && (
                                    <div className="flex justify-between text-sm text-green-700 font-bold">
                                        <span>Discount ({discountType}):</span>
                                        <span>-P. {discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {hasDiscount && (
                                    <div className="flex justify-between text-sm text-green-700 font-bold mt-1">
                                        <span>VAT Exemption:</span>
                                        <span>-P. {vatPortion.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount after discount and VAT exemption */}
                        <div className="flex justify-between text-sm font-bold mb-2 pb-2 border-b">
                            <span>Amount:</span>
                            <span>P. {amountAfterDiscount.toFixed(2)}</span>
                        </div>

                        {/* Service Fee */}
                        <div className="flex justify-between text-sm mb-3">
                            <span>Service Fee ({orderType === 'Dine In' ? 'Dine In: P. 25' : 'Takeout: P. 50'}):</span>
                            <span className="font-bold">P. {serviceFee.toFixed(2)}</span>
                        </div>

                        {/* Total Price */}
                        <div className="flex justify-between text-lg font-bold mb-2 bg-yellow-100 p-2 rounded">
                            <span>Total Price:</span>
                            <span>P. {totalAmount.toFixed(2)}</span>
                        </div>

                        {/* Payment Input */}
                        <input 
                            type="number"
                            placeholder="Input Amount"
                            className="w-full p-2 border border-gray-400 rounded mb-2"
                            value={paymentInput}
                            onChange={e => setPaymentInput(e.target.value)}
                        />

                        {/* Change */}
                        <div className="flex justify-between text-lg font-bold mb-4 bg-blue-100 p-2 rounded">
                            <span>Change:</span>
                            <span>P. {change >= 0 ? change.toFixed(2) : '---'}</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                        <button 
                            onClick={() => setOrderType('Dine In')}
                            className={`flex-1 py-2 rounded-lg border border-black font-bold ${orderType === 'Dine In' ? 'bg-white' : 'bg-gray-300'}`}
                        >
                            DINE IN
                        </button>
                        <button 
                            onClick={() => setOrderType('Takeout')}
                            className={`flex-1 py-2 rounded-lg border border-black font-bold ${orderType === 'Takeout' ? 'bg-white' : 'bg-gray-300'}`}
                        >
                            TAKEOUT
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={change < 0 || !paymentInput}
                            className="w-full py-2 bg-white border border-black rounded-lg font-bold hover:bg-green-100 disabled:opacity-50"
                        >
                            CONFIRM
                        </button>
                        <button 
                            onClick={() => setShowCheckoutModal(false)}
                            className="w-full py-1 text-sm underline text-red-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default POS;