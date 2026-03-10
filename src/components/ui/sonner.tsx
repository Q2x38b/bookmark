import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border group-[.toaster]:border-white/5 group-[.toaster]:shadow-md group-[.toaster]:rounded-lg group-[.toaster]:py-3 group-[.toaster]:px-4",
          title: "group-[.toast]:text-[15px] group-[.toast]:font-medium group-[.toast]:text-foreground",
          description: "group-[.toast]:text-[13px] group-[.toast]:text-muted-foreground group-[.toast]:mt-0.5",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:bg-popover",
          error: "group-[.toaster]:bg-popover",
          info: "group-[.toaster]:bg-popover",
        },
      }}
      position="bottom-right"
      {...props}
    />
  )
}

export { Toaster }
