'use client'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import SplashScreen from '@/components/splash-screen'
import CustomCursor from '@/components/custom-cursor'
import GridFlicker from '@/components/grid-flicker'
import FloatingNav from '@/components/floating-nav'
import { useTransitionStore, useTransitionNavigate, isPlainClick } from '@/hooks/use-page-transition'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/share', label: 'Share' },
  { href: '/bloggers', label: 'Bloggers' },
  { href: '/about', label: 'About' },
]

export default function Layout({ children }: PropsWithChildren) {
  const { siteContent, loadConfig } = useConfigStore()
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isFullBleed = isHome || pathname.startsWith('/write') || pathname.startsWith('/pictures') || pathname.startsWith('/config') || pathname.startsWith('/blog/')
  const isListLike = !isHome && !isFullBleed
  const transitionPhase = useTransitionStore(s => s.phase)
  const transitionLabel = useTransitionStore(s => s.label)
  const navigate = useTransitionNavigate()
  const [typedLabel, setTypedLabel] = useState('')

  // load site config from runtime endpoint
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // scroll trigger: collapse top nav once user scrolls down on list-like pages
  const [navCollapsed, setNavCollapsed] = useState(false)
  useEffect(() => {
    if (!isListLike) {
      setNavCollapsed(false)
      return
    }
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        setNavCollapsed(y > 4)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [isListLike])

  // reset collapsed state on route change (so newly-entered page starts open)
  useEffect(() => {
    setNavCollapsed(false)
  }, [pathname])

  const showFloating = isListLike && navCollapsed && transitionPhase === 'idle'
  const transitioning = transitionPhase !== 'idle'

  // Lock scroll during page transitions
  useEffect(() => {
    if (transitioning) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [transitioning])

  useEffect(() => {
    if (transitionPhase !== 'cover') return
    setTypedLabel('')
    let i = 0
    const timer = setInterval(() => {
      i++
      setTypedLabel(transitionLabel.slice(0, i))
      if (i >= transitionLabel.length) clearInterval(timer)
    }, 35)
    return () => clearInterval(timer)
  }, [transitionPhase, transitionLabel])

  // reveal only after the new page is actually mounted (and min dwell elapsed)
  const setPhase = useTransitionStore(s => s.setPhase)
  const coveredAt = useTransitionStore(s => s.coveredAt)
  useEffect(() => {
    if (transitionPhase !== 'cover') return
    const elapsed = Date.now() - coveredAt
    const wait = Math.max(100, 450 - elapsed)
    const revealTimer = setTimeout(() => {
      setPhase('reveal')
      setTimeout(() => setPhase('idle'), 500)
    }, wait)
    return () => clearTimeout(revealTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // fallback: never stay covered longer than 3s (e.g. dev compile)
  useEffect(() => {
    if (transitionPhase !== 'cover') return
    const fallback = setTimeout(() => {
      setPhase('reveal')
      setTimeout(() => setPhase('idle'), 500)
    }, 3000)
    return () => clearTimeout(fallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionPhase])

  // Esc: navigate to parent route
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[data-dialog-open]')) return
      if (pathname === '/') return
      const parent = pathname.replace(/\/+$/, '').split('/').slice(0, -1).join('/') || '/'
      navigate(parent)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pathname, navigate])

  // Toast interaction: single click copy, double click (250ms) close
  useEffect(() => {
    let clickTimer: ReturnType<typeof setTimeout> | null = null
    let hintEl: HTMLDivElement | null = null

    const showCopyHint = (target: HTMLElement) => {
      if (hintEl) hintEl.remove()
      const rect = target.getBoundingClientRect()
      const hint = document.createElement('div')
      hint.textContent = '已复制'
      hint.style.cssText = `
        position: fixed; z-index: 99999; left: ${rect.left + rect.width / 2}px; top: ${rect.top - 8}px;
        transform: translate(-50%, -100%);
        background: var(--color-brand); color: #000; font-size: 10px;
        font-family: "JetBrains Mono","SF Mono",Consolas,monospace;
        letter-spacing: 0.1em; padding: 2px 8px;
        opacity: 0; transition: opacity 0.15s ease;
        pointer-events: none;
      `
      document.body.appendChild(hint)
      hintEl = hint
      requestAnimationFrame(() => { hint.style.opacity = '1' })
      setTimeout(() => {
        hint.style.opacity = '0'
        setTimeout(() => { hint.remove(); if (hintEl === hint) hintEl = null }, 150)
      }, 800)
    }

    const onToastClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-sonner-toast]')
      if (!target) return
      if (clickTimer) {
        clearTimeout(clickTimer)
        clickTimer = null
        const toastId = target.getAttribute('data-id')
        if (toastId) toast.dismiss(toastId)
        else toast.dismiss()
      } else {
        clickTimer = setTimeout(() => {
          clickTimer = null
          const msgEl = target.querySelector('[data-content]')
          const msg = msgEl?.textContent || ''
          if (msg) {
            navigator.clipboard.writeText(msg).then(() => {
              showCopyHint(target as HTMLElement)
            }).catch(() => {})
          }
        }, 250)
      }
    }
    document.addEventListener('click', onToastClick)
    return () => {
      document.removeEventListener('click', onToastClick)
      if (clickTimer) clearTimeout(clickTimer)
      if (hintEl) hintEl.remove()
    }
  }, [])

  return (
    <div className='flex min-h-screen flex-col bg-black' style={{ color: 'var(--color-primary)', fontFamily: '"JetBrains Mono","SF Mono",Consolas,monospace' }}>
      <SplashScreen />
      <CustomCursor />
      {/* decode glitch transition overlay */}
      {transitionPhase !== 'idle' && (
        <div
          className='fixed inset-0 bg-black'
          style={{
            zIndex: 9998,
            animation: transitionPhase === 'cover' ? 'glitch-in 0.35s ease-out both' : 'transition-fade-out 0.35s ease both'
          }}
        >
          <div
            className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm tracking-[0.15em]'
            style={{ color: 'var(--color-brand)' }}
          >
            {typedLabel}
            <span style={{ animation: 'splash-blink 0.6s step-end infinite' }}>▋</span>
          </div>
        </div>
      )}
      <Toaster
        position='bottom-right'
        richColors={false}
        closeButton={false}
        duration={6000}
        icons={{
          success: <CircleCheckIcon className='size-4' />,
          info: <InfoIcon className='size-4' />,
          warning: <TriangleAlertIcon className='size-4' />,
          error: <OctagonXIcon className='size-4' />,
          loading: <Loader2Icon className='size-4 animate-spin' />
        }}
        toastOptions={{
          className: 'toast-terminal',
          style: {
            background: '#000',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            border: '1px solid var(--color-border)',
            color: '#999',
            fontSize: '12px',
            fontFamily: '"JetBrains Mono","SF Mono",Consolas,monospace',
            letterSpacing: '0.08em',
            borderRadius: 0,
            padding: '12px 16px',
            cursor: 'default',
            userSelect: 'none'
          }
        }}
      />

      {/* Grid background */}
      <div className='pointer-events-none fixed inset-0 z-0' style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      {/* Grid ambient: random cells light up and fade */}
      <GridFlicker />

      {/* Top Nav */}
      {!isHome && (
        <nav className='relative z-10 flex items-center justify-between border-b px-10' style={{ borderColor: 'var(--color-border)' }}>
          <Link
            href='/'
            className={`py-6 text-base font-semibold tracking-[0.2em] text-white no-underline transition-opacity ${isListLike && navCollapsed ? 'opacity-0' : 'opacity-100'}`}
            data-cursor-label='HOME'
            onClick={e => {
              if (!isPlainClick(e)) return
              e.preventDefault()
              navigate('/')
            }}
          >
            TENET
          </Link>
          <div
            className='flex gap-2'
            style={{
              animation: isListLike && navCollapsed
                ? 'nav-items-out 0.45s cubic-bezier(0.2,0.7,0.2,1) both'
                : isListLike
                  ? 'nav-items-in 0.45s cubic-bezier(0.2,0.7,0.2,1) both'
                  : undefined,
              pointerEvents: isListLike && navCollapsed ? 'none' : 'auto'
            }}
          >
            {navItems.map((item, i) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className='group relative flex items-baseline gap-1.5 px-3 py-6 text-xs tracking-[0.1em] uppercase no-underline transition-colors'
                  style={{ color: active ? 'var(--color-brand)' : '#666' }}
                  onClick={e => {
                    if (!isPlainClick(e)) return
                    e.preventDefault()
                    navigate(item.href)
                  }}
                >
                  <span className='text-[9px]' style={{ color: active ? 'var(--color-brand)' : '#3a3a3a' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className='transition-colors group-hover:text-white' style={{ color: active ? 'var(--color-brand)' : undefined }}>
                    {item.label}
                  </span>
                  <span className='absolute bottom-5 left-3 right-3 h-px transition-all duration-300' style={{
                    backgroundColor: 'var(--color-brand)',
                    opacity: active ? 1 : 0
                  }} />
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* TENET vertical badge — migrates to left golden ratio when scrolled on list-like pages */}
      {isListLike && (
        <div
          className='pointer-events-none fixed left-3 z-30'
          style={{
            top: '38.2vh',
            transform: 'translateY(-50%)',
            opacity: navCollapsed && !transitioning ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <button
            type='button'
            className='group pointer-events-auto relative flex flex-col items-center gap-2 border px-1.5 py-3 text-[10px] tracking-[0.45em] no-underline transition-colors duration-300 hover:border-[var(--color-brand)]'
            style={{
              borderColor: 'var(--color-border)',
              color: '#777',
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              animation: navCollapsed ? 'floating-nav-enter-left 0.45s cubic-bezier(0.2,0.7,0.2,1) both' : 'floating-nav-exit-left 0.3s ease both'
            }}
            onClick={() => navigate('/')}
            aria-label='回到首页'
            data-cursor-label='HOME'
          >
            <svg className='h-3.5 w-3.5 transition-colors duration-300 group-hover:text-white' viewBox='0 0 12 12' fill='none'>
              <path d='M2 5L6 2L10 5V10H2V5Z' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
            <span className='h-px w-3' style={{ backgroundColor: 'var(--color-border)' }} />
            <span className='transition-colors duration-300 group-hover:text-white' style={{ writingMode: 'vertical-rl' }}>TENET</span>
            <span
              className='absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100'
              style={{ backgroundColor: 'var(--color-brand)' }}
            />
          </button>
        </div>
      )}

      {/* Floating nav — appears on scroll on list-like pages */}
      {isListLike && (
        <FloatingNav visible={showFloating} />
      )}

      {/* Main content */}
      {isFullBleed ? (
        <main className='relative z-[1] flex-1' style={transitionPhase === 'cover' ? { animation: 'page-glitch 0.3s steps(2) 1' } : undefined}>
          {children}
        </main>
      ) : (
        <main
          className='relative z-[1] mx-auto w-full max-w-[720px] flex-1 px-6 py-12'
          style={transitionPhase === 'cover' ? { animation: 'page-glitch 0.3s steps(2) 1' } : undefined}
        >
          {children}
        </main>
      )}

      {/* Footer */}
      {!isHome && (
        <footer className='relative z-[1] flex justify-center border-t px-10 py-6' style={{ borderColor: 'var(--color-border)' }}>
          <span className='text-[0.65rem] tracking-[0.1em]' style={{ color: '#333' }}>
            {'// '}
            {siteContent.meta.title || 'BLOG'}
          </span>
        </footer>
      )}
    </div>
  )
}
