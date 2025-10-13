import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type ViewMode = 'days' | 'months' | 'years'

interface ModernDatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
}

export function ModernDatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date",
  disabled 
}: ModernDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>('days')
  const [viewDate, setViewDate] = React.useState<Date>(value || new Date())

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const monthsFull = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  // Generate years range (current year ± 50 years)
  const currentYear = new Date().getFullYear()
  const yearsStart = Math.floor(viewDate.getFullYear() / 12) * 12
  const years = Array.from({ length: 12 }, (_, i) => yearsStart + i)
  
  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(viewDate)

  const handlePrevious = () => {
    const newDate = new Date(viewDate)
    if (viewMode === 'days') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'months') {
      newDate.setFullYear(newDate.getFullYear() - 1)
    } else {
      newDate.setFullYear(newDate.getFullYear() - 12)
    }
    setViewDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(viewDate)
    if (viewMode === 'days') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'months') {
      newDate.setFullYear(newDate.getFullYear() + 1)
    } else {
      newDate.setFullYear(newDate.getFullYear() + 12)
    }
    setViewDate(newDate)
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewDate)
    newDate.setMonth(monthIndex)
    setViewDate(newDate)
    setViewMode('days')
  }

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate)
    newDate.setFullYear(year)
    setViewDate(newDate)
    setViewMode('months')
  }

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    if (disabled && disabled(newDate)) return
    onChange?.(newDate)
    setOpen(false)
  }

  const renderHeader = () => {
    let headerText = ''
    let onHeaderClick = () => {}

    if (viewMode === 'days') {
      headerText = `${monthsFull[viewDate.getMonth()]} ${viewDate.getFullYear()}`
      onHeaderClick = () => setViewMode('months')
    } else if (viewMode === 'months') {
      headerText = `${viewDate.getFullYear()} - Mois`
      onHeaderClick = () => setViewMode('years')
    } else {
      headerText = `${years[0]} - ${years[years.length - 1]}`
      onHeaderClick = () => {}
    }

    return (
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevious}
          className="h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onHeaderClick}
          className={cn(
            "text-sm font-medium px-3 py-1.5 rounded hover:bg-accent transition-colors",
            viewMode !== 'years' && "cursor-pointer"
          )}
        >
          {headerText}
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    // Week day headers
    const headers = weekDays.map((day, i) => (
      <div key={i} className="h-9 w-9 text-center text-sm font-normal text-muted-foreground flex items-center justify-center">
        {day}
      </div>
    ))

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />)
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
      const isSelected = value && 
        value.getDate() === day && 
        value.getMonth() === viewDate.getMonth() && 
        value.getFullYear() === viewDate.getFullYear()
      const isToday = new Date().toDateString() === date.toDateString()
      const isDisabled = disabled && disabled(date)

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDaySelect(day)}
          disabled={isDisabled}
          className={cn(
            "h-9 w-9 p-0 font-normal rounded hover:bg-accent hover:text-accent-foreground transition-colors",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            isToday && !isSelected && "bg-accent",
            isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          {day}
        </button>
      )
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {headers}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    )
  }

  const renderMonths = () => {
    return (
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => (
          <button
            key={month}
            type="button"
            onClick={() => handleMonthSelect(index)}
            className={cn(
              "h-12 px-3 py-2 rounded font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
              value && 
              value.getMonth() === index && 
              value.getFullYear() === viewDate.getFullYear() &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {month}
          </button>
        ))}
      </div>
    )
  }

  const renderYears = () => {
    return (
      <div className="grid grid-cols-4 gap-2">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => handleYearSelect(year)}
            className={cn(
              "h-12 px-3 py-2 rounded font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
              value && value.getFullYear() === year &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {year}
          </button>
        ))}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-surface",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP", { locale: fr }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 pointer-events-auto" align="start">
        <div className="space-y-4">
          {renderHeader()}
          {viewMode === 'days' && renderDays()}
          {viewMode === 'months' && renderMonths()}
          {viewMode === 'years' && renderYears()}
        </div>
      </PopoverContent>
    </Popover>
  )
}
