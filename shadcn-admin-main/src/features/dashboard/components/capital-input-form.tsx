import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'

const countries = [
  { value: 'US', label: 'United States', currency: 'USD', flag: '🇺🇸' },
  { value: 'CN', label: 'China', currency: 'CNY', flag: '🇨🇳' },
  { value: 'JP', label: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { value: 'DE', label: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { value: 'IN', label: 'India', currency: 'INR', flag: '🇮🇳' },
  { value: 'UK', label: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { value: 'FR', label: 'France', currency: 'EUR', flag: '🇫🇷' },
  { value: 'IT', label: 'Italy', currency: 'EUR', flag: '🇮🇹' },
  { value: 'BR', label: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  { value: 'CA', label: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { value: 'RU', label: 'Russia', currency: 'RUB', flag: '🇷🇺' },
  { value: 'KR', label: 'South Korea', currency: 'KRW', flag: '🇰🇷' },
  { value: 'AU', label: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { value: 'MX', label: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  { value: 'ES', label: 'Spain', currency: 'EUR', flag: '🇪🇸' },
  { value: 'ID', label: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
  { value: 'SA', label: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  { value: 'TR', label: 'Turkey', currency: 'TRY', flag: '🇹🇷' },
  { value: 'NL', label: 'Netherlands', currency: 'EUR', flag: '🇳🇱' },
  { value: 'CH', label: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },
  { value: 'PL', label: 'Poland', currency: 'PLN', flag: '🇵🇱' },
  { value: 'SE', label: 'Sweden', currency: 'SEK', flag: '🇸🇪' },
  { value: 'BE', label: 'Belgium', currency: 'EUR', flag: '🇧🇪' },
  { value: 'TH', label: 'Thailand', currency: 'THB', flag: '🇹🇭' },
  { value: 'IE', label: 'Ireland', currency: 'EUR', flag: '🇮🇪' },
  { value: 'AT', label: 'Austria', currency: 'EUR', flag: '🇦🇹' },
  { value: 'NG', label: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { value: 'IL', label: 'Israel', currency: 'ILS', flag: '🇮🇱' },
  { value: 'SG', label: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { value: 'AE', label: 'UAE', currency: 'AED', flag: '🇦🇪' },
]

const currencies = Array.from(new Set(countries.map((c) => c.currency))).map(
  (curr) => ({ value: curr, label: curr })
)

export function CapitalInputForm({ onCompute }: { onCompute: (params: any) => void }) {
  const [amount, setAmount] = useState<number>(500)
  const [currency, setCurrency] = useState('INR')
  const [currencyOpen, setCurrencyOpen] = useState(false)

  const [costWeight, setCostWeight] = useState(3)
  const [speedWeight, setSpeedWeight] = useState(1)
  const [riskWeight, setRiskWeight] = useState(1)
  const [isComputing, setIsComputing] = useState(false)

  const [sourceOpen, setSourceOpen] = useState(false)
  const [sourceValue, setSourceValue] = useState('IN')
  const [destOpen, setDestOpen] = useState(false)
  const [destValue, setDestValue] = useState('US')

  const handleCompute = () => {
    setIsComputing(true)
    setTimeout(() => {
      setIsComputing(false)
      onCompute({
        source: sourceValue,
        destination: destValue,
        amount,
        currency,
        costWeight,
        speedWeight,
        riskWeight,
      })
    }, 2000)
  }

  const WeightSlider = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (val: number) => void
  }) => {
    const percentage = ((value - 1) / 4) * 100

    return (
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>{label} Priority</span>
          <span className='text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md'>
            {value}/5
          </span>
        </div>
        <div className='relative'>
          {/* Visual track with filled portion */}
          <div className='h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative'>
            <div
              className='h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-200 ease-out'
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Native range input with enhanced touch target */}
          <input
            type='range'
            min='1'
            max='5'
            step='1'
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className='absolute inset-0 w-full h-6 cursor-pointer opacity-0 z-10 -top-1.5'
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
              background: 'transparent',
            }}
          />
          {/* Custom styled thumb overlay */}
          <div
            className='absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 rounded-full shadow-lg border-2 border-white dark:border-gray-800 transition-all duration-200 ease-out pointer-events-none z-0'
            style={{
              left: `calc(${percentage}% - 10px)`,
            }}
          />
        </div>
        <div className='flex justify-between text-[10px] text-muted-foreground px-1'>
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    )
  }

  const SearchableCombobox = ({
    items,
    value,
    setValue,
    open,
    setOpen,
    label,
    placeholder,
    width = 'w-full',
  }: {
    items: { value: string; label: string; flag?: string }[]
    value: string
    setValue: (val: string) => void
    open: boolean
    setOpen: (val: boolean) => void
    label?: string
    placeholder: string
    width?: string
  }) => (
    <div className={cn('space-y-2', width === 'w-full' ? 'w-full' : '')}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className={cn('justify-between font-normal', width)}
          >
            {value ? (
              <span className='flex items-center gap-2 truncate'>
                {items.find((item) => item.value === value)?.flag}
                <span>{items.find((item) => item.value === value)?.label}</span>
                <span className='text-muted-foreground text-xs'>
                  ({items.find((item) => item.value === value)?.value})
                </span>
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0'>
          <Command>
            <CommandInput placeholder={`Search...`} />
            <CommandList>
              <CommandEmpty>No result found.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={(currentValue) => {
                      const selected = items.find(
                        (i) => i.label.toLowerCase() === currentValue.toLowerCase()
                      )
                      setValue(selected ? selected.value : '')
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === item.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {item.flag && <span className='mr-2'>{item.flag}</span>}
                    <span>{item.label}</span>
                    <span className='ml-auto text-xs text-muted-foreground'>
                      {item.value}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )

  return (
    <Card className='w-full shadow-md border-t-4 border-t-blue-600'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold'>Capital Routing Parameters</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <SearchableCombobox
            label='Source Country'
            items={countries}
            value={sourceValue}
            setValue={setSourceValue}
            open={sourceOpen}
            setOpen={setSourceOpen}
            placeholder='Select source...'
          />
          <SearchableCombobox
            label='Destination Country'
            items={countries}
            value={destValue}
            setValue={setDestValue}
            open={destOpen}
            setOpen={setDestOpen}
            placeholder='Select destination...'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Amount</Label>
            <div className='flex gap-2'>
              <Input
                type='number'
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className='flex-1'
              />
              <SearchableCombobox
                items={currencies}
                value={currency}
                setValue={setCurrency}
                open={currencyOpen}
                setOpen={setCurrencyOpen}
                placeholder='Curr'
                width='w-[120px]'
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label>Purpose</Label>
            <Select defaultValue='loan'>
              <SelectTrigger>
                <SelectValue placeholder='Select purpose' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='loan'>Inter-company Loan</SelectItem>
                <SelectItem value='investment'>FDI Investment</SelectItem>
                <SelectItem value='dividend'>Dividend Payout</SelectItem>
                <SelectItem value='royalty'>Royalty Payment</SelectItem>
                <SelectItem value='equity'>Equity Injection</SelectItem>
                <SelectItem value='debt'>Debt Service</SelectItem>
                <SelectItem value='trade'>Trade Settlement</SelectItem>
                <SelectItem value='ip'>IP Licensing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50'>
          <Label className='text-base font-semibold'>Optimization Weights</Label>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <WeightSlider
              label='Cost'
              value={costWeight}
              onChange={setCostWeight}
            />
            <WeightSlider
              label='Speed'
              value={speedWeight}
              onChange={setSpeedWeight}
            />
            <WeightSlider
              label='Risk'
              value={riskWeight}
              onChange={setRiskWeight}
            />
          </div>
        </div>

        <Button
          size='lg'
          className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold text-lg shadow-lg'
          onClick={handleCompute}
          disabled={isComputing}
        >
          {isComputing ? 'Computing Best Routes...' : 'Compute Routes'}
        </Button>
      </CardContent>
    </Card>
  )
}
