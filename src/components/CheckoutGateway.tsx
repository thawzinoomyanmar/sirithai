import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RefreshCw, 
  CheckCircle, 
  Check, 
  Copy, 
  UploadCloud, 
  Trash2, 
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  QrCode,
  UserCheck,
  AlertTriangle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Course, PurchaseOrder, RegisteredUser } from '../types';
import { localDB } from '../utils/db';
import { isOnlineSimulated, addSyncLog } from '../utils/syncEngine';
import { setAuthValue } from '../utils/authStorage';

// ============================================================================
// SLEEK MINIMAL BANK LOGOS (INLINE SVGS)
// ============================================================================

export const KBZPayIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 rounded-xl shrink-0 inline-block">
    <rect width="100" height="100" rx="24" fill="#005bab" />
    <text x="50%" y="46%" textAnchor="middle" fill="white" fontFamily="system-ui, sans-serif" fontSize="24" fontWeight="900" letterSpacing="-0.5">KBZ</text>
    <text x="50%" y="78%" textAnchor="middle" fill="white" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="400">Pay</text>
  </svg>
);

export const WavePayIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 rounded-xl shrink-0 inline-block">
    <rect width="100" height="100" rx="24" fill="#df1f26" />
    <path d="M25,50 C25,32 40,20 50,20 C62,20 75,35 75,50 C75,65 62,80 50,80 C40,80 25,65 25,50" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" />
    <circle cx="50" cy="50" r="14" fill="white" />
  </svg>
);

export const CBPayIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 rounded-xl shrink-0 inline-block bg-white border border-slate-100 p-1">
    <rect width="100" height="100" rx="20" fill="none" />
    <path d="M20 70 A30 30 0 0 1 80 70" fill="none" stroke="#e31b23" strokeWidth="8" strokeLinecap="round" />
    <path d="M30 70 A20 20 0 0 1 70 70" fill="none" stroke="#f39200" strokeWidth="8" strokeLinecap="round" />
    <text x="50%" y="45" textAnchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="900" fill="#005bab">CB</text>
  </svg>
);

export const AYABankIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 rounded-xl shrink-0 inline-block bg-white border border-slate-100 p-0.5">
    <rect width="100" height="100" rx="24" fill="#ed1c24" />
    <text x="50%" y="58%" textAnchor="middle" fill="white" fontFamily="sans-serif" fontSize="30" fontWeight="900" letterSpacing="-1">AYA</text>
  </svg>
);

export const TrueMoneyIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 rounded-xl shrink-0 bg-white border border-slate-100 p-1 inline-block">
    <rect width="100" height="100" rx="20" fill="none" />
    <path d="M15,30 L45,30 L55,70 L25,70 Z" fill="#ea1a2a" />
    <path d="M45,30 L75,30 L85,70 L55,70 Z" fill="#f37021" />
    <text x="50%" y="88" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="900" fill="#ea1a2a">true</text>
  </svg>
);

export const PromptPayIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 rounded-xl shrink-0 inline-block">
    <rect width="100" height="100" rx="24" fill="#002d62" />
    <circle cx="50" cy="50" r="14" fill="none" stroke="white" strokeWidth="6" />
    <line x1="50" y1="20" x2="50" y2="80" stroke="white" strokeWidth="6" strokeLinecap="round" />
    <line x1="20" y1="50" x2="80" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export const LINELogoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current inline shrink-0">
    <path d="M24 10.3c0-4.6-5.4-8.3-12-8.3S0 5.7 0 10.3c0 4.1 4.3 7.6 10.1 8.2.4.1.9.3 1 .6l.2 1.4c0 .3-.1.7-.5.8h-.2c-.3 0-1.5-.7-2-1.3C3.9 19 0 15 0 10.3 0 5.1 5.4 1 12 1s12 4.1 12 9.3c0 4.8-5.4 8.7-12 8.7h-.3l-3.3 2.1c-.4.3-.8.1-.8-.4l.4-2.8C2 16.5 0 13.6 0 10.3z" />
  </svg>
);

export const WhatsAppLogoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current inline shrink-0">
    <path d="M12.012 2c-5.506 0-9.987 4.479-9.987 9.986 0 1.764.459 3.49 1.332 5.008l-1.357 4.953 5.074-1.328c1.47.802 3.125 1.224 4.802 1.224 5.506 0 9.987-4.479 9.987-9.987a9.96 9.96 0 0 0-2.924-7.062A9.97 9.97 0 0 0 12.012 2zm5.72 14.156c-.235.66-.1.173-1.04 1.1-.883.873-1.25.962-2.1.868-.696-.076-1.564-.326-2.607-.806-1.89-.867-3.136-2.793-3.23-2.918-.095-.125-.765-1.013-.765-1.932 0-.918.485-1.37.66-.183.172.503.438.406.875.406.438 0 .47-.03.547.11a3.03 3.03 0 0 1 .438 1.12c.078.188-.047.344-.14.47-.094.124-.157.203-.25.312-.095.11-.188.219-.078.406.11.188.485.8.1.58.11l1.5 1.62c.11.11.235.156.36.156h.17c.219-.016.485-.235.61-.406.126-.172.11-.297.22-.39.11-.094.25-.094.39-.047.14.047.875.406 1.03.484.157.078.266.125.313.203.047.078.047.453-.188 1.11z" />
  </svg>
);

