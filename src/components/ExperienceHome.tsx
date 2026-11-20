import { lazy, Suspense, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, ScanLine, ShoppingBag } from 'lucide-react'
import { defaultBody, defaultBottom, defaultTop } from '../data'
import AvatarView from './AvatarView'
import Studio from './Studio'
import { scrollToSection, type HomeSection } from '../navigation'
import { brandSymbolUrl } from '../brand'
import useSceneExperience from './useSceneExperience'
const LogoScene = lazy(() => import('./LogoScene'))
export default function ExperienceHome() {
  const root = useRef<HTMLElement>(null)
  const { search } = useLocation()
  const [initial] = useState<HomeSection>(() => {
    const params = new URLSearchParams(search)
    return params.has('studio')
      ? 'studio'
      : params.has('about')
        ? 'about'
        : 'intro'
  })
  const { active, transitioning, loadLogo, journey, logoProgress } =
    useSceneExperience(root, initial)
  return (
    <main
      className="experience-home experience-fixed"
      ref={root}
      tabIndex={-1}
      data-active-scene={active}
      data-transitioning={transitioning}
    >
      <section
        className="experience-scene experience-scene--intro story-track"
        id="intro"
        data-scene="intro"
        data-active={active === 'intro'}
        inert={active !== 'intro'}
        aria-hidden={active !== 'intro'}
        aria-label="Dunia L’MOR"
      >
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
          <h1 className="story-heading" tabIndex={-1}>
            <span>GAYA</span>
            <span className="outline-text">KAMU.</span>
            <span className="hero-heading-accessible">Aturan kamu.</span>
          </h1>
          <div className="story-model">
            <AvatarView
              hero
              active={active === 'intro'}
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
          <div className="story-bottom">
            <span className="scroll-cue">
              <span className="scroll-line" /> SCROLL TO EXPLORE
            </span>
            <span>YOUR BODY. YOUR STYLE. YOUR L’MOR.</span>
          </div>
        </div>
      </section>
      <div
        className="experience-scene experience-scene--studio"
        data-scene="studio"
        data-active={active === 'studio'}
        inert={active !== 'studio'}
        aria-hidden={active !== 'studio'}
      >
        <div
          className="experience-studio-scroll"
          data-scene-scroll
          tabIndex={0}
          role="region"
          aria-label="5D Studio, gulir untuk melihat seluruh kontrol"
        >
          <Studio active={active === 'studio'} />
        </div>
      </div>
      <section
        className="experience-scene experience-scene--about closing-track"
        data-scene="about"
        data-active={active === 'about'}
        inert={active !== 'about'}
        aria-hidden={active !== 'about'}
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
            <h2 id="closing-title" tabIndex={-1}>
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
                fallback={
                  <img
                    className="logo-fallback"
                    src={brandSymbolUrl}
                    alt="Logo L’MOR"
                    width="667"
                    height="490"
                  />
                }
              >
                <LogoScene
                  progress={logoProgress}
                  active={active === 'about'}
                />
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
      <nav
        className="chapter-dock"
        data-chapter={active}
        aria-label="Navigasi bab"
      >
        <button
          className={active === 'intro' ? 'active' : ''}
          aria-current={active === 'intro' ? 'location' : undefined}
          onClick={() => scrollToSection('intro')}
        >
          <span /> INTRO
        </button>
        <button
          className={active === 'studio' ? 'active' : ''}
          aria-current={active === 'studio' ? 'location' : undefined}
          onClick={() => scrollToSection('studio')}
        >
          <span /> THE STUDIO
        </button>
        <button
          className={active === 'about' ? 'active' : ''}
          aria-current={active === 'about' ? 'location' : undefined}
          onClick={() => scrollToSection('about')}
        >
          <span /> BEYOND
        </button>
      </nav>
    </main>
  )
}
