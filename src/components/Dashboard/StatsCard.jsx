import React from 'react'

const StatsCard = ({ title, value, icon }) => {
  return (
    <div className="card text-center">
      {icon && (
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {value}
      </div>
      <div>{title}</div>
    </div>
  )
}

export default StatsCard