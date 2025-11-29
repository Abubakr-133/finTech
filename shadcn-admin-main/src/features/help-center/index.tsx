import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HelpCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

export function HelpCenter() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    toast.success('Your concern has been submitted. We will get back to you soon!')
    setFormData({
      name: '',
      email: '',
      category: '',
      subject: '',
      message: '',
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'>
            <HelpCircle className='h-6 w-6' />
          </div>
          <div className='flex flex-col'>
            <span className='text-2xl font-extrabold tracking-tight text-foreground'>
              Help Center
            </span>
            <span className='text-[10px] font-medium uppercase tracking-widest text-muted-foreground'>
              Support & Feedback
            </span>
          </div>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-6 overflow-y-auto h-full pb-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Contact Support</h1>
            <p className='text-muted-foreground mt-1'>
              Have a concern or complaint? Fill out the form below and we'll get back to you.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submit Your Concern</CardTitle>
              <CardDescription>
                Please provide as much detail as possible so we can assist you better.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Full Name *</Label>
                    <Input
                      id='name'
                      placeholder='John Doe'
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email Address *</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='john.doe@example.com'
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='category'>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                    required
                  >
                    <SelectTrigger id='category'>
                      <SelectValue placeholder='Select a category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='technical'>Technical Issue</SelectItem>
                      <SelectItem value='billing'>Billing & Payment</SelectItem>
                      <SelectItem value='feature'>Feature Request</SelectItem>
                      <SelectItem value='bug'>Bug Report</SelectItem>
                      <SelectItem value='account'>Account Issue</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='subject'>Subject *</Label>
                  <Input
                    id='subject'
                    placeholder='Brief description of your concern'
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='message'>Message *</Label>
                  <Textarea
                    id='message'
                    placeholder='Please describe your concern or complaint in detail...'
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    className='min-h-[150px]'
                    required
                  />
                </div>

                <Button type='submit' className='w-full' size='lg'>
                  <Send className='mr-2 h-4 w-4' />
                  Submit Concern
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4 text-sm'>
                <div>
                  <h3 className='font-semibold mb-1'>How do I compute a route?</h3>
                  <p className='text-muted-foreground'>
                    Go to the Dashboard, fill in the source and destination countries, amount, and your preferences.
                    Click "Compute Routes" to see optimized routing options.
                  </p>
                </div>
                <div>
                  <h3 className='font-semibold mb-1'>What is DTAA?</h3>
                  <p className='text-muted-foreground'>
                    Double Taxation Avoidance Agreement (DTAA) is a treaty between countries to prevent double
                    taxation and reduce withholding tax rates on cross-border transactions.
                  </p>
                </div>
                <div>
                  <h3 className='font-semibold mb-1'>How are routes optimized?</h3>
                  <p className='text-muted-foreground'>
                    Routes are optimized based on your preference weights for cost, speed, and risk. The system
                    evaluates multiple legal paths and selects the one with the best composite score.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