// ============================================================================
// DYNAMIC QR CODE RENDERER (MINIMAL DOTS)
// ============================================================================

const DynamicQRCode: React.FC<{ value: string; color: string; brandLabel: string }> = ({ value, color, brandLabel }) => {
  const getDotPattern = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const dots = [];
    for (let r = 0; r < 18; r++) {
      const row = [];
      for (let c = 0; c < 18; c++) {
        const inTopLeft = r < 5 && c < 5;
        const inTopRight = r < 5 && c >= 13;
        const inBottomLeft = r >= 13 && c < 5;
        if (inTopLeft || inTopRight || inBottomLeft) {
          row.push(false);
        } else {
          const val = Math.abs(Math.sin((r * 18 + c) * 31 + hash));
          row.push(val > 0.45);
        }
      }
      dots.push(row);
    }
    return dots;
  };

  const dots = getDotPattern(value);

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-slate-50/40 rounded-xl relative border border-slate-100/60 max-w-[120px] mx-auto">
      <svg viewBox="0 0 100 100" className="w-[72px] h-[72px] sm:w-[80px] h-[80px] bg-white p-1.5 border border-slate-100 rounded-lg inline-block">
        {/* Finder corners */}
        <rect x="6" y="6" width="22" height="22" fill="none" stroke={color} strokeWidth="5" rx="2" />
        <rect x="12" y="12" width="10" height="10" fill={color} rx="1" />
        
        <rect x="72" y="6" width="22" height="22" fill="none" stroke={color} strokeWidth="5" rx="2" />
        <rect x="78" y="12" width="10" height="10" fill={color} rx="1" />

        <rect x="6" y="72" width="22" height="22" fill="none" stroke={color} strokeWidth="5" rx="2" />
        <rect x="12" y="78" width="10" height="10" fill={color} rx="1" />

        {/* Grid dots */}
        <g fill="#1e293b">
          {dots.map((row, r) => 
            row.map((active, c) => {
              if (!active) return null;
              const x = 8 + c * 4.6;
              const y = 8 + r * 4.6;
              return <rect key={`${r}-${c}`} x={x} y={y} width="3.2" height="3.2" fill="#1e293b" rx="0.5" />;
            })
          )}
        </g>
      </svg>
      <span className="text-[8px] text-slate-400 font-mono font-bold mt-1 uppercase letter-tag">
        Scan QR to Pay
      </span>
    </div>
  );
};

// ============================================================================
// BANK ACCOUNTS DICTIONARY
// ============================================================================

const BANK_ACCOUNTS = {
  kbzpay: {
    bankName: "KBZPay",
    accountName: "Kru Jane (Teacher)",
    accountNumber: "09791112233",
    qrColor: "#005bab",
    instruction: "Transfer via KBZPay App or scan this merchant QR.",
    qrText: "KBZPAY-MERCHANT-8829103982",
    logoText: "KBZP",
    description: "Instant zero-fee wallet transfer"
  },
  wavepay: {
    bankName: "WavePay",
    accountName: "Kru Jane (Teacher)",
    accountNumber: "09791112233",
    qrColor: "#df1f26",
    instruction: "Send to WavePay wallet number & upload slip screenshot.",
    qrText: "WAVEPAY-TRANSFER-09791112233",
    logoText: "Wave",
    description: "Nationwide Wave transfer"
  },
  cbpay: {
    bankName: "CB Pay",
    accountName: "Thura Sone",
    accountNumber: "2039230910293021",
    qrColor: "#009645",
    instruction: "Transfer via CBPay or direct commercial bank deposit.",
    qrText: "CBPAY-ACCOUNT-2039230910293021",
    logoText: "CB",
    description: "Direct bank transfer"
  },
  ayabank: {
    bankName: "AYA Bank",
    accountName: "Thura Sone",
    accountNumber: "3023091029304859",
    qrColor: "#ed1c24",
    instruction: "Deposit to AYA Bank savings or AYA iBanking app.",
    qrText: "AYA-SAVINGS-3023091029304859",
    logoText: "AYA",
    description: "Convenient bank transfer"
  },
  truemoney: {
    bankName: "TrueMoney (TH)",
    accountName: "Kru Jane Academy",
    accountNumber: "+66 98-765-4321",
    qrColor: "#ea1a2a",
    instruction: "TrueMoney wallet key for students residing in Thailand.",
    qrText: "TRUEMONEY-TH-66987654321",
    logoText: "True",
    description: "Thailand wallet payment"
  },
  promptpay: {
    bankName: "PromptPay (TH)",
    accountName: "Thai Language Academy",
    accountNumber: "0891234567",
    qrColor: "#002d62",
    instruction: "Scan Thai PromptPay QR using any Thai Banking App.",
    qrText: "PROMPTPAY-TAX-0891234567",
    logoText: "Prompt",
    description: "Thai Bank QR payment"
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CheckoutGatewayProps {
  isGatewayOpen: boolean;
  setIsGatewayOpen: (open: boolean) => void;
  gatewayCourse: Course | null;
  checkoutName: string;
  setCheckoutName: (name: string) => void;
  gatewayEmail: string;
  setGatewayEmail: (email: string) => void;
  gatewayPhone: string;
  setGatewayPhone: (phone: string) => void;
  gatewayStep: number;
  setGatewayStep: (step: number) => void;
  gatewayPaymentMethod: 'kbzpay' | 'wavepay' | 'cbpay' | 'ayabank' | 'truemoney' | 'promptpay';
  setGatewayPaymentMethod: (method: 'kbzpay' | 'wavepay' | 'cbpay' | 'ayabank' | 'truemoney' | 'promptpay') => void;
  gatewayOtp: string;
  setGatewayOtp: (otp: string) => void;
  gatewayTimer: number;
  setGatewayTimer: (time: number) => void;
  gatewayProcessing: boolean;
  setGatewayProcessing: (proc: boolean) => void;
  currentUser: string | null;
  setCurrentUser: (user: string | null) => void;
  setIsLoggedIn: (isLogged: boolean) => void;
  addSystemLog: (user: string, message: string) => void;
  orders: PurchaseOrder[];
  setOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setIsCourseStoreExpanded: (expanded: boolean) => void;
  registeredUsers: RegisteredUser[];
  setRegisteredUsers: React.Dispatch<React.SetStateAction<RegisteredUser[]>>;
}

const convertFileToBase64 = (file: File, maxWidth = 800, quality = 0.65): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    };

    img.src = objectUrl;
  });
};

