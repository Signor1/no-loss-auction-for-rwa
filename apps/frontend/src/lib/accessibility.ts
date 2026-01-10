import { useEffect, useRef, useCallback } from 'react'

// Accessibility types
export interface A11yProps {
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-pressed'?: boolean
  'aria-selected'?: boolean
  'aria-disabled'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-atomic'?: boolean
  'aria-relevant'?: string
  'aria-busy'?: boolean
  'tabIndex'?: number
}

export interface FocusTrapProps {
  enabled: boolean
  onEscape?: () => void
}

export interface KeyboardNavigationProps {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onTab?: () => void
  onShiftTab?: () => void
}

export interface ScreenReaderAnnouncement {
  message: string
  priority: 'polite' | 'assertive'
  timeout?: number
}

// WCAG 2.1 AA compliance utilities
export const a11yUtils = {
  // Color contrast checker
  checkColorContrast: (foreground: string, background: string): number => {
    // Simplified contrast calculation - in real implementation would use proper algorithm
    const getLuminance = (color: string): number => {
      // Convert hex to RGB then calculate luminance
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      
      const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
      const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
      const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
      
      return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB
    }
    
    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  },

  // Check if contrast meets WCAG AA standards
  meetsWCAG_AA: (contrast: ratio): boolean => {
    return ratio >= 4.5 // WCAG AA standard for normal text
  },

  meetsWCAG_AA_Large: (contrast: ratio): boolean => {
    return ratio >= 3 // WCAG AA standard for large text (18pt+ or 14pt bold)
  },

  // Generate accessible color combinations
  getAccessibleColors: (baseColor: string): { text: string; background: string } => {
    // Simplified logic - in real implementation would be more sophisticated
    const isLight = baseColor.toLowerCase() === '#ffffff' || baseColor.toLowerCase().startsWith('#f')
    
    return {
      text: isLight ? '#000000' : '#ffffff',
      background: baseColor
    }
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase()
    const focusableTags = ['a', 'button', 'input', 'select', 'textarea', 'details']
    
    if (focusableTags.includes(tagName)) return true
    
    // Check for tabindex
    const tabindex = element.getAttribute('tabindex')
    if (tabindex && parseInt(tabindex) >= 0) return true
    
    // Check for contenteditable
    if (element.getAttribute('contenteditable') === 'true') return true
    
    return false
  },

  // Get all focusable elements in a container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), details, [contenteditable="true"]'
    )
    
    return Array.from(focusableElements).filter(el => {
      const element = el as HTMLElement
      return !element.hasAttribute('disabled') && 
             !element.hasAttribute('aria-hidden') &&
             element.offsetParent !== null
    }) as HTMLElement[]
  },

  // Set focus to first focusable element
  focusFirstElement: (container: HTMLElement): boolean => {
    const focusableElements = a11yUtils.getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
      return true
    }
    return false
  },

  // Set focus to last focusable element
  focusLastElement: (container: HTMLElement): boolean => {
    const focusableElements = a11yUtils.getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
      return true
    }
    return false
  }
}

// Hook for focus management
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus()
    }
  }, [])

  const trapFocus = useCallback((enabled: boolean) => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = a11yUtils.getFocusableElements(container)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault()
        
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement

        if (event.shiftKey) {
          // Shift + Tab
          if (activeElement === firstElement) {
            lastElement.focus()
          } else {
            const currentIndex = focusableElements.indexOf(activeElement as HTMLElement)
            if (currentIndex > 0) {
              focusableElements[currentIndex - 1].focus()
            }
          }
        } else {
          // Tab
          if (activeElement === lastElement) {
            firstElement.focus()
          } else {
            const currentIndex = focusableElements.indexOf(activeElement as HTMLElement)
            if (currentIndex < focusableElements.length - 1) {
              focusableElements[currentIndex + 1].focus()
            }
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef])

  return {
    saveFocus,
    restoreFocus,
    trapFocus
  }
}

// Hook for keyboard navigation
export function useKeyboardNavigation(props: KeyboardNavigationProps) {
  const elementRef = useRef<HTMLElement>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        props.onArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        props.onArrowDown?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        props.onArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        props.onArrowRight?.()
        break
      case 'Enter':
        event.preventDefault()
        props.onEnter?.()
        break
      case ' ':
        event.preventDefault()
        props.onSpace?.()
        break
      case 'Escape':
        event.preventDefault()
        props.onEscape?.()
        break
      case 'Tab':
        if (event.shiftKey) {
          props.onShiftTab?.()
        } else {
          props.onTab?.()
        }
        break
    }
  }, [props])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('keydown', handleKeyDown)
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return elementRef
}

// Hook for screen reader announcements
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite')
  }, [announce])

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive')
  }, [announce])

  return {
    announce,
    announcePolite,
    announceAssertive
  }
}

// Hook for skip links
export function useSkipLinks() {
  const createSkipLink = useCallback((targetId: string, label: string): HTMLElement => {
    const link = document.createElement('a')
    link.href = `#${targetId}`
    link.textContent = label
    link.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50'
    link.setAttribute('role', 'navigation')
    link.setAttribute('aria-label', label)

    return link
  }, [])

  const addSkipLink = useCallback((targetId: string, label: string) => {
    const link = createSkipLink(targetId, label)
    document.body.insertBefore(link, document.body.firstChild)
    return link
  }, [createSkipLink])

  return {
    createSkipLink,
    addSkipLink
  }
}

