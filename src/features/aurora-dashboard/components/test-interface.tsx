import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, MessageCircle, UserPlus } from 'lucide-react'

const testScenarios = [
  {
    icon: Calendar,
    title: '📅 Schedule Appointment',
    description: 'Test booking functionality',
    color: 'text-blue-500',
  },
  {
    icon: MessageCircle,
    title: '❓ Ask Questions',
    description: 'Test FAQ responses',
    color: 'text-green-500',
  },
  {
    icon: UserPlus,
    title: '🔄 Transfer Call',
    description: 'Test human handoff',
    color: 'text-yellow-500',
  },
]

export function TestInterface() {
  const [isTesting, setIsTesting] = useState(false)
  const [callStatus, setCallStatus] = useState('')
  const [testNumber, setTestNumber] = useState('')

  const startTest = () => {
    setIsTesting(true)
    setCallStatus('Initiating call...')

    setTimeout(() => {
      setCallStatus('✅ Connected! Aurora is handling the call...')
    }, 2000)

    setTimeout(() => {
      setCallStatus('📞 Call completed successfully. Summary sent to your email.')
      setIsTesting(false)
    }, 8000)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>🧪 Test AI Receptionist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testNumber">Phone Number (Optional)</Label>
          <Input
            id="testNumber"
            type="tel"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank for a simulated demo call
          </p>
        </div>

        <Button
          onClick={startTest}
          disabled={isTesting}
          className="w-full"
          size="lg"
        >
          {isTesting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Testing in Progress...
            </>
          ) : (
            '🚀 Start Test Call'
          )}
        </Button>

        {callStatus && (
          <Alert>
            <AlertDescription className="flex items-center">
              {isTesting && (
                <span className="mr-2 h-3 w-3 animate-pulse rounded-full bg-green-500" />
              )}
              {callStatus}
            </AlertDescription>
          </Alert>
        )}

        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium">Quick Test Scenarios:</h3>
          <div className="space-y-2">
            {testScenarios.map((scenario, index) => {
              const Icon = scenario.icon
              return (
                <button
                  key={index}
                  className="flex w-full items-center space-x-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                  onClick={startTest}
                  disabled={isTesting}
                >
                  <Icon className={`h-5 w-5 ${scenario.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{scenario.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {scenario.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

