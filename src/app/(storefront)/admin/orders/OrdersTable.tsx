"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatus } from "@/app/actions/admin";
import { confirmMtoOrder } from "@/app/actions/admin.mto";
import { OrderStatus } from "@prisma/client";
import { Loader2, Eye, Download, Printer, Settings, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PaginationData {
  page: number;
  totalPages: number;
  totalCount: number;
}

export default function OrdersTable({ 
  orders, 
  pagination, 
  currentQuery = "", 
  currentStatus = undefined 
}: { 
  orders: any[];
  pagination: PaginationData;
  currentQuery?: string;
  currentStatus?: OrderStatus | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(currentQuery);

  const updateFilters = (newQuery: string | undefined, newStatus: string | undefined, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newQuery !== undefined) {
      if (newQuery) params.set("query", newQuery);
      else params.delete("query");
    }
    
    if (newStatus !== undefined) {
      if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
      else params.delete("status");
    }
    
    params.set("page", newPage.toString());
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(searchInput, undefined, 1);
  };

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
    const order = orders.find(o => o.id === orderId);

    if (status === "CONFIRMED") {
      if (order?.isMtoOrder) {
        if (!confirm("Confirm this MTO order? A 48-hour payment deadline will be set.")) return;
        startTransition(async () => {
          const res = await confirmMtoOrder(orderId);
          if (res.success) {
            toast.success("MTO Order confirmed and deadline set.");
          } else {
            toast.error(res.error || "Failed to confirm MTO order");
          }
        });
        return;
      }

      // Need advance amount for normal orders
      setSelectedOrder(order);
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <Input 
            placeholder="Search order #, name, phone..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={currentStatus || "ALL"} 
            onValueChange={(val) => updateFilters(undefined, val, 1)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING_ADVANCE">Pending Advance</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="DISPATCHED">Dispatched</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-sm border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Order Number</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Advance</th>
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
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    {order.orderNumber}
                    {order.isMtoOrder && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">MTO</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {order.shippingAddress?.name}<br/>
                  <span className="text-xs text-muted-foreground">{order.shippingAddress?.phone}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[200px] truncate text-xs">
                    {order.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                </td>
                <td className="px-4 py-3">৳{(order.total || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-green-700 font-medium whitespace-nowrap">Paid: ৳{(order.advancePaid || 0).toLocaleString()}</span>
                    {order.isMtoOrder && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">Req: ৳{(order.requiredAdvance || 0).toLocaleString()}</span>
                    )}
                  </div>
                </td>
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
                      asChild
                    >
                      <Link href={`/admin/orders/${order.id}`}>
                        <Settings className="w-4 h-4 text-[var(--walnut)]" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setViewOrder(order);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      asChild
                    >
                      <a href={`/checkout/invoice?order=${order.orderNumber}`} target="_blank" rel="noreferrer">
                        <Printer className="w-4 h-4 text-[var(--gold)]" />
                      </a>
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>
          Showing {orders.length > 0 ? (pagination.page - 1) * 20 + 1 : 0} to{" "}
          {Math.min(pagination.page * 20, pagination.totalCount)} of {pagination.totalCount} orders
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={pagination.page <= 1}
            onClick={() => updateFilters(undefined, undefined, pagination.page - 1)}
          >
            Previous
          </Button>
          <div className="font-medium text-foreground px-2">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => updateFilters(undefined, undefined, pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order: {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmAdvance} className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Total Order Value: <strong className="text-black">৳{selectedOrder ? (selectedOrder.total || 0).toLocaleString() : 0}</strong>
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
            <DialogTitle className="flex justify-between items-center pr-8">
              <span>Order Details: {viewOrder?.orderNumber}</span>
              {viewOrder && (
                <Button variant="outline" size="sm" asChild className="h-8">
                  <a href={`/checkout/invoice?order=${viewOrder.orderNumber}`} target="_blank" rel="noreferrer">
                    <Printer className="w-4 h-4 mr-2" /> Print Invoice
                  </a>
                </Button>
              )}
            </DialogTitle>
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
                  <p className="text-gray-600">{viewOrder.shippingAddress?.street}</p>
                  <p className="text-gray-600">
                    {viewOrder.shippingAddress?.district}, {viewOrder.shippingAddress?.division}
                    {viewOrder.shippingAddress?.postCode ? ` - ${viewOrder.shippingAddress?.postCode}` : ""}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Order Items</h3>
                <div className="border rounded-sm divide-y">
                  {viewOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between p-3">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-gray-500">Qty: {item.quantity} x ৳{(item.unitPrice || 0).toLocaleString()}</p>
                      </div>
                      <p className="font-medium">৳{(item.total || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-gray-600">Subtotal: ৳{(viewOrder.subtotal || 0).toLocaleString()}</p>
                <p className="text-gray-600">Shipping: ৳{(viewOrder.shippingCost || 0).toLocaleString()}</p>
                {viewOrder.discountAmount > 0 && (
                  <p className="text-green-600">Discount: -৳{(viewOrder.discountAmount || 0).toLocaleString()}</p>
                )}
                <p className="font-bold text-lg pt-2 border-t inline-block w-48 text-[var(--walnut-dark)]">
                  Total: ৳{(viewOrder.total || 0).toLocaleString()}
                </p>
                <p className="text-gray-600 mt-2">Advance Paid: ৳{(viewOrder.advancePaid || 0).toLocaleString()}</p>
                <p className="text-gray-600 font-medium">Pending: ৳{((viewOrder.total || 0) - (viewOrder.advancePaid || 0)).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
