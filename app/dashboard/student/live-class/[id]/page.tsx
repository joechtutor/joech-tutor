'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { useParams } from 'next/navigation'
import { supabaseBrowser } from '../../../../../lib/supabase-browser'

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

type SignalType =
  | 'student-hello'
  | 'teacher-hello'
  | 'student-joined'
  | 'teacher-joined'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'student-left'
  | 'teacher-left'

type SignalMessage = {
  type: SignalType
  from: string
  to?: string
  data?: unknown
  name?: string
  timestamp?: number
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

export default function StudentLiveClassPage() {
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

  const [teacherConnected, setTeacherConnected] =
    useState(false)

  const [teacherStream, setTeacherStream] =
    useState<MediaStream | null>(null)

  /*
   * IMPORTANT:
   *
   * Teacher video starts muted because modern browsers can block
   * unmuted autoplay. The student can enable teacher sound using
   * the button shown on the teacher video.
   */
  const [teacherVideoMuted, setTeacherVideoMuted] =
    useState(true)

  const [teacherVideoPlaying, setTeacherVideoPlaying] =
    useState(false)

  const [teacherTrackInfo, setTeacherTrackInfo] =
    useState('Waiting for teacher media...')

  const localVideoRef =
    useRef<HTMLVideoElement | null>(null)

  const teacherVideoRef =
    useRef<HTMLVideoElement | null>(null)

  const localStreamRef =
    useRef<MediaStream | null>(null)

  const teacherPeerRef =
    useRef<RTCPeerConnection | null>(null)

  /*
   * Keep one persistent remote MediaStream.
   *
   * This is important because some browsers/WebRTC configurations
   * may deliver audio/video tracks without event.streams[0].
   * The previous implementation could create a separate stream
   * for each track and accidentally replace the video stream with
   * the audio stream.
   */
  const teacherStreamRef =
    useRef<MediaStream | null>(null)

  const mediaChannelRef =
    useRef<any>(null)

  const chatChannelRef =
    useRef<any>(null)

  const studentIdRef =
    useRef<string>('')

  const studentNameRef =
    useRef<string>('Student')

  const subscribedRef =
    useRef(false)

  const remoteDescriptionSetRef =
    useRef(false)

  const pendingIceCandidatesRef =
    useRef<RTCIceCandidateInit[]>([])

  const teacherPresentRef =
    useRef(false)

  const mountedRef =
    useRef(true)

  const offerInProgressRef =
    useRef(false)

  /*
   * ---------------------------------------------------------
   * GET CURRENT STUDENT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    mountedRef.current = true

    async function loadCurrentStudent() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error(
            '[StudentLiveClass] Auth error:',
            userError
          )
        }

        if (!user?.id) {
          console.warn(
            '[StudentLiveClass] No authenticated user found.'
          )

          return
        }

        studentIdRef.current = user.id

        const metadataName =
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === 'string'
              ? user.user_metadata.name
              : ''

        if (metadataName.trim()) {
          studentNameRef.current =
            metadataName.trim()
        } else if (user.email) {
          studentNameRef.current =
            user.email.split('@')[0] || 'Student'
        }

        console.log(
          '[StudentLiveClass] Student identity:',
          {
            id: studentIdRef.current,
            name: studentNameRef.current,
          }
        )
      } catch (err) {
        console.error(
          '[StudentLiveClass] Unable to identify student:',
          err
        )
      }
    }

    void loadCurrentStudent()

    return () => {
      mountedRef.current = false
    }
  }, [supabase])

  /*
   * ---------------------------------------------------------
   * LOAD LIVE CLASS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false

    async function loadClass() {
      if (!id) {
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
          `/api/live-classes/${encodeURIComponent(id)}`

        console.log(
          '[StudentLiveClass] Loading:',
          apiUrl
        )

        const response =
          await fetch(apiUrl, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          })

        const text =
          await response.text()

        let data: {
          success?: boolean
          liveClass?: LiveClass
          error?: string
          details?: string
          diagnostics?: Record<string, unknown>
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
          if (!cancelled) {
            setDiagnostics(
              data.diagnostics
                ? JSON.stringify(
                    data.diagnostics,
                    null,
                    2
                  )
                : ''
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
              'The classroom API returned no live class data.'
            )
          }

          return
        }

        console.log(
          '[StudentLiveClass] Class loaded:',
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
          '[StudentLiveClass] Load error:',
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
   * ATTACH LOCAL VIDEO
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const video =
      localVideoRef.current

    const stream =
      localStreamRef.current

    if (!video || !stream) {
      return
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    video.muted = true
    video.playsInline = true
    video.autoplay = true

    void video.play().catch((err) => {
      console.warn(
        '[StudentMedia] Local video autoplay blocked:',
        err
      )
    })
  }, [
    cameraEnabled,
    mediaConnected,
  ])

  /*
   * ---------------------------------------------------------
   * ATTACH TEACHER VIDEO
   * ---------------------------------------------------------
   *
   * This is one of the main fixes.
   *
   * The teacher video is initially muted so the browser allows
   * autoplay. Muting the video does NOT remove the teacher's
   * audio track. The student can enable the audio manually.
   */

  useEffect(() => {
    const video =
      teacherVideoRef.current

    const stream =
      teacherStream

    if (!video || !stream) {
      return
    }

    console.log(
      '[StudentMedia] Attaching teacher stream to video element.',
      {
        streamId: stream.id,
        tracks: stream.getTracks().map(
          (track) => ({
            id: track.id,
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
          })
        ),
      }
    )

    video.srcObject = stream

    video.autoplay = true
    video.playsInline = true

    /*
     * Keep muted for reliable autoplay.
     */
    video.muted = teacherVideoMuted

    const handleLoadedMetadata = () => {
      console.log(
        '[StudentMedia] Teacher video metadata loaded.',
        {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
        }
      )

      void video.play().then(() => {
        console.log(
          '[StudentMedia] Teacher video PLAYING successfully.'
        )

        if (mountedRef.current) {
          setTeacherVideoPlaying(true)
        }
      }).catch((err) => {
        console.warn(
          '[StudentMedia] Teacher video play failed:',
          err
        )

        if (mountedRef.current) {
          setTeacherVideoPlaying(false)
        }
      })
    }

    video.addEventListener(
      'loadedmetadata',
      handleLoadedMetadata
    )

    /*
     * Try immediately too, in case metadata has already loaded.
     */
    if (
      video.readyState >= 1
    ) {
      void video.play().then(() => {
        if (mountedRef.current) {
          setTeacherVideoPlaying(true)
        }
      }).catch((err) => {
        console.warn(
          '[StudentMedia] Immediate teacher video play failed:',
          err
        )
      })
    }

    return () => {
      video.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      )
    }
  }, [
    teacherStream,
    teacherVideoMuted,
  ])

  /*
   * ---------------------------------------------------------
   * TEACHER VIDEO SOUND
   * ---------------------------------------------------------
   */

  function toggleTeacherSound() {
    const video =
      teacherVideoRef.current

    if (!video) {
      console.warn(
        '[StudentMedia] Teacher video element is not available.'
      )

      return
    }

    const nextMuted =
      !video.muted

    video.muted =
      nextMuted

    setTeacherVideoMuted(
      nextMuted
    )

    console.log(
      '[StudentMedia] Teacher sound:',
      nextMuted
        ? 'MUTED'
        : 'ON'
    )

    void video.play().then(() => {
      setTeacherVideoPlaying(true)
    }).catch((err) => {
      console.warn(
        '[StudentMedia] Teacher video play after sound change failed:',
        err
      )
    })
  }

  /*
   * ---------------------------------------------------------
   * UPDATE TEACHER TRACK INFORMATION
   * ---------------------------------------------------------
   */

  const updateTeacherTrackInfo =
    useCallback(
      (stream: MediaStream) => {
        const tracks =
          stream.getTracks()

        const videoTracks =
          stream.getVideoTracks()

        const audioTracks =
          stream.getAudioTracks()

        const videoReady =
          videoTracks.filter(
            (track) =>
              track.readyState ===
              'live'
          ).length

        const audioReady =
          audioTracks.filter(
            (track) =>
              track.readyState ===
              'live'
          ).length

        const info =
          `Video: ${videoTracks.length} (${videoReady} live) • Audio: ${audioTracks.length} (${audioReady} live) • Total tracks: ${tracks.length}`

        console.log(
          '[StudentMedia] Teacher track status:',
          info
        )

        if (mountedRef.current) {
          setTeacherTrackInfo(
            info
          )
        }
      },
      []
    )

  /*
   * ---------------------------------------------------------
   * SEND MEDIA SIGNAL
   * ---------------------------------------------------------
   */

  const sendMediaSignal =
    useCallback(
      async (
        signal: SignalMessage
      ) => {
        const channel =
          mediaChannelRef.current

        if (!channel) {
          console.warn(
            '[StudentMedia] Cannot send signal; channel missing:',
            signal
          )

          return false
        }

        if (!subscribedRef.current) {
          console.warn(
            '[StudentMedia] Cannot send signal; channel is not subscribed:',
            signal.type
          )

          return false
        }

        try {
          const result =
            await channel.send({
              type: 'broadcast',
              event: 'media-signal',
              payload: {
                ...signal,
                timestamp: Date.now(),
              },
            })

          console.log(
            '[StudentMedia] Signal sent:',
            signal.type,
            result
          )

          return result === 'ok'
        } catch (err) {
          console.error(
            '[StudentMedia] Signal send error:',
            err
          )

          return false
        }
      },
      []
    )

  /*
   * ---------------------------------------------------------
   * CREATE STUDENT PEER CONNECTION
   * ---------------------------------------------------------
   */

  const createTeacherPeerConnection =
    useCallback(() => {
      if (
        teacherPeerRef.current &&
        teacherPeerRef.current.connectionState !==
          'closed'
      ) {
        return teacherPeerRef.current
      }

      console.log(
        '[StudentMedia] Creating NEW peer connection.'
      )

      const peer =
        new RTCPeerConnection(
          ICE_SERVERS
        )

      /*
       * Add student's local tracks.
       */

      const localStream =
        localStreamRef.current

      if (localStream) {
        localStream
          .getTracks()
          .forEach((track) => {
            console.log(
              '[StudentMedia] Adding local track:',
              {
                kind: track.kind,
                id: track.id,
                enabled: track.enabled,
              }
            )

            try {
              peer.addTrack(
                track,
                localStream
              )
            } catch (err) {
              console.error(
                '[StudentMedia] Failed to add local track:',
                err
              )
            }
          })
      }

      /*
       * ICE candidates generated by student.
       */

      peer.onicecandidate =
        (event) => {
          if (!event.candidate) {
            return
          }

          console.log(
            '[StudentMedia] Local ICE candidate generated.'
          )

          void sendMediaSignal({
            type: 'ice-candidate',
            from:
              studentIdRef.current ||
              'student',
            to: 'teacher',
            data:
              event.candidate.toJSON(),
            name:
              studentNameRef.current,
          })
        }

      /*
       * Teacher audio/video arrives here.
       *
       * MAIN FIX:
       *
       * We maintain ONE persistent MediaStream and add every
       * received track to it.
       *
       * This prevents an audio track from replacing the video
       * track when event.streams[0] is missing or inconsistent.
       */

      peer.ontrack =
        (event) => {
          console.log(
            '[StudentMedia] ==============================='
          )

          console.log(
            '[StudentMedia] REMOTE TRACK RECEIVED'
          )

          console.log(
            '[StudentMedia] Track:',
            {
              kind: event.track.kind,
              id: event.track.id,
              enabled: event.track.enabled,
              muted: event.track.muted,
              readyState: event.track.readyState,
            }
          )

          console.log(
            '[StudentMedia] event.streams:',
            event.streams
          )

          /*
           * Reuse existing stream if possible.
           */
          let stream =
            teacherStreamRef.current

          /*
           * If browser supplied a stream, prefer it as the
           * base stream when we do not have one yet.
           */
          if (
            !stream &&
            event.streams &&
            event.streams.length > 0
          ) {
            stream =
              event.streams[0]

            teacherStreamRef.current =
              stream

            console.log(
              '[StudentMedia] Using browser-provided remote stream:',
              stream.id
            )
          }

          /*
           * Otherwise create our own persistent stream.
           */
          if (!stream) {
            stream =
              new MediaStream()

            teacherStreamRef.current =
              stream

            console.log(
              '[StudentMedia] Created persistent remote MediaStream:',
              stream.id
            )
          }

          /*
           * Add the incoming track if it is not already present.
           */
          const existingTrack =
            stream
              .getTracks()
              .find(
                (track) =>
                  track.id ===
                  event.track.id
              )

          if (!existingTrack) {
            try {
              stream.addTrack(
                event.track
              )

              console.log(
                '[StudentMedia] Added remote track to teacher stream:',
                event.track.kind
              )
            } catch (err) {
              console.error(
                '[StudentMedia] Could not add remote track:',
                err
              )
            }
          }

          /*
           * Track ended handler.
           */
          event.track.onended =
            () => {
              console.warn(
                '[StudentMedia] Teacher track ended:',
                {
                  kind:
                    event.track.kind,
                  id:
                    event.track.id,
                }
              )

              updateTeacherTrackInfo(
                stream!
              )
            }

          /*
           * Track mute/unmute diagnostics.
           */
          event.track.onmute =
            () => {
              console.warn(
                '[StudentMedia] Teacher track MUTED:',
                event.track.kind
              )

              updateTeacherTrackInfo(
                stream!
              )
            }

          event.track.onunmute =
            () => {
              console.log(
                '[StudentMedia] Teacher track UNMUTED:',
                event.track.kind
              )

              updateTeacherTrackInfo(
                stream!
              )
            }

          updateTeacherTrackInfo(
            stream
          )

          setTeacherStream(
            stream
          )

          setTeacherConnected(
            true
          )

          teacherPresentRef.current =
            true

          /*
           * Force the video element to receive the stream.
           */
          const video =
            teacherVideoRef.current

          if (video) {
            console.log(
              '[StudentMedia] Immediately attaching teacher stream to video element.'
            )

            video.srcObject =
              stream

            video.autoplay = true
            video.playsInline = true

            /*
             * Start muted so autoplay is permitted.
             */
            video.muted =
              teacherVideoMuted

            void video.play().then(() => {
              console.log(
                '[StudentMedia] Teacher video started after remote track.'
              )

              if (mountedRef.current) {
                setTeacherVideoPlaying(
                  true
                )
              }
            }).catch((err) => {
              console.warn(
                '[StudentMedia] Teacher video could not start automatically:',
                err
              )

              if (mountedRef.current) {
                setTeacherVideoPlaying(
                  false
                )
              }
            })
          }

          console.log(
            '[StudentMedia] Final teacher stream tracks:',
            stream.getTracks().map(
              (track) => ({
                id: track.id,
                kind: track.kind,
                enabled: track.enabled,
                readyState:
                  track.readyState,
                muted: track.muted,
              })
            )
          )

          console.log(
            '[StudentMedia] ==============================='
          )
        }

      /*
       * Connection state.
       */

      peer.onconnectionstatechange =
        () => {
          console.log(
            '[StudentMedia] Peer connection state:',
            peer.connectionState
          )

          if (
            peer.connectionState ===
              'connected'
          ) {
            setTeacherConnected(
              true
            )

            teacherPresentRef.current =
              true

            setMediaError('')
          }

          if (
            peer.connectionState ===
              'connecting'
          ) {
            console.log(
              '[StudentMedia] Peer is connecting...'
            )
          }

          if (
            peer.connectionState ===
              'disconnected'
          ) {
            console.warn(
              '[StudentMedia] Peer temporarily disconnected.'
            )
          }

          if (
            peer.connectionState ===
              'failed'
          ) {
            console.error(
              '[StudentMedia] Peer connection FAILED.'
            )

            setTeacherConnected(
              false
            )

            setTeacherVideoPlaying(
              false
            )

            /*
             * Do not immediately destroy the remote stream.
             * This allows diagnostics and reconnection logic
             * to work more reliably.
             */
          }

          if (
            peer.connectionState ===
              'closed'
          ) {
            setTeacherConnected(
              false
            )

            setTeacherVideoPlaying(
              false
            )
          }
        }

      /*
       * ICE state.
       */

      peer.oniceconnectionstatechange =
        () => {
          console.log(
            '[StudentMedia] ICE state:',
            peer.iceConnectionState
          )

          if (
            peer.iceConnectionState ===
            'failed'
          ) {
            console.error(
              '[StudentMedia] ICE connection FAILED.'
            )

            setMediaError(
              'The video connection could not establish a network path to the teacher. Please check the internet connection on both devices.'
            )
          }
        }

      /*
       * Signalling state.
       */

      peer.onsignalingstatechange =
        () => {
          console.log(
            '[StudentMedia] Signaling state:',
            peer.signalingState
          )
        }

      /*
       * ICE gathering diagnostics.
       */

      peer.onicegatheringstatechange =
        () => {
          console.log(
            '[StudentMedia] ICE gathering state:',
            peer.iceGatheringState
          )
        }

      teacherPeerRef.current =
        peer

      return peer
    }, [
      sendMediaSignal,
      teacherVideoMuted,
      updateTeacherTrackInfo,
    ])

  /*
   * ---------------------------------------------------------
   * FLUSH PENDING ICE
   * ---------------------------------------------------------
   */

  const flushPendingIce =
    useCallback(
      async (
        peer: RTCPeerConnection
      ) => {
        if (
          !peer.remoteDescription
        ) {
          return
        }

        const pending =
          pendingIceCandidatesRef.current

        pendingIceCandidatesRef.current =
          []

        console.log(
          '[StudentMedia] Flushing pending ICE candidates:',
          pending.length
        )

        for (
          const candidate of pending
        ) {
          try {
            await peer.addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            )

            console.log(
              '[StudentMedia] Queued ICE candidate added.'
            )
          } catch (err) {
            console.error(
              '[StudentMedia] Failed to add queued ICE candidate:',
              err
            )
          }
        }
      },
      []
    )

  /*
   * ---------------------------------------------------------
   * HANDLE MEDIA SIGNAL
   * ---------------------------------------------------------
   */

  const handleMediaSignal =
    useCallback(
      async (
        signal: SignalMessage
      ) => {
        console.log(
          '[StudentMedia] SIGNAL RECEIVED:',
          signal
        )

        /*
         * Ignore our own signal.
         */
        if (
          signal.from ===
          studentIdRef.current
        ) {
          return
        }

        /*
         * Ignore signals meant for another student.
         */
        if (
          signal.to &&
          signal.to !== 'student' &&
          signal.to !==
            studentIdRef.current
        ) {
          return
        }

        /*
         * Teacher signals.
         *
         * We intentionally accept teacher-originated ICE and
         * offer messages even if the teacher uses a real user ID
         * rather than the literal "teacher".
         */

        const isTeacherSignal =
          signal.from === 'teacher' ||
          signal.from === 'teacher-presence' ||
          signal.type === 'teacher-hello' ||
          signal.type === 'teacher-joined' ||
          signal.type === 'offer' ||
          signal.type === 'ice-candidate' ||
          signal.type === 'teacher-left'

        if (!isTeacherSignal) {
          return
        }

        try {
          /*
           * -------------------------------------------------
           * TEACHER HELLO
           * -------------------------------------------------
           */

          if (
            signal.type ===
              'teacher-hello' ||
            signal.type ===
              'teacher-joined'
          ) {
            console.log(
              '[StudentMedia] TEACHER IS PRESENT.'
            )

            teacherPresentRef.current =
              true

            setTeacherConnected(
              true
            )

            /*
             * Tell teacher student is ready.
             */
            await sendMediaSignal({
              type: 'student-joined',
              from:
                studentIdRef.current ||
                'student',
              to: 'teacher',
              name:
                studentNameRef.current ||
                'Student',
            })

            if (
              localStreamRef.current
            ) {
              await sendMediaSignal({
                type: 'student-hello',
                from:
                  studentIdRef.current ||
                  'student',
                to: 'teacher',
                name:
                  studentNameRef.current ||
                  'Student',
              })
            }

            return
          }

          /*
           * -------------------------------------------------
           * OFFER FROM TEACHER
           * -------------------------------------------------
           */

          if (
            signal.type ===
            'offer'
          ) {
            console.log(
              '[StudentMedia] ================================='
            )

            console.log(
              '[StudentMedia] OFFER RECEIVED FROM TEACHER.'
            )

            teacherPresentRef.current =
              true

            setTeacherConnected(
              true
            )

            /*
             * Validate offer.
             */

            const offer =
              signal.data as RTCSessionDescriptionInit

            if (
              !offer ||
              !offer.type ||
              !offer.sdp
            ) {
              console.error(
                '[StudentMedia] INVALID OFFER RECEIVED:',
                offer
              )

              setMediaError(
                'The teacher sent an invalid video connection offer.'
              )

              return
            }

            console.log(
              '[StudentMedia] Offer type:',
              offer.type
            )

            console.log(
              '[StudentMedia] Offer SDP length:',
              offer.sdp.length
            )

            /*
             * Prevent simultaneous duplicate offer handling.
             */
            if (
              offerInProgressRef.current
            ) {
              console.warn(
                '[StudentMedia] Another offer is already being processed.'
              )

              return
            }

            offerInProgressRef.current =
              true

            try {
              let peer =
                teacherPeerRef.current

              /*
               * Recreate peer only if it is unusable.
               */
              if (
                peer &&
                (
                  peer.connectionState ===
                    'failed' ||
                  peer.connectionState ===
                    'closed'
                )
              ) {
                console.warn(
                  '[StudentMedia] Existing peer unusable. Recreating.'
                )

                peer.close()

                teacherPeerRef.current =
                  null

                peer =
                  null
              }

              if (!peer) {
                peer =
                  createTeacherPeerConnection()
              }

              console.log(
                '[StudentMedia] Current signaling state before offer:',
                peer.signalingState
              )

              /*
               * If an identical/repeated offer arrives while
               * processing another negotiation, ignore it.
               */
              if (
                peer.signalingState !==
                'stable'
              ) {
                console.warn(
                  '[StudentMedia] Peer is not stable. Current state:',
                  peer.signalingState
                )

                /*
                 * If remote description is already the same type,
                 * do not process duplicate offer.
                 */
                if (
                  peer.remoteDescription?.type ===
                  'offer'
                ) {
                  console.log(
                    '[StudentMedia] Ignoring duplicate offer.'
                  )

                  return
                }

                /*
                 * Otherwise reset the connection.
                 */
                try {
                  peer.close()
                } catch {
                  // Ignore close failure.
                }

                teacherPeerRef.current =
                  null

                peer =
                  createTeacherPeerConnection()
              }

              /*
               * Set teacher offer as remote description.
               */

              await peer.setRemoteDescription(
                new RTCSessionDescription(
                  offer
                )
              )

              remoteDescriptionSetRef.current =
                true

              console.log(
                '[StudentMedia] Teacher offer set as remote description.'
              )

              /*
               * Add ICE candidates that arrived before the offer.
               */

              await flushPendingIce(
                peer
              )

              /*
               * Make sure student's local tracks exist.
               */

              const localStream =
                localStreamRef.current

              if (localStream) {
                const senders =
                  peer.getSenders()

                for (
                  const track of localStream.getTracks()
                ) {
                  const existingSender =
                    senders.find(
                      (sender) =>
                        sender.track?.kind ===
                        track.kind
                    )

                  if (
                    existingSender
                  ) {
                    try {
                      await existingSender.replaceTrack(
                        track
                      )

                      console.log(
                        '[StudentMedia] Local track replaced:',
                        track.kind
                      )
                    } catch (err) {
                      console.warn(
                        '[StudentMedia] Could not replace existing track:',
                        err
                      )
                    }
                  } else {
                    try {
                      peer.addTrack(
                        track,
                        localStream
                      )

                      console.log(
                        '[StudentMedia] Local track added after offer:',
                        track.kind
                      )
                    } catch (err) {
                      console.warn(
                        '[StudentMedia] Could not add local track after offer:',
                        err
                      )
                    }
                  }
                }
              }

              /*
               * Create answer.
               */

              console.log(
                '[StudentMedia] Creating answer...'
              )

              const answer =
                await peer.createAnswer()

              await peer.setLocalDescription(
                answer
              )

              console.log(
                '[StudentMedia] Local answer created.'
              )

              /*
               * Send answer to teacher.
               */

              const localDescription =
                peer.localDescription

              await sendMediaSignal({
                type: 'answer',
                from:
                  studentIdRef.current ||
                  'student',
                to: 'teacher',
                data:
                  localDescription?.toJSON() ||
                  answer,
                name:
                  studentNameRef.current ||
                  'Student',
              })

              console.log(
                '[StudentMedia] ANSWER SENT TO TEACHER.'
              )

              console.log(
                '[StudentMedia] ================================='
              )
            } finally {
              offerInProgressRef.current =
                false
            }

            return
          }

          /*
           * -------------------------------------------------
           * TEACHER ICE CANDIDATE
           * -------------------------------------------------
           */

          if (
            signal.type ===
            'ice-candidate'
          ) {
            const candidate =
              signal.data as RTCIceCandidateInit

            if (!candidate) {
              return
            }

            const peer =
              createTeacherPeerConnection()

            /*
             * ICE can arrive before the offer.
             */

            if (
              !peer.remoteDescription
            ) {
              console.log(
                '[StudentMedia] Queueing ICE candidate until remote description exists.'
              )

              pendingIceCandidatesRef.current.push(
                candidate
              )

              return
            }

            try {
              await peer.addIceCandidate(
                new RTCIceCandidate(
                  candidate
                )
              )

              console.log(
                '[StudentMedia] Teacher ICE candidate added.'
              )
            } catch (err) {
              console.error(
                '[StudentMedia] ICE candidate error:',
                err
              )
            }

            return
          }

          /*
           * -------------------------------------------------
           * TEACHER LEFT
           * -------------------------------------------------
           */

          if (
            signal.type ===
            'teacher-left'
          ) {
            console.log(
              '[StudentMedia] TEACHER LEFT.'
            )

            teacherPresentRef.current =
              false

            remoteDescriptionSetRef.current =
              false

            pendingIceCandidatesRef.current =
              []

            offerInProgressRef.current =
              false

            setTeacherConnected(
              false
            )

            setTeacherVideoPlaying(
              false
            )

            setTeacherStream(
              null
            )

            teacherStreamRef.current =
              null

            if (
              teacherPeerRef.current
            ) {
              teacherPeerRef.current.close()

              teacherPeerRef.current =
                null
            }

            return
          }
        } catch (err) {
          console.error(
            '[StudentMedia] Signal handling error:',
            err
          )

          setMediaError(
            err instanceof Error
              ? err.message
              : 'A video connection error occurred.'
          )
        }
      },
      [
        createTeacherPeerConnection,
        flushPendingIce,
        sendMediaSignal,
      ]
    )

  /*
   * ---------------------------------------------------------
   * MEDIA REALTIME CHANNEL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!id) {
      return
    }

    let mounted = true

    const channelName =
      `live-class-media-${id}`

    console.log(
      '[StudentMedia] Joining channel:',
      channelName
    )

    const channel =
      supabase
        .channel(channelName, {
          config: {
            broadcast: {
              self: false,
            },
          },
        })
        .on(
          'broadcast',
          {
            event: 'media-signal',
          },
          ({ payload }) => {
            if (!mounted) {
              return
            }

            const signal =
              payload as SignalMessage

            if (
              !signal ||
              !signal.type
            ) {
              console.warn(
                '[StudentMedia] Invalid signal received:',
                payload
              )

              return
            }

            void handleMediaSignal(
              signal
            )
          }
        )
        .subscribe(
          async (status, err) => {
            if (!mounted) {
              return
            }

            console.log(
              '[StudentMedia] Media realtime channel status:',
              status
            )

            if (err) {
              console.error(
                '[StudentMedia] Media realtime channel error:',
                err
              )

              try {
                console.error(
                  '[StudentMedia] FULL REALTIME ERROR:',
                  JSON.stringify(
                    err,
                    Object.getOwnPropertyNames(err),
                    2
                  )
                )
              } catch {
                console.error(
                  '[StudentMedia] Could not serialize realtime error.'
                )
              }
            }

            if (
              status ===
              'SUBSCRIBED'
            ) {
              subscribedRef.current =
                true

              setMediaConnected(
                true
              )

              setMediaError('')

              console.log(
                '[StudentMedia] Media channel successfully subscribed.'
              )

              /*
               * Tell teacher the student is ready.
               */

              await sendMediaSignal({
                type: 'student-joined',
                from:
                  studentIdRef.current ||
                  'student',
                to: 'teacher',
                name:
                  studentNameRef.current ||
                  'Student',
              })

              await sendMediaSignal({
                type: 'student-hello',
                from:
                  studentIdRef.current ||
                  'student',
                to: 'teacher',
                name:
                  studentNameRef.current ||
                  'Student',
              })

              console.log(
                '[StudentMedia] Student presence sent.'
              )

              return
            }

            if (
              status ===
                'CHANNEL_ERROR' ||
              status ===
                'TIMED_OUT' ||
              status ===
                'CLOSED'
            ) {
              subscribedRef.current =
                false

              setMediaConnected(
                false
              )

              const statusMessage =
                status ===
                'CHANNEL_ERROR'
                  ? 'The live video signalling channel could not connect.'
                  : status ===
                      'TIMED_OUT'
                    ? 'The live video signalling channel timed out.'
                    : 'The live video signalling channel was closed.'

              setMediaError(
                statusMessage
              )

              console.error(
                '[StudentMedia] Media channel problem:',
                status,
                err
              )

              if (err) {
                try {
                  console.error(
                    '[StudentMedia] FULL REALTIME ERROR:',
                    JSON.stringify(
                      err,
                      Object.getOwnPropertyNames(
                        err
                      ),
                      2
                    )
                  )
                } catch {
                  console.error(
                    '[StudentMedia] Realtime error could not be serialized.'
                  )
                }
              }

              return
            }
          }
        )

    mediaChannelRef.current =
      channel

    return () => {
      mounted = false

      subscribedRef.current =
        false

      const currentChannel =
        mediaChannelRef.current

      mediaChannelRef.current =
        null

      /*
       * Tell teacher student is leaving.
       */

      if (currentChannel) {
        void currentChannel
          .send({
            type: 'broadcast',
            event: 'media-signal',
            payload: {
              type: 'student-left',
              from:
                studentIdRef.current ||
                'student',
              to: 'teacher',
              name:
                studentNameRef.current ||
                'Student',
              timestamp: Date.now(),
            } satisfies SignalMessage,
          })
          .catch(() => {
            // Channel may already be closed.
          })

        void supabase
          .removeChannel(
            currentChannel
          )
      }
    }
  }, [
    id,
    supabase,
    handleMediaSignal,
    sendMediaSignal,
  ])

  /*
   * ---------------------------------------------------------
   * START STUDENT MEDIA
   * ---------------------------------------------------------
   */

  const startStudentMedia =
    useCallback(
      async () => {
        if (
          typeof navigator ===
            'undefined' ||
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setMediaError(
            'Your browser does not support camera and microphone access.'
          )

          return
        }

        if (
          localStreamRef.current
        ) {
          /*
           * Media already exists.
           */

          if (
            subscribedRef.current
          ) {
            await sendMediaSignal({
              type: 'student-joined',
              from:
                studentIdRef.current ||
                'student',
              to: 'teacher',
              name:
                studentNameRef.current ||
                'Student',
            })

            await sendMediaSignal({
              type: 'student-hello',
              from:
                studentIdRef.current ||
                'student',
              to: 'teacher',
              name:
                studentNameRef.current ||
                'Student',
            })
          }

          /*
           * Reattach local video.
           */
          const localVideo =
            localVideoRef.current

          if (
            localVideo &&
            localVideo.srcObject !==
              localStreamRef.current
          ) {
            localVideo.srcObject =
              localStreamRef.current

            localVideo.muted =
              true

            void localVideo.play().catch(
              () => {
                // Browser autoplay restriction.
              }
            )
          }

          return
        }

        setMediaLoading(
          true
        )

        setMediaError('')

        try {
          console.log(
            '[StudentMedia] Requesting camera/microphone...'
          )

          const stream =
            await navigator.mediaDevices.getUserMedia({
              video: {
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
                facingMode: 'user',
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            })

          console.log(
            '[StudentMedia] Camera/microphone granted.',
            {
              tracks:
                stream.getTracks().map(
                  (track) => ({
                    kind:
                      track.kind,
                    id:
                      track.id,
                    enabled:
                      track.enabled,
                    readyState:
                      track.readyState,
                  })
                ),
            }
          )

          localStreamRef.current =
            stream

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

          setMediaConnected(
            subscribedRef.current
          )

          /*
           * Attach local video immediately.
           */

          if (
            localVideoRef.current
          ) {
            localVideoRef.current.srcObject =
              stream

            localVideoRef.current.muted =
              true

            localVideoRef.current.autoplay =
              true

            localVideoRef.current.playsInline =
              true

            void localVideoRef.current
              .play()
              .catch(() => {
                // Browser autoplay restriction.
              })
          }

          /*
           * If a peer already exists, attach the tracks.
           */

          if (
            teacherPeerRef.current
          ) {
            const peer =
              teacherPeerRef.current

            const senders =
              peer.getSenders()

            for (
              const track of stream.getTracks()
            ) {
              const sender =
                senders.find(
                  (item) =>
                    item.track?.kind ===
                    track.kind
                )

              if (sender) {
                try {
                  await sender.replaceTrack(
                    track
                  )
                } catch (err) {
                  console.warn(
                    '[StudentMedia] Track replacement failed:',
                    err
                  )
                }
              } else {
                try {
                  peer.addTrack(
                    track,
                    stream
                  )
                } catch (err) {
                  console.warn(
                    '[StudentMedia] Failed to add track:',
                    err
                  )
                }
              }
            }
          }

          /*
           * Notify teacher.
           */

          if (
            subscribedRef.current
          ) {
            await sendMediaSignal({
              type: 'student-joined',
              from:
                studentIdRef.current ||
                'student',
              to: 'teacher',
              name:
                studentNameRef.current ||
                'Student',
            })

            await sendMediaSignal({
              type: 'student-hello',
              from:
                studentIdRef.current ||
                'student',
              to: 'teacher',
              name:
                studentNameRef.current ||
                'Student',
            })
          }
        } catch (err) {
          console.error(
            '[StudentMedia] Camera/microphone error:',
            err
          )

          if (
            err instanceof DOMException &&
            err.name ===
              'NotAllowedError'
          ) {
            setMediaError(
              'Camera and microphone permission was denied. Please allow camera and microphone access in your browser.'
            )
          } else if (
            err instanceof DOMException &&
            err.name ===
              'NotFoundError'
          ) {
            setMediaError(
              'No camera or microphone was found on this device.'
            )
          } else if (
            err instanceof DOMException &&
            err.name ===
              'NotReadableError'
          ) {
            setMediaError(
              'The camera or microphone is already being used by another application.'
            )
          } else {
            setMediaError(
              err instanceof Error
                ? err.message
                : 'Unable to access camera and microphone.'
            )
          }

          setMediaConnected(
            false
          )
        } finally {
          setMediaLoading(
            false
          )
        }
      },
      [sendMediaSignal]
    )

  /*
   * ---------------------------------------------------------
   * START MEDIA WHEN CLASS IS READY
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!liveClass) {
      return
    }

    void startStudentMedia()

    return () => {
      // Full cleanup is handled below.
    }
  }, [
    liveClass?.id,
    startStudentMedia,
  ])

  /*
   * ---------------------------------------------------------
   * PERIODIC HANDSHAKE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!liveClass) {
      return
    }

    const interval =
      window.setInterval(() => {
        if (
          !subscribedRef.current
        ) {
          return
        }

        void sendMediaSignal({
          type: 'student-hello',
          from:
            studentIdRef.current ||
            'student',
          to: 'teacher',
          name:
            studentNameRef.current ||
            'Student',
        })
      }, 5000)

    return () => {
      window.clearInterval(
        interval
      )
    }
  }, [
    liveClass,
    sendMediaSignal,
  ])

  /*
   * ---------------------------------------------------------
   * FINAL MEDIA CLEANUP
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      console.log(
        '[StudentMedia] Final cleanup.'
      )

      if (
        teacherPeerRef.current
      ) {
        teacherPeerRef.current.close()

        teacherPeerRef.current =
          null
      }

      const stream =
        localStreamRef.current

      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          )

        localStreamRef.current =
          null
      }

      teacherStreamRef.current =
        null

      setTeacherStream(
        null
      )
    }
  }, [])

  /*
   * ---------------------------------------------------------
   * CHAT CHANNEL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!id) {
      return
    }

    let mounted = true

    const channelName =
      `live-class-chat-${id}`

    console.log(
      '[StudentChat] Joining channel:',
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
            if (!mounted) {
              return
            }

            const incoming =
              payload as ChatMessage

            if (
              !incoming?.id ||
              !incoming?.message
            ) {
              return
            }

            setMessages(
              (current) => {
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
              }
            )
          }
        )
        .subscribe(
          (status, err) => {
            if (!mounted) {
              return
            }

            setChatConnected(
              status ===
                'SUBSCRIBED'
            )

            console.log(
              '[StudentChat] Status:',
              status
            )

            if (err) {
              console.error(
                '[StudentChat] Realtime error:',
                err
              )
            }
          }
        )

    chatChannelRef.current =
      channel

    return () => {
      mounted = false

      const currentChannel =
        chatChannelRef.current

      chatChannelRef.current =
        null

      if (currentChannel) {
        void supabase.removeChannel(
          currentChannel
        )
      }
    }
  }, [id, supabase])

  /*
   * ---------------------------------------------------------
   * SEND CHAT
   * ---------------------------------------------------------
   */

  async function sendMessage() {
    const cleanMessage =
      message.trim()

    if (
      !cleanMessage ||
      !chatChannelRef.current ||
      !chatConnected ||
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

      sender: 'student',

      name:
        studentNameRef.current ||
        'Student',

      message:
        cleanMessage,

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

      if (
        result !== 'ok'
      ) {
        throw new Error(
          'Unable to send message.'
        )
      }

      setMessages(
        (current) =>
          [
            ...current,
            chatMessage,
          ].slice(-100)
      )

      setMessage('')
    } catch (err) {
      console.error(
        '[StudentChat] Send error:',
        err
      )
    } finally {
      setSending(false)
    }
  }

  function handleChatKeyDown(
    event: KeyboardEvent<HTMLInputElement>
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
   * MICROPHONE
   * ---------------------------------------------------------
   */

  function toggleMicrophone() {
    const stream =
      localStreamRef.current

    if (!stream) {
      void startStudentMedia()
      return
    }

    const tracks =
      stream.getAudioTracks()

    if (
      tracks.length === 0
    ) {
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
  }

  /*
   * ---------------------------------------------------------
   * CAMERA
   * ---------------------------------------------------------
   */

  function toggleCamera() {
    const stream =
      localStreamRef.current

    if (!stream) {
      void startStudentMedia()
      return
    }

    const tracks =
      stream.getVideoTracks()

    if (
      tracks.length === 0
    ) {
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
              fontSize: '45px',
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
            Joining Live Class...
          </h2>

          <p
            style={{
              color: '#64748b',
              marginTop: '10px',
            }}
          >
            Please wait while we connect you.
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

  if (
    error ||
    !liveClass
  ) {
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
            Unable to Join Classroom
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
              href="/dashboard/student/live-class"
              style={{
                background: '#082b59',
                color: '#fff',
                padding: '11px 18px',
                borderRadius: '9px',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    )
  }

  /*
   * ---------------------------------------------------------
   * CLASSROOM
   * ---------------------------------------------------------
   */

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#eef2f7',
      }}
    >
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
            Live Classroom • Student Mode
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
              background:
                teacherConnected
                  ? '#166534'
                  : '#92400e',
              padding: '7px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            ●{' '}
            {teacherConnected
              ? 'Teacher Connected'
              : 'Waiting for Teacher'}
          </span>

          <Link
            href="/dashboard/student/live-class"
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
                display: 'inline-block',
                background:
                  liveClass.status === 'live'
                    ? '#dcfce7'
                    : '#e0f2fe',
                color:
                  liveClass.status === 'live'
                    ? '#15803d'
                    : '#0369a1',
                padding: '5px 10px',
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

        {/* VIDEO AREA */}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1.5fr) minmax(280px, 1fr)',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          {/* TEACHER */}

          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              minHeight: '430px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.12)',
            }}
          >
            <video
              ref={teacherVideoRef}
              autoPlay
              playsInline
              muted={teacherVideoMuted}
              controls={false}
              onPlaying={() => {
                console.log(
                  '[StudentMedia] Teacher video onPlaying fired.'
                )

                setTeacherVideoPlaying(
                  true
                )
              }}
              onPause={() => {
                console.warn(
                  '[StudentMedia] Teacher video paused.'
                )

                setTeacherVideoPlaying(
                  false
                )
              }}
              onError={(event) => {
                console.error(
                  '[StudentMedia] Teacher video element error:',
                  event.currentTarget.error
                )
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                minHeight: '430px',
                objectFit: 'cover',
                display:
                  teacherStream
                    ? 'block'
                    : 'none',
                background:
                  '#020617',
              }}
            />

            {!teacherStream && (
              <div
                style={{
                  minHeight: '430px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  textAlign: 'center',
                  padding: '30px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '60px',
                      marginBottom: '12px',
                    }}
                  >
                    🎥
                  </div>

                  <strong
                    style={{
                      fontSize: '18px',
                    }}
                  >
                    {teacherConnected
                      ? 'Connecting teacher video...'
                      : 'Waiting for teacher video'}
                  </strong>

                  <div
                    style={{
                      marginTop: '8px',
                      color: '#94a3b8',
                      fontSize: '12px',
                    }}
                  >
                    {teacherConnected
                      ? 'Teacher is present. Establishing the video connection...'
                      : 'The teacher will appear here when connected.'}
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                background:
                  'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '7px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                zIndex: 5,
              }}
            >
              🎥 Teacher
            </div>

            <div
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background:
                  teacherConnected
                    ? 'rgba(22,101,52,0.9)'
                    : 'rgba(146,64,14,0.9)',
                color: '#fff',
                padding: '7px 10px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 700,
                zIndex: 5,
              }}
            >
              {teacherConnected
                ? '● CONNECTED'
                : 'WAITING'}
            </div>

            {teacherStream && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    bottom: '18px',
                    background:
                      'rgba(0,0,0,0.72)',
                    color: '#fff',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    zIndex: 5,
                  }}
                >
                  {teacherVideoPlaying
                    ? '● Video playing'
                    : '● Video connected'}
                </div>

                <button
                  type="button"
                  onClick={
                    toggleTeacherSound
                  }
                  style={{
                    position: 'absolute',
                    right: '14px',
                    bottom: '18px',
                    zIndex: 10,
                    border: 0,
                    borderRadius: '10px',
                    background:
                      'rgba(0,0,0,0.78)',
                    color: '#fff',
                    padding:
                      '10px 14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11px',
                    boxShadow:
                      '0 3px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {teacherVideoMuted
                    ? '🔊 Enable Teacher Sound'
                    : '🔇 Mute Teacher'}
                </button>
              </>
            )}
          </div>

          {/* STUDENT */}

          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              minHeight: '430px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow:
                '0 4px 20px rgba(0,0,0,0.12)',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '430px',
                objectFit: 'cover',
                display:
                  cameraEnabled
                    ? 'block'
                    : 'none',
                transform:
                  'scaleX(-1)',
                background:
                  '#020617',
              }}
            />

            {!cameraEnabled && (
              <div
                style={{
                  height: '430px',
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

            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                background:
                  'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '7px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              🎓 You
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '18px',
                left: '50%',
                transform:
                  'translateX(-50%)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={
                  toggleMicrophone
                }
                style={{
                  width: '48px',
                  height: '48px',
                  border: 'none',
                  borderRadius: '50%',
                  background:
                    micEnabled
                      ? '#0b5ed7'
                      : '#dc2626',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: 'pointer',
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

              <button
                type="button"
                onClick={
                  toggleCamera
                }
                style={{
                  width: '48px',
                  height: '48px',
                  border: 'none',
                  borderRadius: '50%',
                  background:
                    cameraEnabled
                      ? '#0b5ed7'
                      : '#dc2626',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
                title={
                  cameraEnabled
                    ? 'Turn camera off'
                    : 'Turn camera on'
                }
              >
                {cameraEnabled
                  ? '📹'
                  : '🚫'}
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
                    'rgba(15,23,42,0.8)',
                  color: '#fff',
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                Connecting camera and microphone...
              </div>
            )}
          </div>
        </section>

        {/* MEDIA STATUS */}

        <section
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
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

            <div
              style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
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

            <div
              style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                }}
              >
                Media Channel
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
                  ? '● CONNECTED'
                  : '● CONNECTING'}
              </strong>
            </div>

            <div
              style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                }}
              >
                Teacher
              </div>

              <strong
                style={{
                  color:
                    teacherConnected
                      ? '#15803d'
                      : '#b45309',
                }}
              >
                {teacherConnected
                  ? '● CONNECTED'
                  : '● WAITING'}
              </strong>
            </div>

            <div
              style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                }}
              >
                Teacher Video
              </div>

              <strong
                style={{
                  color:
                    teacherVideoPlaying
                      ? '#15803d'
                      : teacherStream
                        ? '#b45309'
                        : '#64748b',
                  fontSize: '11px',
                }}
              >
                {teacherVideoPlaying
                  ? '▶ PLAYING'
                  : teacherStream
                    ? '● RECEIVED'
                    : '● WAITING'}
              </strong>
            </div>
          </div>

          {teacherStream && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: '9px',
                color: '#475569',
                fontSize: '11px',
              }}
            >
              <strong>
                Teacher media:
              </strong>{' '}
              {teacherTrackInfo}
            </div>
          )}

          {mediaError && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: '#fef2f2',
                color: '#991b1b',
                borderRadius: '9px',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              {mediaError}
            </div>
          )}

          {!mediaConnected && (
            <button
              type="button"
              onClick={
                startStudentMedia
              }
              style={{
                width: '100%',
                marginTop: '14px',
                border: 0,
                borderRadius: '9px',
                background: '#0b5ed7',
                color: '#fff',
                padding: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🎥 Enable Camera & Microphone
            </button>
          )}

          {teacherStream &&
            teacherVideoMuted && (
              <button
                type="button"
                onClick={
                  toggleTeacherSound
                }
                style={{
                  width: '100%',
                  marginTop: '10px',
                  border: 0,
                  borderRadius: '9px',
                  background: '#082b59',
                  color: '#fff',
                  padding: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🔊 Click Here to Enable Teacher Sound
              </button>
            )}
        </section>

        {/* CHAT */}

        <section
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '13px',
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
              minHeight: '250px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '12px 2px',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: '#94a3b8',
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
                    color: '#64748b',
                  }}
                >
                  No messages yet
                </strong>

                <span
                  style={{
                    marginTop: '5px',
                    fontSize: '11px',
                  }}
                >
                  You can chat with your teacher here.
                </span>
              </div>
            ) : (
              messages.map(
                (item) => (
                  <div
                    key={item.id}
                    style={{
                      maxWidth: '90%',
                      marginBottom: '10px',
                      marginLeft:
                        item.sender ===
                        'student'
                          ? 'auto'
                          : '0',
                      padding:
                        '9px 11px',
                      borderRadius: '10px',
                      background:
                        item.sender ===
                        'student'
                          ? '#eaf2ff'
                          : '#f1f5f9',
                      border:
                        '1px solid #e2e8f0',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color:
                          item.sender ===
                          'student'
                            ? '#0b5ed7'
                            : '#082b59',
                        marginBottom: '3px',
                      }}
                    >
                      {item.name}
                    </div>

                    <div
                      style={{
                        color: '#334155',
                        fontSize: '12px',
                        lineHeight: 1.45,
                        wordBreak:
                          'break-word',
                      }}
                    >
                      {item.message}
                    </div>

                    <div
                      style={{
                        marginTop: '4px',
                        color: '#94a3b8',
                        fontSize: '8px',
                        textAlign: 'right',
                      }}
                    >
                      {new Date(
                        item.createdAt
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
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
                padding: '10px',
                fontSize: '12px',
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
                  '9px 14px',
                background:
                  '#0b5ed7',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
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
        </section>
      </div>
    </main>
  )
}