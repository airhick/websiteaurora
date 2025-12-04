import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVAPICalls } from '@/hooks/use-vapi-calls'
import { useVAPIAssistant } from '@/hooks/use-vapi-assistant'
import { Badge } from '@/components/ui/badge'
import { Settings, Wrench, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'

export function AssistantConfig() {
  const { calls } = useVAPICalls()
  const [assistantId, setAssistantId] = useState<string | undefined>()
  const { assistant, loading } = useVAPIAssistant(assistantId)

  // Get assistant ID from the first call
  useEffect(() => {
    if (calls.length > 0 && calls[0].assistantId) {
      setAssistantId(calls[0].assistantId)
    }
  }, [calls])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assistant Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading assistant configuration...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!assistant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assistant Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No assistant configuration found</p>
            <p className="text-xs mt-2">Make sure you have calls with an assistant ID</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tools = assistant.model?.tools || []
  const systemMessage = assistant.model?.systemMessage || 'No system message configured'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Assistant Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {assistant.name && (
          <div>
            <h4 className="font-semibold mb-2">Assistant Name</h4>
            <p className="text-sm">{assistant.name}</p>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            System Prompt
          </h4>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{systemMessage}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Integrated Tools ({tools.length})
          </h4>
          {tools.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tools configured</p>
          ) : (
            <div className="space-y-2">
              {tools.map((tool, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      {tool.function?.name || tool.type || 'Unknown'}
                    </Badge>
                    {tool.type && tool.type !== tool.function?.name && (
                      <span className="text-xs text-muted-foreground">({tool.type})</span>
                    )}
                  </div>
                  {tool.function?.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {tool.function.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
