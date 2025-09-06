"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "~~/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen: setIsOpen || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ asChild, children, onClick }: DialogTriggerProps) => {
  const { setOpen } = React.useContext(DialogContext);
  
  const handleClick = () => {
    setOpen(true);
    onClick?.();
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  );
};

const DialogContent = ({ className, children }: DialogContentProps) => {
  const { open, setOpen } = React.useContext(DialogContext);

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg",
          className
        )}
      >
        {children}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  );
};

const DialogHeader = ({ className, children }: DialogHeaderProps) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
  >
    {children}
  </div>
);

const DialogTitle = ({ className, children }: DialogTitleProps) => (
  <h2
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
  >
    {children}
  </h2>
);

const DialogDescription = ({ className, children }: DialogDescriptionProps) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
};
