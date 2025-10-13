import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type AdvancedCalendarProps = DayPickerProps

function AdvancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: AdvancedCalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.selected as Date || new Date())
  
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i)
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth)
  }

  return (
    <div className={cn("p-3 pointer-events-auto", className)}>
      {/* Custom header with year and month selectors */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            const newMonth = new Date(month)
            newMonth.setMonth(month.getMonth() - 1)
            handleMonthChange(newMonth)
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <Select
            value={months[month.getMonth()]}
            onValueChange={(value) => {
              const newMonth = new Date(month)
              newMonth.setMonth(months.indexOf(value))
              handleMonthChange(newMonth)
            }}
          >
            <SelectTrigger className="h-8 w-[110px] bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={month.getFullYear().toString()}
            onValueChange={(value) => {
              const newMonth = new Date(month)
              newMonth.setFullYear(parseInt(value))
              handleMonthChange(newMonth)
            }}
          >
            <SelectTrigger className="h-8 w-[90px] bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => {
            const newMonth = new Date(month)
            newMonth.setMonth(month.getMonth() + 1)
            handleMonthChange(newMonth)
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <DayPicker
        month={month}
        onMonthChange={handleMonthChange}
        showOutsideDays={showOutsideDays}
        className={cn("pointer-events-auto", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "hidden", // Hide default caption since we have custom one
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
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
AdvancedCalendar.displayName = "AdvancedCalendar"

export { AdvancedCalendar }
