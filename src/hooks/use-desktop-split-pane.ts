import * as React from "react"

// Matches Tailwind's `lg:` breakpoint exactly -- the Discovery split-pane
// grid switches to two columns at the same width this hook flips true, so
// the click handler (intercept vs. real navigation) never disagrees with
// what's actually on screen.
const DESKTOP_BREAKPOINT = 1024

export function useDesktopSplitPane() {
  // Starts false so server and first client render match; the effect
  // corrects it post-mount once window is available, same as use-mobile.
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isDesktop
}
