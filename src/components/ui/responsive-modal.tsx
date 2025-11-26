import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer"

interface ResponsiveModalProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ResponsiveModal({ children, open, onOpenChange }: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

export function ResponsiveModalTrigger({ children, className, asChild }: { children: React.ReactNode, className?: string, asChild?: boolean }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTrigger className={className} asChild={asChild}>{children}</DrawerTrigger>
  }

  return <DialogTrigger className={className} asChild={asChild}>{children}</DialogTrigger>
}

export function ResponsiveModalContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={className}>
        {children}
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={className}>
      {children}
    </DialogContent>
  )
}

export function ResponsiveModalHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>
  }

  return <DialogHeader className={className}>{children}</DialogHeader>
}

export function ResponsiveModalTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>
  }

  return <DialogTitle className={className}>{children}</DialogTitle>
}

export function ResponsiveModalDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>
  }

  return <DialogDescription className={className}>{children}</DialogDescription>
}

export function ResponsiveModalFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>
  }

  return <DialogFooter className={className}>{children}</DialogFooter>
}

export function ResponsiveModalClose({ children, className, asChild }: { children: React.ReactNode, className?: string, asChild?: boolean }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerClose className={className} asChild={asChild}>{children}</DrawerClose>
  }

  return <DialogClose className={className} asChild={asChild}>{children}</DialogClose>
}
