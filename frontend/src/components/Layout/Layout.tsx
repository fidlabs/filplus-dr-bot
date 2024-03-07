import { ReactNode } from 'react';
import Header from './Header/index.js';
import Footer from './Footer/index.js';

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
