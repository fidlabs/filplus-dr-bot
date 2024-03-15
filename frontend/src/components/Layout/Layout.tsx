import { ReactNode } from 'react';
import Header from './Header/index.js';
import Footer from './Footer/index.js';

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ flexGrow: 1 }}>
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
