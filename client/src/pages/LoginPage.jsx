import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-aura-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-aura-deep/20 p-8 rounded-2xl border border-aura-forest/30 backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-aura-light mb-6 text-center">Aura Chat</h2>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-aura-light/70 text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-aura-dark border border-aura-forest/50 rounded-lg p-2.5 text-aura-light focus:outline-none focus:border-aura-light transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-aura-light/70 text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-aura-dark border border-aura-forest/50 rounded-lg p-2.5 text-aura-light focus:outline-none focus:border-aura-light transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-aura-forest hover:bg-aura-forest/80 text-aura-dark font-bold py-3 rounded-lg transition-all transform active:scale-[0.98]"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-aura-light/50 text-sm">
          Don't have an account? <Link to="/signup" className="text-aura-forest hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