// Hook for ARIA attributes generation
export function useAriaProps() {
  const getButtonProps = useCallback((options: {
    label?: string
    describedBy?: string
    expanded?: boolean
    pressed?: boolean
    disabled?: boolean
  } = {}): A11yProps => {
    const props: A11yProps = {
      role: 'button',
      type: 'button'
    }

    if (options.label) props['aria-label'] = options.label
    if (options.describedBy) props['aria-describedby'] = options.describedBy
    if (options.expanded !== undefined) props['aria-expanded'] = options.expanded
    if (options.pressed !== undefined) props['aria-pressed'] = options.pressed
    if (options.disabled) {
      props['aria-disabled'] = true
      props.tabIndex = -1
    }

    return props
  }, [])

  const getLinkProps = useCallback((options: {
    label?: string
    describedBy?: string
    current?: boolean
    disabled?: boolean
  } = {}): A11yProps => {
    const props: A11yProps = {}

    if (options.label) props['aria-label'] = options.label
    if (options.describedBy) props['aria-describedby'] = options.describedBy
    if (options.current) props['aria-current'] = 'page'
    if (options.disabled) {
      props['aria-disabled'] = true
      props.tabIndex = -1
    }

    return props
  }, [])

  const getModalProps = useCallback((options: {
    label?: string
    describedBy?: string
    labelledBy?: string
  } = {}): A11yProps => {
    const props: A11yProps = {
      role: 'dialog',
      'aria-modal': 'true'
    }

    if (options.label) props['aria-label'] = options.label
    if (options.describedBy) props['aria-describedby'] = options.describedBy
    if (options.labelledBy) props['aria-labelledby'] = options.labelledBy

    return props
  }, [])

  const getTooltipProps = useCallback((options: {
    id: string
    describedBy?: string
  }): A11yProps => {
    const props: A11yProps = {
      role: 'tooltip',
      id: options.id
    }

    if (options.describedBy) props['aria-describedby'] = options.describedBy

    return props
  }, [])

  const getProgressProps = useCallback((options: {
    label?: string
    value?: number
    max?: number
    showValue?: boolean
  } = {}): A11yProps => {
    const props: A11yProps = {
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': (options.max || 100).toString()
    }

    if (options.label) props['aria-label'] = options.label
    if (options.value !== undefined) {
      props['aria-valuenow'] = options.value.toString()
      if (options.showValue) {
        props['aria-valuetext'] = `${options.value} of ${options.max || 100}`
      }
    }

    return props
  }, [])

  return {
    getButtonProps,
    getLinkProps,
    getModalProps,
    getTooltipProps,
    getProgressProps
  }
}

// Accessibility testing utilities
export const a11yTesting = {
  // Check for missing alt text on images
  checkImageAltText: (container: HTMLElement): string[] => {
    const images = container.querySelectorAll('img')
    const issues: string[] = []

    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image ${index + 1} is missing alt text or aria-label`)
      }
    })

    return issues
  },

  // Check for proper heading hierarchy
  checkHeadingHierarchy: (container: HTMLElement): string[] => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const issues: string[] = []
    let previousLevel = 0

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1))
      
      if (level > previousLevel + 1) {
        issues.push(`Heading level skipped: from h${previousLevel} to h${level}`)
      }
      
      previousLevel = level
    })

    return issues
  },

  // Check for form labels
  checkFormLabels: (container: HTMLElement): string[] => {
    const inputs = container.querySelectorAll('input, select, textarea')
    const issues: string[] = []

    inputs.forEach((input, index) => {
      const hasLabel = input.id && container.querySelector(`label[for="${input.id}"]`)
      const hasAriaLabel = input.getAttribute('aria-label')
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby')

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        const inputType = input.getAttribute('type') || input.tagName.toLowerCase()
        issues.push(`Input ${index + 1} (${inputType}) is missing a label`)
      }
    })

    return issues
  },

  // Check for focus management
  checkFocusManagement: (container: HTMLElement): string[] => {
    const focusableElements = a11yUtils.getFocusableElements(container)
    const issues: string[] = []

    if (focusableElements.length === 0) {
      issues.push('Container has no focusable elements')
    }

    // Check for tabindex > 0
    container.querySelectorAll('[tabindex]').forEach((element, index) => {
      const tabindex = element.getAttribute('tabindex')
      if (tabindex && parseInt(tabindex) > 0) {
        issues.push(`Element ${index + 1} has tabindex > 0`)
      }
    })

    return issues
  },

  // Run comprehensive accessibility audit
  runAudit: (container: HTMLElement): {
    errors: string[]
    warnings: string[]
    score: number
  } => {
    const errors = [
      ...a11yTesting.checkImageAltText(container),
      ...a11yTesting.checkFormLabels(container)
    ]

    const warnings = [
      ...a11yTesting.checkHeadingHierarchy(container),
      ...a11yTesting.checkFocusManagement(container)
    ]

    const score = Math.max(0, 100 - (errors.length * 10) - (warnings.length * 5))

    return {
      errors,
      warnings,
      score
    }
  }
}

// CSS utilities for accessibility
export const a11yCSS = {
  // Screen reader only class
  srOnly: `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `,

  // Focus visible styles
  focusVisible: `
    &:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `,

  // High contrast mode support
  highContrast: `
    @media (prefers-contrast: high) {
      border-color: ButtonText;
      color: ButtonText;
    }
  `,

  // Reduced motion support
  reducedMotion: `
    @media (prefers-reduced-motion: reduce) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  `
}
