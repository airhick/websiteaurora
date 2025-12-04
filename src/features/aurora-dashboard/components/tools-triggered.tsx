import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVAPICalls } from '@/hooks/use-vapi-calls'
import { extractToolCalls } from '@/lib/vapi'
import { Badge } from '@/components/ui/badge'
import { Wrench, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ToolsTriggered() {
  const { calls } = useVAPICalls()
  const [selectedTool, setSelectedTool] = useState<{ name: string; arguments: string; callId: string } | null>(null)

  // Extract all tool calls from all calls
  const allToolCalls = calls.flatMap(call => {
    const tools = extractToolCalls(call)
    return tools.map(tool => ({
      ...tool,
      callId: call.id,
      callTime: call.startedAt || call.createdAt,
    }))
  })

  const toolCounts = allToolCalls.reduce((acc, tool) => {
    acc[tool.name] = (acc[tool.name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const uniqueTools = Object.keys(toolCounts).map(name => ({
    name,
    count: toolCounts[name],
    latestCall: allToolCalls.filter(t => t.name === name).sort((a, b) => 
      (b.callTime || '').localeCompare(a.callTime || '')
    )[0],
  })).sort((a, b) => b.count - a.count)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Tools Triggered
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uniqueTools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tools have been triggered yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {uniqueTools.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => {
                    const latest = allToolCalls.find(t => t.name === tool.name && t.callId === tool.latestCall?.callId)
                    if (latest) {
                      setSelectedTool({
                        name: latest.name,
                        arguments: latest.arguments,
                        callId: latest.callId,
                      })
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Triggered {tool.count} time{tool.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Badge variant="secondary">{tool.count}</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tool Details: {selectedTool?.name}</DialogTitle>
            <DialogDescription>
              Call ID: {selectedTool?.callId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2">Arguments:</h4>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {selectedTool?.arguments ? JSON.stringify(JSON.parse(selectedTool.arguments), null, 2) : 'No arguments'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

