import { ReactNode } from 'react';
import Header from "./Header/Header";
import Footer from "./Footer/Footer";

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
