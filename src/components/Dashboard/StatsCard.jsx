import React from 'react'

const StatsCard = ({ title, value, icon }) => (
  <div className="card stats-card">
    {icon && <div className="stats-icon">{icon}</div>}
    <div className="stats-value">{value}</div>
    <div className="stats-title">{title}</div>
  </div>
)

export default StatsCard