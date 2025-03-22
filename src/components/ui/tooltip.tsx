import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from 'src/lib/utils'

const Tooltip = ({
  children,
  content,
  sideOffset = 5,
  className,
}: {
  children: React.ReactNode
  content: React.ReactNode
  sideOffset?: number
  className?: string
}) => {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          sideOffset={sideOffset}
          className={cn(
            'z-50 rounded-md bg-white px-3 py-2 text-sm text-gray-700 shadow-md',
            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-white" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export default Tooltip
