import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';

/* Global Styles */
import '@/shared/styles/responsive.css';
import '@/shared/styles/spinner.css';

/* Orchestration */
import Header from '@/shared/components/Header/Header';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

function App() {
  return (
    <Router>
      <LazyMotion features={domAnimation}>
        <AppProviders>
          <Header />
          <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <main style={{ flex: 1 }}>
              <AppRoutes />
            </main>
          </div>
        </AppProviders>
      </LazyMotion>
    </Router>
  );
}

export default App;
