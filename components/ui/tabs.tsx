"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsVariantContext = React.createContext<"default" | "line">("default")

function TabsList({ className, variant = "default", children, ...props }: TabsPrimitive.List.Props & { variant?: "default" | "line" }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          variant === "default" && "relative inline-flex h-11 w-fit items-center gap-1 rounded-[12px] border border-[#f2e6d6] bg-white p-1",
          variant === "line" && "relative inline-flex h-10 w-fit items-center gap-2 border-b border-sidebar-border bg-transparent pr-4",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    </TabsVariantContext.Provider>
  )
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "relative z-10 inline-flex h-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap outline-none transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variant === "default" && "rounded-[9px] px-4 text-[13.5px] font-bold text-brand-grey data-[selected]:text-white focus-visible:ring-2 focus-visible:ring-ring/50",
        variant === "line" && "px-1 text-sm font-medium text-muted-foreground data-[selected]:text-foreground data-[selected]:font-semibold hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        variant === "default" && "absolute top-1 bottom-1 z-0 rounded-[9px] bg-gradient-to-br from-brand-orange to-brand-orange-dark transition-all duration-200 ease-out",
        variant === "line" && "absolute bottom-0 z-0 h-0.5 rounded-t-full bg-foreground transition-all duration-200 ease-out",
        className
      )}
      style={{
        left: "var(--active-tab-left)",
        width: "var(--active-tab-width)",
      }}
      {...props}
    />
  )
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("mt-4 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel }
