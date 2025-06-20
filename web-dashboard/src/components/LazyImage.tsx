import React, { useState, useRef, useEffect, memo } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

const LazyImage = memo(function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA3MEg0MEE2IDYgMCAwIDAgMzQgNzZWMTI0QTYgNiAwIDAgMCA0MCAxMzBINjBBNiA2IDAgMCAwIDY2IDEyNFY3NkE2IDYgMCAwIDAgNjAgNzBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik00NSA4NUE1IDUgMCAxIDEgNDUgOTVBNSA1IDAgMCAxIDQ1IDg1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=',
  onLoad,
  onError
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // 50px手前から読み込み開始
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
        onLoad?.()
      }
      img.onerror = () => {
        onError?.()
      }
      img.src = src
    }
  }, [isInView, isLoaded, src, onLoad, onError])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-70'} ${className}`}
      loading="lazy"
    />
  )
})

export { LazyImage }