import * as React from "react"
import { format, setMonth, setYear, getYear, getMonth } from "date-fns"
import { fr, type Locale } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Edit3, CalendarDays, ArrowLeft } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerM3BaseProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  locale?: Locale
}

interface DatePickerM3ModalProps extends DatePickerM3BaseProps {
  variant?: "modal"
  trigger?: React.ReactNode
  triggerClassName?: string
}

interface DatePickerM3InlineProps extends DatePickerM3BaseProps {
  variant: "inline"
  className?: string
}

interface DatePickerM3PopoverProps extends DatePickerM3BaseProps {
  variant: "popover"
  trigger?: React.ReactNode
  triggerClassName?: string
  placeholder?: string
}

type DatePickerM3Props = DatePickerM3ModalProps | DatePickerM3InlineProps | DatePickerM3PopoverProps

// Composant de sélection rapide mois/année
const MonthYearSelector = ({
  date,
  onChange,
  onBack,
  minDate,
  maxDate,
  locale = fr,
}: {
  date: Date
  onChange: (date: Date) => void
  onBack: () => void
  minDate?: Date
  maxDate?: Date
  locale?: Locale
}) => {
  const [mode, setMode] = React.useState<'month' | 'year'>('month')
  const currentYear = getYear(date)
  const currentMonth = getMonth(date)
  
  // Générer une plage d'années (50 ans avant et après l'année actuelle)
  const currentYearNow = new Date().getFullYear()
  const startYear = minDate ? getYear(minDate) : currentYearNow - 50
  const endYear = maxDate ? getYear(maxDate) : currentYearNow + 50
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(setMonth(new Date(), i), 'MMMM', { locale })
  }))

  // Vue de sélection d'année
  if (mode === 'year') {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('month')}
            className="h-8 px-2 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium flex-1 text-center">
            Sélectionner l'année
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-2">
          {years.map((year) => (
            <Button
              key={year}
              variant={year === currentYear ? "default" : "outline"}
              className={cn(
                "h-11 rounded-xl font-medium transition-all text-sm",
                year === currentYear && "ring-2 ring-primary/30"
              )}
              onClick={() => {
                onChange(setYear(date, year))
                setMode('month')
              }}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // Vue de sélection de mois
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode('year')}
          className="h-8 px-3 rounded-full font-medium flex-1"
        >
          {currentYear}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month) => (
          <Button
            key={month.value}
            variant={month.value === currentMonth ? "default" : "outline"}
            className={cn(
              "h-11 rounded-xl font-medium transition-all capitalize text-sm",
              month.value === currentMonth && "ring-2 ring-primary/30"
            )}
            onClick={() => {
              onChange(setMonth(date, month.value))
              onBack()
            }}
          >
            {month.label.substring(0, 4)}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Composant de saisie manuelle de date
const DateInputManual = ({
  value,
  onChange,
  onClose,
}: {
  value?: Date
  onChange: (date: Date | undefined) => void
  onClose: () => void
}) => {
  const [inputValue, setInputValue] = React.useState(
    value ? format(value, 'dd/MM/yyyy') : ''
  )
  const [error, setError] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const formatInput = (numbers: string) => {
    // Formater avec les slashes automatiquement
    let formatted = ''
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2) // JJ
      if (numbers.length >= 3) {
        formatted += '/' + numbers.substring(2, 4) // MM
      }
      if (numbers.length >= 5) {
        formatted += '/' + numbers.substring(4, 8) // AAAA
      }
    }
    return formatted
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Extraire uniquement les chiffres
    const numbers = val.replace(/\D/g, '')
    
    // Limiter à 8 chiffres (JJMMAAAA)
    if (numbers.length <= 8) {
      const formatted = formatInput(numbers)
      setInputValue(formatted)
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permettre la navigation et suppression
    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      return
    }
    
    // Permettre uniquement les chiffres
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }

    // Enter pour valider
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const parseDate = (input: string): Date | null => {
    // Extraire uniquement les chiffres
    const numbers = input.replace(/\D/g, '')
    
    if (numbers.length !== 8) {
      return null
    }

    // Parser: JJMMAAAA
    const dayStr = numbers.substring(0, 2)
    const monthStr = numbers.substring(2, 4)
    const yearStr = numbers.substring(4, 8)
    
    const day = parseInt(dayStr, 10)
    const month = parseInt(monthStr, 10)
    const year = parseInt(yearStr, 10)

    // Validation des plages
    if (day < 1 || day > 31) return null
    if (month < 1 || month > 12) return null
    if (year < 1900 || year > 2100) return null

    try {
      // Créer la date (mois - 1 car JavaScript compte de 0 à 11)
      const date = new Date(year, month - 1, day)
      
      // Vérifier que la date créée correspond bien aux valeurs attendues
      // (pour éviter des dates comme 31/02 qui deviennent 03/03)
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return null
      }

      return date
    } catch {
      return null
    }
  }

  const handleSubmit = () => {
    setError('')
    
    if (!inputValue || inputValue.length < 10) {
      setError('Format: JJ/MM/AAAA (ex: 12/11/2025)')
      inputRef.current?.focus()
      return
    }

    const date = parseDate(inputValue)
    
    if (!date) {
      setError('Date invalide')
      inputRef.current?.select()
      return
    }

    onChange(date)
    onClose()
  }

  const handleCancel = () => {
    setError('')
    onClose()
  }

  React.useEffect(() => {
    // Focus et sélectionner tout le texte
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="space-y-3">
        <label className="text-sm font-medium text-muted-foreground block">
          Saisir la date
        </label>
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder="JJ/MM/AAAA"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="h-12 sm:h-14 text-center text-base sm:text-lg font-medium tracking-wider"
          maxLength={10}
        />
        <p className="text-xs text-muted-foreground text-center">
          Tapez 8 chiffres (ex: 12112025 → 12/11/2025)
        </p>
        {error && (
          <p className="text-sm text-danger text-center px-1">{error}</p>
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="rounded-full w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          className="rounded-full w-full sm:w-auto"
        >
          OK
        </Button>
      </div>
    </div>
  )
}

// Composant calendrier Material 3 stylisé avec swipe
const CalendarM3 = React.forwardRef<HTMLDivElement, {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  locale?: Locale
  className?: string
  month: Date
  onMonthChange: (date: Date) => void
}>(({ selected, onSelect, disabled, minDate, maxDate, locale = fr, className, month, onMonthChange }, ref) => {
  const [touchStart, setTouchStart] = React.useState<number | null>(null)
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null)
  const [showMonthYearSelector, setShowMonthYearSelector] = React.useState(false)

  // Minimum swipe distance (en pixels)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      // Swipe vers la gauche = mois suivant
      const nextMonth = new Date(month)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      onMonthChange(nextMonth)
    }
    
    if (isRightSwipe) {
      // Swipe vers la droite = mois précédent
      const prevMonth = new Date(month)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      onMonthChange(prevMonth)
    }
  }

  const handlePreviousMonth = () => {
    const prevMonth = new Date(month)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    onMonthChange(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(month)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    onMonthChange(nextMonth)
  }

  const handleToday = () => {
    const today = new Date()
    onMonthChange(today)
    onSelect?.(today)
  }

  // Séparer la sélection du mois et de l'année
  const handleMonthClick = () => {
    setShowMonthYearSelector(true)
  }

  return (
    <div ref={ref} className={cn("date-picker-m3", className)}>
      {showMonthYearSelector ? (
        <MonthYearSelector
          date={month}
          onChange={(newDate) => {
            onMonthChange(newDate)
          }}
          onBack={() => setShowMonthYearSelector(false)}
          minDate={minDate}
          maxDate={maxDate}
          locale={locale}
        />
      ) : (
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex justify-between items-center px-3 pt-3 pb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-9 w-9 rounded-full hover:bg-accent/50 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 flex-1 justify-center">
              <Button
                variant="ghost"
                onClick={handleMonthClick}
                className="text-sm font-medium hover:bg-accent/50 rounded-full px-3 h-8 capitalize"
              >
                {format(month, 'MMMM', { locale })}
              </Button>
              <Button
                variant="ghost"
                onClick={handleMonthClick}
                className="text-sm font-medium hover:bg-accent/50 rounded-full px-3 h-8"
              >
                {format(month, 'yyyy', { locale })}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-9 w-9 rounded-full hover:bg-accent/50 flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <DayPicker
            mode="single"
            selected={selected}
            onSelect={onSelect}
            month={month}
            onMonthChange={onMonthChange}
            disabled={disabled}
            fromDate={minDate}
            toDate={maxDate}
            locale={locale}
            className="p-0"
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "hidden", // On utilise notre propre header
              caption_label: "hidden",
              nav: "hidden",
              nav_button: "hidden",
              nav_button_previous: "hidden",
              nav_button_next: "hidden",
              table: "w-full border-collapse px-3 pb-2",
              head_row: "flex w-full mb-1",
              head_cell: "text-muted-foreground flex-1 text-center font-medium text-xs uppercase",
              row: "flex w-full mt-1",
              cell: cn(
                "relative p-0 text-center focus-within:relative focus-within:z-20 flex-1"
              ),
              day: cn(
                "h-10 w-10 p-0 font-normal rounded-full mx-auto",
                "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              ),
              day_selected: cn(
                "bg-primary text-primary-foreground font-semibold",
                "hover:bg-primary hover:text-primary-foreground",
                "focus:bg-primary focus:text-primary-foreground"
              ),
              day_today: cn(
                "border-2 border-primary font-medium",
                "aria-selected:border-primary"
              ),
              day_outside: "text-muted-foreground/40 opacity-50",
              day_disabled: "text-muted-foreground/30 opacity-40 hover:bg-transparent cursor-not-allowed",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
              day_hidden: "invisible",
            }}
            showOutsideDays={false}
          />

          {/* Bouton Aujourd'hui */}
          <div className="px-3 pb-3 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="w-full rounded-full h-9 text-primary hover:bg-primary/10"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Aujourd'hui
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})
CalendarM3.displayName = "CalendarM3"

/**
 * Date Picker Material 3
 * 
 * Composant de sélection de date suivant les Material Design 3 guidelines
 * https://m3.material.io/components/date-pickers/guidelines
 * 
 * @example
 * // Modal (par défaut)
 * <DatePickerM3 value={date} onChange={setDate} />
 * 
 * @example
 * // Inline
 * <DatePickerM3 variant="inline" value={date} onChange={setDate} />
 * 
 * @example
 * // Popover avec trigger personnalisé
 * <DatePickerM3 
 *   variant="popover" 
 *   value={date} 
 *   onChange={setDate}
 *   placeholder="Sélectionner une date"
 * />
 */
export function DatePickerM3(props: DatePickerM3Props) {
  const {
    value,
    onChange,
    disabled,
    minDate,
    maxDate,
    locale = fr,
  } = props

  const [month, setMonth] = React.useState<Date>(value || new Date())
  const [inputMode, setInputMode] = React.useState(false)

  // Variant inline
  if (props.variant === "inline") {
    return (
      <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", props.className)}>
        <CalendarM3
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          locale={locale}
          month={month}
          onMonthChange={setMonth}
        />
      </div>
    )
  }

  // Variant popover
  if (props.variant === "popover") {
    const [open, setOpen] = React.useState(false)

    return (
      <Popover open={open} onOpenChange={(newOpen) => {
        // Empêcher la fermeture automatique - on ne peut fermer que via les boutons
        if (!newOpen) return
        setOpen(newOpen)
      }}>
        <PopoverTrigger asChild>
          {props.trigger || (
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-11 px-4",
                !value && "text-muted-foreground",
                props.triggerClassName
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "dd MMMM yyyy", { locale }) : (
                <span>{props.placeholder || "Sélectionner une date"}</span>
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 rounded-xl border-2" 
          align="start"
          sideOffset={8}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex justify-between items-center px-3 py-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 rounded-full text-muted-foreground"
            >
              Annuler
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInputMode(!inputMode)}
              className="h-8 rounded-full"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              {inputMode ? "Calendrier" : "Saisie"}
            </Button>
          </div>
          {inputMode ? (
            <DateInputManual
              value={value}
              onChange={(date) => {
                onChange?.(date)
                if (date) setOpen(false)
              }}
              onClose={() => setOpen(false)}
            />
          ) : (
            <CalendarM3
              selected={value}
              onSelect={(date) => {
                onChange?.(date)
                if (date) setOpen(false)
              }}
              disabled={disabled}
              minDate={minDate}
              maxDate={maxDate}
              locale={locale}
              month={month}
              onMonthChange={setMonth}
            />
          )}
        </PopoverContent>
      </Popover>
    )
  }

  // Variant modal (par défaut)
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {props.trigger ? (
        <div onClick={() => !disabled && setOpen(true)}>
          {props.trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-11 px-4",
            !value && "text-muted-foreground",
            props.triggerClassName
          )}
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd MMMM yyyy", { locale }) : (
            <span>Sélectionner une date</span>
          )}
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={(newOpen) => {
        // Empêcher la fermeture automatique - on ne peut fermer que via les boutons
        if (!newOpen) return
        setOpen(newOpen)
      }}>
        <DialogContent 
          className="sm:max-w-[400px] rounded-3xl p-0 gap-0 overflow-hidden"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 pt-6 pb-2 space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-normal">
                {inputMode ? "Saisir une date" : "Sélectionner une date"}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInputMode(!inputMode)}
                className="h-9 w-9 rounded-full"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              {inputMode ? "Entrez une date au format jour/mois/année" : "Choisissez une date dans le calendrier"}
            </DialogDescription>
            {value && !inputMode && (
              <p className="text-sm text-muted-foreground">
                {format(value, "EEEE d MMMM yyyy", { locale })}
              </p>
            )}
          </DialogHeader>
          <div className="px-2 pb-2">
            {inputMode ? (
              <DateInputManual
                value={value}
                onChange={(date) => {
                  onChange?.(date)
                }}
                onClose={() => {
                  setOpen(false)
                  setInputMode(false)
                }}
              />
            ) : (
              <CalendarM3
                selected={value}
                onSelect={(date) => {
                  onChange?.(date)
                }}
                disabled={disabled}
                minDate={minDate}
                maxDate={maxDate}
                locale={locale}
                month={month}
                onMonthChange={setMonth}
              />
            )}
          </div>
          {!inputMode && (
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (value) setOpen(false)
                }}
                disabled={!value}
                className="rounded-full"
              >
                OK
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
