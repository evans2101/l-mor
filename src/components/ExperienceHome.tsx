import { useLocale, translateNode as tn, translateText as tt } from '../i18n'
import { lazy, Suspense, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, ScanLine, ShoppingBag } from 'lucide-react'
import { defaultBody, defaultBottom, defaultTop } from '../data'
import AvatarView from './AvatarView'
import Studio from './Studio'
import { scrollToSection, type HomeSection } from '../navigation'
import { brandSymbolUrl } from '../brand'
import useSceneExperience from './useSceneExperience'
import HeroTitle from './HeroTitle'
import Atmosphere from './Atmosphere'
const LogoScene = lazy(() => import('./LogoScene'))
export default function ExperienceHome() {
  useLocale()
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
        aria-label={tt('Dunia L’MOR')}
      >
        <div className="story-pin">
          <Atmosphere />
          <div className="story-atmosphere" aria-hidden="true">
            <div className="light-beam" />
            <div className="floor-orbit" />
            <div className="floor-orbit orbit-outer" />
          </div>
          <div className="story-edition">
            <span>{tn('EVERYDAY COLLECTION')}</span>
            <span>{tn('EST. TO BE YOURSELF / 2026')}</span>
          </div>
          <HeroTitle active={active === 'intro'} />
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
            <span className="premium-signature">
              <i />
              {tn('Rasa premium. Harga bersahabat.')}
            </span>
            <span className="eyebrow">{tn('ATURAN KAMU.')}</span>
            <p>
              {tn('Everyday pieces. Extraordinary you.')}
              <br />
              {tn('Temukan outfit yang terasa kamu banget.')}
            </p>
            <div className="story-actions">
              <Link className="btn btn-white" to="/?studio=1">
                <ScanLine size={16} />
                {tn(' Explore 5D Studio')}
              </Link>
              <Link className="story-text-link" to="/catalog">
                {tn('Lihat koleksi ')}
                <Plus size={16} />
              </Link>
            </div>
          </div>
          <div className="story-bottom">
            <span className="scroll-cue">
              <span className="scroll-line" />
              {tn(' SCROLL TO EXPLORE')}
            </span>
            <span>{tn('YOUR BODY. YOUR STYLE. YOUR L\u2019MOR.')}</span>
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
          aria-label={tt('5D Studio, gulir untuk melihat seluruh kontrol')}
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
          <Atmosphere finale />
          <div className="closing-halo" aria-hidden="true" />
          <div className="closing-top">
            <span className="eyebrow">{tn('A LITTLE MORE THAN CLOTHES.')}</span>
            <span>{tn('THE NEXT CHAPTER IS YOURS.')}</span>
          </div>
          <div className="closing-copy">
            <h2 id="closing-title" tabIndex={-1}>
              {tn('Wear less doubt.')}
              <br />
              <em>{tn('Wear more you.')}</em>
            </h2>
            <p>
              {tn('Gaya bukan soal jadi orang lain.')}
              <br />
              {tn('Temukan versi paling nyaman dari dirimu.')}
            </p>
          </div>
          <div className="closing-logo">
            <div className="logo-orbit logo-orbit-one" aria-hidden="true" />
            <div className="logo-orbit logo-orbit-two" aria-hidden="true" />
            {tn(
              loadLogo && (
                <Suspense
                  fallback={
                    <img
                      className="logo-fallback"
                      src={brandSymbolUrl}
                      alt={tt('Logo L’MOR')}
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
              ),
            )}
          </div>
          <div className="closing-actions">
            <Link className="btn btn-white" to="/catalog">
              <ShoppingBag size={17} />
              {tn(' Belanja sekarang')}
            </Link>
            <Link className="btn btn-outline" to="/?studio=1">
              {tn('Buat look kamu ')}
              <Plus size={16} />
            </Link>
          </div>
          <div className="closing-bottom">
            <span>{tn('NEVER FIT IN.')}</span>
            <span>{tn('ALWAYS FEEL LIKE YOU.')}</span>
          </div>
        </div>
      </section>
      <nav
        className="chapter-dock"
        data-chapter={active}
        aria-label={tt('Navigasi bab')}
      >
        <button
          className={active === 'intro' ? 'active' : ''}
          aria-current={active === 'intro' ? 'location' : undefined}
          onClick={() => scrollToSection('intro')}
        >
          <span />
          {tn(' INTRO')}
        </button>
        <button
          className={active === 'studio' ? 'active' : ''}
          aria-current={active === 'studio' ? 'location' : undefined}
          onClick={() => scrollToSection('studio')}
        >
          <span />
          {tn(' THE STUDIO')}
        </button>
        <button
          className={active === 'about' ? 'active' : ''}
          aria-current={active === 'about' ? 'location' : undefined}
          onClick={() => scrollToSection('about')}
        >
          <span />
          {tn(' BEYOND')}
        </button>
      </nav>
    </main>
  )
}
