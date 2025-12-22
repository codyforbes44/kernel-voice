import { ReactNode } from 'react';
import { Header } from './Header';
import SEO from '@/components/SEO';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[];
  showHeader?: boolean;
  className?: string;
}

export const PageWrapper = ({
  children,
  title,
  description,
  image,
  keywords,
  showHeader = true,
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
        />
      )}
      <div className={`min-h-screen bg-background ${className}`}>
        {showHeader && <Header />}
        {children}
      </div>
    </>
  );
};
