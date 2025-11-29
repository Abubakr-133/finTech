import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ComparisonTable() {
    const data = [
        {
            route: 'Optimal',
            net: '₹489.5cr',
            friction: '2.1%',
            vsDirect: '+₹8.5cr',
            time: '1.5d',
            risk: '3/10',
            path: 'IN→SG→US',
            tags: ['Recommended', 'DTAA'],
        },
        {
            route: 'Direct',
            net: '₹481.0cr',
            friction: '3.8%',
            vsDirect: '-',
            time: '3.0d',
            risk: '6/10',
            path: 'IN→US',
            tags: ['Standard'],
        },
        {
            route: 'Via UAE',
            net: '₹486.0cr',
            friction: '2.8%',
            vsDirect: '+₹5.0cr',
            time: '2.0d',
            risk: '5/10',
            path: 'IN→AE→US',
            tags: ['Fast'],
        },
        {
            route: 'Via Mauritius',
            net: '₹487.2cr',
            friction: '1.9%',
            vsDirect: '+₹6.2cr',
            time: '2.5d',
            risk: '5/10',
            path: 'IN→MU→US',
            tags: ['Low Cost'],
        },
    ]

    return (
        <Card className='col-span-1 lg:col-span-4'>
            <CardHeader>
                <CardTitle>Detailed Route Comparison</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Route Strategy</TableHead>
                            <TableHead>Net Received</TableHead>
                            <TableHead>Friction %</TableHead>
                            <TableHead className='text-green-600'>Savings</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Risk Score</TableHead>
                            <TableHead>Path</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.route}>
                                <TableCell className='font-medium'>
                                    <div className='flex flex-col'>
                                        <span>{row.route}</span>
                                        <div className='flex gap-1 mt-1'>
                                            {row.tags.map((tag) => (
                                                <Badge variant='secondary' className='text-[10px] px-1 py-0' key={tag}>
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className='font-bold'>{row.net}</TableCell>
                                <TableCell>{row.friction}</TableCell>
                                <TableCell className='text-green-600 font-medium'>
                                    {row.vsDirect}
                                </TableCell>
                                <TableCell>{row.time}</TableCell>
                                <TableCell>
                                    <div className='flex items-center gap-2'>
                                        <div className='h-2 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden'>
                                            <div
                                                className={`h-full ${parseInt(row.risk) < 4
                                                        ? 'bg-green-500'
                                                        : parseInt(row.risk) < 7
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${parseInt(row.risk) * 10}%` }}
                                            />
                                        </div>
                                        <span className='text-xs text-muted-foreground'>
                                            {row.risk}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className='font-mono text-xs'>{row.path}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
