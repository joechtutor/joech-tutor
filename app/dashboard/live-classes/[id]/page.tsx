'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import LiveTeachingBoard from '../../../../components/LiveTeachingBoard'
import { supabaseBrowser } from '../../../../lib/supabase-browser'

type LiveClass = {
  id: string
  title: string
  subject: string
  topic: string | null
  class_code: string
  scheduled_at: string | null
  duration_minutes: number
  status: 'scheduled' | 'live' | 'ended'
}

type ChatMessage = {
  id: string
  sender: 'teacher' | 'student'
  name: string
  message: string
  createdAt: string
}

type SignalMessage = {
  type:
    | 'offer'
    | 'answer'
    | 'ice-candidate'
    | 'student-joined'
    | 'student-left'
  from: string
  to?: string
  data?: unknown
}

type StudentConnection = {
  id: string
  name: string
  stream: MediaStream | null
  connection: RTCPeerConnection
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
  ],
}

export default function LiveClassroomPage() {
  const params = useParams()

  const rawId = params?.id

  const id =
    typeof rawId === 'string'
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : ''

  const supabase = supabaseBrowser()

  const [liveClass, setLiveClass] =
    useState<LiveClass | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [diagnostics, setDiagnostics] =
    useState('')

  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  const [message, setMessage] =
    useState('')

  const [chatConnected, setChatConnected] =
    useState(false)

  const [sending, setSending] =
    useState(false)

  const [mediaConnected, setMediaConnected] =
    useState(false)

  const [mediaLoading, setMediaLoading] =
    useState(false)

  const [mediaError, setMediaError] =
    useState('')

  const [micEnabled, setMicEnabled] =
    useState(true)

  const [cameraEnabled, setCameraEnabled] =
    useState(true)

  const [students, setStudents] =
    useState<StudentConnection[]>([])

  /*
   * SCREEN SHARING STATE
   */

  const [isScreenSharing, setIsScreenSharing] =
    useState(false)

  const [screenShareLoading, setScreenShareLoading] =
    useState(false)

  const [screenShareError, setScreenShareError] =
    useState('')

  const teacherVideoRef =
    useRef<HTMLVideoElement | null>(null)

  /*
   * Separate video element used to preview
   * the teacher's shared screen locally.
   */
  const screenShareVideoRef =
    useRef<HTMLVideoElement | null>(null)

  const localStreamRef =
    useRef<MediaStream | null>(null)

  /*
   * Holds the current screen-sharing stream.
   */
  const screenStreamRef =
    useRef<MediaStream | null>(null)

  const mediaChannelRef =
    useRef<
      ReturnType<
        ReturnType<typeof supabaseBrowser>['channel']
      > | null
    >(null)

  const chatChannelRef =
    useRef<
      ReturnType<
        ReturnType<typeof supabaseBrowser>['channel']
      > | null
    >(null)

  const peerConnectionsRef =
    useRef<Map<string, RTCPeerConnection>>(
      new Map()
    )

  const screenShareActiveRef =
    useRef(false)

  /*
   * ---------------------------------------------------------
   * LOAD LIVE CLASS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false

    async function loadClass() {
      console.log(
        '========================================'
      )

      console.log(
        'ADMIN LIVE CLASSROOM PAGE'
      )

      console.log(
        'URL:',
        window.location.href
      )

      console.log(
        'Class ID:',
        id
      )

      console.log(
        '========================================'
      )

      if (!id) {
        console.error(
          'No live class ID found in URL'
        )

        if (!cancelled) {
          setError(
            'No live class ID was found in the classroom URL.'
          )

          setLoading(false)
        }

        return
      }

      try {
        setLoading(true)
        setError('')
        setDiagnostics('')

        const apiUrl =
          `/api/live-classes/${encodeURIComponent(
            id
          )}`

        console.log(
          'Fetching classroom API:',
          apiUrl
        )

        const response =
          await fetch(
            apiUrl,
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            }
          )

        console.log(
          'Classroom API response status:',
          response.status
        )

        const text =
          await response.text()

        console.log(
          'Classroom API raw response:',
          text
        )

        let data: {
          success?: boolean
          liveClass?: LiveClass
          error?: string
          details?: string
          diagnostics?: Record<
            string,
            unknown
          >
        } = {}

        try {
          data = text
            ? JSON.parse(text)
            : {}
        } catch {
          throw new Error(
            `Server returned an invalid response. HTTP ${response.status}`
          )
        }

        if (!response.ok) {
          const diagnosticText =
            data.diagnostics
              ? JSON.stringify(
                  data.diagnostics,
                  null,
                  2
                )
              : ''

          if (!cancelled) {
            setDiagnostics(
              diagnosticText
            )

            setError(
              data.error ||
                data.details ||
                `Unable to load classroom. HTTP ${response.status}`
            )
          }

          return
        }

        if (!data.liveClass) {
          if (!cancelled) {
            setError(
              'The classroom API responded successfully, but no live class data was returned.'
            )

            setDiagnostics(
              data.diagnostics
                ? JSON.stringify(
                    data.diagnostics,
                    null,
                    2
                  )
                : ''
            )
          }

          return
        }

        console.log(
          'Live class successfully loaded:',
          data.liveClass
        )

        if (!cancelled) {
          setLiveClass(
            data.liveClass
          )

          setDiagnostics(
            data.diagnostics
              ? JSON.stringify(
                  data.diagnostics,
                  null,
                  2
                )
              : ''
          )
        }
      } catch (err) {
        console.error(
          'LIVE CLASSROOM PAGE ERROR:',
          err
        )

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load classroom.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadClass()

    return () => {
      cancelled = true
    }
  }, [id])

  /*
   * ---------------------------------------------------------
   * LIVE CHAT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!id) return

    let mounted = true

    const channelName =
      `live-class-chat-${id}`

    console.log(
      '[TeacherLiveClass] Creating chat channel:',
      channelName
    )

    const channel =
      supabase
        .channel(channelName)
        .on(
          'broadcast',
          {
            event: 'chat-message',
          },
          ({ payload }) => {
            if (!mounted) return

            const incoming =
              payload as ChatMessage

            if (
              !incoming?.id ||
              !incoming?.message
            ) {
              return
            }

            console.log(
              '[TeacherLiveClass] Chat message received:',
              incoming
            )

            setMessages((current) => {
              if (
                current.some(
                  (item) =>
                    item.id ===
                    incoming.id
                )
              ) {
                return current
              }

              return [
                ...current,
                incoming,
              ].slice(-100)
            })
          }
        )
        .subscribe((status) => {
          if (!mounted) return

          console.log(
            '[TeacherLiveClass] Chat status:',
            status
          )

          setChatConnected(
            status === 'SUBSCRIBED'
          )
        })

    chatChannelRef.current =
      channel

    return () => {
      mounted = false

      const currentChannel =
        chatChannelRef.current

      chatChannelRef.current = null

      if (currentChannel) {
        supabase
          .removeChannel(
            currentChannel
          )
          .catch((err) => {
            console.error(
              '[TeacherLiveClass] Chat cleanup error:',
              err
            )
          })
      }
    }
  }, [id, supabase])

  /*
   * ---------------------------------------------------------
   * SEND CHAT MESSAGE
   * ---------------------------------------------------------
   */

  async function sendMessage() {
    const cleanMessage =
      message.trim()

    if (
      !cleanMessage ||
      !id ||
      !chatChannelRef.current ||
      sending
    ) {
      return
    }

    setSending(true)

    const chatMessage: ChatMessage = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

      sender: 'teacher',

      name: 'Teacher',

      message: cleanMessage,

      createdAt:
        new Date().toISOString(),
    }

    try {
      const result =
        await chatChannelRef.current.send({
          type: 'broadcast',
          event: 'chat-message',
          payload: chatMessage,
        })

      if (result !== 'ok') {
        throw new Error(
          'Unable to send message.'
        )
      }

      setMessages((current) =>
        [
          ...current,
          chatMessage,
        ].slice(-100)
      )

      setMessage('')
    } catch (err) {
      console.error(
        '[TeacherLiveClass] Send message error:',
        err
      )
    } finally {
      setSending(false)
    }
  }

  function handleChatKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()

      void sendMessage()
    }
  }

  /*
   * ---------------------------------------------------------
   * CREATE PEER CONNECTION
   * ---------------------------------------------------------
   */

  function createPeerConnection(
    studentId: string,
    studentName: string
  ) {
    const existing =
      peerConnectionsRef.current.get(
        studentId
      )

    if (existing) {
      return existing
    }

    console.log(
      '[TeacherMedia] Creating peer connection:',
      studentId
    )

    const peer =
      new RTCPeerConnection(
        ICE_SERVERS
      )

    const localStream =
      localStreamRef.current

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => {
          peer.addTrack(
            track,
            localStream
          )
        })
    }

    peer.onicecandidate =
      async (event) => {
        if (
          !event.candidate ||
          !mediaChannelRef.current
        ) {
          return
        }

        const signal: SignalMessage = {
          type: 'ice-candidate',

          from: 'teacher',

          to: studentId,

          data: event.candidate,
        }

        try {
          await mediaChannelRef.current.send(
            {
              type: 'broadcast',

              event: 'media-signal',

              payload: signal,
            }
          )
        } catch (err) {
          console.error(
            '[TeacherMedia] ICE send error:',
            err
          )
        }
      }

    peer.onconnectionstatechange =
      () => {
        console.log(
          '[TeacherMedia] Connection state:',
          studentId,
          peer.connectionState
        )

        if (
          peer.connectionState ===
            'failed' ||
          peer.connectionState ===
            'closed' ||
          peer.connectionState ===
            'disconnected'
        ) {
          peerConnectionsRef.current.delete(
            studentId
          )

          setStudents((current) =>
            current.filter(
              (student) =>
                student.id !==
                studentId
            )
          )
        }
      }

    peer.ontrack =
      (event) => {
        const stream =
          event.streams[0]

        if (!stream) return

        console.log(
          '[TeacherMedia] Student stream received:',
          studentId
        )

        setStudents((current) => {
          const existingStudent =
            current.find(
              (student) =>
                student.id ===
                studentId
            )

          if (existingStudent) {
            return current.map(
              (student) =>
                student.id ===
                studentId
                  ? {
                      ...student,
                      stream,
                    }
                  : student
            )
          }

          return [
            ...current,
            {
              id: studentId,
              name:
                studentName ||
                'Student',
              stream,
              connection: peer,
            },
          ]
        })
      }

    peerConnectionsRef.current.set(
      studentId,
      peer
    )

    return peer
  }

  /*
   * ---------------------------------------------------------
   * SEND OFFER TO STUDENT
   * ---------------------------------------------------------
   */

  async function createOffer(
    studentId: string,
    studentName: string
  ) {
    const channel =
      mediaChannelRef.current

    if (!channel) {
      console.warn(
        '[TeacherMedia] Media channel not ready.'
      )

      return
    }

    try {
      const peer =
        createPeerConnection(
          studentId,
          studentName
        )

      const offer =
        await peer.createOffer()

      await peer.setLocalDescription(
        offer
      )

      const signal: SignalMessage = {
        type: 'offer',

        from: 'teacher',

        to: studentId,

        data: offer,
      }

      await channel.send({
        type: 'broadcast',

        event: 'media-signal',

        payload: signal,
      })

      console.log(
        '[TeacherMedia] Offer sent to student:',
        studentId
      )
    } catch (err) {
      console.error(
        '[TeacherMedia] Offer error:',
        err
      )
    }
  }

  /*
   * ---------------------------------------------------------
   * HANDLE MEDIA SIGNAL
   * ---------------------------------------------------------
   */

  async function handleMediaSignal(
    signal: SignalMessage
  ) {
    if (
      signal.from === 'teacher'
    ) {
      return
    }

    if (
      signal.to &&
      signal.to !== 'teacher'
    ) {
      return
    }

    const studentId =
      signal.from

    const peer =
      createPeerConnection(
        studentId,
        'Student'
      )

    try {
      if (
        signal.type ===
        'answer'
      ) {
        const answer =
          signal.data as RTCSessionDescriptionInit

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            answer
          )
        )

        console.log(
          '[TeacherMedia] Answer received:',
          studentId
        )

        return
      }

      if (
        signal.type ===
        'ice-candidate'
      ) {
        const candidate =
          signal.data as RTCIceCandidateInit

        /*
         * Keep the existing working ICE logic.
         */
        if (
          peer.remoteDescription
        ) {
          await peer.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          )
        } else {
          console.warn(
            '[TeacherMedia] Ignoring ICE candidate because remote description is not ready:',
            studentId
          )
        }

        return
      }

      if (
        signal.type ===
        'student-joined'
      ) {
        await createOffer(
          studentId,
          'Student'
        )

        return
      }

      if (
        signal.type ===
        'student-left'
      ) {
        peer.close()

        peerConnectionsRef.current.delete(
          studentId
        )

        setStudents((current) =>
          current.filter(
            (student) =>
              student.id !==
              studentId
          )
        )
      }
    } catch (err) {
      console.error(
        '[TeacherMedia] Signal handling error:',
        err
      )
    }
  }

  /*
   * ---------------------------------------------------------
   * START TEACHER CAMERA + MICROPHONE
   * ---------------------------------------------------------
   */

  async function startTeacherMedia() {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setMediaError(
        'Your browser does not support camera and microphone access.'
      )

      return
    }

    setMediaLoading(true)
    setMediaError('')

    try {
      console.log(
        '[TeacherMedia] Requesting camera and microphone...'
      )

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              width: {
                ideal: 1280,
              },

              height: {
                ideal: 720,
              },

              facingMode:
                'user',
            },

            audio: {
              echoCancellation:
                true,

              noiseSuppression:
                true,

              autoGainControl:
                true,
            },
          }
        )

      localStreamRef.current =
        stream

      if (
        teacherVideoRef.current
      ) {
        teacherVideoRef.current.srcObject =
          stream
      }

      const audioTrack =
        stream.getAudioTracks()[0]

      const videoTrack =
        stream.getVideoTracks()[0]

      setMicEnabled(
        audioTrack
          ? audioTrack.enabled
          : false
      )

      setCameraEnabled(
        videoTrack
          ? videoTrack.enabled
          : false
      )

      console.log(
        '[TeacherMedia] Camera/microphone ready.'
      )

      setMediaConnected(true)

      /*
       * Re-add/replace the new tracks
       * on existing student connections.
       */
      peerConnectionsRef.current.forEach(
        (peer) => {
          const senders =
            peer.getSenders()

          stream
            .getTracks()
            .forEach(
              (track) => {
                const sender =
                  senders.find(
                    (item) =>
                      item.track?.kind ===
                      track.kind
                  )

                if (sender) {
                  void sender.replaceTrack(
                    track
                  )
                } else {
                  peer.addTrack(
                    track,
                    stream
                  )
                }
              }
            )
        }
      )
    } catch (err) {
      console.error(
        '[TeacherMedia] Camera/microphone error:',
        err
      )

      setMediaError(
        err instanceof DOMException &&
          err.name ===
            'NotAllowedError'
          ? 'Camera and microphone permission was denied. Please allow access in your browser.'
          : err instanceof DOMException &&
              err.name ===
                'NotFoundError'
            ? 'No camera or microphone was found on this device.'
            : err instanceof Error
              ? err.message
              : 'Unable to access camera and microphone.'
      )

      setMediaConnected(false)
    } finally {
      setMediaLoading(false)
    }
  }

  /*
   * ---------------------------------------------------------
   * SCREEN SHARING
   * ---------------------------------------------------------
   */

  async function startScreenSharing() {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getDisplayMedia
    ) {
      setScreenShareError(
        'Your browser does not support screen sharing.'
      )

      return
    }

    /*
     * Prevent duplicate requests.
     */
    if (screenShareActiveRef.current) {
      return
    }

    setScreenShareLoading(true)
    setScreenShareError('')

    try {
      console.log(
        '[TeacherScreenShare] Requesting screen...'
      )

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia(
          {
            video: {
              width: {
                ideal: 1920,
              },

              height: {
                ideal: 1080,
              },

              frameRate: {
                ideal: 30,
                max: 30,
              },
            },

            audio: false,
          }
        )

      const screenTrack =
        screenStream.getVideoTracks()[0]

      if (!screenTrack) {
        throw new Error(
          'No screen video track was returned.'
        )
      }

      screenStreamRef.current =
        screenStream

      screenShareActiveRef.current =
        true

      /*
       * Show local preview.
       */
      if (
        screenShareVideoRef.current
      ) {
        screenShareVideoRef.current.srcObject =
          screenStream
      }

      /*
       * Replace the teacher's CAMERA video
       * track with the SCREEN video track
       * on every existing student connection.
       *
       * Audio is NOT changed.
       */
      peerConnectionsRef.current.forEach(
        (peer, studentId) => {
          const videoSender =
            peer
              .getSenders()
              .find(
                (sender) =>
                  sender.track?.kind ===
                  'video'
              )

          if (videoSender) {
            void videoSender
              .replaceTrack(
                screenTrack
              )
              .then(() => {
                console.log(
                  '[TeacherScreenShare] Screen track sent to student:',
                  studentId
                )
              })
              .catch((err) => {
                console.error(
                  '[TeacherScreenShare] replaceTrack error:',
                  studentId,
                  err
                )
              })
          } else {
            console.warn(
              '[TeacherScreenShare] No video sender found for:',
              studentId
            )
          }
        }
      )

      setIsScreenSharing(true)

      /*
       * If the teacher clicks the browser's
       * "Stop sharing" button, this event fires.
       */
      screenTrack.onended = () => {
        console.log(
          '[TeacherScreenShare] Browser stopped screen sharing.'
        )

        void stopScreenSharing()
      }

      console.log(
        '[TeacherScreenShare] Screen sharing started successfully.'
      )
    } catch (err) {
      console.error(
        '[TeacherScreenShare] Screen sharing error:',
        err
      )

      /*
       * User cancelling the browser picker
       * should not be treated as a serious error.
       */
      if (
        err instanceof DOMException &&
        err.name === 'AbortError'
      ) {
        setScreenShareError('')
      } else {
        setScreenShareError(
          err instanceof Error
            ? err.message
            : 'Unable to start screen sharing.'
        )
      }

      screenStreamRef.current = null
      screenShareActiveRef.current =
        false
      setIsScreenSharing(false)
    } finally {
      setScreenShareLoading(false)
    }
  }

  /*
   * ---------------------------------------------------------
   * STOP SCREEN SHARING
   * ---------------------------------------------------------
   */

  async function stopScreenSharing() {
    const screenStream =
      screenStreamRef.current

    screenShareActiveRef.current =
      false

    /*
     * Stop the screen capture tracks.
     */
    if (screenStream) {
      screenStream
        .getTracks()
        .forEach((track) => {
          track.stop()
        })

      screenStreamRef.current =
        null
    }

    /*
     * Return the local teacher preview
     * to the normal camera stream.
     */
    if (
      teacherVideoRef.current &&
      localStreamRef.current
    ) {
      teacherVideoRef.current.srcObject =
        localStreamRef.current
    }

    if (
      screenShareVideoRef.current
    ) {
      screenShareVideoRef.current.srcObject =
        null
    }

    /*
     * Restore the CAMERA video track
     * for every student connection.
     *
     * Microphone/audio remains untouched.
     */
    const cameraTrack =
      localStreamRef.current
        ?.getVideoTracks()[0]

    if (cameraTrack) {
      peerConnectionsRef.current.forEach(
        (peer, studentId) => {
          const videoSender =
            peer
              .getSenders()
              .find(
                (sender) =>
                  sender.track?.kind ===
                  'video'
              )

          if (videoSender) {
            void videoSender
              .replaceTrack(
                cameraTrack
              )
              .then(() => {
                console.log(
                  '[TeacherScreenShare] Camera restored for student:',
                  studentId
                )
              })
              .catch((err) => {
                console.error(
                  '[TeacherScreenShare] Camera restore error:',
                  studentId,
                  err
                )
              })
          }
        }
      )
    }

    setIsScreenSharing(false)
    setScreenShareError('')

    console.log(
      '[TeacherScreenShare] Screen sharing stopped.'
    )
  }

  /*
   * ---------------------------------------------------------
   * MEDIA REALTIME CHANNEL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!id) return

    let mounted = true

    const channelName =
      `live-class-media-${id}`

    console.log(
      '[TeacherMedia] Joining media channel:',
      channelName
    )

    const channel =
      supabase
        .channel(channelName)
        .on(
          'broadcast',
          {
            event:
              'media-signal',
          },
          ({ payload }) => {
            if (!mounted) return

            const signal =
              payload as SignalMessage

            console.log(
              '[TeacherMedia] Signal received:',
              signal
            )

            void handleMediaSignal(
              signal
            )
          }
        )
        .subscribe(
          async (status) => {
            if (!mounted) return

            console.log(
              '[TeacherMedia] Media channel status:',
              status
            )

            if (
              status ===
              'SUBSCRIBED'
            ) {
              setMediaConnected(
                true
              )

              /*
               * Tell students that the teacher
               * is present.
               */
              try {
                await channel.send({
                  type:
                    'broadcast',

                  event:
                    'media-signal',

                  payload: {
                    type:
                      'student-joined',

                    from:
                      'teacher',
                  },
                })
              } catch (err) {
                console.error(
                  '[TeacherMedia] Presence broadcast error:',
                  err
                )
              }
            }
          }
        )

    mediaChannelRef.current =
      channel

    return () => {
      mounted = false

      const currentChannel =
        mediaChannelRef.current

      mediaChannelRef.current =
        null

      if (currentChannel) {
        supabase
          .removeChannel(
            currentChannel
          )
          .catch((err) => {
            console.error(
              '[TeacherMedia] Channel cleanup error:',
              err
            )
          })
      }
    }
  }, [id, supabase])

  /*
   * ---------------------------------------------------------
   * START MEDIA AFTER PAGE LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!liveClass) return

    void startTeacherMedia()

    return () => {
      /*
       * Stop screen sharing first.
       */
      const screenStream =
        screenStreamRef.current

      if (screenStream) {
        screenStream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          )

        screenStreamRef.current =
          null
      }

      screenShareActiveRef.current =
        false

      /*
       * Stop camera/microphone.
       */
      const stream =
        localStreamRef.current

      if (stream) {
        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          )

        localStreamRef.current =
          null
      }

      /*
       * Close student connections.
       */
      peerConnectionsRef.current.forEach(
        (peer) => {
          peer.close()
        }
      )

      peerConnectionsRef.current.clear()
    }
  }, [liveClass?.id])

  /*
   * ---------------------------------------------------------
   * MUTE / UNMUTE
   * ---------------------------------------------------------
   */

  function toggleMicrophone() {
    const stream =
      localStreamRef.current

    if (!stream) {
      void startTeacherMedia()
      return
    }

    const tracks =
      stream.getAudioTracks()

    if (tracks.length === 0) {
      return
    }

    const newState =
      !tracks[0].enabled

    tracks.forEach(
      (track) => {
        track.enabled =
          newState
      }
    )

    setMicEnabled(
      newState
    )

    console.log(
      '[TeacherMedia] Microphone:',
      newState
        ? 'ON'
        : 'OFF'
    )
  }

  /*
   * ---------------------------------------------------------
   * CAMERA ON / OFF
   * ---------------------------------------------------------
   */

  function toggleCamera() {
    /*
     * Do not allow camera switching
     * while screen sharing is active.
     *
     * The actual camera track remains available
     * so it can be restored when screen sharing ends.
     */
    const stream =
      localStreamRef.current

    if (!stream) {
      void startTeacherMedia()
      return
    }

    const tracks =
      stream.getVideoTracks()

    if (tracks.length === 0) {
      return
    }

    const newState =
      !tracks[0].enabled

    tracks.forEach(
      (track) => {
        track.enabled =
          newState
      }
    )

    setCameraEnabled(
      newState
    )

    console.log(
      '[TeacherMedia] Camera:',
      newState
        ? 'ON'
        : 'OFF'
    )
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f5f7fb',
          padding: '30px',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '18px',
            textAlign: 'center',
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              fontSize: '42px',
              marginBottom: '15px',
            }}
          >
            🎥
          </div>

          <h2
            style={{
              margin: 0,
              color: '#082b59',
            }}
          >
            Opening Classroom...
          </h2>

          <p
            style={{
              color: '#64748b',
              marginTop: '10px',
            }}
          >
            Please wait while we connect you
            to the live classroom.
          </p>
        </div>
      </main>
    )
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (error || !liveClass) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f5f7fb',
          padding: '30px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '650px',
            background: '#fff',
            padding: '35px',
            borderRadius: '18px',
            boxShadow:
              '0 4px 25px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              fontSize: '50px',
              marginBottom: '10px',
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              textAlign: 'center',
              color: '#991b1b',
            }}
          >
            Unable to Open Classroom
          </h2>

          <p
            style={{
              textAlign: 'center',
              color: '#475569',
              lineHeight: 1.6,
            }}
          >
            {error ||
              'Classroom not found.'}
          </p>

          {id && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '12px',
                marginTop: '20px',
                fontSize: '13px',
                color: '#475569',
                wordBreak: 'break-all',
              }}
            >
              <strong>
                Class ID:
              </strong>{' '}
              {id}
            </div>
          )}

          {diagnostics && (
            <details
              style={{
                marginTop: '20px',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#082b59',
                  fontWeight: 700,
                }}
              >
                Technical Diagnostics
              </summary>

              <pre
                style={{
                  marginTop: '12px',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '15px',
                  borderRadius: '10px',
                  overflowX: 'auto',
                  fontSize: '12px',
                }}
              >
                {diagnostics}
              </pre>
            </details>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '25px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              style={{
                background: '#0b5ed7',
                color: '#fff',
                border: 'none',
                padding: '11px 18px',
                borderRadius: '9px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Try Again
            </button>

            <Link
              href="/dashboard/live-classes"
              style={{
                display: 'inline-block',
                background: '#082b59',
                color: '#fff',
                padding: '11px 18px',
                borderRadius: '9px',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Back to Live Classes
            </Link>
          </div>
        </div>
      </main>
    )
  }

  /*
   * ---------------------------------------------------------
   * TEACHER CLASSROOM
   * ---------------------------------------------------------
   */

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#eef2f7',
      }}
    >
      {/* HEADER */}

      <header
        style={{
          minHeight: '72px',
          background: '#082b59',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 28px',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 800,
            }}
          >
            JOECH TUTOR
          </div>

          <div
            style={{
              fontSize: '13px',
              opacity: 0.8,
            }}
          >
            Live Classroom • Teacher Mode
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              background: mediaConnected
                ? '#166534'
                : '#92400e',
              padding: '7px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            ●{' '}
            {mediaConnected
              ? 'Media Connected'
              : 'Connecting Media'}
          </span>

          <Link
            href="/dashboard/live-classes"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              background:
                'rgba(255,255,255,0.12)',
              padding: '9px 14px',
              borderRadius: '8px',
            }}
          >
            ← Exit Classroom
          </Link>
        </div>
      </header>

      <div
        style={{
          padding: '25px',
        }}
      >
        {/* CLASS TITLE */}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display:
                  'inline-block',
                background:
                  liveClass.status ===
                  'live'
                    ? '#dcfce7'
                    : '#e0f2fe',
                color:
                  liveClass.status ===
                  'live'
                    ? '#15803d'
                    : '#0369a1',
                padding:
                  '5px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                marginBottom: '10px',
              }}
            >
              {liveClass.status.toUpperCase()}
            </div>

            <h1
              style={{
                margin: 0,
                color: '#082b59',
              }}
            >
              {liveClass.title}
            </h1>

            <p
              style={{
                margin: '6px 0 0',
                color: '#64748b',
              }}
            >
              {liveClass.subject}

              {liveClass.topic
                ? ` • ${liveClass.topic}`
                : ''}
            </p>
          </div>

          <div
            style={{
              background: '#fff',
              padding: '12px 18px',
              borderRadius: '10px',
              boxShadow:
                '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                color: '#64748b',
                display: 'block',
              }}
            >
              CLASS CODE
            </span>

            <div
              style={{
                fontWeight: 800,
                color: '#0b5ed7',
                letterSpacing: '2px',
                fontSize: '18px',
              }}
            >
              {liveClass.class_code}
            </div>
          </div>
        </div>

        {/* TEACHER MEDIA */}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) 300px',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          {/* TEACHER CAMERA / SCREEN */}

          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              minHeight: '280px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.12)',
            }}
          >
            {/* CAMERA */}

            <video
              ref={teacherVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                minHeight: '280px',
                objectFit: 'cover',
                display:
                  isScreenSharing ||
                  !cameraEnabled
                    ? 'none'
                    : 'block',
                transform:
                  'scaleX(-1)',
              }}
            />

            {/* SCREEN SHARE PREVIEW */}

            <video
              ref={screenShareVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                minHeight: '280px',
                objectFit: 'contain',
                background: '#020617',
                display:
                  isScreenSharing
                    ? 'block'
                    : 'none',
              }}
            />

            {/* CAMERA OFF */}

            {!cameraEnabled &&
              !isScreenSharing && (
                <div
                  style={{
                    minHeight: '280px',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '55px',
                        marginBottom: '8px',
                      }}
                    >
                      👤
                    </div>

                    <strong>
                      Camera is off
                    </strong>
                  </div>
                </div>
              )}

            {/* SCREEN SHARING LABEL */}

            {isScreenSharing && (
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background:
                    'rgba(220,38,38,0.9)',
                  color: '#fff',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                🖥️ SCREEN SHARING
              </div>
            )}

            {!isScreenSharing && (
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background:
                    'rgba(0,0,0,0.55)',
                  color: '#fff',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                🎥 Teacher
              </div>
            )}

            {/* CONTROL BUTTONS */}

            <div
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '50%',
                transform:
                  'translateX(-50%)',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {/* MICROPHONE */}

              <button
                type="button"
                onClick={
                  toggleMicrophone
                }
                style={{
                  width: '46px',
                  height: '46px',
                  border: 'none',
                  borderRadius:
                    '50%',
                  background:
                    micEnabled
                      ? '#0b5ed7'
                      : '#dc2626',
                  color: '#fff',
                  fontSize: '20px',
                  cursor:
                    'pointer',
                }}
                title={
                  micEnabled
                    ? 'Mute microphone'
                    : 'Unmute microphone'
                }
              >
                {micEnabled
                  ? '🎤'
                  : '🔇'}
              </button>

              {/* CAMERA */}

              <button
                type="button"
                onClick={
                  toggleCamera
                }
                disabled={
                  isScreenSharing
                }
                style={{
                  width: '46px',
                  height: '46px',
                  border: 'none',
                  borderRadius:
                    '50%',
                  background:
                    cameraEnabled
                      ? '#0b5ed7'
                      : '#dc2626',
                  color: '#fff',
                  fontSize: '20px',
                  cursor:
                    isScreenSharing
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    isScreenSharing
                      ? 0.55
                      : 1,
                }}
                title={
                  isScreenSharing
                    ? 'Stop screen sharing before changing camera'
                    : cameraEnabled
                      ? 'Turn camera off'
                      : 'Turn camera on'
                }
              >
                {cameraEnabled
                  ? '📹'
                  : '🚫'}
              </button>

              {/* SCREEN SHARE */}

              <button
                type="button"
                onClick={() => {
                  if (
                    isScreenSharing
                  ) {
                    void stopScreenSharing()
                  } else {
                    void startScreenSharing()
                  }
                }}
                disabled={
                  screenShareLoading
                }
                style={{
                  minWidth: '54px',
                  height: '46px',
                  border: 'none',
                  borderRadius:
                    '23px',
                  background:
                    isScreenSharing
                      ? '#dc2626'
                      : '#7c3aed',
                  color: '#fff',
                  fontSize: '18px',
                  cursor:
                    screenShareLoading
                      ? 'wait'
                      : 'pointer',
                  padding:
                    '0 15px',
                  fontWeight: 800,
                }}
                title={
                  isScreenSharing
                    ? 'Stop screen sharing'
                    : 'Share your screen'
                }
              >
                {screenShareLoading
                  ? '...'
                  : isScreenSharing
                    ? '🛑 Stop'
                    : '🖥️ Share'}
              </button>
            </div>

            {mediaLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background:
                    'rgba(15,23,42,0.75)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                Connecting camera
                and microphone...
              </div>
            )}
          </div>

          {/* MEDIA STATUS */}

          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: '#082b59',
              }}
            >
              🎥 Teacher Controls
            </h3>

            {/* MICROPHONE */}

            <div
              style={{
                padding: '12px',
                background:
                  '#f8fafc',
                borderRadius: '10px',
                marginBottom:
                  '10px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                Microphone
              </div>

              <strong
                style={{
                  color:
                    micEnabled
                      ? '#15803d'
                      : '#dc2626',
                }}
              >
                {micEnabled
                  ? '🎤 ON'
                  : '🔇 MUTED'}
              </strong>
            </div>

            {/* CAMERA */}

            <div
              style={{
                padding: '12px',
                background:
                  '#f8fafc',
                borderRadius: '10px',
                marginBottom:
                  '10px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                Camera
              </div>

              <strong
                style={{
                  color:
                    cameraEnabled
                      ? '#15803d'
                      : '#dc2626',
                }}
              >
                {cameraEnabled
                  ? '📹 ON'
                  : '🚫 OFF'}
              </strong>
            </div>

            {/* SCREEN SHARING STATUS */}

            <div
              style={{
                padding: '12px',
                background:
                  isScreenSharing
                    ? '#f5f3ff'
                    : '#f8fafc',
                borderRadius: '10px',
                marginBottom:
                  '10px',
                border:
                  isScreenSharing
                    ? '1px solid #ddd6fe'
                    : '1px solid transparent',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                Screen Sharing
              </div>

              <strong
                style={{
                  color:
                    isScreenSharing
                      ? '#7c3aed'
                      : '#64748b',
                }}
              >
                {isScreenSharing
                  ? '🖥️ ACTIVE'
                  : '○ NOT SHARING'}
              </strong>
            </div>

            {/* CONNECTION */}

            <div
              style={{
                padding: '12px',
                background:
                  '#f8fafc',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                Connection
              </div>

              <strong
                style={{
                  color:
                    mediaConnected
                      ? '#15803d'
                      : '#b45309',
                }}
              >
                {mediaConnected
                  ? '● Connected'
                  : '● Connecting'}
              </strong>
            </div>

            {mediaError && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '11px',
                  background:
                    '#fef2f2',
                  color: '#991b1b',
                  borderRadius: '9px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                }}
              >
                {mediaError}
              </div>
            )}

            {screenShareError && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '11px',
                  background:
                    '#fef2f2',
                  color: '#991b1b',
                  borderRadius: '9px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                }}
              >
                <strong>
                  Screen sharing:
                </strong>{' '}
                {screenShareError}
              </div>
            )}

            {!mediaConnected && (
              <button
                type="button"
                onClick={
                  startTeacherMedia
                }
                style={{
                  width: '100%',
                  marginTop: '14px',
                  border: 0,
                  borderRadius: '9px',
                  background:
                    '#0b5ed7',
                  color: '#fff',
                  padding: '11px',
                  fontWeight: 700,
                  cursor:
                    'pointer',
                }}
              >
                🎥 Enable Camera &
                Microphone
              </button>
            )}

            {/* SCREEN SHARE BUTTON */}

            <button
              type="button"
              onClick={() => {
                if (
                  isScreenSharing
                ) {
                  void stopScreenSharing()
                } else {
                  void startScreenSharing()
                }
              }}
              disabled={
                screenShareLoading
              }
              style={{
                width: '100%',
                marginTop: '10px',
                border: 0,
                borderRadius: '9px',
                background:
                  isScreenSharing
                    ? '#dc2626'
                    : '#7c3aed',
                color: '#fff',
                padding: '11px',
                fontWeight: 700,
                cursor:
                  screenShareLoading
                    ? 'wait'
                    : 'pointer',
              }}
            >
              {screenShareLoading
                ? 'Opening screen picker...'
                : isScreenSharing
                  ? '🛑 Stop Screen Sharing'
                  : '🖥️ Share Screen'}
            </button>
          </div>
        </section>

        {/* STUDENT VIDEO AREA */}

        <section
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '15px',
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#082b59',
              }}
            >
              👨‍🎓 Students on Camera
            </h3>

            <span
              style={{
                background:
                  '#e0f2fe',
                color: '#0369a1',
                padding:
                  '5px 10px',
                borderRadius:
                  '20px',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              {students.length}{' '}
              connected
            </span>
          </div>

          {students.length === 0 ? (
            <div
              style={{
                minHeight: '150px',
                display: 'grid',
                placeItems: 'center',
                background:
                  '#f8fafc',
                borderRadius: '12px',
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '40px',
                  }}
                >
                  👨‍🎓
                </div>

                <strong>
                  No students on camera
                  yet
                </strong>

                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '11px',
                  }}
                >
                  Students who join with
                  camera enabled will
                  appear here.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '15px',
              }}
            >
              {students.map(
                (student) => (
                  <StudentVideo
                    key={student.id}
                    student={student}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* BOARD + CHAT */}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) 300px',
            gap: '20px',
          }}
        >
          {/* TEACHING BOARD */}

          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              minHeight: '650px',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <LiveTeachingBoard
              liveClassId={
                liveClass.id
              }
            />
          </div>

          {/* CHAT */}

          <aside
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              minHeight: '500px',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection:
                'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                paddingBottom:
                  '13px',
                borderBottom:
                  '1px solid #edf0f4',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: '#082b59',
                }}
              >
                💬 Live Chat
              </h3>

              <span
                style={{
                  padding: '4px 9px',
                  borderRadius: '20px',
                  background:
                    chatConnected
                      ? '#dcfce7'
                      : '#fef3c7',
                  color:
                    chatConnected
                      ? '#15803d'
                      : '#b45309',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                {chatConnected
                  ? 'Online'
                  : 'Connecting'}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: '245px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding:
                  '12px 2px',
              }}
            >
              {messages.length ===
              0 ? (
                <div
                  style={{
                    height: '220px',
                    display: 'flex',
                    flexDirection:
                      'column',
                    justifyContent:
                      'center',
                    alignItems:
                      'center',
                    textAlign:
                      'center',
                    color:
                      '#94a3b8',
                  }}
                >
                  <div
                    style={{
                      fontSize: '35px',
                    }}
                  >
                    💬
                  </div>

                  <strong
                    style={{
                      color:
                        '#64748b',
                      fontSize:
                        '12px',
                    }}
                  >
                    No messages yet
                  </strong>

                  <span
                    style={{
                      marginTop:
                        '5px',
                      fontSize:
                        '10px',
                    }}
                  >
                    Start the class
                    conversation.
                  </span>
                </div>
              ) : (
                messages.map(
                  (item) => (
                    <div
                      key={item.id}
                      style={{
                        maxWidth:
                          '90%',
                        marginBottom:
                          '10px',
                        marginLeft:
                          item.sender ===
                          'teacher'
                            ? 'auto'
                            : '0',
                        padding:
                          '9px 11px',
                        borderRadius:
                          '10px',
                        background:
                          item.sender ===
                          'teacher'
                            ? '#eaf2ff'
                            : '#f1f5f9',
                        border:
                          '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            '9px',
                          fontWeight:
                            800,
                          color:
                            item.sender ===
                            'teacher'
                              ? '#0b5ed7'
                              : '#082b59',
                          marginBottom:
                            '3px',
                        }}
                      >
                        {item.name}
                      </div>

                      <div
                        style={{
                          color:
                            '#334155',
                          fontSize:
                            '12px',
                          lineHeight:
                            1.45,
                          wordBreak:
                            'break-word',
                        }}
                      >
                        {item.message}
                      </div>

                      <div
                        style={{
                          marginTop:
                            '4px',
                          color:
                            '#94a3b8',
                          fontSize:
                            '8px',
                          textAlign:
                            'right',
                        }}
                      >
                        {new Date(
                          item.createdAt
                        ).toLocaleTimeString(
                          [],
                          {
                            hour:
                              '2-digit',
                            minute:
                              '2-digit',
                          }
                        )}
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '7px',
                borderTop:
                  '1px solid #edf0f4',
                paddingTop: '12px',
              }}
            >
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleChatKeyDown
                }
                placeholder={
                  chatConnected
                    ? 'Type a message...'
                    : 'Connecting...'
                }
                disabled={
                  !chatConnected ||
                  sending
                }
                maxLength={500}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border:
                    '1px solid #dce2ea',
                  borderRadius: '8px',
                  padding: '9px',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />

              <button
                type="button"
                onClick={() =>
                  void sendMessage()
                }
                disabled={
                  !chatConnected ||
                  !message.trim() ||
                  sending
                }
                style={{
                  border: 0,
                  borderRadius: '8px',
                  padding:
                    '9px 12px',
                  background:
                    '#0b5ed7',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor:
                    'pointer',
                  opacity:
                    !chatConnected ||
                    !message.trim() ||
                    sending
                      ? 0.5
                      : 1,
                }}
              >
                {sending
                  ? '...'
                  : 'Send'}
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

/*
 * ---------------------------------------------------------
 * STUDENT VIDEO COMPONENT
 * ---------------------------------------------------------
 */

function StudentVideo({
  student,
}: {
  student: StudentConnection
}) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    )

  useEffect(() => {
    if (
      videoRef.current &&
      student.stream
    ) {
      videoRef.current.srcObject =
        student.stream
    }
  }, [student.stream])

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '170px',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '170px',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {!student.stream && (
        <div
          style={{
            height: '170px',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          👨‍🎓
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: '8px',
          bottom: '8px',
          background:
            'rgba(0,0,0,0.65)',
          color: '#fff',
          padding: '5px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: 700,
        }}
      >
        {student.name}
      </div>
    </div>
  )
}