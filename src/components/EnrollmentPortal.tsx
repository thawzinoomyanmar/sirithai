import React from 'react';
import { CheckoutGateway } from './CheckoutGateway';

export interface EnrollmentPortalProps {
  course?: {
    title: string;
    price: string | number;
    type?: string;
  } | null;
  isOpen?: boolean;
  onClose?: () => void;
  [key: string]: any;
}

export const EnrollmentPortal: React.FC<EnrollmentPortalProps> = ({
  course,
  isOpen = true,
  onClose,
  ...restProps
}) => {
  if (!isOpen || !course) return null;

  const rawPriceStr = String(course.price || '35000');
  const formattedPrice = typeof course.price === 'number' 
    ? course.price 
    : parseInt(rawPriceStr.replace(/[^0-9]/g, '') || '35000', 10);

  const formattedCourse = {
    id: `course_${Date.now()}`,
    name: course.title || "Advanced Business Thai Speaking",
    nameMm: "",
    priceAmount: formattedPrice || 35000,
    currency: 'MMK' as const,
    itemType: course.type === 'PREMIUM COURSE' ? 'course' : 'e-book',
    duration: course.type || "PREMIUM COURSE",
    description: `Access to ${course.title || 'Advanced Business Thai Speaking'}`,
    descriptionMm: "",
    instructor: "Kru Jane & Sayar Thura",
    includes: ["Lifetime Interactive Access", "Direct Study Materials", "Verified Certificate"]
  };

  return (
    <CheckoutGateway
      isGatewayOpen={isOpen}
      setIsGatewayOpen={(open) => {
        if (!open && onClose) onClose();
      }}
      gatewayCourse={formattedCourse as any}
      checkoutName={restProps.checkoutName || ""}
      setCheckoutName={restProps.setCheckoutName || (() => {})}
      gatewayEmail={restProps.gatewayEmail || ""}
      setGatewayEmail={restProps.setGatewayEmail || (() => {})}
      gatewayPhone={restProps.gatewayPhone || ""}
      setGatewayPhone={restProps.setGatewayPhone || (() => {})}
      gatewayStep={restProps.gatewayStep || 1}
      setGatewayStep={restProps.setGatewayStep || (() => {})}
      gatewayPaymentMethod={restProps.gatewayPaymentMethod || 'kbzpay'}
      setGatewayPaymentMethod={restProps.setGatewayPaymentMethod || (() => {})}
      gatewayOtp={restProps.gatewayOtp || ""}
      setGatewayOtp={restProps.setGatewayOtp || (() => {})}
      gatewayTimer={restProps.gatewayTimer || 180}
      setGatewayTimer={restProps.setGatewayTimer || (() => {})}
      gatewayProcessing={restProps.gatewayProcessing || false}
      setGatewayProcessing={restProps.setGatewayProcessing || (() => {})}
      currentUser={restProps.currentUser || null}
      setCurrentUser={restProps.setCurrentUser || (() => {})}
      setIsLoggedIn={restProps.setIsLoggedIn || (() => {})}
      addSystemLog={restProps.addSystemLog || (() => {})}
      orders={restProps.orders || []}
      setOrders={restProps.setOrders || (() => {})}
      setIsCourseStoreExpanded={restProps.setIsCourseStoreExpanded || (() => {})}
      registeredUsers={restProps.registeredUsers || []}
      setRegisteredUsers={restProps.setRegisteredUsers || (() => {})}
    />
  );
};
