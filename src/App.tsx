/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Redirect } from './pages/Redirect';
import { Navbar } from './components/Navbar';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-x-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/:shortCode" element={<Redirect />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
