import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCustomerAssistants } from '@/hooks/use-customer-assistants'
import { Badge } from '@/components/ui/badge'
import { Settings, Wrench, MessageSquare, Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { useTranslation } from '@/lib/translations'

export function AssistantConfig() {
  const { assistants, loading, error, refresh, hasApiKey } = useCustomerAssistants()
  const t = useTranslation()

  if (!hasApiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t.assistant.configuration}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>VAPI API key not configured</p>
            <p className="text-xs mt-2">
              Please configure the VAPI API key in environment variables (VITE_VAPI_API_KEY) or localStorage.
              <br />
              The API key is global for all dashboards.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && assistants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assistant Configuration
          </CardTitle>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-64 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <div className="grid gap-2 md:grid-cols-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
          </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (assistants.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assistant Configuration
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {error ? (
              <>
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
                <p className="text-xs mt-2">Check the browser console for more details</p>
              </>
            ) : (
              <>
                <p>{t.assistant.noConfiguration}</p>
                <p className="text-xs mt-2">{t.assistant.configureAgents}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t.assistant.configuration} ({assistants.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {assistants.map((assistant) => {
          // Handle different possible structures from VAPI API
          const assistantData = assistant as any
          const model = assistant.model || assistantData.model
          
          // Extract tools - check multiple possible locations
          let tools: any[] = []
          if (model?.tools && Array.isArray(model.tools)) {
            tools = model.tools
          } else if (model?.function?.tools && Array.isArray(model.function.tools)) {
            tools = model.function.tools
          } else if (assistantData.tools && Array.isArray(assistantData.tools)) {
            tools = assistantData.tools
          }
          
          // Extract system message - check multiple possible locations
          let systemMessage = 'No system message configured'
          if (model?.systemMessage) {
            systemMessage = model.systemMessage
          } else if (model?.system_message) {
            systemMessage = model.system_message
          } else if (model?.messages && Array.isArray(model.messages)) {
            // Look for system message in messages array
            const systemMsg = model.messages.find((msg: any) => msg.role === 'system')
            if (systemMsg?.content) {
              systemMessage = systemMsg.content
            } else if (model.messages[0]?.content) {
              systemMessage = model.messages[0].content
            }
          } else if (assistantData.systemMessage) {
            systemMessage = assistantData.systemMessage
          }
          
          // Log for debugging
          if (tools.length === 0 && systemMessage === 'No system message configured') {
            console.log('Assistant data structure:', {
              id: assistant.id,
              name: assistant.name,
              hasModel: !!model,
              modelKeys: model ? Object.keys(model) : [],
              fullAssistant: assistant,
            })
          }

          // Extract model info (matching Python: config.get('model', {}).get('model', 'Unknown Model'))
          const modelName = model?.model || (assistantData as any).model?.model || 'Unknown Model'

          return (
            <AssistantCard 
              key={assistant.id}
              assistant={assistant}
              assistantData={assistantData}
              model={model}
              modelName={modelName}
              systemMessage={systemMessage}
              tools={tools}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

// Separate component for each assistant card
function AssistantCard({ 
  assistant, 
  assistantData, 
  model, 
  modelName, 
  systemMessage, 
  tools 
}: {
  assistant: any
  assistantData: any
  model: any
  modelName: string
  systemMessage: string
  tools: any[]
}) {
  const t = useTranslation()
  const [showFullPrompt, setShowFullPrompt] = useState(false)
  const [showTechDetails, setShowTechDetails] = useState(false)
  
  const truncatedPrompt = systemMessage.length > 150 
    ? systemMessage.substring(0, 150) + '...' 
    : systemMessage
  
  // Extract technical details
  const firstMessage = assistantData.firstMessage || model?.firstMessage || 'Not set'
  const voice = assistantData.voice || model?.voice || 'Default'
  const language = assistantData.language || model?.language || 'Auto'
  const temperature = model?.temperature || assistantData.temperature || 'Default'
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">
              {assistant.name || 'Unnamed'}
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">
              {assistant.id.substring(0, 8)}...
            </Badge>
            {modelName && modelName !== 'Unknown Model' && (
              <Badge variant="secondary" className="text-xs">
                {modelName}
                    </Badge>
            )}
                  </div>
                  {assistant.error && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{assistant.error}</span>
                    </div>
                  )}
                </div>
              </div>

      {/* System Prompt - Truncated */}
              <div>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">{t.assistant.systemPrompt}</h4>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {showFullPrompt ? systemMessage : truncatedPrompt}
          </p>
          {systemMessage.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 text-xs"
              onClick={() => setShowFullPrompt(!showFullPrompt)}
            >
              {showFullPrompt ? t.assistant.showLess : t.assistant.showMore}
            </Button>
          )}
                </div>
              </div>

      {/* Tools - Simplified */}
      {tools.length > 0 && (
              <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">{t.assistant.tools} ({tools.length})</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {tools.slice(0, 5).map((tool, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                            {tool.function?.name || tool.type || 'Unknown'}
                          </Badge>
            ))}
            {tools.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{tools.length - 5} more
              </Badge>
                          )}
                        </div>
        </div>
      )}

      {/* Technical Details Widget */}
      <div className="border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between h-8 text-xs"
          onClick={() => setShowTechDetails(!showTechDetails)}
        >
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3" />
            <span>{t.assistant.technicalDetails}</span>
          </div>
          {showTechDetails ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
        
        {showTechDetails && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">{t.assistant.assistantId}:</span>
              <p className="font-mono text-[10px] mt-1 break-all">{assistant.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.assistant.model}:</span>
              <p className="mt-1">{modelName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t.assistant.voice}:</span>
              <p className="mt-1">{typeof voice === 'object' ? voice?.provider || 'Default' : voice}</p>
                      </div>
            <div>
              <span className="text-muted-foreground">{t.assistant.language}:</span>
              <p className="mt-1">{language}</p>
                  </div>
            {firstMessage && firstMessage !== 'Not set' && (
              <div className="col-span-2">
                <span className="text-muted-foreground">{t.assistant.firstMessage}:</span>
                <p className="mt-1 text-muted-foreground line-clamp-2">{firstMessage.substring(0, 100)}...</p>
              </div>
            )}
                </div>
              )}
            </div>
    </div>
  )
}
