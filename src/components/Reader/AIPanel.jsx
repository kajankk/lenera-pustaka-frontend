// components/Reader/AIPanel.jsx
import React, { useState } from 'react'

const AIPanel = ({
  bookSlug,
  currentPage,
  selectedText,
  onGenerateSummary,
  onAskQuestion,
  onGenerateQuiz,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('summary')
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [aiResponse, setAIResponse] = useState(null)
  const [summaryOptions, setSummaryOptions] = useState({
    length: 'medium',
    style: 'academic'
  })
  const [quizOptions, setQuizOptions] = useState({
    difficulty: 'medium',
    questionCount: 5,
    type: 'mixed'
  })

  const handleGenerateSummary = async () => {
    setLoading(true)
    try {
      const response = await onGenerateSummary(currentPage, summaryOptions)
      setAIResponse(response)
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!question.trim()) return

    setLoading(true)
    try {
      const response = await onAskQuestion(question, selectedText)
      setAIResponse(response)
    } catch (error) {
      console.error('Error asking question:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuiz = async () => {
    setLoading(true)
    try {
      const response = await onGenerateQuiz(currentPage, quizOptions)
      setAIResponse(response)
    } catch (error) {
      console.error('Error generating quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'summary', label: 'Rangkuman', icon: '📄' },
    { id: 'qa', label: 'Tanya Jawab', icon: '❓' },
    { id: 'quiz', label: 'Kuis', icon: '🧠' }
  ]

  return (
    <div className="reader-panel card ai-panel">
      <div className="panel-header">
        <h3>AI Assistant</h3>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          Tutup
        </button>
      </div>

      {/* Tabs */}
      <div className="ai-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`btn btn-secondary btn-small ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              setAIResponse(null)
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="ai-summary-section">
            <div className="ai-options">
              <div className="form-group">
                <label>Panjang Rangkuman:</label>
                <select
                  className="form-control"
                  value={summaryOptions.length}
                  onChange={(e) => setSummaryOptions(prev => ({ ...prev, length: e.target.value }))}
                >
                  <option value="short">Singkat</option>
                  <option value="medium">Sedang</option>
                  <option value="long">Panjang</option>
                </select>
              </div>

              <div className="form-group">
                <label>Gaya Rangkuman:</label>
                <select
                  className="form-control"
                  value={summaryOptions.style}
                  onChange={(e) => setSummaryOptions(prev => ({ ...prev, style: e.target.value }))}
                >
                  <option value="academic">Akademis</option>
                  <option value="casual">Santai</option>
                  <option value="bullet">Poin-poin</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateSummary}
              disabled={loading}
            >
              {loading ? 'Membuat Rangkuman...' : `Buat Rangkuman Halaman ${currentPage}`}
            </button>
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'qa' && (
          <div className="ai-qa-section">
            {selectedText && (
              <div className="context-text">
                <strong>Konteks:</strong> "{selectedText}"
              </div>
            )}

            <div className="form-group">
              <textarea
                className="form-control"
                placeholder="Tanyakan sesuatu tentang buku ini..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows="3"
                disabled={loading}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleAskQuestion}
              disabled={loading || !question.trim()}
            >
              {loading ? 'Mencari Jawaban...' : 'Tanya AI'}
            </button>
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="ai-quiz-section">
            <div className="ai-options">
              <div className="form-group">
                <label>Kesulitan:</label>
                <select
                  className="form-control"
                  value={quizOptions.difficulty}
                  onChange={(e) => setQuizOptions(prev => ({ ...prev, difficulty: e.target.value }))}
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>

              <div className="form-group">
                <label>Jumlah Soal:</label>
                <select
                  className="form-control"
                  value={quizOptions.questionCount}
                  onChange={(e) => setQuizOptions(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                >
                  <option value="3">3 Soal</option>
                  <option value="5">5 Soal</option>
                  <option value="10">10 Soal</option>
                </select>
              </div>

              <div className="form-group">
                <label>Jenis Soal:</label>
                <select
                  className="form-control"
                  value={quizOptions.type}
                  onChange={(e) => setQuizOptions(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="mixed">Campur</option>
                  <option value="multiple-choice">Pilihan Ganda</option>
                  <option value="true-false">Benar/Salah</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateQuiz}
              disabled={loading}
            >
              {loading ? 'Membuat Kuis...' : `Buat Kuis Halaman ${currentPage}`}
            </button>
          </div>
        )}

        {/* AI Response */}
        {aiResponse && (
          <div className="ai-response">
            <div className="response-header">
              <h4>
                {activeTab === 'summary' && 'Rangkuman AI'}
                {activeTab === 'qa' && 'Jawaban AI'}
                {activeTab === 'quiz' && 'Kuis dari AI'}
              </h4>
            </div>

            <div className="response-content">
              {activeTab === 'summary' && (
                <div className="summary-content">
                  {aiResponse.summary}
                </div>
              )}

              {activeTab === 'qa' && (
                <div className="qa-content">
                  <div className="question">
                    <strong>Pertanyaan:</strong> {aiResponse.question}
                  </div>
                  <div className="answer">
                    <strong>Jawaban:</strong> {aiResponse.answer}
                  </div>
                  {aiResponse.confidence && (
                    <small className="confidence">
                      Tingkat Kepercayaan: {(aiResponse.confidence * 100).toFixed(1)}%
                    </small>
                  )}
                </div>
              )}

              {activeTab === 'quiz' && (
                <div className="quiz-content">
                  <div className="quiz-header">
                    <h5>Kuis: {aiResponse.title}</h5>
                    <small>Kesulitan: {aiResponse.difficulty} | {aiResponse.questions?.length} soal</small>
                  </div>
                  <div className="quiz-questions">
                    {aiResponse.questions?.map((q, index) => (
                      <div key={index} className="quiz-question">
                        <div className="question-text">
                          <strong>{index + 1}.</strong> {q.question}
                        </div>
                        {q.options && (
                          <div className="question-options">
                            {q.options.map((option, optIndex) => (
                              <div key={optIndex} className="option">
                                <strong>{String.fromCharCode(65 + optIndex)}.</strong> {option}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="correct-answer">
                          <small><strong>Jawaban:</strong> {q.correctAnswer}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIPanel