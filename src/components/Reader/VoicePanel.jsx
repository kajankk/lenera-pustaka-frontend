// components/Reader/VoicePanel.jsx
import React, { useState, useRef } from 'react'

const VoicePanel = ({ voiceNotes, onVoiceNoteAdd, currentPage, onClose }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isPlaying, setIsPlaying] = useState(null)
  const [uploadingNote, setUploadingNote] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Tidak dapat mengakses mikrofon. Pastikan izin sudah diberikan.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const saveVoiceNote = async () => {
    if (!audioBlob) return

    setUploadingNote(true)
    try {
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
        type: 'audio/webm'
      })

      await onVoiceNoteAdd(audioFile, currentPage)
      setAudioBlob(null)
      alert('Catatan suara berhasil disimpan!')
    } catch (error) {
      console.error('Error saving voice note:', error)
      alert('Gagal menyimpan catatan suara')
    } finally {
      setUploadingNote(false)
    }
  }

  const playVoiceNote = (noteId, audioUrl) => {
    if (isPlaying === noteId) {
      setIsPlaying(null)
      return
    }

    const audio = new Audio(audioUrl)
    setIsPlaying(noteId)

    audio.onended = () => setIsPlaying(null)
    audio.onerror = () => {
      setIsPlaying(null)
      alert('Gagal memutar audio')
    }

    audio.play()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="reader-panel card">
      <div className="panel-header">
        <h3>Catatan Suara ({voiceNotes.length})</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          Tutup
        </button>
      </div>

      {/* Recording Controls */}
      <div className="panel-recording-controls">
        {!audioBlob ? (
          <div className="recording-section">
            <button
              className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={uploadingNote}
            >
              {isRecording ? '🛑 Berhenti Merekam' : '🎤 Mulai Merekam'}
            </button>
            {isRecording && (
              <div className="recording-indicator">
                <span className="pulse-dot"></span>
                Sedang merekam...
              </div>
            )}
          </div>
        ) : (
          <div className="recorded-audio-section">
            <p>Rekaman siap disimpan untuk halaman {currentPage}</p>
            <div className="audio-controls">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setAudioBlob(null)}
                disabled={uploadingNote}
              >
                Hapus
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={saveVoiceNote}
                disabled={uploadingNote}
              >
                {uploadingNote ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="panel-content">
        {voiceNotes.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada catatan suara.</p>
            <p>Rekam suara Anda untuk membuat catatan audio.</p>
          </div>
        ) : (
          <div className="voice-notes-list">
            {voiceNotes.map((note) => (
              <div key={note.id} className="voice-note-item">
                <div className="voice-note-content">
                  <button
                    className="btn btn-secondary voice-play-btn"
                    onClick={() => playVoiceNote(note.id, note.audioUrl)}
                    title="Putar catatan suara"
                  >
                    {isPlaying === note.id ? '⏸️' : '▶️'}
                  </button>
                  <div className="voice-note-info">
                    <div className="voice-note-duration">
                      Durasi: {note.duration || 'N/A'}
                    </div>
                    <small className="voice-note-meta">
                      Halaman {note.page} • {formatDate(note.createdAt)}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default VoicePanel