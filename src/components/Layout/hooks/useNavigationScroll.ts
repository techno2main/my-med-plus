import { useRef, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

/**
 * Hook personnalisé pour gérer le scroll horizontal de la navigation
 * Sauvegarde et restaure la position de scroll dans le localStorage
 * Supporte le drag-to-scroll à la souris
 */
export function useNavigationScroll() {
  const location = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Restore scroll position on mount and route change
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const savedPosition = localStorage.getItem('nav-scroll-position')
    if (savedPosition) {
      // Use multiple methods to ensure it works
      container.scrollLeft = parseInt(savedPosition, 10)
      
      requestAnimationFrame(() => {
        container.scrollLeft = parseInt(savedPosition, 10)
      })
      
      setTimeout(() => {
        container.scrollLeft = parseInt(savedPosition, 10)
      }, 100)
    }
  }, [location.pathname])

  // Save scroll position on scroll and touch
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const savePosition = () => {
      localStorage.setItem('nav-scroll-position', container.scrollLeft.toString())
    }

    container.addEventListener('scroll', savePosition, { passive: true })
    container.addEventListener('touchend', savePosition, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', savePosition)
      container.removeEventListener('touchend', savePosition)
    }
  }, [])

  // Handle mouse drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 2
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  return {
    scrollContainerRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  }
}
