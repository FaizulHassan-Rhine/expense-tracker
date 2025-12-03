import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function MonthPicker({ value, onChange, placeholder = "Select month", className, disabled }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = React.useState(currentYear)
  
  // Parse value (format: "YYYY-MM")
  const parsedValue = value ? {
    year: parseInt(value.split("-")[0]),
    month: parseInt(value.split("-")[1]) - 1
  } : null

  const handleMonthSelect = (monthIndex) => {
    const yearMonth = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`
    onChange(yearMonth)
    setIsOpen(false)
  }

  const displayValue = parsedValue 
    ? `${MONTHS[parsedValue.month]} ${parsedValue.year}`
    : placeholder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {/* Year selector */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold">{selectedYear}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => {
              const isSelected = parsedValue && 
                parsedValue.year === selectedYear && 
                parsedValue.month === index
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-12",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleMonthSelect(index)}
                >
                  {month.slice(0, 3)}
                </Button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

