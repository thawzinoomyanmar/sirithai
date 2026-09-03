import React from 'react';
import { EbookCard } from './EbookCard';
import { useLanguage } from '../utils/LanguageContext';

interface EbooksComponentProps {
  items: any[];
  isLoggedIn: boolean;
  currentUser: string | null;
  onOpenEnrollment: (course: { title: string; price: string; type: string }) => void;
  onEnterBook: (item: any) => void;
  onNavigateLogin?: () => void;
}

export const EbooksComponent: React.FC<EbooksComponentProps> = ({
  items,
  isLoggedIn,
  currentUser,
  onOpenEnrollment,
  onEnterBook,
  onNavigateLogin
}) => {
  const { t } = useLanguage();
  const handleItemUnlock = (item: any) => {
    const rawPrice = String(item.price || item.priceAmount || '');
    const isFree = item.price === 0 || item.price === 'FREE' || rawPrice.toUpperCase() === 'FREE';

    if (isFree) {
      onEnterBook(item);
      return;
    }

    if (!isLoggedIn) {
      alert(t('auth.login_required'));
      if (onNavigateLogin) {
        onNavigateLogin();
      }
      return;
    }

    const cleanPrice = rawPrice.replace(' MMK', '').trim() || String(item.priceAmount || '25,000');

    onOpenEnrollment({
      title: item.title || item.name,
      price: cleanPrice,
      type: "PREMIUM RESOURCE"
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-sans font-black text-slate-900 text-left">
        📚 {t('ebooks.heading')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <EbookCard
            key={item.id}
            item={item}
            currentUser={currentUser}
            onUnlock={() => handleItemUnlock(item)}
            onEnterBook={onEnterBook}
          />
        ))}
      </div>
    </div>
  );
};
