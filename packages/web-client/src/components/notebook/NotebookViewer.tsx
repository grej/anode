import React, { useCallback } from 'react'
import { useStore } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables, events } from '@anode/schema'
import { Cell } from './Cell.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Terminal, Circle } from 'lucide-react'
import { getCurrentNotebookId } from '../../util/store-id.js'

const cellsQuery = queryDb(
  tables.cells.select()
)

const notebookQuery = queryDb(
  tables.notebook.select().limit(1)
)

const kernelSessionsQuery = queryDb(
  tables.kernelSessions.select().where({ isActive: true })
)

interface NotebookViewerProps {
  notebookId: string
  onBack: () => void
}

export const NotebookViewer: React.FC<NotebookViewerProps> = ({ onBack }) => {
  const { store } = useStore()
  const cells = store.useQuery(cellsQuery) as any[]
  const notebooks = store.useQuery(notebookQuery) as any[]
  const kernelSessions = store.useQuery(kernelSessionsQuery) as any[]
  const notebook = notebooks[0]

  const [isEditingTitle, setIsEditingTitle] = React.useState(false)
  const [localTitle, setLocalTitle] = React.useState(notebook?.title || '')
  const [showKernelHelper, setShowKernelHelper] = React.useState(false)
  const [focusedCellId, setFocusedCellId] = React.useState<string | null>(null)

  const currentNotebookId = getCurrentNotebookId()
  const kernelCommand = `NOTEBOOK_ID=${currentNotebookId} pnpm dev:kernel`

  // Check kernel status
  const activeKernel = kernelSessions.find((session: any) => session.status === 'ready')
  const hasActiveKernel = Boolean(activeKernel)
  const kernelStatus = activeKernel?.status || (kernelSessions.length > 0 ? kernelSessions[0].status : 'disconnected')

  const copyKernelCommand = useCallback(() => {
    navigator.clipboard.writeText(kernelCommand)
    // Could add a toast notification here
  }, [kernelCommand])

  React.useEffect(() => {
    if (notebook?.title) {
      setLocalTitle(notebook.title)
    }
  }, [notebook?.title])

  const updateTitle = useCallback(() => {
    if (notebook && localTitle !== notebook.title) {
      store.commit(events.notebookTitleChanged({
        title: localTitle,
      }))
    }
    setIsEditingTitle(false)
  }, [notebook, localTitle, store])

  const addCell = useCallback((afterCellId?: string, cellType: 'code' | 'markdown' | 'raw' | 'sql' | 'ai' = 'code') => {
    const cellId = `cell-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const newPosition = afterCellId
      ? Math.max(...cells.map((c: any) => c.position)) + 1
      : cells.length

    store.commit(events.cellCreated({
      id: cellId,
      position: newPosition,
      cellType,
      createdBy: 'current-user',
    }))

    // Focus the new cell after creation
    setTimeout(() => setFocusedCellId(cellId), 0)
  }, [cells, store])

  const deleteCell = useCallback((cellId: string) => {
    store.commit(events.cellDeleted({
      id: cellId,
    }))
  }, [store])

  const moveCell = useCallback((cellId: string, direction: 'up' | 'down') => {
    const currentCell = cells.find((c: any) => c.id === cellId)
    if (!currentCell) return

    const sortedCells = cells.sort((a: any, b: any) => a.position - b.position)
    const currentIndex = sortedCells.findIndex((c: any) => c.id === cellId)

    if (direction === 'up' && currentIndex > 0) {
      const targetCell = sortedCells[currentIndex - 1]
      if (targetCell) {
        // Swap positions
        store.commit(events.cellMoved({
          id: cellId,
          newPosition: targetCell.position,
        }))
        store.commit(events.cellMoved({
          id: targetCell.id,
          newPosition: currentCell.position,
        }))
      }
    } else if (direction === 'down' && currentIndex < sortedCells.length - 1) {
      const targetCell = sortedCells[currentIndex + 1]
      if (targetCell) {
        // Swap positions
        store.commit(events.cellMoved({
          id: cellId,
          newPosition: targetCell.position,
        }))
        store.commit(events.cellMoved({
          id: targetCell.id,
          newPosition: currentCell.position,
        }))
      }
    }
  }, [cells, store])

  const focusCell = useCallback((cellId: string) => {
    setFocusedCellId(cellId)
  }, [])

  const focusNextCell = useCallback((currentCellId: string) => {
    const sortedCells = cells.sort((a: any, b: any) => a.position - b.position)
    const currentIndex = sortedCells.findIndex((c: any) => c.id === currentCellId)

    if (currentIndex < sortedCells.length - 1) {
      const nextCell = sortedCells[currentIndex + 1]
      setFocusedCellId(nextCell.id)
    } else {
      // At the last cell, create a new one
      addCell(currentCellId)
    }
  }, [cells, addCell])

  const focusPreviousCell = useCallback((currentCellId: string) => {
    const sortedCells = cells.sort((a: any, b: any) => a.position - b.position)
    const currentIndex = sortedCells.findIndex((c: any) => c.id === currentCellId)

    if (currentIndex > 0) {
      const previousCell = sortedCells[currentIndex - 1]
      setFocusedCellId(previousCell.id)
    }
  }, [cells])

  // Reset focus when focused cell changes or is removed
  React.useEffect(() => {
    if (focusedCellId && !cells.find((c: any) => c.id === focusedCellId)) {
      setFocusedCellId(null)
    }
  }, [focusedCellId, cells])

  // Focus first cell when notebook loads and has cells
  React.useEffect(() => {
    if (!focusedCellId && cells.length > 0) {
      const sortedCells = cells.sort((a: any, b: any) => a.position - b.position)
      setFocusedCellId(sortedCells[0].id)
    }
  }, [focusedCellId, cells])

  if (!notebook) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading notebook...</div>
      </div>
    )
  }

  const sortedCells = cells.sort((a: any, b: any) => a.position - b.position)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Button variant="outline" onClick={onBack}>
                ← Back
              </Button>

              {isEditingTitle ? (
                <Input
                  value={localTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalTitle(e.target.value)}
                  onBlur={updateTitle}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') updateTitle()
                    if (e.key === 'Escape') {
                      setLocalTitle(notebook.title)
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-2xl font-bold border-none bg-transparent p-0 focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <CardTitle
                  className="text-2xl cursor-pointer hover:text-muted-foreground transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {notebook.title}
                </CardTitle>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKernelHelper(!showKernelHelper)}
                className="flex items-center gap-2"
              >
                <Terminal className="h-4 w-4" />
                Kernel
                <Circle
                  className={`h-2 w-2 fill-current ${
                    hasActiveKernel ? 'text-green-500' :
                    kernelStatus === 'starting' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}
                />
              </Button>
              <Badge
                variant="secondary"
                className={`${
                  hasActiveKernel ? 'bg-green-100 text-green-800 border-green-200' :
                  kernelStatus === 'starting' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {notebook.kernelType} {hasActiveKernel ? '●' : '○'}
              </Badge>
              <Badge variant="outline">{sortedCells.length} cells</Badge>
            </div>
          </div>

          {showKernelHelper && (
            <div className="mt-4 p-4 bg-slate-50 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  Kernel Status
                  <Circle
                    className={`h-3 w-3 fill-current ${
                      hasActiveKernel ? 'text-green-500' :
                      kernelStatus === 'starting' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}
                  />
                  <span className={`text-xs font-normal ${
                    hasActiveKernel ? 'text-green-600' :
                    kernelStatus === 'starting' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {hasActiveKernel ? 'Connected' :
                     kernelStatus === 'starting' ? 'Starting...' :
                     'Disconnected'}
                  </span>
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKernelHelper(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>

              {!hasActiveKernel && (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    Run this command in your terminal to start a kernel for notebook <code className="bg-slate-200 px-1 rounded">{currentNotebookId}</code>:
                  </p>
                  <div className="flex items-center gap-2 bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                    <span className="flex-1">{kernelCommand}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyKernelCommand}
                      className="h-8 w-8 p-0 text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Each notebook requires its own kernel instance. The kernel will connect automatically once started.
                  </p>
                </>
              )}

              {hasActiveKernel && activeKernel && (
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session ID:</span>
                    <code className="bg-slate-200 px-1 rounded text-xs">{activeKernel.sessionId}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kernel Type:</span>
                    <span>{activeKernel.kernelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    {/* <span>{new Date(activeKernel.startedAt).toLocaleTimeString()}</span> */}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Heartbeat:</span>
                    <span>{new Date(activeKernel.lastHeartbeat).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Keyboard Shortcuts Help */}
      {sortedCells.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">↑↓</kbd>
                <span className="text-muted-foreground">Navigate cells</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Shift+Enter</kbd>
                <span className="text-muted-foreground">Run & move</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+Enter</kbd>
                <span className="text-muted-foreground">Run & stay</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cells */}
      <div className="space-y-3">
        {sortedCells.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-muted-foreground mb-6">
                Welcome to your notebook! Choose a cell type to get started.
              </div>
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                <Button onClick={() => addCell()}>
                  + Code Cell
                </Button>
                <Button variant="outline" onClick={() => addCell(undefined, 'markdown')}>
                  📝 Markdown
                </Button>
                <Button variant="outline" onClick={() => addCell(undefined, 'sql')}>
                  🗄️ SQL Query
                </Button>
                <Button variant="outline" onClick={() => addCell(undefined, 'ai')}>
                  🤖 AI Assistant
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                💡 Use ↑↓ arrow keys to navigate • Shift+Enter to run and move • Ctrl+Enter to run
              </div>
            </div>
          </div>
        ) : (
          sortedCells.map((cell: any) => (
            <Cell
              key={cell.id}
              cell={cell}
              onAddCell={() => addCell(cell.id)}
              onDeleteCell={() => deleteCell(cell.id)}
              onMoveUp={() => moveCell(cell.id, 'up')}
              onMoveDown={() => moveCell(cell.id, 'down')}
              onFocusNext={() => focusNextCell(cell.id)}
              onFocusPrevious={() => focusPreviousCell(cell.id)}
              onFocus={() => focusCell(cell.id)}
              autoFocus={focusedCellId === cell.id}
            />
          ))
        )}
      </div>

      {/* Add Cell Buttons */}
      {sortedCells.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border/30">
          <div className="text-center space-y-3">
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => addCell()}>
                + Code Cell
              </Button>
              <Button variant="outline" size="sm" onClick={() => addCell(undefined, 'markdown')}>
                📝 Markdown
              </Button>
              <Button variant="outline" size="sm" onClick={() => addCell(undefined, 'sql')}>
                🗄️ SQL Query
              </Button>
              <Button variant="outline" size="sm" onClick={() => addCell(undefined, 'ai')}>
                🤖 AI Assistant
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Add a new cell below
            </div>
          </div>
        </div>
      )}

      {/* Notebook Info */}
      <Separator className="my-8" />
      <div className="text-xs text-muted-foreground text-center">
        <div>Owner: {notebook.ownerId}</div>
      </div>
    </div>
  )
}
