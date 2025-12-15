import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCallLogs } from '@/hooks/use-call-logs'
import { Badge } from '@/components/ui/badge'
import { Phone, RefreshCw, Play, Pause, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export function CallLogs() {
  const { callLogs, loading, syncing, error, sync } = useCallLogs()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const handlePlay = (recordingUrl: string, callId: string) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingId === callId) {
      // If clicking the same call, stop it
      setPlayingId(null)
      return
    }

    // Create new audio element
    const audio = new Audio(recordingUrl)
    audioRef.current = audio
    setPlayingId(callId)

    audio.play().catch((error) => {
      console.error('Error playing audio:', error)
      toast.error('Failed to play recording')
      setPlayingId(null)
    })

    audio.onended = () => {
      setPlayingId(null)
      audioRef.current = null
    }

    audio.onerror = () => {
      console.error('Audio playback error')
      toast.error('Failed to load recording')
      setPlayingId(null)
      audioRef.current = null
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleSync = async () => {
    await sync()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && callLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Loading call logs...</p>
          </div>
        ) : error && error.includes('call_logs table does not exist') ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="mt-4 text-lg font-medium">Database Setup Required</h3>
            <p className="mb-4 text-sm text-muted-foreground max-w-md">
              The call logs table needs to be created in your Supabase database. 
              Please run the SQL script <code className="bg-muted px-2 py-1 rounded text-xs">supabase-call-logs-schema.sql</code> in your Supabase SQL Editor.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Once the table is created, call logs will be automatically synced from VAPI.
            </p>
          </div>
        ) : callLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="mt-4 text-lg font-medium">No call logs yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Call logs will appear here after your first call
            </p>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {callLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={log.status === 'ended' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                        {log.type && (
                          <Badge variant="outline" className="text-xs">
                            {log.type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatDateTime(log.started_at || log.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(log.started_at || log.created_at)}
                      </p>
                    </div>
                    {log.recording_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handlePlay(log.recording_url!, `call-${log.id}`)}
                      >
                        {playingId === `call-${log.id}` ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {log.summary && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Summary:</p>
                      <p className="text-muted-foreground line-clamp-2">{log.summary}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {log.duration && (
                      <span>Duration: {formatDuration(log.duration)}</span>
                    )}
                    {log.cost && (
                      <span>Cost: ${parseFloat(log.cost.toString()).toFixed(4)}</span>
                    )}
                    {log.customer_number && (
                      <span>From: {log.customer_number}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

