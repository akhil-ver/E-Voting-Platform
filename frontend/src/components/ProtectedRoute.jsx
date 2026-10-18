import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl border border-rose-500/40 bg-rose-950/20 text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Denied</h2>
        <p className="text-xs text-rose-300">
          This operation requires <strong>{requiredRole}</strong> clearance. Your current role is <strong>{user?.role}</strong>.
        </p>
      </div>
    );
  }

  return children;
};
