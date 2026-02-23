import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import SEO from '@/components/SEO';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export const PageWrapper = ({
  children,
  title,
  description,
  image,
  keywords,
  noIndex,
  showHeader = true,
  showFooter = false,
  className = '',
}: PageWrapperProps) => {
  return (
    <>
      {title && (
        <SEO
          title={title}
          description={description}
          image={image}
          keywords={keywords}
          noIndex={noIndex}
        />
      )}
      <div className={`min-h-screen bg-background ${showFooter ? 'flex flex-col' : ''} ${className}`}>
        {showHeader && <Header />}
        {children}
        {showFooter && <Footer />}
      </div>
    </>
  );
};
