// components/Reader/HighlightPanel.jsx
 import React, { useState } from 'react'

 const HighlightPanel = ({ highlights, onHighlightClick, onHighlightDelete, onClose }) => {
   const [filterColor, setFilterColor] = useState('all')

   const colorMap = {
     '#ffff00': { name: 'Kuning', emoji: '🟡' },
     '#90EE90': { name: 'Hijau', emoji: '🟢' },
     '#FFB6C1': { name: 'Pink', emoji: '🩷' },
     '#87CEEB': { name: 'Biru', emoji: '🔵' },
     '#DDA0DD': { name: 'Ungu', emoji: '🟣' }
   }

   const filteredHighlights = filterColor === 'all'
     ? highlights
     : highlights.filter(h => h.color === filterColor)

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
         <h3>Highlight ({highlights.length})</h3>
         <button className="btn btn-secondary btn-small" onClick={onClose}>
           Tutup
         </button>
       </div>

       <div className="panel-filters">
         <select
           value={filterColor}
           onChange={(e) => setFilterColor(e.target.value)}
           className="form-control"
         >
           <option value="all">Semua Warna</option>
           {Object.entries(colorMap).map(([color, info]) => (
             <option key={color} value={color}>
               {info.emoji} {info.name}
             </option>
           ))}
         </select>
       </div>

       <div className="panel-content">
         {filteredHighlights.length === 0 ? (
           <div className="empty-state">
             <p>Belum ada highlight.</p>
             <p>Pilih teks dan klik warna untuk membuat highlight.</p>
           </div>
         ) : (
           <div className="highlight-list">
             {filteredHighlights.map((highlight) => (
               <div key={highlight.id} className="highlight-item">
                 <div
                   className="highlight-content"
                   onClick={() => onHighlightClick(highlight)}
                   style={{ cursor: 'pointer' }}
                 >
                   <div className="highlight-color-indicator"
                        style={{ backgroundColor: highlight.color }} />
                   <div className="highlight-text">
                     "{highlight.text}"
                   </div>
                   {highlight.note && (
                     <p className="highlight-note">{highlight.note}</p>
                   )}
                   <small className="highlight-meta">
                     Halaman {highlight.page} • {formatDate(highlight.createdAt)}
                   </small>
                 </div>
                 <button
                   className="btn btn-secondary btn-small"
                   onClick={(e) => {
                     e.stopPropagation()
                     onHighlightDelete(highlight.id)
                   }}
                   title="Hapus highlight"
                 >
                   Hapus
                 </button>
               </div>
             ))}
           </div>
         )}
       </div>
     </div>
   )
 }

 export default HighlightPanel