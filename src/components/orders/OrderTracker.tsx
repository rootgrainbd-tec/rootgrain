import { CheckCircle2, Circle, Clock, Package, Truck } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface OrderTrackerProps {
  status: OrderStatus;
}

const steps = [
  { id: "PENDING", label: "Pending", icon: Clock },
  { id: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { id: "PROCESSING", label: "In Production", icon: Package },
  { id: "DISPATCHED", label: "Dispatched", icon: Truck },
  { id: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

export function OrderTracker({ status }: OrderTrackerProps) {
  // Cancelled or Rejected have a different flow
  if (status === "CANCELLED" || status === "REJECTED") {
    return (
      <div className="flex items-center text-red-500 gap-2 font-medium">
        <Circle className="w-5 h-5 fill-current" />
        Order {status.charAt(0) + status.slice(1).toLowerCase()}
      </div>
    );
  }

  const currentIndex = steps.findIndex((s) => s.id === status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex; // Default to PENDING if unknown

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[var(--walnut)]/10 -z-10 -translate-y-1/2 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-[var(--gold)] -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isActive = index === activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-[var(--ivory)] px-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isActive ? 'border-[var(--gold)] bg-[var(--gold)] text-white shadow-md' : 
                    isCompleted ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]' : 
                    'border-[var(--walnut)]/20 bg-[var(--ivory)] text-[var(--walnut)]/40'}
                `}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-medium ${isCompleted ? 'text-[var(--walnut-dark)]' : 'text-[var(--walnut)]/50'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
