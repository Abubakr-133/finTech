import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function RouteExplanation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-blue-500' />
            Why this Route Fits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3 text-sm text-muted-foreground'>
            <p>
              The <strong className='text-foreground'>IN→SG→US</strong> route has been selected as optimal based on
              your preference weights (Cost: 60%, Speed: 20%, Risk: 20%).
            </p>
            <div className='space-y-2 pl-4 border-l-2 border-blue-500/30'>
              <p>
                <strong className='text-foreground'>DTAA Benefits:</strong> Singapore's Double Taxation Avoidance
                Agreement with India reduces withholding tax from 20% to 10% on interest payments, saving approximately
                ₹6.2cr on your ₹500cr transfer.
              </p>
              <p>
                <strong className='text-foreground'>FX Efficiency:</strong> Singapore's deep FX market offers tighter
                spreads (0.6% vs 1.2% direct), resulting in additional savings of ₹3cr.
              </p>
              <p>
                <strong className='text-foreground'>Settlement Speed:</strong> T+1.5 settlement via Singapore's
                efficient banking infrastructure vs T+3 direct route, reducing opportunity cost by ₹4cr/day.
              </p>
              <p>
                <strong className='text-foreground'>Risk Profile:</strong> Low compliance risk (3/10) with established
                regulatory framework and strong bank credit ratings across the route.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

