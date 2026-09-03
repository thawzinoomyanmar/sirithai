import React from 'react';
import { CourseResourceCard } from './CourseResourceCard';
import { getResourceOpenUrl } from '../utils/resourceLinks';
import { useLanguage } from '../utils/LanguageContext';

interface ResourcesComponentProps {
  resources: any[];
  courseName: string;
  isLoggedIn: boolean;
  onOpenEnrollment: (course: { title: string; price: string; type: string }) => void;
  onStudyInteractive: (res: any) => void;
  onDownload: (res: any) => void;
  onNavigateLogin?: () => void;
}

export const ResourcesComponent: React.FC<ResourcesComponentProps> = ({
  resources,
  courseName,
  isLoggedIn,
  onOpenEnrollment,
  onStudyInteractive,
  onDownload,
  onNavigateLogin
}) => {
  const { t } = useLanguage();
  const handlePurchase = (res: any) => {
    const rawPrice = String(res.price || res.priceAmount || '');
    const isFree = res.priceAmount === 0 || rawPrice.toUpperCase() === 'FREE';

    if (isFree) {
      onDownload(res);
      return;
    }

    if (!isLoggedIn) {
      alert(t('auth.login_required'));
      if (onNavigateLogin) {
        onNavigateLogin();
      }
      return;
    }

    const cleanPrice = rawPrice.replace(' MMK', '').trim() || String(res.priceAmount || '15,000');

    onOpenEnrollment({
      title: res.name || res.title,
      price: cleanPrice,
      type: "PREMIUM RESOURCE"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 
          onClick={() => {
            const pdfUrl = getResourceOpenUrl(resources?.[0]);
            if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
          }}
          className="text-lg font-sans font-black text-slate-900 text-left cursor-pointer hover:text-brand-purple flex items-center gap-2"
          title={t('resources.open_sample')}
        >
          <span>📕 {t('resources.heading')}</span>
          <span className="text-[10px] bg-purple-100 text-brand-purple font-bold px-2 py-0.5 rounded-full hover:bg-purple-200 transition-all">
            📄 {t('resources.open_sample')} ↗
          </span>
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((res) => {
          const rawPrice = String(res.price || res.priceAmount || '');
          const isFree = res.priceAmount === 0 || rawPrice.toUpperCase() === 'FREE';
          return (
            <CourseResourceCard
              key={res.id}
              res={res}
              courseName={courseName}
              isFree={isFree}
              itemOwned={isFree}
              onStudyInteractive={onStudyInteractive}
              onDownload={onDownload}
              onPurchase={() => handlePurchase(res)}
            />
          );
        })}
      </div>
    </div>
  );
};
