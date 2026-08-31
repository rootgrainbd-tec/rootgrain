"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Ban } from "lucide-react";
import { PaymentMethod, PaymentType, PaymentStatus } from "@prisma/client";
import { recordAdminPaymentAction } from "@/app/actions/payment.admin";
import { voidPaymentAction } from "@/app/actions/payment-void.admin";
import { v4 as uuidv4 } from "uuid";

interface PaymentRecord {
  id: string;
  createdAt: Date;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  advancePaid: number;
  legacyAdvancePaid: number;
  balanceDue: number;
  paymentRecords: PaymentRecord[];
}

export default function PaymentLedger({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey, setIdempotencyKey] = useState("");
  
  // Form State
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<PaymentType>("ADVANCE");
  const [method, setMethod] = useState<PaymentMethod>("MANUAL_BKASH");
  const [reference, setReference] = useState("");

  // Validation State
  const [clientError, setClientError] = useState<string | null>(null);

  // Void Confirmation State
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  const [voidIdempotencyKey, setVoidIdempotencyKey] = useState("");
  const [isVoiding, startVoidTransition] = useTransition();

  useEffect(() => {
    setIdempotencyKey(uuidv4());
  }, []);

  const validateForm = () => {
    setClientError(null);
    const parsedAmount = parseInt(amount, 10);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return "Amount must be a positive number.";
    }
    if (parsedAmount > order.balanceDue) {
      return `Amount cannot exceed balance due (৳${order.balanceDue.toLocaleString()}).`;
    }

    if (type === "ADVANCE" && method === "COD") {
      return "ADVANCE payment cannot use COD method.";
    }
    if (type === "INSTALLMENT" && method === "COD") {
      return "INSTALLMENT payment cannot use COD method.";
    }
    if (type === "COD" && !(method === "COD" || method === "CASH")) {
      return "COD payment type must use COD or CASH method.";
    }

    const isDigital = method === "MANUAL_BKASH" || method === "BANK_TRANSFER";
    if (isDigital && !reference.trim()) {
      return "Reference is required for digital payments.";
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      setClientError(error);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("orderId", order.id);
      formData.append("amount", amount);
      formData.append("type", type);
      formData.append("method", method);
      if (reference.trim()) {
        formData.append("reference", reference.trim());
      }
      formData.append("idempotencyKey", idempotencyKey);

      const res = await recordAdminPaymentAction(null, formData);
      
      if (res.success) {
        toast.success("Payment recorded successfully.");
        // Reset form
        setAmount("");
        setReference("");
        // Generate new key for the next potential payment
        setIdempotencyKey(uuidv4());
        setClientError(null);
      } else {
        if (res.fieldErrors) {
          const errors = Object.values(res.fieldErrors).flat().join(", ");
          setClientError(errors);
          toast.error(errors);
        } else {
          setClientError(res.error || "Failed to record payment.");
          toast.error(res.error || "Failed to record payment.");
        }
      }
    });
  };

  const handleVoidClick = (paymentId: string) => {
    setVoidConfirmId(paymentId);
    setVoidIdempotencyKey(uuidv4());
  };

  const handleVoidCancel = () => {
    setVoidConfirmId(null);
    setVoidIdempotencyKey("");
  };

  const handleVoidConfirm = () => {
    if (!voidConfirmId || !voidIdempotencyKey) return;

    startVoidTransition(async () => {
      const formData = new FormData();
      formData.append("paymentRecordId", voidConfirmId);
      formData.append("idempotencyKey", voidIdempotencyKey);

      const res = await voidPaymentAction(null, formData);

      if (res.success) {
        toast.success("Payment voided successfully.");
        setVoidConfirmId(null);
        setVoidIdempotencyKey("");
      } else {
        toast.error(res.error || "Failed to void payment.");
      }
    });
  };

  const isVoidable = (status: PaymentStatus) => {
    return status === "INITIATED" || status === "COMPLETED";
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const styles: Record<string, string> = {
      COMPLETED: "bg-green-100 text-green-800",
      INITIATED: "bg-yellow-100 text-yellow-800",
      FAILED: "bg-red-100 text-red-800",
      REFUNDED: "bg-blue-100 text-blue-800",
      VOIDED: "bg-gray-100 text-gray-500 line-through",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Financial Summary */}
      <div className="bg-white p-6 rounded-sm border shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">৳{order.total.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Advance Paid</p>
          <p className="text-2xl font-bold text-green-700">৳{order.advancePaid.toLocaleString()}</p>
          {order.legacyAdvancePaid > 0 && (
            <p className="text-xs text-gray-400 mt-1">Includes ৳{order.legacyAdvancePaid.toLocaleString()} legacy</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Balance Due</p>
          <p className="text-2xl font-bold text-red-600">৳{order.balanceDue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Payment History</h3>
          {order.paymentRecords.length === 0 ? (
            <p className="text-sm text-gray-500">No payments recorded yet.</p>
          ) : (
            <div className="bg-white rounded-sm border shadow-sm overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.paymentRecords.map((pr) => (
                    <tr key={pr.id} className={`hover:bg-muted/50 ${pr.status === "VOIDED" ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{new Date(pr.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium">{pr.type}</td>
                      <td className="px-4 py-3">{pr.method}</td>
                      <td className="px-4 py-3 text-gray-500">{pr.reference || "-"}</td>
                      <td className="px-4 py-3">{getStatusBadge(pr.status)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${pr.status === "VOIDED" ? "text-gray-400 line-through" : "text-green-700"}`}>
                        ৳{pr.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isVoidable(pr.status) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleVoidClick(pr.id)}
                            disabled={isVoiding}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Void
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Void Confirmation Modal */}
          {voidConfirmId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Confirm Payment Void</h4>
                <p className="text-sm text-gray-600">
                  Are you sure you want to void this payment? This action is <span className="font-bold text-red-600">irreversible</span> and will remove this payment from the order balance.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleVoidCancel}
                    disabled={isVoiding}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleVoidConfirm}
                    disabled={isVoiding}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isVoiding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Void Payment
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Recording Form */}
        <div className="bg-white p-6 rounded-sm border shadow-sm space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Record Payment</h3>
          
          {order.balanceDue <= 0 ? (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-sm text-sm">
              This order is fully paid. No further payments can be recorded.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (BDT)</label>
                <Input 
                  type="number" 
                  min="1" 
                  max={order.balanceDue}
                  required 
                  placeholder={`Max: ৳${order.balanceDue}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Type</label>
                <Select disabled={isPending} value={type} onValueChange={(v) => setType(v as PaymentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADVANCE">Advance</SelectItem>
                    <SelectItem value="INSTALLMENT">Installment</SelectItem>
                    <SelectItem value="COD">Cash on Delivery (Final)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select disabled={isPending} value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL_BKASH">bKash (Manual)</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="COD">COD Handover</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(method === "MANUAL_BKASH" || method === "BANK_TRANSFER") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Reference <span className="text-red-500">*</span></label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="e.g. TrxID or Bank Ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              )}

              {clientError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
                  {clientError}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isPending || !idempotencyKey} 
                className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Record Payment
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
