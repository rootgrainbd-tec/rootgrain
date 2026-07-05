"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatus } from "@/app/actions/admin";
import { OrderStatus } from "@prisma/client";
import { Loader2, Eye, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OrdersTable({ orders }: { orders: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const exportCSV = () => {
    if (orders.length === 0) return;
    const headers = ["Order Number", "Customer Name", "Phone", "Status", "Total", "Advance Paid", "Date"];
    const rows = orders.map(o => [
      o.orderNumber, 
      o.shippingAddress?.name || "", 
      o.shippingAddress?.phone || "", 
      o.status, 
      o.total, 
      o.advancePaid, 
      new Date(o.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    if (status === "CONFIRMED") {
      // Need advance amount
      setSelectedOrder(orders.find(o => o.id === orderId));
      setIsConfirmModalOpen(true);
      return;
    }

    if (status === "REJECTED" && !confirm("Are you sure you want to reject this order?")) return;

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status);
      if (res.success) {
        toast.success(`Order status updated to ${status}`);
      } else {
        toast.error(res.error || "Failed to update");
      }
    });
  };

  const handleConfirmAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !advanceAmount) return;

    const advanceInTaka = parseInt(advanceAmount);
    
    startTransition(async () => {
      const res = await updateOrderStatus(selectedOrder.id, "CONFIRMED", advanceInTaka);
      if (res.success) {
        toast.success("Order confirmed successfully!");
        setIsConfirmModalOpen(false);
        setAdvanceAmount("");
        setSelectedOrder(null);
      } else {
        toast.error(res.error || "Failed to confirm");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>
      <div className="bg-white rounded-sm border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Order Number</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Advance Paid</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders found.</td>
              </tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                <td className="px-4 py-3">
                  {order.shippingAddress?.name}<br/>
                  <span className="text-xs text-muted-foreground">{order.shippingAddress?.phone}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[200px] truncate text-xs">
                    {order.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                </td>
                <td className="px-4 py-3">৳{order.total.toLocaleString()}</td>
                <td className="px-4 py-3">৳{order.advancePaid.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${order.status === 'PENDING_ADVANCE' ? 'bg-yellow-100 text-yellow-800' : 
                      order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 
                      order.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setViewOrder(order);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 text-[var(--walnut)]" />
                    </Button>
                    <Select 
                      disabled={isPending} 
                      value={order.status}
                      onValueChange={(val) => handleStatusUpdate(order.id, val as OrderStatus)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING_ADVANCE">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirm</SelectItem>
                        <SelectItem value="PROCESSING">Process</SelectItem>
                        <SelectItem value="DISPATCHED">Dispatch</SelectItem>
                        <SelectItem value="DELIVERED">Deliver</SelectItem>
                        <SelectItem value="REJECTED">Reject</SelectItem>
                        <SelectItem value="CANCELLED">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order: {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmAdvance} className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Total Order Value: <strong className="text-black">৳{selectedOrder ? selectedOrder.total.toLocaleString() : 0}</strong>
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Advance Amount Received (BDT)</label>
              <Input 
                type="number" 
                required 
                placeholder="e.g. 500" 
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details: {viewOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-6 pt-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Customer Info</h3>
                  <p className="text-gray-600">{viewOrder.shippingAddress?.name}</p>
                  <p className="text-gray-600">{viewOrder.shippingAddress?.phone}</p>
                  <p className="text-gray-600">{viewOrder.shippingAddress?.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Shipping Address</h3>
                  <p className="text-gray-600">{viewOrder.shippingAddress?.address}</p>
                  <p className="text-gray-600">{viewOrder.shippingAddress?.district}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Order Items</h3>
                <div className="border rounded-sm divide-y">
                  {viewOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between p-3">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-gray-500">Qty: {item.quantity} x ৳{item.price.toLocaleString()}</p>
                      </div>
                      <p className="font-medium">৳{item.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-gray-600">Subtotal: ৳{viewOrder.subtotal.toLocaleString()}</p>
                <p className="text-gray-600">Shipping: ৳{viewOrder.shippingCost.toLocaleString()}</p>
                {viewOrder.discountAmount > 0 && (
                  <p className="text-green-600">Discount: -৳{viewOrder.discountAmount.toLocaleString()}</p>
                )}
                <p className="font-bold text-lg pt-2 border-t inline-block w-48 text-[var(--walnut-dark)]">
                  Total: ৳{viewOrder.total.toLocaleString()}
                </p>
                <p className="text-gray-600 mt-2">Advance Paid: ৳{viewOrder.advancePaid.toLocaleString()}</p>
                <p className="text-gray-600 font-medium">Pending: ৳{(viewOrder.total - viewOrder.advancePaid).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
