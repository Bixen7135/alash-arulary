"use client";
import * as React from "react";
import * as RD from "@radix-ui/react-dialog";

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogTitle = RD.Title;
export const DialogClose = RD.Close;

export function DialogContent({
  className = "",
  children,
  ...props
}: RD.DialogContentProps & { className?: string }) {
  return (
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 bg-black/30 data-[state=open]:animate-in" />
      <RD.Content
        className={`fixed left-1/2 top-1/2 w-[95vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 shadow-lg focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </RD.Content>
    </RD.Portal>
  );
}

export function DialogHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-1 pb-2 ${className}`} {...props} />;
}

