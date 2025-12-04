import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Headphones, Calendar, MessageCircle, UserPlus, FileText } from 'lucide-react'

const capabilities = [
  {
    icon: Headphones,
    title: '24/7 Call Answering',
    description: 'Never miss a call, day or night',
    color: 'text-blue-500',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Automatically book appointments',
    color: 'text-purple-500',
  },
  {
    icon: MessageCircle,
    title: 'FAQ Handling',
    description: 'Answer common questions instantly',
    color: 'text-green-500',
  },
  {
    icon: UserPlus,
    title: 'Call Transfer',
    description: 'Seamlessly transfer to humans when needed',
    color: 'text-yellow-500',
  },
  {
    icon: FileText,
    title: 'Detailed Summaries',
    description: 'Get comprehensive call reports',
    color: 'text-gray-500',
  },
]

export function AICapabilities() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>✨ Aurora's Capabilities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {capabilities.map((capability, index) => {
          const Icon = capability.icon
          return (
            <div key={index} className="flex items-start space-x-4">
              <div className={`rounded-full p-2 bg-muted ${capability.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {capability.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {capability.description}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

