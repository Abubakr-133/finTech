import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Bot, User, ChevronRight, ChevronLeft, Menu } from 'lucide-react'

interface Message {
    id: number
    text: string
    sender: 'user' | 'bot'
}

const QUERIES = [
    'Why is this route optimal?',
    'Why did you not choose other possible routes?',
    'How do choosing other routes affect overall tradeoffs?',
    'What will be the time constraint of least cost route',
]

export function AIBotPanel({
    isCollapsed,
    toggleCollapse,
}: {
    isCollapsed: boolean
    toggleCollapse: () => void
}) {
    const navigate = useNavigate()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: 'Hello! I can explain the routing logic or answer questions about DTAA treaties. Select a query from the menu to get started.',
            sender: 'bot',
        },
    ])
    const [isTyping, setIsTyping] = useState(false)

    const handleQuery = (query: string) => {
        const userMsg: Message = {
            id: Date.now(),
            text: query,
            sender: 'user',
        }
        setMessages((prev) => [...prev, userMsg])
        setIsTyping(true)

        // Simulate bot response
        setTimeout(() => {
            const botMsg: Message = {
                id: Date.now() + 1,
                text: getBotResponse(query),
                sender: 'bot',
            }
            setMessages((prev) => [...prev, botMsg])
            setIsTyping(false)
        }, 1500)
    }

    if (isCollapsed) {
        return (
            <Card className='flex h-[calc(100vh-8rem)] flex-col w-12 items-center py-4 transition-all duration-300'>
                <Button
                    variant='ghost'
                    size='icon'
                    onClick={toggleCollapse}
                    title='Expand AI Bot'
                >
                    <ChevronLeft className='h-5 w-5' />
                </Button>
                <div className='mt-4 flex flex-col gap-4'>
                    <Bot className='h-6 w-6 text-blue-500' />
                </div>
            </Card>
        )
    }

    return (
        <Card className='flex h-[calc(100vh-8rem)] flex-col transition-all duration-300'>
            <CardHeader className='border-b p-4 flex flex-row items-center justify-between space-y-0'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                    <Bot className='h-5 w-5 text-blue-500' />
                    CapiFlow Agent
                </CardTitle>
                <Button variant='ghost' size='icon' onClick={toggleCollapse}>
                    <ChevronRight className='h-5 w-5' />
                </Button>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col p-0 overflow-hidden'>
                <ScrollArea className='flex-1 p-4 min-h-0'>
                    <div className='space-y-4 pr-4'>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                <div
                                    className={`flex max-w-[80%] items-start gap-2 rounded-lg p-3 text-sm ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-muted text-foreground'
                                        }`}
                                >
                                    {msg.sender === 'bot' && <Bot className='mt-0.5 h-4 w-4 shrink-0' />}
                                    <div className='break-words'>{msg.text}</div>
                                    {msg.sender === 'user' && <User className='mt-0.5 h-4 w-4 shrink-0' />}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className='flex justify-start'>
                                <div className='bg-muted flex max-w-[80%] items-center gap-2 rounded-lg p-3 text-sm text-foreground'>
                                    <Bot className='h-4 w-4' />
                                    <span className='animate-pulse'>Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className='border-t p-4 flex-shrink-0'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className='w-full justify-start' variant='outline' disabled={isTyping}>
                                <Menu className='mr-2 h-4 w-4' />
                                Query Menu
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='w-[300px]' align='start'>
                            {QUERIES.map((query) => (
                                <DropdownMenuItem
                                    key={query}
                                    onClick={() => handleQuery(query)}
                                    className='cursor-pointer'
                                >
                                    {query}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => navigate({ to: '/help-center' })}
                                className='cursor-pointer'
                            >
                                Other
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    )
}

function getBotResponse(input: string): string {
    const lower = input.toLowerCase()
    
    if (lower.includes('why is this route optimal') || lower.includes('optimal')) {
        return 'The IN→SG→US route is optimal because it balances cost (2.1% friction), speed (1.5 days), and risk (3/10). The Singapore DTAA reduces withholding tax from 20% to 10%, saving ₹6.2cr. Combined with efficient FX spreads (0.6% vs 1.2% direct) and faster settlement (T+1.5 vs T+3), this route maximizes net received while maintaining low compliance risk.'
    }
    
    if (lower.includes('why did you not choose other') || lower.includes('not choose')) {
        return 'Other routes were evaluated but didn\'t match your preference weights (Cost 60%, Speed 20%, Risk 20%). The Mauritius route (1.8% friction) is cheaper but slower (2.5d) and higher risk (5/10). The UK route is fastest (1d) but costs more (2.8% friction). The optimal route provides the best composite score (92/100) based on your priorities.'
    }
    
    if (lower.includes('tradeoffs') || lower.includes('affect overall')) {
        return 'Choosing alternative routes involves tradeoffs:\n\n• Cheapest (Mauritius): Saves ₹1.5cr more but adds 1 day and increases risk by 2 points\n• Fastest (UK): Saves 0.5 days but costs ₹4cr more and has higher friction (2.8%)\n• Safest (Germany): Lowest risk (1/10) but highest friction (3.2%) and slower (2d)\n\nThe optimal route minimizes these tradeoffs by providing strong performance across all dimensions.'
    }
    
    if (lower.includes('time constraint') || lower.includes('least cost')) {
        return 'The least cost route (Mauritius via IN→MU→US) has a time constraint of 2.5 days. While it offers the lowest friction (1.8%), it takes 1 day longer than the optimal route. If time is critical, the optimal route provides a better balance at 1.5 days with only 0.3% higher friction, resulting in better overall value given your preference weights.'
    }
    
    return "I'm analyzing the latest regulatory updates for your specific routing scenario. Please verify the compliance documents in the reports section."
}
