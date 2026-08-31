"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Edit3, X, Check, Clock, AlertTriangle } from "lucide-react";
import { markMtoExpired, updateShippingAddress, startMtoProduction, completeMtoProduction, voidInvoiceAction } from "@/app/actions/admin.mto";
import { reviseAdvanceAction } from "@/app/actions/advance-revision.admin";
import { reviseOrderPriceAction } from "@/app/actions/price-revision.admin";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export default function MtoManagement({ order }: { order: any }) {
  const [isPending, startTransition] = useTransition();
  const [isEditingAdvance, setIsEditingAdvance] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(order.requiredAdvance.toString());
  const [advanceReason, setAdvanceReason] = useState("");
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as any;
  const canRevisePrice = user?.permissions?.includes("price.revise");

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [priceData, setPriceData] = useState<Record<string, number>>({});
  const [priceReason, setPriceReason] = useState("");
  const [priceIdempotencyKey, setPriceIdempotencyKey] = useState("");
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [advanceIdempotencyKey, setAdvanceIdempotencyKey] = useState("");

  const [addressData, setAddressData] = useState(
    typeof order.shippingAddress === 'string' 
      ? JSON.parse(order.shippingAddress) 
      : order.shippingAddress || {}
  );

  useEffect(() => {
    setAdvanceIdempotencyKey(uuidv4());
    setPriceIdempotencyKey(uuidv4());
    if (order.items) {
      const init: Record<string, number> = {};
      order.items.forEach((item: any) => init[item.id] = item.unitPrice);
      setPriceData(init);
    }
  }, [order.items]);

  const hasPayments = order.paymentRecords && order.paymentRecords.length > 0;
  const isOverdue = order.advanceDeadline && new Date(order.advanceDeadline) < new Date();
  const canExpire = order.status === "PENDING_ADVANCE" || order.status === "CONFIRMED";

  const advanceInvoices = order.documents?.filter((d: any) => d.documentType === "INVOICE" && (d.snapshot as any)?.invoiceType === "ADVANCE") || [];
  
  const handleVoidInvoice = (invoiceId: string) => {
    if (!confirm("Are you sure you want to void this invoice? This will invalidate it and allow a new one to be generated if the order is confirmed again.")) return;
    startTransition(async () => {
      const res = await voidInvoiceAction(invoiceId, order.id);
      if (res.success) {
        toast.success("Invoice voided successfully.");
      } else {
        toast.error(res.error || "Failed to void invoice");
      }
    });
  };

  const canReviseAdvance = (order.status === "PENDING_ADVANCE" || order.status === "CONFIRMED") && order.productionState === "NOT_STARTED";

  const handleAdvanceSubmit = () => {
    const amt = parseInt(advanceAmount);
    if (isNaN(amt) || amt < 0 || amt > order.total) {
      toast.error("Invalid advance amount. Must be between 0 and ৳" + order.total.toLocaleString());
      return;
    }
    if (!advanceReason.trim()) {
      toast.error("Reason is required for advance revision.");
      return;
    }
    setShowAdvanceConfirm(true);
  };

  const handleAdvanceConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("orderId", order.id);
      formData.append("newRequiredAdvance", advanceAmount);
      formData.append("reason", advanceReason.trim());
      formData.append("idempotencyKey", advanceIdempotencyKey);

      const res = await reviseAdvanceAction(null, formData);
      if (res.success) {
        toast.success("Required advance revised successfully.");
        setIsEditingAdvance(false);
        setAdvanceReason("");
        setShowAdvanceConfirm(false);
        setAdvanceIdempotencyKey(uuidv4());
      } else {
        toast.error(res.error || "Failed to revise advance");
        setShowAdvanceConfirm(false);
      }
    });
  };

  const handleAdvanceCancel = () => {
    setIsEditingAdvance(false);
    setAdvanceAmount(order.requiredAdvance.toString());
    setAdvanceReason("");
    setShowAdvanceConfirm(false);
  };

  const handleUpdateAddress = () => {
    startTransition(async () => {
      const res = await updateShippingAddress(order.id, addressData);
      if (res.success) {
        toast.success("Shipping address updated.");
        setIsEditingAddress(false);
      } else {
        toast.error(res.error || "Failed to update address");
      }
    });
  };

  const handleExpire = () => {
    if (!confirm("Are you sure you want to mark this MTO order as EXPIRED (Cancelled)? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await markMtoExpired(order.id);
      if (res.success) {
        toast.success("Order marked as expired.");
      } else {
        toast.error(res.error || "Failed to expire order");
      }
    });
  };

  const handleStartProduction = () => {
    if (!confirm("Start manufacturing/production for this order?")) return;
    startTransition(async () => {
      const res = await startMtoProduction(order.id);
      if (res.success) {
        toast.success("Production started successfully.");
      } else {
        toast.error(res.error || "Failed to start production");
      }
    });
  };

  const handleCompleteProduction = () => {
    if (!confirm("Mark production as completed?")) return;
    startTransition(async () => {
      const res = await completeMtoProduction(order.id);
      if (res.success) {
        toast.success("Production marked as complete.");
      } else {
        toast.error(res.error || "Failed to complete production");
      }
    });
  };

  const handlePriceSubmit = () => {
    if (!priceReason.trim()) {
      toast.error("Reason is required for price revision.");
      return;
    }
    const hasChanges = order.items?.some((item: any) => priceData[item.id] !== item.unitPrice);
    if (!hasChanges) {
      toast.error("No prices were changed.");
      return;
    }
    
    // Check validation client-side
    const newSubtotal = order.items.reduce((sum: number, item: any) => sum + (priceData[item.id] * item.quantity), 0);
    const newTotal = newSubtotal + order.shippingCost - order.discountAmount;
    if (newTotal < order.advancePaid) {
      toast.error(`New total (৳${newTotal.toLocaleString()}) cannot be less than advance paid (৳${order.advancePaid.toLocaleString()})`);
      return;
    }
    if (newTotal < order.requiredAdvance) {
      toast.error(`New total (৳${newTotal.toLocaleString()}) cannot be less than required advance (৳${order.requiredAdvance.toLocaleString()})`);
      return;
    }

    setShowPriceConfirm(true);
  };

  const handlePriceConfirm = () => {
    startTransition(async () => {
      const itemsToUpdate = order.items
        .filter((item: any) => priceData[item.id] !== item.unitPrice)
        .map((item: any) => ({
          orderItemId: item.id,
          newUnitPrice: priceData[item.id]
        }));

      const res = await reviseOrderPriceAction({
        orderId: order.id,
        items: itemsToUpdate,
        reason: priceReason.trim(),
        idempotencyKey: priceIdempotencyKey
      });

      if (res.success) {
        toast.success("Prices revised successfully.");
        setIsEditingPrices(false);
        setPriceReason("");
        setShowPriceConfirm(false);
        setPriceIdempotencyKey(uuidv4());
      } else {
        toast.error(res.error || "Failed to revise prices");
        setShowPriceConfirm(false);
      }
    });
  };

  const previewSubtotal = order.items?.reduce((sum: number, item: any) => sum + ((priceData[item.id] ?? item.unitPrice) * item.quantity), 0) || 0;
  const previewTotal = previewSubtotal + order.shippingCost - order.discountAmount;
  const previewBalanceDue = previewTotal - order.advancePaid;


  return (
    <div className="space-y-6">
      {/* Required Advance & Deadline */}
      <div className="bg-white p-6 rounded-sm border shadow-sm">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            MTO Management
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">MTO</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Payment Deadline</p>
              {order.advanceDeadline ? (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className={`w-4 h-4 ${isOverdue && canExpire ? 'text-red-500' : 'text-gray-500'}`} />
                  <span className={`font-medium ${isOverdue && canExpire ? 'text-red-600' : 'text-gray-800'}`}>
                    {format(new Date(order.advanceDeadline), 'PPp')}
                  </span>
                  {isOverdue && canExpire && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium">OVERDUE</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-800 mt-1">Pending Confirmation</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                Required Advance
                {canReviseAdvance && !isEditingAdvance && (
                  <button onClick={() => setIsEditingAdvance(true)} className="text-blue-600 hover:text-blue-800">
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </p>
              {isEditingAdvance ? (
                <div className="space-y-2 mt-1">
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      min="0"
                      max={order.total}
                      value={advanceAmount} 
                      onChange={(e) => setAdvanceAmount(e.target.value)} 
                      className="w-32 h-8 text-sm"
                      placeholder="Amount"
                    />
                  </div>
                  <Input
                    type="text"
                    value={advanceReason}
                    onChange={(e) => setAdvanceReason(e.target.value)}
                    placeholder="Reason for revision (required)"
                    className="h-8 text-sm"
                    maxLength={500}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="default" onClick={handleAdvanceSubmit} disabled={isPending} className="h-8 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleAdvanceCancel} disabled={isPending} className="h-8 text-red-600">
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-800 mt-1 font-medium">
                  ৳{order.requiredAdvance.toLocaleString()}
                </p>
              )}
            </div>

            {/* Advance Revision Confirmation Modal */}
            {showAdvanceConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Confirm Advance Revision</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>Current Required Advance: <span className="font-bold">৳{order.requiredAdvance.toLocaleString()}</span></p>
                    <p>New Required Advance: <span className="font-bold">৳{parseInt(advanceAmount).toLocaleString()}</span></p>
                    <p>Reason: <span className="font-medium">{advanceReason}</span></p>
                    <p className="text-xs text-gray-400 mt-2">This changes only the advance threshold. Payment history and balance are not affected.</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setShowAdvanceConfirm(false)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button onClick={handleAdvanceConfirm} disabled={isPending} className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirm Revision
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-l pl-6">
            <div>
              <p className="text-sm text-gray-500 font-medium">Advance Paid</p>
              <p className="text-lg font-bold text-green-700 mt-1">৳{order.advancePaid.toLocaleString()}</p>
            </div>
            
            {isOverdue && canExpire && !hasPayments && (
              <div className="pt-2">
                <Button 
                  onClick={handleExpire} 
                  disabled={isPending}
                  variant="destructive" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Mark as Expired (Cancelled)
                </Button>
              </div>
            )}

            {order.status === "CONFIRMED" && order.productionState === "NOT_STARTED" && order.advancePaid >= order.requiredAdvance && (
              <div className="pt-2">
                <Button 
                  onClick={handleStartProduction} 
                  disabled={isPending}
                  size="sm" 
                  className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Start Production
                </Button>
              </div>
            )}

            {order.status === "PROCESSING" && order.productionState === "IN_PROGRESS" && (
              <div className="pt-2">
                <Button 
                  onClick={handleCompleteProduction} 
                  disabled={isPending}
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Complete Production
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advance Invoices Section */}
      {advanceInvoices.length > 0 && (
        <div className="bg-white p-6 rounded-sm border shadow-sm">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              Advance Invoices
            </h3>
          </div>
          <div className="space-y-4">
            {advanceInvoices.map((inv: any) => {
              const paymentsForInvoice = order.paymentRecords?.filter((p: any) => p.invoiceDocumentId === inv.id && p.status === "COMPLETED") || [];
              const totalPaid = paymentsForInvoice.reduce((sum: number, p: any) => sum + p.amount, 0);
              const canVoid = inv.status === "ISSUED" && totalPaid === 0;

              return (
                <div key={inv.id} className="border p-4 rounded flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{inv.referenceIdentity}</p>
                    <p className="text-sm text-gray-500">Status: <span className={inv.status === "VOIDED" ? "text-red-600 font-medium" : "text-green-600 font-medium"}>{inv.status}</span></p>
                    <p className="text-sm text-gray-500">Generated: {format(new Date(inv.createdAt), 'PPp')}</p>
                    <p className="text-sm text-gray-500">Payments: ৳{totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    {canVoid && (
                      <Button
                        onClick={() => handleVoidInvoice(inv.id)}
                        disabled={isPending}
                        variant="destructive"
                        size="sm"
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                        Void Invoice
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Address Management */}
      <div className="bg-white p-6 rounded-sm border shadow-sm">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Shipping Address</h3>
          {!isEditingAddress && order.status !== "CANCELLED" && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(true)}>
              <Edit3 className="w-4 h-4 mr-2" /> Edit
            </Button>
          )}
        </div>

        {isEditingAddress ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Name</label>
                <Input value={addressData.name || ''} onChange={e => setAddressData({...addressData, name: e.target.value})} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Phone</label>
                <Input value={addressData.phone || ''} onChange={e => setAddressData({...addressData, phone: e.target.value})} className="h-8 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">Street</label>
                <Input value={addressData.street || ''} onChange={e => setAddressData({...addressData, street: e.target.value})} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">District</label>
                <Input value={addressData.district || ''} onChange={e => setAddressData({...addressData, district: e.target.value})} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Division</label>
                <Input value={addressData.division || ''} onChange={e => setAddressData({...addressData, division: e.target.value})} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(false)} disabled={isPending}>Cancel</Button>
              <Button size="sm" onClick={handleUpdateAddress} disabled={isPending} className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
                {isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />} Save Address
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-700">
            <div>
              <p><span className="font-medium">Name:</span> {addressData?.name || "N/A"}</p>
              <p><span className="font-medium">Phone:</span> {addressData?.phone || "N/A"}</p>
              <p><span className="font-medium">Email:</span> {addressData?.email || "N/A"}</p>
            </div>
            <div>
              <p>{addressData?.street}</p>
              <p>{addressData?.district}, {addressData?.division}</p>
              <p>{addressData?.postCode}</p>
            </div>
          </div>
        )}
      </div>
      {/* Price Revision */}
      <div className="bg-white p-6 rounded-sm border shadow-sm">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Price Revision (Commercial)</h3>
          {!isEditingPrices && canReviseAdvance && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditingPrices(true)}>
              <Edit3 className="w-4 h-4 mr-2" /> Revise Prices
            </Button>
          )}
        </div>
        
        <div className="border rounded-sm divide-y">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4">
              <div>
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity} x ৳{item.unitPrice.toLocaleString()} (Current)</p>
              </div>
              <div className="mt-2 sm:mt-0 flex items-center gap-4">
                {isEditingPrices ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">New Price:</span>
                    <Input 
                      type="number" 
                      min="0"
                      value={priceData[item.id] ?? item.unitPrice} 
                      onChange={(e) => setPriceData({...priceData, [item.id]: parseInt(e.target.value) || 0})} 
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                ) : (
                  <p className="font-medium text-[var(--walnut-dark)]">৳{item.total.toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {isEditingPrices && (
          <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-medium text-gray-800">Revision Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Subtotal</p>
                <p className="font-semibold">৳{previewSubtotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Shipping - Discount</p>
                <p className="font-semibold">৳{(order.shippingCost - order.discountAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">New Total</p>
                <p className={`font-semibold ${previewTotal < order.advancePaid || previewTotal < order.requiredAdvance ? 'text-red-600' : 'text-blue-600'}`}>৳{previewTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">New Balance Due</p>
                <p className="font-semibold text-green-700">৳{previewBalanceDue.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Input
                type="text"
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                placeholder="Reason for price revision (required)"
                className="h-9"
                maxLength={500}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditingPrices(false)} disabled={isPending}>Cancel</Button>
                <Button onClick={handlePriceSubmit} disabled={isPending} className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
                  Review & Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Price Revision Confirmation Modal */}
        {showPriceConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 space-y-4 max-h-[90vh] overflow-y-auto">
              <h4 className="text-lg font-semibold text-gray-900">Confirm Price Revision</h4>
              <div className="text-sm text-gray-600 space-y-3">
                <p>You are about to mutate the commercial prices for this MTO order. This will generate a <span className="font-mono bg-gray-100 px-1 rounded">PRICE_REVISED</span> event and recalculate the financial invariants.</p>
                
                <div className="bg-gray-50 p-3 rounded border text-xs font-mono space-y-1">
                  {order.items?.map((item: any) => {
                    const newPrice = priceData[item.id] ?? item.unitPrice;
                    if (newPrice !== item.unitPrice) {
                      const adjustment = newPrice - item.unitPrice;
                      return (
                        <div key={item.id} className="flex justify-between border-b pb-1 mb-1 last:border-0 last:mb-0 last:pb-0">
                          <span className="truncate w-1/2">{item.productName}</span>
                          <span className="text-right">
                            {item.unitPrice} &rarr; {newPrice} 
                            <span className={adjustment > 0 ? 'text-blue-600' : 'text-red-600'}>
                              {adjustment > 0 ? ` (+${adjustment})` : ` (${adjustment})`}
                            </span>
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 font-medium">
                  <p>Old Total: ৳{order.total.toLocaleString()}</p>
                  <p>New Total: ৳{previewTotal.toLocaleString()}</p>
                  <p>Old Balance: ৳{order.balanceDue.toLocaleString()}</p>
                  <p>New Balance: ৳{previewBalanceDue.toLocaleString()}</p>
                </div>
                <p>Reason: <span className="font-medium text-gray-900">{priceReason}</span></p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPriceConfirm(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button onClick={handlePriceConfirm} disabled={isPending} className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Commit Revision
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