export const CheckoutGateway: React.FC<CheckoutGatewayProps> = ({
  isGatewayOpen,
  setIsGatewayOpen,
  gatewayCourse,
  checkoutName,
  setCheckoutName,
  gatewayEmail,
  setGatewayEmail,
  gatewayPhone,
  setGatewayPhone,
  gatewayStep,
  setGatewayStep,
  gatewayPaymentMethod,
  setGatewayPaymentMethod,
  gatewayOtp,
  setGatewayOtp,
  gatewayTimer,
  setGatewayTimer,
  gatewayProcessing,
  setGatewayProcessing,
  currentUser,
  setCurrentUser,
  setIsLoggedIn,
  addSystemLog,
  orders,
  setOrders,
  setIsCourseStoreExpanded,
  registeredUsers,
  setRegisteredUsers,
}) => {
  if (!isGatewayOpen || !gatewayCourse) return null;

  // Local state for auto signup / login password in enrollment
  const [gatewayPassword, setGatewayPassword] = useState<string>('');

  // Evidence file state
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'number' | 'name' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeBank = BANK_ACCOUNTS[gatewayPaymentMethod] || BANK_ACCOUNTS.kbzpay;

  // Check if there is a previous cancelled order for this item by this user
  const previousCancelledOrder = orders.find(o => 
    o.username.toLowerCase() === (currentUser || "").toLowerCase() &&
    o.status === 'cancelled' &&
    (
      o.itemName.toLowerCase().includes(gatewayCourse.name.toLowerCase()) || 
      gatewayCourse.name.toLowerCase().includes(o.itemName.replace('🎓 [Course] ', '').toLowerCase()) ||
      o.id === gatewayCourse.id ||
      (o.itemName.toLowerCase().includes('course') && gatewayCourse.id.includes('course')) ||
      (gatewayCourse.id === 'premium-book' && o.itemName.toLowerCase().includes('book'))
    )
  );

  // Copy helper
  const handleCopy = (text: string, type: 'number' | 'name') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    addSystemLog('Billing', `Copied ${activeBank.bankName} Account ${type}`);
    setTimeout(() => setCopiedType(null), 1500);
  };

  // Drag/Drop and selection slips
  const processReceiptFile = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setEvidenceFile(file);
      try {
        const compressedBase64 = await convertFileToBase64(file);
        setEvidencePreview(compressedBase64);
        addSystemLog('Billing', `Uploaded & compressed check screenshot: "${file.name}"`);
      } catch (err) {
        console.error("Failed to compress image:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEvidencePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        addSystemLog('Billing', `Uploaded check screenshot: "${file.name}"`);
      }
    } else {
      alert("Please upload a valid receipt image (PNG / JPG).");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processReceiptFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processReceiptFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveReceipt = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
  };

  // Direct Social Helpline Message
  const getSocialShareMessage = () => {
    const studentName = (checkoutName || currentUser || "New Student").trim();
    const courseName = gatewayCourse.name;
    const MMKPrice = gatewayCourse.priceAmount.toLocaleString();
    const bankChannel = activeBank.bankName;
    const phoneNum = gatewayPhone || "N/A";
    
    return `Hello Teachers! 🙋‍♂️ I have made the direct tuition payment:\n- Course: ${courseName}\n- Amount: ${MMKPrice} MMK\n- Wallet/Bank: ${bankChannel}\n- Student: ${studentName}\n- Phone: ${phoneNum}\n\nPlease verify and activate my access. Thank you!`;
  };

  const handleLineNotify = () => {
    const msgText = getSocialShareMessage();
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(msgText)}`;
    window.open(url, '_blank', 'noreferrer,noopener');
    addSystemLog('Billing', 'LINE Messenger verification opened.');
  };

  const handleWhatsAppNotify = () => {
    const msgText = getSocialShareMessage();
    const url = `https://wa.me/66987654321?text=${encodeURIComponent(msgText)}`;
    window.open(url, '_blank', 'noreferrer,noopener');
    addSystemLog('Billing', 'WhatsApp support opened.');
  };

  const selectPaymentMethod = (method: 'kbzpay' | 'wavepay' | 'cbpay' | 'ayabank' | 'truemoney' | 'promptpay') => {
    setGatewayPaymentMethod(method);
    setGatewayTimer(180);
    setGatewayStep(3);
    addSystemLog('Billing', `Entered transfer detail stage with: ${method.toUpperCase()}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-[99999] overflow-y-auto animate-fade-in">
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="bg-white rounded-2xl max-w-lg md:max-w-xl w-full text-slate-800 shadow-xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Compact Elegant Header */}
        <div className="px-5 py-4 bg-brand-purple text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-sans font-black uppercase tracking-wider">
              Enrollment Portal • သင်တန်းဝင်ခွင့်
            </h3>
            <p className="text-[10px] text-purple-200 font-bold mt-0.5">
              Step {gatewayStep}/4 • {
                gatewayStep === 1 ? "Student details" : 
                gatewayStep === 2 ? "Select bank payment method" :
                gatewayStep === 3 ? "Direct Deposit QR" :
                "Enrollment Successful"
              }
            </p>
          </div>
          <button 
            onClick={() => setIsGatewayOpen(false)}
            className="p-1 hover:bg-white/10 transition-colors text-purple-200 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rich Spacious Step Progress Flow with Icons */}
        <div className="bg-slate-50/70 border-b border-slate-100 py-2.5 px-4 sm:px-10 shrink-0 select-none relative">
          <div className="max-w-md mx-auto relative flex items-center justify-between">
            {/* Background connecting line */}
            <div className="absolute left-6 right-6 top-[15px] h-0.5 bg-slate-200 rounded-full z-0">
              <div 
                className="h-full bg-brand-purple rounded-full transition-all duration-300"
                style={{ 
                  width: `${((Math.min(gatewayStep, 4) - 1) / 3) * 100}%` 
                }} 
              />
            </div>

            {/* Step icons & descriptions */}
            {[
              { step: 1, label: 'Profile', mmLabel: 'ကျောင်းသား', icon: <UserCheck className="w-3.5 h-3.5" /> },
              { step: 2, label: 'Payment', mmLabel: 'ဘဏ်ရွေးရန်', icon: <CreditCard className="w-3.5 h-3.5" /> },
              { step: 3, label: 'Receipt QR', mmLabel: 'ငွေလွှဲပြေစာ', icon: <QrCode className="w-3.5 h-3.5" /> },
              { step: 4, label: 'Enrolled', mmLabel: 'ကျောင်းအပ်ပြီး', icon: <CheckCircle className="w-3.5 h-3.5" /> }
            ].map((item) => {
              const isActive = gatewayStep === item.step;
              const isPassed = gatewayStep > item.step;
              
              return (
                <div key={item.step} className="flex flex-col items-center relative z-10 w-16">
                  <div 
                    className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                      isActive 
                        ? (item.step === 4 ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30 scale-110 ring-4 ring-emerald-500/20' : 'bg-brand-purple text-white border-brand-purple shadow-sm shadow-brand-purple/20 scale-105') 
                        : isPassed 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs' 
                          : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span 
                    className={`text-[8.5px] font-sans font-black mt-1.5 leading-tight text-center transition-colors ${
                      isActive ? (item.step === 4 ? 'text-emerald-600 font-extrabold' : 'text-brand-purple') : isPassed ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span 
                    className={`text-[7px] font-sans mt-0.5 leading-none text-center transition-colors ${
                      isActive ? (item.step === 4 ? 'text-emerald-600 font-extrabold' : 'text-brand-purple/80 font-bold') : isPassed ? 'text-emerald-500/80 font-bold' : 'text-slate-400/70'
                    }`}
                  >
                    {item.mmLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Summary Bar (Compact) */}
        <div className="bg-brand-purple/5 px-5 py-2 border-b border-slate-100/80 flex justify-between items-center shrink-0">
          <div className="space-y-0.5">
            <span className="text-[7.5px] font-mono font-black uppercase text-brand-purple tracking-widest block">
              {gatewayCourse?.itemType === 'e-book' ? 'eBook / Study Resource' : 'Course'}
            </span>
            <span className="text-xs font-sans font-bold text-slate-800 block truncate max-w-[280px]">{gatewayCourse.name}</span>
          </div>
          <div className="text-right shrink-0 bg-white border border-slate-100 px-2 py-0.5 rounded-lg">
            <span className="text-[7.5px] font-mono text-slate-400 block uppercase leading-none mb-0.5">
              {gatewayCourse?.itemType === 'e-book' ? 'Price' : 'Fee'}
            </span>
            <span className="text-xs font-mono font-bold text-brand-purple">
              {gatewayCourse.priceAmount.toLocaleString()} MMK
            </span>
          </div>
        </div>

        {/* CONTENT DYNAMIC PORT */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs flex-1">
          
          {/* STEP 1: ENROLLMENT FORM */}
          {gatewayStep === 1 && (
            <div className="space-y-3 animate-fade-in max-w-sm mx-auto">
              {previousCancelledOrder && (
                <div className="bg-rose-50 border-2 border-rose-200/80 p-3.5 rounded-xl text-left space-y-2">
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span className="text-[10px] font-sans font-black uppercase tracking-wider">
                      Previous Order Declined (ငြင်းပယ်ထားပါသည်)
                    </span>
                  </div>
                  <p className="text-[10.5px] text-rose-800 font-sans font-bold leading-normal">
                    Your previous payment transfer receipt verification was rejected by administrative reviews. Please complete your student info, select bank, and re-upload the correct transaction slip correctly!
                  </p>
                  {previousCancelledOrder.adminNotes && (
                    <div className="bg-white/90 border border-rose-150 p-2.5 rounded-lg text-[10px] text-rose-950 font-sans font-bold leading-normal">
                      <span className="text-[9px] text-rose-600 block uppercase font-sans font-black mb-0.5">Admin Rejection memo:</span>
                      "{previousCancelledOrder.adminNotes}"
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Student Full Name ({checkoutName ? "Verified" : "ကျောင်းသားအမည်"})
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-205 focus:border-brand-purple/60 focus:bg-white rounded-lg text-xs font-semibold text-slate-900 focus:outline-none transition-all placeholder:text-slate-300"
                    placeholder="e.g. Min Thura"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Mobile Phone (ဖုန်းနံပါတ်)
                  </label>
                  <input
                    type="text"
                    required
                    value={gatewayPhone}
                    onChange={(e) => setGatewayPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-205 focus:border-brand-purple/60 focus:bg-white rounded-lg text-xs font-mono font-600 text-slate-900 focus:outline-none transition-all placeholder:text-slate-300"
                    placeholder="e.g. 09791112233"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Email Address (အီးမေးလ်)
                  </label>
                  <input
                    type="email"
                    value={gatewayEmail}
                    onChange={(e) => setGatewayEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-205 focus:border-brand-purple/60 focus:bg-white rounded-lg text-xs font-medium text-slate-900 focus:outline-none transition-all placeholder:text-slate-300"
                    placeholder="student@example.com"
                  />
                </div>

                {!currentUser && (() => {
                  const isExisting = registeredUsers.some(u => u.username.toLowerCase() === checkoutName.trim().toLowerCase());
                  return (
                    <div className="animate-fade-in">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {isExisting ? (
                          <span className="text-amber-600 font-extrabold flex items-center gap-1">
                            ⚠️ Student Account Found! Enter Password to Login (အကောင့်ရှိပြီးသားဖြစ်၍ စကားဝှက်ထည့်ပါ)
                          </span>
                        ) : (
                          <span>
                            Choose Password for Auto-Signup (အကောင့်အသစ်အတွက် စကားဝှက်အသစ်ပေးပါ)
                          </span>
                        )}
                      </label>
                      <input
                        type="password"
                        required
                        value={gatewayPassword}
                        onChange={(e) => setGatewayPassword(e.target.value)}
                        className={`w-full px-3 py-1.5 border focus:bg-white rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-300 ${
                          isExisting 
                            ? 'bg-amber-50/70 border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10' 
                            : 'bg-slate-50 border-slate-205 focus:border-brand-purple/60'
                        }`}
                        placeholder={isExisting ? "Type password to link account..." : "Password (min 4 chars)..."}
                      />
                      <p className="text-[9px] text-slate-400 mt-0.5 font-sans leading-normal">
                        {isExisting 
                          ? "This student profile is already registered. Logging in will link this course purchase to your progress!" 
                          : "This password will let you easily log back in anytime to access approved lessons."}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const cleanName = checkoutName.trim();
                    if (!cleanName || !gatewayPhone.trim()) {
                      alert("Please provide dry contact information (Name and Phone) first.");
                      return;
                    }
                    if (!currentUser) {
                      const cleanPassword = gatewayPassword.trim();
                      if (!cleanPassword) {
                        alert("Please provide a password so that you can easily log in to access your course!");
                        return;
                      }
                      const matchedUser = registeredUsers.find(u => u.username.toLowerCase() === cleanName.toLowerCase());
                      if (matchedUser) {
                        if (matchedUser.password && matchedUser.password !== cleanPassword) {
                          alert(`Error: This name "${cleanName}" is already taken by another registered student. Please enter the correct password, or choose a different Student Full Name.`);
                          return;
                        }
                      } else {
                        if (cleanPassword.length < 4) {
                          alert("For security, your password must be at least 4 characters.");
                          return;
                        }
                      }
                    }
                    setGatewayStep(2);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm font-sans cursor-pointer"
                >
                  <span>Select Payment Channel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MINIMAL BANK GATEWAYS SELECTOR GRID */}
          {gatewayStep === 2 && (
            <div className="space-y-3 animate-fade-in">
              <div className="text-center space-y-0.5 select-none max-w-xs mx-auto">
                <span className="text-[9px] uppercase tracking-wider text-brand-purple font-mono font-bold block">Direct Channels</span>
                <p className="text-[11px] text-slate-500 font-medium">Please select your wallet or preferred payment route:</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: 'kbzpay', name: 'KBZPay', icon: <KBZPayIcon />, desc: 'Instant transfer' },
                  { id: 'wavepay', name: 'WavePay', icon: <WavePayIcon />, desc: 'Simple wallet' },
                  { id: 'cbpay', name: 'CB Pay', icon: <CBPayIcon />, desc: 'Direct deposit' },
                  { id: 'ayabank', name: 'AYA Bank', icon: <AYABankIcon />, desc: 'Standard secure' },
                  { id: 'truemoney', name: 'TrueMoney', icon: <TrueMoneyIcon />, desc: 'Thai App' },
                  { id: 'promptpay', name: 'PromptPay', icon: <PromptPayIcon />, desc: 'TH bank QR' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectPaymentMethod(item.id as any)}
                    className="p-2.5 bg-slate-50/50 border border-slate-150 hover:border-brand-purple/40 hover:bg-brand-purple/[0.02] rounded-xl flex flex-col items-center text-center gap-1.5 transition-all duration-200 group cursor-pointer hover:shadow-xs"
                  >
                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    
                    <div className="space-y-0.5">
                      <span className="text-[10.5px] font-sans font-bold text-slate-800 block group-hover:text-brand-purple transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[8px] text-slate-400 font-medium block">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Prev / Controls */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setGatewayStep(1)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HIGHLY MINIMALIST SPLIT VIEW OR SINGLE QR CARD */}
          {gatewayStep === 3 && (
            <div className="space-y-2.5 animate-fade-in">
              {/* Back & Timer row */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setGatewayStep(2)}
                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-lg text-[9px] transition-colors cursor-pointer flex items-center gap-0.5 shrink-0"
                >
                  <ArrowLeft className="w-2.5 h-2.5 text-slate-600" />
                  <span>Choose Bank</span>
                </button>

                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 text-[9px] font-mono font-bold shrink-0">
                  <span>Session:</span>
                  <span>{Math.floor(gatewayTimer / 60)}:{(gatewayTimer % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Split Details & Uploader */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                
                {/* Bank details info container */}
                <div className="md:col-span-7 bg-slate-50/50 p-2 sm:p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between gap-1.5">
                  <div className="flex flex-row md:flex-col items-stretch gap-2.5 justify-between">
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider leading-none">
                          {activeBank.bankName} Details
                        </span>
                        <p className="text-[8.5px] text-slate-400 font-medium leading-tight">
                          {activeBank.instruction}
                        </p>
                      </div>

                      {/* Copier rows */}
                      <div className="space-y-1">
                        {/* Name Row */}
                        <div className="flex items-center justify-between bg-white px-2 py-0.5 sm:py-1 rounded-lg border border-slate-100">
                          <div className="min-w-0">
                            <span className="text-[6.5px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Receiver name</span>
                            <span className="text-[9.5px] font-sans font-bold text-slate-800 truncate block">{activeBank.accountName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeBank.accountName, 'name')}
                            className="p-1 text-slate-400 hover:text-brand-purple transition-colors cursor-pointer shrink-0"
                            title="Copy Account Name"
                          >
                            {copiedType === 'name' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Number Row */}
                        <div className="flex items-center justify-between bg-white px-2 py-0.5 sm:py-1 rounded-lg border border-slate-100">
                          <div className="min-w-0">
                            <span className="text-[6.5px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Account / Card info</span>
                            <span className="text-[10px] font-mono font-bold text-slate-950 block select-all tracking-wide">{activeBank.accountNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeBank.accountNumber, 'number')}
                            className="p-1 text-slate-400 hover:text-brand-purple transition-colors cursor-pointer shrink-0"
                            title="Copy Account Number"
                          >
                            {copiedType === 'number' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                      <DynamicQRCode value={activeBank.qrText} color={activeBank.qrColor} brandLabel={activeBank.logoText} />
                    </div>
                  </div>
                </div>

                {/* Direct Upload Screenshot Area */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                  <div className="flex-1 flex flex-col space-y-1.5">
                    {previousCancelledOrder && (
                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-left space-y-1 font-sans mb-1 animate-pulse-subtle">
                        <div className="flex items-center gap-1 text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          <span className="text-[8.5px] font-sans font-black uppercase tracking-wide">Correction Required • ပြေစာပြန်လည်တင်ရန်</span>
                        </div>
                        <p className="text-[9.5px] text-rose-800 font-bold leading-relaxed">
                          Your previous receipt was rejected: <b className="text-rose-950">"{previousCancelledOrder.adminNotes || "Incorrect transaction record"}"</b>. Please select the correct deposit slip image.
                        </p>
                      </div>
                    )}
                    <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider leading-none">
                      Upload Screenshot Slip
                    </span>

                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border border-dashed rounded-xl p-2 text-center transition-all cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[105px] ${
                        isDragOver ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-205 hover:border-brand-purple/40 bg-slate-50/20'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />

                      {evidencePreview ? (
                        <div className="w-full flex flex-col gap-2 font-sans items-center py-2">
                          <div className="relative border border-slate-150 p-1 bg-white rounded-xl overflow-hidden shadow-3xs max-w-[120px] w-full">
                            {/* Exact 9:16 Aspect Ratio container */}
                            <div className="aspect-[9/16] w-full bg-slate-100 rounded-lg overflow-hidden relative">
                              <img 
                                src={evidencePreview} 
                                alt="Receipt slip preview" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[7px] text-white px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase scale-90">
                                9:16 Ratio
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center min-w-0">
                            <span className="block text-[8.5px] font-sans font-black text-slate-700 truncate leading-tight max-w-[160px] mx-auto">
                              {evidenceFile?.name || "Payment slip screenshot"}
                            </span>
                            <span className="text-[7.5px] text-emerald-600 font-black uppercase mt-0.5 block tracking-wider font-sans">
                              Slip screenshot attached (9:16)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveReceipt();
                            }}
                            className="bg-red-50 hover:bg-red-100 border border-red-200/50 text-[8px] py-1 px-3 text-red-600 rounded-lg transition-colors font-sans font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5 inline text-red-500" />
                            <span>Remove image</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-0.5 py-2.5 text-center">
                          <UploadCloud className="w-4 h-4 text-slate-400 mx-auto" />
                          <span className="text-[9px] font-sans font-black text-slate-600 block leading-tight uppercase tracking-wider">
                            Tap to attach slip screenshot
                          </span>
                          <span className="text-[7.5px] text-slate-400 block font-bold mt-0.5">
                            Drag-drop transaction slip here • 9:16 ratio recommended
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sleek compact instructors notification box */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1 text-left">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-brand-purple" />
                      <span className="text-[8.5px] font-black uppercase tracking-wide text-brand-purple">
                        Notify Admin (အက်မင်သို့ အကြောင်းကြားရန်)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handleLineNotify}
                        className="py-1 px-1 bg-[#06C755] hover:bg-[#05B34C] text-white rounded-lg text-[8px] uppercase font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <LINELogoIcon />
                        <span>LINE support</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleWhatsAppNotify}
                        className="py-1 px-1 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg text-[8px] uppercase font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <WhatsAppLogoIcon />
                        <span>WhatsApp support</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit trigger button */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanName = (checkoutName || 'Student_' + Math.floor(100 + Math.random() * 900)).trim();
                    let buyerUsername = cleanName;
                    
                    // Handle login / sign-up
                    if (!currentUser) {
                      const cleanPassword = gatewayPassword.trim();
                      const matchedUser = registeredUsers.find(u => u.username.toLowerCase() === cleanName.toLowerCase());

                      if (matchedUser) {
                        // Log in the existing user
                        setIsLoggedIn(true);
                        setCurrentUser(matchedUser.username);
                        setAuthValue('thai_user_logged_in', 'true');
                        setAuthValue('thai_current_user', matchedUser.username);
                        setAuthValue('thai_user_is_admin', matchedUser.role === 'admin' ? 'true' : 'false');
                        addSystemLog(matchedUser.username, `Student logged in during checkout`);
                        buyerUsername = matchedUser.username;
                      } else {
                        // Sign up and log in the new user!
                        setIsLoggedIn(true);
                        setCurrentUser(cleanName);
                        setAuthValue('thai_user_logged_in', 'true');
                        setAuthValue('thai_current_user', cleanName);
                        setAuthValue('thai_user_is_admin', 'false');

                        const newUser: RegisteredUser = {
                          username: cleanName,
                          password: cleanPassword,
                          role: 'student',
                          xp: 0,
                          dateJoined: new Date().toISOString().split('T')[0],
                          fullName: cleanName,
                          phone: gatewayPhone,
                          email: gatewayEmail
                        };
                        
                        setRegisteredUsers(prev => {
                          const nextList = [...prev, newUser];
                          localStorage.setItem('thai_registered_users_list', JSON.stringify(nextList));
                          return nextList;
                        });

                        addSystemLog(cleanName, `Registered new student account and auto-logged in during enrollment.`);
                        buyerUsername = cleanName;
                      }
                    } else {
                      buyerUsername = currentUser;
                    }

                    const id = "ORD-" + Math.floor(10000 + Math.random() * 90000);
                    const isEbook = gatewayCourse?.itemType === 'e-book';
                    const newOrder: PurchaseOrder = {
                      id,
                      username: buyerUsername,
                      itemName: isEbook ? `📕 [eBook] ${gatewayCourse.name}` : `🎓 [Course] ${gatewayCourse.name}`,
                      itemType: isEbook ? 'e-book' : 'course',
                      priceAmount: gatewayCourse.priceAmount,
                      currency: 'MMK',
                      status: 'pending',
                      orderDate: new Date().toISOString().split('T')[0],
                      evidenceImage: evidencePreview || undefined,
                      adminNotes: '',
                      studentPhone: gatewayPhone,
                      studentEmail: gatewayEmail
                    };
                    setOrders(prev => [newOrder, ...prev]);
                    
                    const realName = buyerUsername || 
                                     (window as any).Clerk?.user?.fullName || 
                                     (window as any).Clerk?.user?.firstName || 
                                     (window as any).Clerk?.user?.username || 
                                     currentUser || 
                                     'Student';

                    // Synchronously transition to Step 4!
                    setGatewayStep(4);
                    setGatewayProcessing(false);
                    addSystemLog(buyerUsername, `Submitted payment receipt for ${isEbook ? 'eBook' : 'course'} "${gatewayCourse.name}" (Pending validation)`);

                    const executeUpload = async () => {
                      let finalProofUrl = evidencePreview || null;
                      let isSynced = 0;
                      
                      if (isOnlineSimulated()) {
                        try {
                          if (evidenceFile) {
                            addSyncLog('payment', `Compressing payment slip to Base64 format...`, 'info');
                            finalProofUrl = await convertFileToBase64(evidenceFile);
                          }
                          
                          addSyncLog('payment', `Ingesting transaction to D1 database...`, 'info');
                          const response = await fetch('/api/d1-transaction-deploy', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'X-Static-Admin': 'true'
                            },
                            body: JSON.stringify({
                              id,
                              user_id: realName,
                              amount: gatewayCourse.priceAmount,
                              payment_method: gatewayPaymentMethod,
                              status: 'pending',
                              transaction_proof_url: finalProofUrl
                            })
                          });

                          const resData = await response.json().catch(() => ({}));

                          if (response.status === 409 || resData?.duplicate) {
                            const dupMsg = resData?.error || "သင်သည် ဤ သင်တန်းကို ဝယ်ယူပြီးဖြစ်ပါသည်";
                            addSyncLog('payment', `Duplicate purchase rejected: ${dupMsg}`, 'warning');
                            addSystemLog(buyerUsername, `Duplicate purchase attempt: ${dupMsg}`);
                            return { duplicate: true };
                          }

                          if (response.ok) {
                            isSynced = resData.local_dev ? 0 : 1;
                            addSyncLog('payment', `Logged transaction proof successfully (${id}).`, 'success');
                          } else {
                            const errText = resData?.error || await response.text().catch(() => '');
                            isSynced = 0;
                            addSyncLog('payment', `Transaction saved locally. Cloudflare D1 status: ${response.status} ${errText}`, 'info');
                          }
                        } catch (e: any) {
                          isSynced = 0;
                          addSyncLog('payment', `Transaction saved locally (offline mode active).`, 'info');
                        }
                      } else {
                        isSynced = 0;
                        addSyncLog('payment', `Offline order queued locally in IndexedDB: ${id}`, 'warning');
                      }

                      try {
                        await localDB.transactions.put({
                          id,
                          user_id: realName,
                          amount: gatewayCourse.priceAmount,
                          status: 'pending',
                          transaction_proof_url: finalProofUrl,
                          is_synced: isSynced
                        });
                      } catch (dbErr) {
                        console.warn("Local DB transaction cache note:", dbErr);
                      }

                      return { duplicate: false };
                    };

                    executeUpload();
                  }}
                  disabled={gatewayProcessing}
                  className="flex-1 bg-brand-purple hover:bg-brand-purple/95 disabled:opacity-50 text-white font-sans font-bold text-[11px] py-1.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
                >
                  {gatewayProcessing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Verifying transfer slip...</span>
                    </>
                  ) : (
                    <span>{gatewayCourse?.itemType === 'e-book' ? 'Submit Order' : 'Submit & Enroll'}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ENROLLMENT CONFIRMED & DETAILS */}
          {gatewayStep === 4 && (
            <div className="py-2 space-y-3 animate-fade-in max-w-md mx-auto select-none">
              {/* Success Header */}
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20 border-2 border-emerald-400">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                
                <h4 className="text-[14px] font-sans font-black uppercase text-slate-900 tracking-wide">
                  ENROLLED SUCCESSFULLY!
                </h4>
                <p className="text-[12px] font-sans font-bold text-emerald-700">
                  ကျောင်းအပ်နှံမှု စလစ် တင်ပြခြင်း အောင်မြင်ပါသည်။
                </p>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold shadow-xs mt-1">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                  <span>Admin will respond and approve within 24 hours (အက်ဒမင်မှ ၂၄ နာရီအတွင်း စစ်ဆေးပြီး အတည်ပြုပေးပါမည်)</span>
                </div>
              </div>

              {/* ENROLLMENT RECEIPT DETAILS CARD */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-left space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Enrollment Receipt Details</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Registration Pending Approval
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Student Name / ကျောင်းသားအမည်</span>
                    <span className="font-semibold text-slate-800">{checkoutName || currentUser || (orders && orders[0]?.username) || 'Student'}</span>
                  </div>
                  {gatewayPhone && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Phone Number / ဖုန်းနံပါတ်</span>
                      <span className="font-semibold text-slate-800">{gatewayPhone}</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Course / E-Book Name</span>
                    <span className="font-bold text-brand-purple">{gatewayCourse?.name || 'Thai Learning Program'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Payment Method / ငွေပေးချေမှု</span>
                    <span className="font-semibold text-slate-800 uppercase">{gatewayPaymentMethod || 'KBZPay'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Amount / ကျသင့်ငွေ</span>
                    <span className="font-black text-emerald-600">{gatewayCourse?.price || `${gatewayCourse?.priceAmount?.toLocaleString()} MMK`}</span>
                  </div>
                </div>

                {/* Slip Thumbnail if attached */}
                {evidencePreview && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">Payment Slip Attached:</span>
                    <img src={evidencePreview} alt="Receipt Slip" className="w-10 h-10 object-cover rounded-lg border border-slate-300 shadow-xs" />
                  </div>
                )}
              </div>

              {/* GUARANTEE & INSTRUCTIONS */}
              <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span>24-Hour Admin Verification Guarantee</span>
                </div>
                <p className="text-[10.5px] text-emerald-900/90 leading-relaxed pl-6">
                  Our admin team will review and verify your payment submission <strong>within 24 hours</strong>. Once verified, your course features will automatically be unlocked.
                </p>
                <p className="text-[10.5px] text-emerald-900/90 leading-relaxed pl-6 font-semibold pt-0.5">
                  အက်ဒမင်မှ သင့်ငွေလွှဲပြေစာအား စစ်ဆေးပြီး <strong>၂၄ နာရီအတွင်း အတည်ပြုပေးပါမည်</strong>။ အတည်ပြုပြီးပါက သင်တန်းခန်းမသို့ တိုက်ရိုက် ဝင်ရောက်နိုင်ပါပြီ။
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsGatewayOpen(false);
                    setIsCourseStoreExpanded(false);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-[12px] flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <span>DONE • သင်တန်းသို့ သွားရန်</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
