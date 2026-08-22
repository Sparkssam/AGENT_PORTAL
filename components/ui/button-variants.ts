import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-fg)] disabled:opacity-100 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/85 hover:shadow-md active:scale-[0.98]",
        outline:
          "rounded-full border-border bg-background shadow-sm hover:bg-muted hover:text-foreground hover:shadow-md aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "rounded-full bg-secondary text-secondary-foreground shadow-sm hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] hover:shadow-md aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "rounded-full hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground disabled:bg-transparent dark:hover:bg-muted/50",
        destructive:
          "rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        pill: "rounded-full bg-primary text-primary-foreground px-4 shadow-sm hover:bg-primary/85 hover:shadow-md active:scale-[0.98]",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        icon: "size-9 rounded-full",
        "icon-xs":
          "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
