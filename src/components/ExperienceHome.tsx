import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ScanLine, ShoppingBag } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { defaultBody, defaultBottom, defaultTop } from '../data'
import AvatarView from './AvatarView'
import Studio from './Studio'
import { scrollToSection, useHomeSection } from '../navigation'
const LogoScene = lazy(() => import('./LogoScene'))
gsap.registerPlugin(ScrollTrigger)
export default function ExperienceHome() {
  const root = useRef<HTMLElement>(null),
    journey = useRef(0),
    logoProgress = useRef(0)
  const chapter = useHomeSection()
  const [loadLogo, setLoadLogo] = useState(false)
  useEffect(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      let transitionMotion: gsap.core.Timeline | undefined
      const context = gsap.context(() => {
        const story = gsap.timeline({
          scrollTrigger: {
            trigger: '.story-track',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              journey.current = self.progress
            },
          },
        })
        story
          .to(
            '.story-heading',
            { y: -100, opacity: 0, duration: 0.35, ease: 'power1.in' },
            0,
          )
          .to(
            '.story-opening-copy',
            { y: -40, opacity: 0, duration: 0.28 },
            0.04,
          )
          .to(
            '.story-model',
            {
              x: () => (innerWidth < 700 ? '-8vw' : '-25vw'),
              scale: () => (innerWidth < 700 ? 0.95 : 1.1),
              duration: 0.55,
              ease: 'power1.inOut',
            },
            0.06,
          )
          .fromTo(
            '.story-second-copy',
            { y: 70, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.22 },
            0.38,
          )
          .to('.story-second-copy', { y: -45, opacity: 0, duration: 0.2 }, 0.78)
          .to('.story-model', { y: -40, opacity: 0.15, duration: 0.25 }, 0.76)
          .to(
            '.story-curtain',
            { scaleY: 1, duration: 0.2, ease: 'power1.in' },
            0.8,
          )
          .to('.light-beam', { xPercent: -50, rotation: 8, duration: 1 }, 0)
          .to('.floor-orbit', { rotation: 16, scale: 1.3, duration: 1 }, 0)
        for (const [target, wipe] of [
          ['#studio', '.studio-wipe'],
          ['#about', '.beyond-wipe'],
        ]) {
          gsap.set(wipe, { yPercent: 105, y: 0 })
          const reveal = (direction: number) => {
            transitionMotion?.kill()
            gsap.set('.scene-wipe', { yPercent: 105, y: 0 })
            // A transition always finishes, even if the visitor stops scrolling.
            transitionMotion = gsap
              .timeline()
              .fromTo(
                wipe,
                { yPercent: direction * 105, y: 0 },
                { yPercent: 0, y: 0, duration: 0.32, ease: 'power3.inOut' },
                0,
              )
              .fromTo(
                `${wipe} .scene-wipe-title`,
                { y: direction * 55, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
                0.12,
              )
              .fromTo(
                `${wipe} .scene-wipe-orbit`,
                { scale: 0.85, rotation: -20 * direction },
                {
                  scale: 1.05,
                  rotation: 15 * direction,
                  duration: 0.8,
                  ease: 'none',
                },
                0,
              )
              .to(
                wipe,
                {
                  yPercent: -direction * 105,
                  duration: 0.4,
                  ease: 'power3.inOut',
                },
                0.42,
              )
          }
          ScrollTrigger.create({
            trigger: target,
            start: 'top 20%',
            onEnter: () => reveal(1),
            onLeaveBack: () => reveal(-1),
          })
        }
        gsap.from('.studio-section .section-heading', {
          y: 70,
          opacity: 0,
          duration: 1.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: '#studio', start: 'top 80%', once: true },
        })
        gsap.from('.studio-layout', {
          y: 75,
          opacity: 0,
          scale: 0.97,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.studio-layout',
            start: 'top 90%',
            once: true,
          },
        })
        gsap.from('.closing-copy', {
          y: 80,
          opacity: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: '.closing-track',
            start: 'top 60%',
            once: true,
          },
        })
      }, element)
      return () => {
        transitionMotion?.kill()
        context.revert()
      }
    })
    const closing = ScrollTrigger.create({
      trigger: '.closing-track',
      start: 'top bottom',
      end: 'bottom bottom',
      onUpdate: (self) => {
        logoProgress.current = self.progress
      },
    })
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadLogo(true)
          observer.disconnect()
        }
      },
      { rootMargin: '500px' },
    )
    const end = element.querySelector('.closing-track')
    if (end) observer.observe(end)
    const onLoad = () => ScrollTrigger.refresh()
    document.fonts.ready.then(onLoad)
    return () => {
      observer.disconnect()
      closing.kill()
      media.revert()
    }
  }, [])
  return (
    <main className="experience-home" ref={root}>
      <section className="story-track" id="intro" aria-label="Dunia L’MOR">
        <div className="story-pin">
          <div className="story-atmosphere" aria-hidden="true">
            <div className="light-beam" />
            <div className="floor-orbit" />
            <div className="floor-orbit orbit-outer" />
          </div>
          <div className="story-edition">
            <span>EVERYDAY COLLECTION</span>
            <span>EST. TO BE YOURSELF / 2026</span>
          </div>
          <h1 className="story-heading">
            <span>GAYA</span>
            <span className="outline-text">KAMU.</span>
            <span className="hero-heading-accessible">Aturan kamu.</span>
          </h1>
          <div className="story-model">
            <AvatarView
              hero
              body={defaultBody}
              top={defaultTop}
              bottom={defaultBottom}
              journey={journey}
            />
          </div>
          <div className="story-opening-copy">
            <span className="eyebrow">ATURAN KAMU.</span>
            <p>
              Everyday pieces. Extraordinary you.
              <br />
              Temukan outfit yang terasa kamu banget.
            </p>
            <div className="story-actions">
              <Link className="btn btn-white" to="/?studio=1">
                <ScanLine size={16} /> Explore 5D Studio
              </Link>
              <Link className="story-text-link" to="/catalog">
                Lihat koleksi <Plus size={16} />
              </Link>
            </div>
          </div>
          <div className="story-second-copy">
            <span className="eyebrow">A LITTLE MORE PERSONAL.</span>
            <h2>
              Bebas jadi
              <br />
              <em>dirimu.</em>
            </h2>
            <p>
              Bukan sekadar cocok di foto.
              <br />
              Coba di tubuh versimu. Padu padankan sesukamu.
              <br />
              Pakai dengan percaya diri.
            </p>
            <Link className="story-text-link" to="/?studio=1">
              Make it yours <Plus size={17} />
            </Link>
          </div>
          <div className="story-bottom">
            <span className="scroll-cue">
              <span className="scroll-line" /> SCROLL TO EXPLORE
            </span>
            <span>YOUR BODY. YOUR STYLE. YOUR L’MOR.</span>
          </div>
          <div className="story-curtain" aria-hidden="true" />
        </div>
      </section>
      <Studio />
      <section
        className="closing-track"
        id="about"
        aria-labelledby="closing-title"
      >
        <div className="closing-pin">
          <div className="closing-halo" aria-hidden="true" />
          <div className="closing-top">
            <span className="eyebrow">A LITTLE MORE THAN CLOTHES.</span>
            <span>THE NEXT CHAPTER IS YOURS.</span>
          </div>
          <div className="closing-copy">
            <h2 id="closing-title">
              Wear less doubt.
              <br />
              <em>Wear more you.</em>
            </h2>
            <p>
              Gaya bukan soal jadi orang lain.
              <br />
              Temukan versi paling nyaman dari dirimu.
            </p>
          </div>
          <div className="closing-logo">
            {loadLogo && (
              <Suspense
                fallback={<span className="logo-fallback">L’MOR.</span>}
              >
                <LogoScene progress={logoProgress} />
              </Suspense>
            )}
          </div>
          <div className="closing-actions">
            <Link className="btn btn-white" to="/catalog">
              <ShoppingBag size={17} /> Belanja sekarang
            </Link>
            <Link className="btn btn-outline" to="/?studio=1">
              Buat look kamu <Plus size={16} />
            </Link>
          </div>
          <div className="closing-bottom">
            <span>NEVER FIT IN.</span>
            <span>ALWAYS FEEL LIKE YOU.</span>
          </div>
        </div>
      </section>
      <div className="scene-wipe studio-wipe" aria-hidden="true">
        <div className="scene-wipe-orbit" />
        <span className="scene-wipe-label">02 / THE PERSONAL STYLE STUDIO</span>
        <p className="scene-wipe-title">
          LESS GUESSING.
          <br />
          <em>MORE YOU.</em>
        </p>
        <span className="scene-wipe-note">
          YOUR BODY. YOUR STYLE. YOUR RULES.
        </span>
      </div>
      <div className="scene-wipe beyond-wipe" aria-hidden="true">
        <div className="scene-wipe-orbit" />
        <span className="scene-wipe-label">03 / A LITTLE MORE L’MOR</span>
        <p className="scene-wipe-title">
          WEAR IT.
          <br />
          <em>OWN IT.</em>
        </p>
        <span className="scene-wipe-note">THE NEXT CHAPTER IS YOURS.</span>
      </div>
      <nav
        className="chapter-dock"
        data-chapter={chapter}
        aria-label="Navigasi bab"
      >
        <button
          className={chapter === 'intro' ? 'active' : ''}
          aria-current={chapter === 'intro' ? 'location' : undefined}
          onClick={() => scrollToSection('intro')}
        >
          <span /> INTRO
        </button>
        <button
          className={chapter === 'studio' ? 'active' : ''}
          aria-current={chapter === 'studio' ? 'location' : undefined}
          onClick={() => scrollToSection('studio')}
        >
          <span /> THE STUDIO
        </button>
        <button
          className={chapter === 'about' ? 'active' : ''}
          aria-current={chapter === 'about' ? 'location' : undefined}
          onClick={() => scrollToSection('about')}
        >
          <span /> BEYOND
        </button>
      </nav>
    </main>
  )
}
