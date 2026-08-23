"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-[10px] overflow-hidden flex flex-col shadow-none print:overflow-visible print:bg-transparent print:border-none print:shadow-none"
    >
      <div className="relative w-full overflow-auto max-h-[calc(100vh-280px)] print:overflow-visible print:max-h-none">
        <table
          data-slot="table"
          className={cn("w-full caption-bottom text-left text-sm text-white print:text-black", className)}
          {...props}
        />
      </div>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("border-b border-white/10 text-[11px] font-bold text-brand-grey uppercase tracking-wider print:border-black print:text-black", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("divide-y divide-white/5 print:divide-gray-300", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-white/5 transition-colors hover:bg-white/5 has-aria-expanded:bg-white/5 data-[state=selected]:bg-white/10 print:border-gray-300 print:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "py-4 px-6 text-left align-middle font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap [&:has([role=checkbox])]:pr-0 sticky top-0 z-10 bg-[#0a0f44] backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.1)] print:bg-transparent print:text-black print:shadow-none print:static",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-6 py-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
