import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  captionLayout?: "dropdown" | "label"
  fromYear?: number
  toYear?: number
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout,
  fromYear,
  toYear,
  ...props
}: CalendarProps) {
  const initialMonth = props.mode === "single" && props.selected instanceof Date
    ? props.selected
    : new Date()
  const [month, setMonth] = React.useState(initialMonth)

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    const from = fromYear || currentYear
    const to = toYear || currentYear + 10
    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
  }, [fromYear, toYear])

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const handleMonthChange = (newMonth: string) => {
    const newDate = new Date(month)
    newDate.setMonth(parseInt(newMonth))
    setMonth(newDate)
  }

  const handleYearChange = (newYear: string) => {
    const newDate = new Date(month)
    newDate.setFullYear(parseInt(newYear))
    setMonth(newDate)
  }

  const handlePrevMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() - 1)
    setMonth(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() + 1)
    setMonth(newDate)
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Custom navigation header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0"
          )}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {captionLayout === "dropdown" ? (
          <div className="flex items-center gap-1">
            <Select value={month.getMonth().toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 font-medium text-foreground hover:bg-accent focus:ring-0">
                <SelectValue>{monthNames[month.getMonth()]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 font-medium text-foreground hover:bg-accent focus:ring-0">
                <SelectValue>{month.getFullYear()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="text-sm font-medium text-foreground">
            {monthNames[month.getMonth()]} {month.getFullYear()}
          </div>
        )}

        <button
          onClick={handleNextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0"
          )}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <DayPicker
        month={month}
        onMonthChange={setMonth}
        showOutsideDays={showOutsideDays}
        classNames={{
          months: "flex flex-col",
          month: "space-y-2",
          caption: "hidden",
          caption_label: "hidden",
          nav: "hidden",
          nav_button: "hidden",
          nav_button_previous: "hidden",
          nav_button_next: "hidden",
          table: "w-full border-collapse",
          head_row: "flex w-full",
          head_cell:
            "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
          row: "flex w-full mt-1",
          cell: cn(
            "relative h-9 w-9 text-center text-sm p-0 text-foreground",
            "focus-within:relative focus-within:z-20",
            "[&:has([aria-selected])]:bg-accent",
            "[&:has([aria-selected].day-outside)]:bg-accent/50",
            "[&:has([aria-selected].day-range-end)]:rounded-r-md",
            "first:[&:has([aria-selected])]:rounded-l-md",
            "last:[&:has([aria-selected])]:rounded-r-md"
          ),
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
          day_today: "bg-accent text-accent-foreground rounded-md",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
