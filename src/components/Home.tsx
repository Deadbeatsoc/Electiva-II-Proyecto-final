import React from 'react';
import { Film, Tv, Play, Book, Star, MessageCircle, Users } from 'lucide-react';

interface HomeProps {
  onPageChange: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onPageChange }) => {
  const features = [
    {
      icon: Film,
      title: 'Catálogo Completo',
      description: 'Explora miles de películas, series, anime y manga con información detallada y ratings de la comunidad.',
      action: () => onPageChange('catalog'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: MessageCircle,
      title: 'Foro de Discusión',
      description: 'Únete a conversaciones apasionantes sobre tus contenidos favoritos con otros fanáticos.',
      action: () => onPageChange('forum'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Star,
      title: 'Listas Personales',
      description: 'Crea tu lista personalizada, marca tu progreso y compártela con la comunidad.',
      action: () => onPageChange('profile'),
      gradient: 'from-yellow-500 to-orange-500'
    }
  ];

  const stats = [
    { icon: Film, label: 'Películas', count: '15K+' },
    { icon: Tv, label: 'Series', count: '8K+' },
    { icon: Play, label: 'Anime', count: '12K+' },
    { icon: Book, label: 'Manga', count: '25K+' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                MediaForum
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              La comunidad definitiva para los amantes del entretenimiento. 
              Descubre, discute y comparte tu pasión por películas, series, anime y manga.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onPageChange('catalog')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Explorar Catálogo
              </button>
              <button
                onClick={() => onPageChange('forum')}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl border border-blue-200 hover:bg-blue-50 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Únete al Foro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
                  <Icon size={24} className="text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.count}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            MediaForum combina lo mejor de un catálogo completo, una comunidad activa y herramientas personalizadas
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                onClick={feature.action}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl mb-6`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                <div className="flex items-center text-blue-600 font-medium hover:text-blue-700">
                  Explorar ahora →
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <Users size={48} className="mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl font-bold mb-4">
              Únete a nuestra comunidad
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Miles de usuarios ya comparten sus opiniones, descubren nuevos contenidos 
              y conectan con otros fanáticos. ¡Tu opinión cuenta!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onPageChange('forum')}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Ver Discusiones
              </button>
              <button
                onClick={() => onPageChange('catalog')}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-colors"
              >
                Comenzar a Explorar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;