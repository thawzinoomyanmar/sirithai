import React from 'react';
import { Trash2 } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface AdminTableRowProps {
  order: PurchaseOrder;
  onViewDetails: (order: PurchaseOrder) => void;
  onApprove: (orderId: string, itemName: string, username: string, courseId?: string) => void;
  onReject: (orderId: string) => void;
  onDelete: (orderId: string, e: React.MouseEvent) => void;
}

export const AdminTableRow: React.FC<AdminTableRowProps> = React.memo(({
  order,
  onViewDetails,
  onApprove,
  onReject,
  onDelete
}) => {
  return (
    <tr 
      onClick={() => onViewDetails(order)}
      className="hover:bg-amber-50/10 cursor-pointer transition-all group"
      title="Click to view full order details, screenshot slip, and write notes"
    >
      <td className="py-3 px-3 font-mono font-black text-brand-purple group-hover:underline">{order.id}</td>
      <td className="py-3 px-3 font-bold text-brand-dark">{order.username}</td>
      <td className="py-3 px-3 font-semibold text-brand-dark text-[11px]">{order.itemName}</td>
      <td className="py-3 px-3 text-brand-muted font-bold">{order.orderDate}</td>
      <td className="py-3 px-3 font-mono font-black text-brand-dark">
        {order.priceAmount.toLocaleString()} {order.currency}
      </td>
      <td className="py-3 px-3">
        {order.status === 'pending' ? (
          <span className="inline-block px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-205">
            Pending Review
          </span>
        ) : order.status === 'completed' || order.status === 'approved' ? (
          <span className="inline-block px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-green-50 text-green-700 border border-green-205">
            Completed
          </span>
        ) : (
          <span className="inline-block px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-red-50 text-red-700 border border-red-205">
            Cancelled
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1 justify-end items-center">
          <button
            onClick={() => onViewDetails(order)}
            className="px-2 py-1 bg-brand-purple/10 text-brand-purple font-sans font-bold text-[9.5px] uppercase rounded-lg hover:bg-brand-purple hover:text-white transition-all cursor-pointer"
          >
            Details
          </button>
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(order.id, order.itemName, order.username, order.courseId)}
                className="px-2.5 py-1 bg-brand-green text-white text-[9.5px] font-black uppercase rounded-lg hover:opacity-90 cursor-pointer shadow-3xs"
                title="Mark order as Completed"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(order.id)}
                className="px-2.5 py-1 bg-rose-500 text-white text-[9.5px] font-black uppercase rounded-lg hover:bg-rose-600 cursor-pointer shadow-3xs ml-1"
                title="Deny and Cancel order"
              >
                Reject
              </button>
            </>
          )}
          {order.status !== 'pending' && (
            <span className="text-[10px] text-brand-muted italic font-bold">Processed</span>
          )}
          <button
            onClick={(e) => onDelete(order.id, e)}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
            title="Delete Order from D1 Database"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});
