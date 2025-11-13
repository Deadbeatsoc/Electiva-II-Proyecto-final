import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Catalog from './components/Catalog';
import Forum from './components/Forum';
import Profile from './components/Profile';
import { DataProvider } from './context/DataContext';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    if (page !== 'catalog') {
      setSearchQuery('');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onPageChange={handlePageChange} />;
      case 'catalog':
        return <Catalog searchQuery={searchQuery} />;
      case 'forum':
        return <Forum />;
      case 'profile':
        return <Profile />;
      default:
        return <Home onPageChange={handlePageChange} />;
    }
  };

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
        />
        {renderPage()}
      </div>
    </DataProvider>
  );
}

export default App;