import { useState } from "react";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
        {/* Left: Logo */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custodian Manager</h1>
          <p className="text-gray-600">Dashboard Overview</p>
        </div>

        {/* Right: Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-900 hover:text-blue-700">Custodians</a>
          <a href="#" className="text-gray-900 hover:text-blue-700">Buildings</a>
          <a href="#" className="text-gray-900 hover:text-blue-700">Tasks</a>
          <a href="#" className="text-gray-900 hover:text-blue-700">Reports</a>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            Settings
          </button>
        </nav>

        {/* Hamburger (mobile only) */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="block md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-gray-200"
        >
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Overlay (for mobile) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        ></div>
      )}

      {/* Side Drawer (mobile only) */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50 md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          
        </button>

        <ul className="flex flex-col items-start space-y-4 p-6 mt-10">
          <li><a href="#" className="text-gray-900 hover:text-blue-700">Custodians</a></li>
          <li><a href="#" className="text-gray-900 hover:text-blue-700">Buildings</a></li>
          <li><a href="#" className="text-gray-900 hover:text-blue-700">Tasks</a></li>
          <li><a href="#" className="text-gray-900 hover:text-blue-700">Reports</a></li>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            Settings
          </button>
        </ul>
      </div>
    </header>
  );
};

export default NavBar;
