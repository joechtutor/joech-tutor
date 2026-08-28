'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { supabaseBrowser } from '../lib/supabase-browser'

type Point = {
  x: number
  y: number
}

type Tool = 'pen' | 'eraser'

type BoardEvent = {
  id: string
  event_type: 'draw' | 'clear'
  event_data: {
    from?: Point
    to?: Point
    tool?: Tool
    lineWidth?: number
  }
}

type Props = {
  liveClassId: string
  readOnly?: boolean
}

export default function LiveTeachingBoard({
  liveClassId,
  readOnly = false,
}: Props) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const drawingRef =
    useRef(false)

  const lastPointRef =
    useRef<Point | null>(null)

  const channelRef =
    useRef<ReturnType<
      ReturnType<typeof supabaseBrowser>['channel']
    > | null>(null)

  const setupIdRef =
    useRef(0)

  const [tool, setTool] =
    useState<Tool>('pen')

  const [lineWidth, setLineWidth] =
    useState(3)

  const [connected, setConnected] =
    useState(false)

  const supabase =
    supabaseBrowser()

  /*
   * =========================================================
   * DRAW LINE
   * =========================================================
   */

  function drawLine(
    from: Point,
    to: Point,
    drawTool: Tool,
    width: number
  ) {
    const canvas =
      canvasRef.current

    if (!canvas) {
      return
    }

    const context =
      canvas.getContext('2d')

    if (!context) {
      return
    }

    context.beginPath()

    context.moveTo(
      from.x,
      from.y
    )

    context.lineTo(
      to.x,
      to.y
    )

    context.lineCap =
      'round'

    context.lineJoin =
      'round'

    if (
      drawTool === 'eraser'
    ) {
      context.globalCompositeOperation =
        'destination-out'

      context.lineWidth =
        Math.max(
          width * 3,
          15
        )
    } else {
      context.globalCompositeOperation =
        'source-over'

      context.strokeStyle =
        '#000000'

      context.lineWidth =
        width
    }

    context.stroke()

    context.globalCompositeOperation =
      'source-over'
  }

  /*
   * =========================================================
   * CLEAR CANVAS
   * =========================================================
   */

  function clearCanvas() {
    const canvas =
      canvasRef.current

    if (!canvas) {
      return
    }

    const context =
      canvas.getContext('2d')

    if (!context) {
      return
    }

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    )
  }

  /*
   * =========================================================
   * DRAW RECEIVED EVENT
   * =========================================================
   */

  function drawEventOnCanvas(
    event: BoardEvent
  ) {
    if (
      event.event_type ===
      'clear'
    ) {
      clearCanvas()
      return
    }

    const from =
      event.event_data?.from

    const to =
      event.event_data?.to

    if (!from || !to) {
      return
    }

    drawLine(
      from,
      to,
      event.event_data?.tool ||
        'pen',
      event.event_data?.lineWidth ||
        3
    )
  }

  /*
   * =========================================================
   * CANVAS SIZE
   * =========================================================
   */

  useEffect(() => {
    const canvas =
      canvasRef.current

    if (!canvas) {
      return
    }

    function resizeCanvas() {
      const rect =
        canvas!.getBoundingClientRect()

      if (
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        return
      }

      const newWidth =
        Math.floor(
          rect.width
        )

      const newHeight =
        Math.floor(
          rect.height
        )

      if (
        canvas!.width ===
          newWidth &&
        canvas!.height ===
          newHeight
      ) {
        return
      }

      const oldCanvas =
        document.createElement(
          'canvas'
        )

      oldCanvas.width =
        canvas!.width

      oldCanvas.height =
        canvas!.height

      const oldContext =
        oldCanvas.getContext(
          '2d'
        )

      if (
        oldContext &&
        canvas!.width > 0 &&
        canvas!.height > 0
      ) {
        oldContext.drawImage(
          canvas!,
          0,
          0
        )
      }

      canvas!.width =
        newWidth

      canvas!.height =
        newHeight

      const context =
        canvas!.getContext('2d')

      if (!context) {
        return
      }

      context.lineCap =
        'round'

      context.lineJoin =
        'round'

      if (
        oldCanvas.width > 0 &&
        oldCanvas.height > 0
      ) {
        context.drawImage(
          oldCanvas,
          0,
          0,
          oldCanvas.width,
          oldCanvas.height,
          0,
          0,
          newWidth,
          newHeight
        )
      }
    }

    resizeCanvas()

    window.addEventListener(
      'resize',
      resizeCanvas
    )

    return () => {
      window.removeEventListener(
        'resize',
        resizeCanvas
      )
    }
  }, [])

  /*
   * =========================================================
   * SUPABASE REALTIME BOARD
   * =========================================================
   */

  useEffect(() => {
    if (!liveClassId) {
      return
    }

    let mounted = true

    const setupId =
      setupIdRef.current + 1

    setupIdRef.current =
      setupId

    async function setupRealtime() {
      /*
       * Remove previous channel.
       */

      if (channelRef.current) {
        const oldChannel =
          channelRef.current

        channelRef.current =
          null

        try {
          await supabase.removeChannel(
            oldChannel
          )
        } catch (error) {
          console.error(
            '[LiveTeachingBoard] Channel cleanup error:',
            error
          )
        }
      }

      if (
        !mounted ||
        setupIdRef.current !==
          setupId
      ) {
        return
      }

      /*
       * Load board history.
       *
       * Students are allowed to SELECT
       * board events through RLS.
       *
       * This is READ ONLY.
       */

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'live_class_events'
          )
          .select(
            'id,event_type,event_data'
          )
          .eq(
            'live_class_id',
            liveClassId
          )
          .order(
            'created_at',
            {
              ascending: true,
            }
          )

      if (!mounted) {
        return
      }

      if (error) {
        console.error(
          '[LiveTeachingBoard] History load error:',
          {
            message:
              error.message,
            details:
              error.details,
            hint:
              error.hint,
            code:
              error.code,
          }
        )
      } else if (data) {
        clearCanvas()

        data.forEach(
          (event) => {
            drawEventOnCanvas(
              event as BoardEvent
            )
          }
        )
      }

      if (
        !mounted ||
        setupIdRef.current !==
          setupId
      ) {
        return
      }

      /*
       * Teacher and students use the
       * same realtime channel.
       */

      const channelName =
        `live-class-board-${liveClassId}`

      console.log(
        '[LiveTeachingBoard] Joining:',
        channelName,
        readOnly
          ? '(student/read-only)'
          : '(teacher)'
      )

      const channel =
        supabase
          .channel(
            channelName,
            {
              config: {
                broadcast: {
                  self: false,
                },
              },
            }
          )

          /*
           * RECEIVE DRAW
           */

          .on(
            'broadcast',
            {
              event:
                'board-draw',
            },
            ({ payload }) => {
              if (
                !mounted ||
                setupIdRef.current !==
                  setupId
              ) {
                return
              }

              const event =
                payload as BoardEvent

              if (
                !event ||
                event.event_type !==
                  'draw'
              ) {
                return
              }

              console.log(
                '[LiveTeachingBoard] DRAW RECEIVED'
              )

              drawEventOnCanvas(
                event
              )
            }
          )

          /*
           * RECEIVE CLEAR
           */

          .on(
            'broadcast',
            {
              event:
                'board-clear',
            },
            () => {
              if (!mounted) {
                return
              }

              console.log(
                '[LiveTeachingBoard] CLEAR RECEIVED'
              )

              clearCanvas()
            }
          )

          /*
           * CONNECT
           */

          .subscribe(
            (status) => {
              if (
                !mounted ||
                setupIdRef.current !==
                  setupId
              ) {
                return
              }

              console.log(
                '[LiveTeachingBoard] Status:',
                status
              )

              setConnected(
                status ===
                  'SUBSCRIBED'
              )
            }
          )

      channelRef.current =
        channel
    }

    setupRealtime().catch(
      (error) => {
        console.error(
          '[LiveTeachingBoard] Realtime setup error:',
          error
        )

        if (mounted) {
          setConnected(false)
        }
      }
    )

    return () => {
      mounted = false

      if (
        setupIdRef.current ===
        setupId
      ) {
        setupIdRef.current += 1
      }

      setConnected(false)

      const channel =
        channelRef.current

      channelRef.current =
        null

      if (channel) {
        supabase
          .removeChannel(
            channel
          )
          .catch(
            (error) => {
              console.error(
                '[LiveTeachingBoard] Cleanup error:',
                error
              )
            }
          )
      }
    }
  }, [
    liveClassId,
    supabase,
    readOnly,
  ])

  /*
   * =========================================================
   * GET POINTER POSITION
   * =========================================================
   */

  function getPoint(
    event: React.PointerEvent<HTMLCanvasElement>
  ): Point {
    const canvas =
      canvasRef.current

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      }
    }

    const rect =
      canvas.getBoundingClientRect()

    const scaleX =
      canvas.width /
      rect.width

    const scaleY =
      canvas.height /
      rect.height

    return {
      x:
        (event.clientX -
          rect.left) *
        scaleX,

      y:
        (event.clientY -
          rect.top) *
        scaleY,
    }
  }

  /*
   * =========================================================
   * BROADCAST DRAW
   * =========================================================
   */

  async function broadcastDrawEvent(
    from: Point,
    to: Point
  ) {
    const channel =
      channelRef.current

    if (!channel) {
      console.warn(
        '[LiveTeachingBoard] Channel not ready'
      )

      return
    }

    const event: BoardEvent = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

      event_type:
        'draw',

      event_data: {
        from,
        to,
        tool,
        lineWidth,
      },
    }

    try {
      const result =
        await channel.send({
          type:
            'broadcast',

          event:
            'board-draw',

          payload:
            event,
        })

      if (result !== 'ok') {
        console.error(
          '[LiveTeachingBoard] Broadcast failed:',
          result
        )
      }
    } catch (error) {
      console.error(
        '[LiveTeachingBoard] Broadcast error:',
        error
      )
    }
  }

  /*
   * =========================================================
   * SAVE DRAW EVENT
   *
   * IMPORTANT:
   * ONLY THE TEACHER SAVES TO DATABASE.
   *
   * STUDENTS ARE READ-ONLY AND MUST
   * NEVER INSERT INTO live_class_events.
   * =========================================================
   */

  async function saveDrawEvent(
    from: Point,
    to: Point
  ) {
    /*
     * CRITICAL PROTECTION:
     *
     * Students must not write board
     * events to the database.
     */

    if (readOnly) {
      return
    }

    try {
      /*
       * Get the authenticated user.
       */

      const {
        data: {
          user,
        },
        error:
          authError,
      } =
        await supabase.auth.getUser()

      if (authError) {
        console.error(
          '[LiveTeachingBoard] Could not get authenticated user:',
          {
            message:
              authError.message,
            name:
              authError.name,
          }
        )

        return
      }

      if (!user) {
        console.error(
          '[LiveTeachingBoard] No authenticated user. Database event was not saved.'
        )

        return
      }

      /*
       * Teacher saves the event with
       * created_by populated.
       */

      const {
        error,
      } =
        await supabase
          .from(
            'live_class_events'
          )
          .insert({
            live_class_id:
              liveClassId,

            event_type:
              'draw',

            event_data: {
              from,
              to,
              tool,
              lineWidth,
            },

            created_by:
              user.id,
          })

      if (error) {
        console.error(
          '[LiveTeachingBoard] Database save error:',
          {
            message:
              error.message,
            details:
              error.details,
            hint:
              error.hint,
            code:
              error.code,
          }
        )
      }
    } catch (error) {
      console.error(
        '[LiveTeachingBoard] Save error:',
        error
      )
    }
  }

  /*
   * =========================================================
   * START DRAWING
   * =========================================================
   */

  function startDrawing(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (readOnly) {
      return
    }

    const canvas =
      canvasRef.current

    if (!canvas) {
      return
    }

    try {
      canvas.setPointerCapture(
        event.pointerId
      )
    } catch {
      // Ignore pointer capture errors.
    }

    drawingRef.current =
      true

    lastPointRef.current =
      getPoint(event)
  }

  /*
   * =========================================================
   * DRAW
   * =========================================================
   */

  function draw(
    event: React.PointerEvent<HTMLCanvasElement>
  ) {
    if (
      readOnly ||
      !drawingRef.current
    ) {
      return
    }

    const currentPoint =
      getPoint(event)

    const lastPoint =
      lastPointRef.current

    if (!lastPoint) {
      lastPointRef.current =
        currentPoint

      return
    }

    /*
     * Draw immediately locally.
     */

    drawLine(
      lastPoint,
      currentPoint,
      tool,
      lineWidth
    )

    /*
     * Broadcast to students.
     */

    void broadcastDrawEvent(
      lastPoint,
      currentPoint
    )

    /*
     * Save ONLY on teacher.
     *
     * saveDrawEvent() itself also
     * checks readOnly as a second
     * protection.
     */

    if (!readOnly) {
      void saveDrawEvent(
        lastPoint,
        currentPoint
      )
    }

    lastPointRef.current =
      currentPoint
  }

  /*
   * =========================================================
   * STOP DRAWING
   * =========================================================
   */

  function stopDrawing(
    event?: React.PointerEvent<HTMLCanvasElement>
  ) {
    const canvas =
      canvasRef.current

    if (
      canvas &&
      event &&
      canvas.hasPointerCapture(
        event.pointerId
      )
    ) {
      try {
        canvas.releasePointerCapture(
          event.pointerId
        )
      } catch {
        // Ignore pointer capture errors.
      }
    }

    drawingRef.current =
      false

    lastPointRef.current =
      null
  }

  /*
   * =========================================================
   * CLEAR BOARD
   * =========================================================
   */

  async function clearBoard() {
    /*
     * Students cannot clear the board.
     */

    if (readOnly) {
      return
    }

    clearCanvas()

    const channel =
      channelRef.current

    if (channel) {
      try {
        const result =
          await channel.send({
            type:
              'broadcast',

            event:
              'board-clear',

            payload: {
              liveClassId,
              event_type:
                'clear',
            },
          })

        if (result !== 'ok') {
          console.error(
            '[LiveTeachingBoard] Clear broadcast failed:',
            result
          )
        }
      } catch (error) {
        console.error(
          '[LiveTeachingBoard] Clear broadcast error:',
          error
        )
      }
    }

    /*
     * Get authenticated teacher.
     */

    try {
      const {
        data: {
          user,
        },
        error:
          authError,
      } =
        await supabase.auth.getUser()

      if (authError) {
        console.error(
          '[LiveTeachingBoard] Clear auth error:',
          {
            message:
              authError.message,
            name:
              authError.name,
          }
        )

        return
      }

      if (!user) {
        console.error(
          '[LiveTeachingBoard] No authenticated user. Clear event was not saved.'
        )

        return
      }

      /*
       * Save clear event with created_by.
       */

      const {
        error,
      } =
        await supabase
          .from(
            'live_class_events'
          )
          .insert({
            live_class_id:
              liveClassId,

            event_type:
              'clear',

            event_data: {},

            created_by:
              user.id,
          })

      if (error) {
        console.error(
          '[LiveTeachingBoard] Clear database save error:',
          {
            message:
              error.message,
            details:
              error.details,
            hint:
              error.hint,
            code:
              error.code,
          }
        )
      }
    } catch (error) {
      console.error(
        '[LiveTeachingBoard] Clear database error:',
        error
      )
    }
  }

  /*
   * =========================================================
   * USER INTERFACE
   * =========================================================
   */

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background:
          '#ffffff',
      }}
    >

      {!readOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding:
              '10px 12px',
            borderBottom:
              '1px solid #e2e8f0',
            background:
              '#f8fafc',
            flexWrap:
              'wrap',
          }}
        >

          <button
            type="button"
            onClick={() =>
              setTool('pen')
            }
            style={{
              padding:
                '8px 14px',
              borderRadius:
                '8px',
              border:
                '1px solid #cbd5e1',
              background:
                tool === 'pen'
                  ? '#0b5ed7'
                  : '#ffffff',
              color:
                tool === 'pen'
                  ? '#ffffff'
                  : '#1e293b',
              cursor:
                'pointer',
              fontWeight:
                600,
            }}
          >
            ✏️ Pen
          </button>

          <button
            type="button"
            onClick={() =>
              setTool('eraser')
            }
            style={{
              padding:
                '8px 14px',
              borderRadius:
                '8px',
              border:
                '1px solid #cbd5e1',
              background:
                tool === 'eraser'
                  ? '#0b5ed7'
                  : '#ffffff',
              color:
                tool === 'eraser'
                  ? '#ffffff'
                  : '#1e293b',
              cursor:
                'pointer',
              fontWeight:
                600,
            }}
          >
            🧹 Eraser
          </button>

          <label
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap:
                '7px',
              marginLeft:
                '5px',
              color:
                '#475569',
              fontSize:
                '14px',
              fontWeight:
                600,
            }}
          >
            Size

            <input
              type="range"
              min="1"
              max="15"
              value={
                lineWidth
              }
              onChange={(
                event
              ) =>
                setLineWidth(
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />

            <span
              style={{
                minWidth:
                  '25px',
                textAlign:
                  'center',
              }}
            >
              {lineWidth}
            </span>
          </label>

          <button
            type="button"
            onClick={
              clearBoard
            }
            style={{
              marginLeft:
                'auto',
              padding:
                '8px 14px',
              borderRadius:
                '8px',
              border:
                '1px solid #fecaca',
              background:
                '#ffffff',
              color:
                '#b91c1c',
              cursor:
                'pointer',
              fontWeight:
                600,
            }}
          >
            🗑️ Clear
          </button>

          <span
            style={{
              fontSize:
                '11px',
              fontWeight:
                700,
              color:
                connected
                  ? '#15803d'
                  : '#b45309',
            }}
          >
            ●{' '}
            {connected
              ? 'Connected'
              : 'Connecting...'}
          </span>

        </div>
      )}

      <div
        style={{
          position:
            'relative',
          flex: 1,
          minHeight:
            '560px',
          overflow:
            'hidden',
          background:
            '#ffffff',
        }}
      >

        <canvas
          ref={
            canvasRef
          }
          onPointerDown={
            startDrawing
          }
          onPointerMove={
            draw
          }
          onPointerUp={
            stopDrawing
          }
          onPointerCancel={
            stopDrawing
          }
          onPointerLeave={
            stopDrawing
          }
          style={{
            width:
              '100%',
            height:
              '100%',
            display:
              'block',
            touchAction:
              'none',
            cursor:
              readOnly
                ? 'default'
                : tool ===
                    'eraser'
                  ? 'cell'
                  : 'crosshair',
          }}
        />

        {readOnly && (
          <div
            style={{
              position:
                'absolute',
              top:
                '12px',
              right:
                '12px',
              padding:
                '7px 10px',
              borderRadius:
                '8px',
              background:
                'rgba(8,43,89,0.08)',
              color:
                '#475569',
              fontSize:
                '11px',
              fontWeight:
                700,
              pointerEvents:
                'none',
            }}
          >
            👀 Viewing teacher's board
          </div>
        )}

      </div>

    </div>
  )
}