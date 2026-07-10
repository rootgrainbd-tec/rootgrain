import React from 'react';
import Link from 'next/link';
import { Hammer } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-[var(--cream)] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-sm border border-[var(--walnut)]/10 text-center space-y-6 relative">
        <div className="flex justify-center text-[var(--gold)]">
          <Hammer className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-serif text-[var(--walnut-dark)] font-medium">
          Under Maintenance
        </h1>
        
        <p className="text-[var(--walnut)]/80 text-sm md:text-base leading-relaxed">
          We are currently updating our website to bring you a better experience. 
          Please check back shortly. We apologize for any inconvenience.
        </p>

        <div className="pt-4 flex flex-col items-center gap-4">
          <div className="w-16 h-[1px] bg-[var(--gold)]/30"></div>
          <p className="text-xs text-[var(--walnut)]/50 uppercase tracking-widest font-semibold">
            RootGrain Atelier
          </p>
        </div>

        {/* Discreet login link for admins */}
        <Link 
          href="/login" 
          className="absolute bottom-2 right-2 w-4 h-4 opacity-0 hover:opacity-20 transition-opacity flex items-center justify-center"
          title="Admin Login"
        >
          <span className="sr-only">Admin Login</span>
          <div className="w-1 h-1 bg-black rounded-full"></div>
        </Link>
      </div>
    </div>
  );
}
