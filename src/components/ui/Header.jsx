import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

const Header = () => {
  const { user, userProfile, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Text to Speech',
      path: '/text-to-speech-generator',
      icon: 'Volume2'
    }
  ];

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result?.error) {
      setShowUserMenu(false);
    }
  };

  const openAuthModal = (mode = 'signin') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold text-foreground">MindsMakingVoice</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/text-to-speech-generator"
                className="text-foreground hover:text-primary transition-colors"
              >
                Text-to-Speech
              </Link>
              <Link
                to="/features"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : user ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm text-foreground">
                      {userProfile?.full_name || user?.email?.split('@')?.[0]}
                    </span>
                  </Button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium text-foreground">
                          {userProfile?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        {userProfile?.role && (
                          <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                            userProfile?.role === 'premium' ? 'bg-primary text-primary-foreground' :
                            userProfile?.role === 'admin'? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userProfile?.role?.charAt(0)?.toUpperCase() + userProfile?.role?.slice(1)}
                          </span>
                        )}
                      </div>
                      
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile Settings
                      </Link>
                      
                      <Link
                        to="/billing"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Billing
                      </Link>
                      
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => openAuthModal('signin')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => openAuthModal('signup')}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          iconName={isMenuOpen ? "X" : "Menu"}
          onClick={toggleMenu}
        >
          Menu
        </Button>
      </div>
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-t border-border shadow-elevated">
          <div className="px-6 py-4 space-y-3">
            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navigationItems?.map((item) => (
                <a
                  key={item?.path}
                  href={item?.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-smooth ${
                    isActivePath(item?.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon name={item?.icon} size={20} />
                  <span className="font-medium">{item?.name}</span>
                </a>
              ))}
            </div>

            {/* Mobile Actions */}
            <div className="pt-3 border-t border-border space-y-2">
              <Button
                variant="ghost"
                iconName="HelpCircle"
                fullWidth
                className="justify-start"
              >
                Help
              </Button>
              <Button
                variant="ghost"
                iconName="Settings"
                fullWidth
                className="justify-start"
              >
                Settings
              </Button>
              <Button
                variant="outline"
                iconName="User"
                fullWidth
                className="justify-start"
              >
                Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;