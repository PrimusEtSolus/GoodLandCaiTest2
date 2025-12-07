import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any session if needed, then redirect
    navigate('/');
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-green-600 to-green-700 text-black flex flex-col shadow-2xl fixed left-0 top-0 overflow-y-auto z-10 border-r-4 border-green-800">
      <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 border-b-4 border-green-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-green-800 font-bold text-xl">G</span>
          </div>
          <h1 className="text-2xl font-bold">GoodLand CAI</h1>
        </div>
        
        <div className="bg-green-800/30 rounded-lg p-2 text-center">
          <span className="text-sm font-semibold text-green-100">Manager Panel</span>
        </div>
      </div>
        
        <nav className="flex flex-col space-y-2 px-4">
          {role === 'MANAGER' && (
            <>
              <Link 
                to="/manager/dashboard" 
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname.includes('dashboard') 
                    ? 'bg-yellow-400 text-green-900 shadow-lg transform scale-105' 
                    : 'hover:bg-green-500 hover:text-white'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  location.pathname.includes('dashboard') ? 'bg-green-900' : 'bg-green-700'
                }`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                </div>
                <span>Dashboard</span>
                {location.pathname.includes('dashboard') && (
                  <div className="absolute right-2 w-2 h-2 bg-green-900 rounded-full animate-pulse"></div>
                )}
              </Link>
              
              <Link 
                to="/manager/inventory" 
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname.includes('inventory') 
                    ? 'bg-yellow-400 text-green-900 shadow-lg transform scale-105' 
                    : 'hover:bg-green-500 hover:text-white'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  location.pathname.includes('inventory') ? 'bg-green-900' : 'bg-green-700'
                }`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  </svg>
                </div>
                <span>Inventory</span>
                {location.pathname.includes('inventory') && (
                  <div className="absolute right-2 w-2 h-2 bg-green-900 rounded-full animate-pulse"></div>
                )}
              </Link>
              
              <Link 
                to="/manager/posm" 
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname.includes('posm') 
                    ? 'bg-yellow-400 text-green-900 shadow-lg transform scale-105' 
                    : 'hover:bg-green-500 hover:text-white'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  location.pathname.includes('posm') ? 'bg-green-900' : 'bg-green-700'
                }`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span>POSM</span>
                {location.pathname.includes('posm') && (
                  <div className="absolute right-2 w-2 h-2 bg-green-900 rounded-full animate-pulse"></div>
                )}
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-3 border-t-4 border-green-800 bg-gradient-to-r from-green-600 to-green-700">
        {/* Manager Button (Interactable but no-op as per instructions) */}
        <button 
          className="w-full py-3 px-4 bg-yellow-400 text-green-900 border-2 border-yellow-600 rounded-lg font-bold hover:bg-yellow-300 transition-all duration-200 shadow-lg hover:shadow-md transform hover:scale-105 flex items-center justify-center gap-2"
          onClick={() => {}}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
          </svg>
          Manager
        </button>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-red-600 text-white border-2 border-red-800 rounded-lg font-bold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-md transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;