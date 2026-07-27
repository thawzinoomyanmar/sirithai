import React, { useState } from 'react';
import { PurchaseOrder } from '../types';
import { 
  X, 
  Check, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  CreditCard, 
  Megaphone, 
  AlertTriangle,
  Notebook,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { localDB } from '../utils/db';

interface OrderDetailModalProps {
  order: PurchaseOrder;
  onClose: () => void;
  isAdmin: boolean;
  onUpdateOrder: (updatedOrder: PurchaseOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
  addSystemLog: (user: string, action: string) => void;
  storeItems?: any[];
  triggerPdfDownload?: (fileName: string, title: string, description: string, highlights: any[]) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  isAdmin,
  onUpdateOrder,
  onDeleteOrder,
  addSystemLog,
  storeItems,
  triggerPdfDownload,
}) => {
  const [notes, setNotes] = useState(order.adminNotes || '');
  const [zoomImage, setZoomImage] = useState(false);

  const matchingItem = storeItems?.find(item => 
    item.name.toLowerCase() === order.itemName.toLowerCase() || 
    item.id.toLowerCase() === order.itemName.toLowerCase() || 
    order.itemName.toLowerCase().includes(item.id.toLowerCase())
  );

  const handleApprove = async () => {
    // 1. Save previous state for rollback
    const previousOrder = { ...order };
    
    // 2. Optimistic UI update
    const updated: PurchaseOrder = {
      ...order,
      status: 'completed',
      adminNotes: notes
    };
    onUpdateOrder(updated);
    addSystemLog('admin', `Approved order ${order.id} for student "${order.username}"`);
    
    // 3. Network request
    try {
      const res1 = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ id: order.id, status: 'completed', adminNotes: notes })
      });
      if (!res1.ok) throw new Error('API /orders failed');
      
      const res2 = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ id: order.id, status: 'approved' })
      });
      if (!res2.ok) throw new Error('API /approve-payment failed');
      
      await localDB.transactions.update(order.id, { status: 'approved' });
      onClose(); // Close only on success
    } catch (apiErr) {
      console.warn("Approve payment API error, rolling back:", apiErr);
      // 4. Rollback on failure
      onUpdateOrder(previousOrder);
      alert('Failed to approve order on the server. Change rolled back.');
    }
  };

  const handleReject = async () => {
    // 1. Save previous state for rollback
    const previousOrder = { ...order };
    
    // 2. Optimistic UI update
    const updated: PurchaseOrder = {
      ...order,
      status: 'cancelled',
      adminNotes: notes
    };
    onUpdateOrder(updated);
    addSystemLog('admin', `Rejected/Cancelled order ${order.id} with note: "${notes || 'No notes'}"`);
    
    // 3. Network request
    try {
      const res1 = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ id: order.id, status: 'cancelled', adminNotes: notes })
      });
      if (!res1.ok) throw new Error('API /orders failed');
      
      const res2 = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ id: order.id, status: 'cancelled' })
      });
      if (!res2.ok) throw new Error('API /approve-payment failed');
      
      await localDB.transactions.update(order.id, { status: 'cancelled' });
      onClose(); // Close only on success
    } catch (apiErr) {
      console.warn("Cancel payment API error, rolling back:", apiErr);
      // 4. Rollback on failure
      onUpdateOrder(previousOrder);
      alert('Failed to reject order on the server. Change rolled back.');
    }
  };

  const handleSaveNotesOnly = async () => {
    const updated: PurchaseOrder = {
      ...order,
      adminNotes: notes
    };
    onUpdateOrder(updated);
    addSystemLog('admin', `Updated administrative notes on order ${order.id}`);
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ id: order.id, adminNotes: notes })
      });
    } catch (apiErr) {
      console.warn("Save notes D1 API error:", apiErr);
    }
    alert('Notes saved successfully!');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete order ${order.id}?`)) {
      return;
    }
    if (onDeleteOrder) {
      onDeleteOrder(order.id);
    }
    addSystemLog('admin', `Deleted purchase order ${order.id} from system.`);
    try {
      await fetch(`/api/orders?id=${encodeURIComponent(order.id)}`, {
        method: 'DELETE',
        headers: { 'X-Static-Admin': 'true' }
      });
      await localDB.transactions.delete(order.id);
    } catch (apiErr) {
      console.warn("Delete order D1 API error:", apiErr);
    }
    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-fade-in font-sans cursor-default"
    >
      <motion.div 
         initial={{ opacity: 0, scale: 0.97, y: 10 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.97, y: 10 }}
         className="bg-white rounded-2xl overflow-hidden shadow-xl max-w-md w-full border border-slate-100 p-5 space-y-4 text-slate-800"
      >
        {/* Header Title with Elegant Minimalist Close */}
        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-brand-purple tracking-wider uppercase bg-brand-purple/5 px-2 py-0.5 rounded-md">
                {order.id}
              </span>
              <div>
                {order.status === 'pending' ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    Pending
                  </span>
                ) : order.status === 'completed' ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-250">
                    Approved
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-rose-50 text-rose-700 border border-rose-250">
                    Cancelled
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-sm font-black font-sans text-slate-900 uppercase tracking-wide mt-1.5">
              Order Receipt Detail
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Details Grid */}
        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
            <span className="font-semibold text-slate-400 uppercase tracking-tight">Student Account</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              {order.username}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100">
            <span className="font-semibold text-slate-400 uppercase tracking-tight">Date Field</span>
            <span className="font-medium text-slate-700">{order.orderDate}</span>
          </div>

          <div className="py-1 border-b border-dashed border-slate-100">
            <span className="font-semibold text-slate-400 uppercase tracking-tight block mb-0.5">Purchased Resource</span>
            <span className="font-black text-brand-purple block leading-tight">{order.itemName}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="font-semibold text-slate-400 uppercase tracking-tight">Transaction Value</span>
            <span className="font-mono font-black text-slate-900 border border-slate-200 px-2 py-0.5 rounded bg-slate-50 text-xs">
              {order.priceAmount?.toLocaleString() || "0"} {order.currency}
            </span>
          </div>
        </div>

        {/* Student Contact Info */}
        {(order.studentPhone || order.studentEmail) && (
          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
              Student Contacts
            </span>
            <div className="grid grid-cols-1 gap-1 text-[11px] font-semibold">
              {order.studentPhone && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">{order.studentPhone}</span>
                </div>
              )}
              {order.studentEmail && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{order.studentEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Minimal Evidence Receipt Attachment */}
        <div className="space-y-1.5">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
            Receipt Slip Screenshot
          </span>
          {order.evidenceImage ? (
            <div className="flex flex-col items-center gap-1.5">
              <div 
                onClick={() => setZoomImage(true)}
                className="group border border-slate-200 hover:border-brand-purple/40 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center cursor-zoom-in max-w-[110px] w-full p-0.5 shadow-3xs"
              >
                {/* 9:16 Aspect Ratio Container */}
                <div className="aspect-[9/16] w-full bg-slate-100 rounded-lg overflow-hidden relative">
                  <img 
                    src={order.evidenceImage} 
                    alt="Receipt evidence" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[7px] text-white px-1.5 py-0.5 rounded font-mono font-bold scale-90">
                    9:16 Ratio
                  </div>
                </div>
              </div>
              <span className="text-[8px] text-slate-400 font-bold font-sans">
                🔍 Tab to zoom full screen
              </span>
            </div>
          ) : (
            <div className="border border-dashed border-slate-150 rounded-xl bg-slate-50 py-3 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">
                No visual document attached
              </span>
            </div>
          )}
        </div>

        {/* Notes Segment */}
        <div className="space-y-1.5">
          <label className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">
            {isAdmin ? "Administrative Note (အက်မင်၏ မှတ်တရ)" : "Verification Comment (မှတ်ချက်)"}
          </label>
          {isAdmin ? (
            <div className="space-y-1.5">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Confirmation or cancellation feedback..."
                className="w-full h-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-900 focus:outline-none focus:border-brand-purple transition-all placeholder:text-slate-400"
              />
              {order.status !== 'pending' && (
                <button
                  type="button"
                  onClick={handleSaveNotesOnly}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Save Notes Updates
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-[10.5px] leading-relaxed text-slate-700 italic text-left">
              {order.adminNotes || "Receipt verification active; notes pending approval updates."}
            </div>
          )}
        </div>

        {/* Unlocked eBook details & download links */}
        {!isAdmin && order.status === 'completed' && matchingItem && (
          <div className="bg-[#f0fbf6] border-2 border-[#10b981]/20 p-4 rounded-xl space-y-2.5 text-left animate-fade-in shadow-2xs">
            <span className="inline-block bg-[#10b981] text-white px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider font-sans select-none">
              🔓 Unlocked Companion Resource
            </span>
            <div className="space-y-1">
              <h4 className="text-[12px] font-sans font-black text-slate-900 leading-tight">
                {matchingItem.name} 
              </h4>
              <p className="text-[9.5px] text-slate-500 font-sans leading-relaxed">
                {matchingItem.description}
              </p>
            </div>
            
            <div className="pt-1.5 flex gap-2">
              {matchingItem.pdfDownloadUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    window.open(matchingItem.pdfDownloadUrl, '_blank');
                    addSystemLog('system', `Opened eBook resource downland link: "${matchingItem.name}" via Order Receipt`);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-[#10b981] to-[#059669] hover:brightness-105 text-white font-sans font-black text-[10.5px] uppercase tracking-wider rounded-lg transition-all text-center flex items-center justify-center gap-1 shadow-3xs cursor-pointer border-b-2 border-[#047857]"
                >
                  📥 Open eBook Download Link
                </button>
              ) : triggerPdfDownload ? (
                <button
                  type="button"
                  onClick={() => {
                    const fileName = matchingItem.pdfFileName || `${matchingItem.id}_workbook.pdf`;
                    const highlights = [{ thai: "สวัสดี", pronunciation: "sa-wat-di", myanmar: "မင်္ဂလာပါ" }];
                    triggerPdfDownload(fileName, matchingItem.name, matchingItem.description, highlights);
                    addSystemLog('system', `Downloaded auto-generated PDF companion via Order Receipt`);
                  }}
                  className="w-full py-2 bg-[#10b981] hover:brightness-105 text-white font-sans font-black text-[10.5px] uppercase tracking-wider rounded-lg transition-all text-center flex items-center justify-center gap-1 shadow-3xs cursor-pointer border-b-2 border-green-800"
                >
                  📥 Download Companion PDF
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Re-submit section for Rejected payments */}
        {!isAdmin && order.status === 'cancelled' && (
          <div className="bg-rose-50 border-2 border-rose-200/60 p-4 rounded-xl space-y-3 text-left">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-[11.5px] font-sans font-black text-rose-800 uppercase tracking-wide leading-tight">
                  Order Payment Validation Error (ငွေလွှဲပြေစာ ပယ်ချခံရသည်)
                </h4>
                <p className="text-[10px] text-rose-700 font-sans font-bold leading-relaxed">
                  The administrator was unable to verify your previous payment screenshot. Please review the reasons described above and recomplete by uploading a new screenshot/slip.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-100 space-y-2">
              <label className="block text-[9px] uppercase font-black text-rose-800 tracking-wider">
                Upload New Payment Slip (.JPG / .PNG Screenshot)
              </label>
              
              <div className="relative border-2 border-dashed border-rose-200 hover:border-rose-400 bg-white/50 rounded-xl p-3 text-center transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (!file.type.startsWith('image/')) {
                        alert("Please upload a valid receipt screenshot image.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const newImg = reader.result as string;
                        const resubmittedOrder: PurchaseOrder = {
                          ...order,
                          status: 'pending',
                          evidenceImage: newImg,
                          adminNotes: "Student uploaded new payment receipt slip for re-verification."
                        };
                        onUpdateOrder(resubmittedOrder);
                        addSystemLog('student', `Student "${order.username}" recompleted order ${order.id} with new payment slip.`);
                        alert("Your new payment proof was uploaded successfully! Order status is now returned to 'Pending Admin verification'.");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <CreditCard className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <span className="block text-[10px] font-sans font-black text-slate-800 uppercase">
                  TAP TO CHOOSE NEW RECEIPT SLIP
                </span>
                <span className="block text-[8px] text-slate-500 font-sans font-medium mt-0.5">
                  KBZPay, KPay, CBPay, WavePay screenshots accepted
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-sans font-black text-[10.5px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="Delete Order from D1 Database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}

          {isAdmin && order.status === 'pending' ? (
            <>
              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 py-2 bg-brand-green text-white font-sans font-black text-[10.5px] uppercase tracking-wider rounded-lg hover:brightness-95 transition-all text-center flex items-center justify-center gap-1 shadow-3xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Approve
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 py-2 bg-rose-600 text-white font-sans font-black text-[10.5px] uppercase tracking-wider rounded-lg hover:bg-rose-500 transition-all text-center flex items-center justify-center gap-1 shadow-3xs cursor-pointer"
              >
                Reject
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-950 text-white font-sans font-black text-[10.5px] uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors text-center cursor-pointer"
            >
              Done / Close
            </button>
          )}
        </div>
      </motion.div>

      {/* PICTURE ZOOM PORT */}
      {zoomImage && order.evidenceImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImage(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            onClick={() => setZoomImage(false)}
            title="Close Zoom"
          >
            <X className="w-5 h-5" />
          </button>
          <img 
            src={order.evidenceImage} 
            alt="Receipt Zoom" 
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

