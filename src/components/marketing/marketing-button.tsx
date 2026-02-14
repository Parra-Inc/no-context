import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const marketingButtonVariants = cva(
  "inline-flex items-center justify-center cursor-pointer rounded-xl font-bold border-2 border-[#1A1A1A] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-[#7C3AED] text-white",
        secondary: "bg-white text-[#1A1A1A]",
        ghost:
          "bg-transparent border-transparent shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-gray-100 text-[#4A4A4A]",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs shadow-[3px_3px_0px_0px_#1A1A1A] hover:shadow-[1px_1px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px]",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface MarketingButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof marketingButtonVariants> {}

const MarketingButton = forwardRef<HTMLButtonElement, MarketingButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(marketingButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
MarketingButton.displayName = "MarketingButton";

export { MarketingButton, marketingButtonVariants };
