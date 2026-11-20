import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  Component,
  type ReactNode,
} from 'react'
import { Rotate3D } from 'lucide-react'
const Avatar = lazy(() => import('./Avatar'))
class AvatarBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    return this.state.error ? (
      <div className="avatar-fallback">
        <Rotate3D size={40} />
        <p>Preview gagal dimuat. Muat ulang halaman untuk mencoba lagi.</p>
      </div>
    ) : (
      this.props.children
    )
  }
}
export default function AvatarView(props: React.ComponentProps<typeof Avatar>) {
  const ref = useRef<HTMLDivElement>(null),
    [visible, setVisible] = useState(!!props.hero)
  useEffect(() => {
    if (visible || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])
  return (
    <div ref={ref} className="avatar-view">
      <AvatarBoundary>
        {visible && (
          <Suspense
            fallback={
              <div className="avatar-loading">
                <Rotate3D size={30} />
                <span>Menyiapkan look kamu…</span>
              </div>
            }
          >
            <Avatar {...props} />
          </Suspense>
        )}
      </AvatarBoundary>
    </div>
  )
}
