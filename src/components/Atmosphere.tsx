export default function Atmosphere({ finale = false }: { finale?: boolean }) {
  return (
    <div
      className={`fashion-atmosphere ${finale ? 'fashion-atmosphere--finale' : ''}`}
      aria-hidden="true"
    >
      <div className="aurora aurora-cool" />
      <div className="aurora aurora-warm" />
      <div className="runway-light runway-light-one" />
      <div className="runway-light runway-light-two" />
      <div className="runway-horizon" />
      <div className="fashion-dust">
        {Array.from({ length: 18 }, (_, i) => (
          <i
            key={i}
            style={
              {
                '--x': `${(i * 37 + 9) % 100}%`,
                '--y': `${(i * 53 + 13) % 100}%`,
                '--delay': `${-i * 1.7}s`,
                '--duration': `${13 + (i % 6) * 3}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="atmosphere-grain" />
    </div>
  )
}
