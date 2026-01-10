import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Onboarding types
export interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector or element ID
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: 'click' | 'hover' | 'focus' | 'none'
  skipable?: boolean
  showProgress?: boolean
  showSkip?: boolean
  showNext?: boolean
  showPrevious?: boolean
  customStyles?: {
    beacon?: React.CSSProperties
    tooltip?: React.CSSProperties
    overlay?: React.CSSProperties
  }
  beforeShow?: () => void | Promise<void>
  afterShow?: () => void | Promise<void>
  onNext?: () => void | Promise<void>
  onPrevious?: () => void | Promise<void>
  onSkip?: () => void | Promise<void>
}

export interface Tour {
  id: string
  name: string
  description: string
  steps: TourStep[]
  targetAudience: 'new' | 'returning' | 'power' | 'all'
  category: 'general' | 'auctions' | 'wallet' | 'profile' | 'search'
  estimatedDuration: number // in minutes
  required?: boolean
  autoStart?: boolean
  showOnLogin?: boolean
  priority: number
}

export interface Tutorial {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // in minutes
  steps: TutorialStep[]
  prerequisites?: string[]
  tags: string[]
  featured?: boolean
}

export interface TutorialStep {
  id: string
  title: string
  description: string
  type: 'instruction' | 'action' | 'quiz' | 'video' | 'interactive'
  content: {
    text?: string
    image?: string
    video?: string
    code?: string
    interactive?: any
  }
  validation?: {
    type: 'click' | 'input' | 'select' | 'custom'
    target: string
    expectedValue?: any
    validator?: (element: HTMLElement) => boolean
  }
  hints?: string[]
  timeLimit?: number // in seconds
  required?: boolean
}

export interface Tooltip {
  id: string
  content: string
  target: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  trigger: 'hover' | 'click' | 'focus' | 'manual'
  delay?: number
  duration?: number
  persistent?: boolean
  dismissible?: boolean
  showOnce?: boolean
  priority?: number
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  helpful: number
  notHelpful: number
  views: number
  lastUpdated: Date
  related?: string[]
}

export interface VideoGuide {
  id: string
  title: string
  description: string
  url: string
  thumbnail: string
  duration: number // in seconds
  category: string
  tags: string[]
  transcript?: string
  chapters?: Array<{
    timestamp: number
    title: string
    description: string
  }>
  featured?: boolean
  views: number
  likes: number
}

export interface KnowledgeBaseArticle {
  id: string
  title: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  author: string
  publishedAt: Date
  updatedAt: Date
  readingTime: number // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  related?: string[]
  helpful: number
  notHelpful: number
  views: number
}

export interface UserOnboardingProgress {
  userId: string
  completedTours: string[]
  completedTutorials: string[]
  tourProgress: Record<string, number> // tourId -> stepIndex
  tutorialProgress: Record<string, number> // tutorialId -> stepIndex
  skippedTours: string[]
  dismissedTooltips: string[]
  faqInteractions: Record<string, 'helpful' | 'not-helpful'>
  videoWatchProgress: Record<string, number> // videoId -> seconds watched
  lastActivity: Date
  preferences: {
    showTooltips: boolean
    autoStartTours: boolean
    enableHints: boolean
    preferredLanguage: string
  }
}

// Mock data
export const mockTours: Tour[] = [
  {
    id: 'welcome-tour',
    name: 'Welcome to No-Loss Auction',
    description: 'Get familiar with the platform basics',
    targetAudience: 'new',
    category: 'general',
    estimatedDuration: 5,
    autoStart: true,
    showOnLogin: true,
    priority: 1,
    steps: [
      {
        id: 'welcome-step-1',
        title: 'Welcome to No-Loss Auction!',
        content: 'Let\'s take a quick tour to help you get started with our decentralized auction platform.',
        target: 'body',
        placement: 'center',
        showProgress: true,
        showSkip: true,
        showNext: true
      },
      {
        id: 'welcome-step-2',
        title: 'Navigation Menu',
        content: 'This is your main navigation. You can access auctions, search, portfolio, and settings from here.',
        target: '#main-nav',
        placement: 'bottom',
        action: 'click',
        showProgress: true,
        showSkip: true,
        showNext: true,
        showPrevious: true
      },
      {
        id: 'welcome-step-3',
        title: 'Active Auctions',
        content: 'Browse and participate in ongoing auctions for real-world assets.',
        target: '#auctions-section',
        placement: 'right',
        action: 'hover',
        showProgress: true,
        showSkip: true,
        showNext: true,
        showPrevious: true
      },
      {
        id: 'welcome-step-4',
        title: 'Wallet Connection',
        content: 'Connect your wallet to start bidding and managing your assets.',
        target: '#wallet-button',
        placement: 'left',
        action: 'click',
        showProgress: true,
        showSkip: true,
        showNext: true,
        showPrevious: true
      },
      {
        id: 'welcome-step-5',
        title: 'You\'re All Set!',
        content: 'You\'ve completed the basic tour. Feel free to explore or check out our tutorials for more in-depth guidance.',
        target: 'body',
        placement: 'center',
        showProgress: true,
        showSkip: false,
        showNext: false,
        showPrevious: true
      }
    ]
  },
  {
    id: 'bidding-tour',
    name: 'How to Place a Bid',
    description: 'Learn the bidding process step by step',
    targetAudience: 'new',
    category: 'auctions',
    estimatedDuration: 3,
    priority: 2,
    steps: [
      {
        id: 'bidding-step-1',
        title: 'Finding an Auction',
        content: 'Start by browsing or searching for auctions that interest you.',
        target: '#search-bar',
        placement: 'bottom',
        showProgress: true,
        showSkip: true,
        showNext: true
      },
      {
        id: 'bidding-step-2',
        title: 'Auction Details',
        content: 'Review the auction details, including current bid, time remaining, and asset information.',
        target: '#auction-details',
        placement: 'left',
        showProgress: true,
        showSkip: true,
        showNext: true,
        showPrevious: true
      },
      {
        id: 'bidding-step-3',
        title: 'Placing Your Bid',
        content: 'Enter your bid amount and confirm to participate in the auction.',
        target: '#bid-form',
        placement: 'top',
        action: 'click',
        showProgress: true,
        showSkip: true,
        showNext: true,
        showPrevious: true
      }
    ]
  }
]

export const mockTutorials: Tutorial[] = [
  {
    id: 'wallet-basics',
    title: 'Wallet Basics',
    description: 'Learn how to set up and use your wallet',
    category: 'wallet',
    difficulty: 'beginner',
    estimatedTime: 10,
    tags: ['wallet', 'blockchain', 'security'],
    featured: true,
    steps: [
      {
        id: 'wallet-step-1',
        title: 'What is a Wallet?',
        description: 'Understanding digital wallets and their importance',
        type: 'instruction',
        content: {
          text: 'A digital wallet is a secure application that stores your cryptocurrency and allows you to interact with blockchain networks. It\'s essential for participating in auctions and managing your assets.',
          image: '/images/wallet-diagram.png'
        }
      },
      {
        id: 'wallet-step-2',
        title: 'Connect Your Wallet',
        description: 'Practice connecting a wallet to the platform',
        type: 'action',
        content: {
          text: 'Click the wallet button in the top right corner and follow the prompts to connect your wallet.',
          interactive: { target: '#wallet-button', action: 'click' }
        },
        validation: {
          type: 'click',
          target: '#wallet-button'
        },
        hints: ['Look for the wallet icon in the top right', 'Make sure you have a wallet extension installed']
      },
      {
        id: 'wallet-step-3',
        title: 'Security Best Practices',
        description: 'Learn how to keep your wallet secure',
        type: 'instruction',
        content: {
          text: 'Always keep your private keys secure, use hardware wallets for large amounts, and enable two-factor authentication when available.',
          video: '/videos/wallet-security.mp4'
        }
      }
    ]
  },
  {
    id: 'advanced-bidding',
    title: 'Advanced Bidding Strategies',
    description: 'Master the art of strategic bidding',
    category: 'auctions',
    difficulty: 'advanced',
    estimatedTime: 15,
    tags: ['bidding', 'strategy', 'advanced'],
    prerequisites: ['wallet-basics'],
    steps: [
      {
        id: 'advanced-step-1',
        title: 'Understanding Auction Types',
        description: 'Different auction formats and their implications',
        type: 'instruction',
        content: {
          text: 'English auctions, Dutch auctions, sealed-bid auctions - each requires different strategies.',
          image: '/images/auction-types.png'
        }
      },
      {
        id: 'advanced-step-2',
        title: 'Timing Your Bids',
        description: 'Learn optimal bidding timing strategies',
        type: 'interactive',
        content: {
          text: 'Practice placing bids at different times to see how it affects the auction dynamics.',
          interactive: { simulation: 'bidding-timing' }
        }
      }
    ]
  }
]

export const mockTooltips: Tooltip[] = [
  {
    id: 'wallet-tooltip',
    content: 'Connect your wallet to start bidding and managing assets',
    target: '#wallet-button',
    placement: 'bottom',
    trigger: 'hover',
    delay: 500,
    showOnce: true,
    priority: 1
  },
  {
    id: 'search-tooltip',
    content: 'Search for auctions, assets, or categories',
    target: '#search-bar',
    placement: 'bottom',
    trigger: 'focus',
    delay: 300,
    showOnce: true,
    priority: 2
  },
  {
    id: 'bid-tooltip',
    content: 'Enter your bid amount. Minimum bid is displayed below.',
    target: '#bid-input',
    placement: 'top',
    trigger: 'focus',
    delay: 200,
    persistent: true,
    priority: 3
  }
]

export const mockFAQ: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I connect my wallet?',
    answer: 'Click the "Connect Wallet" button in the top right corner of the page. Select your wallet provider (MetaMask, WalletConnect, etc.) and follow the prompts to connect. Make sure your wallet is unlocked and you\'re on the correct network.',
    category: 'Wallet',
    tags: ['wallet', 'connection', 'setup'],
    helpful: 45,
    notHelpful: 3,
    views: 892,
    lastUpdated: new Date('2024-01-15'),
    related: ['faq-2', 'faq-5']
  },
  {
    id: 'faq-2',
    question: 'What cryptocurrencies are supported?',
    answer: 'We currently support Ethereum (ETH), USDC, USDT, and DAI for bidding. Additional tokens may be added in the future based on user demand and liquidity.',
    category: 'Payments',
    tags: ['cryptocurrency', 'tokens', 'payment'],
    helpful: 38,
    notHelpful: 2,
    views: 654,
    lastUpdated: new Date('2024-01-18'),
    related: ['faq-1', 'faq-8']
  },
  {
    id: 'faq-3',
    question: 'How does the no-loss auction work?',
    answer: 'Our no-loss auction model ensures that participants can get their funds back if they don\'t win. The auction uses a smart contract that automatically returns bids to unsuccessful participants, eliminating the risk of losing your money.',
    category: 'Auctions',
    tags: ['no-loss', 'auction', 'smart-contract'],
    helpful: 67,
    notHelpful: 5,
    views: 1234,
    lastUpdated: new Date('2024-01-20'),
    related: ['faq-4', 'faq-7']
  }
]

export const mockVideoGuides: VideoGuide[] = [
  {
    id: 'video-1',
    title: 'Getting Started Guide',
    description: 'Complete walkthrough of the platform',
    url: '/videos/getting-started.mp4',
    thumbnail: '/thumbnails/getting-started.jpg',
    duration: 480, // 8 minutes
    category: 'General',
    tags: ['beginner', 'tutorial', 'overview'],
    featured: true,
    views: 2341,
    likes: 156,
    chapters: [
      { timestamp: 0, title: 'Introduction', description: 'Platform overview' },
      { timestamp: 60, title: 'Account Setup', description: 'Creating your account' },
      { timestamp: 180, title: 'Wallet Connection', description: 'Connecting your wallet' },
      { timestamp: 300, title: 'First Bid', description: 'Placing your first bid' },
      { timestamp: 420, title: 'Next Steps', description: 'What to do next' }
    ]
  },
  {
    id: 'video-2',
    title: 'Advanced Bidding Strategies',
    description: 'Master the art of strategic bidding',
    url: '/videos/advanced-bidding.mp4',
    thumbnail: '/thumbnails/advanced-bidding.jpg',
    duration: 720, // 12 minutes
    category: 'Auctions',
    tags: ['advanced', 'strategy', 'bidding'],
    views: 892,
    likes: 78,
    chapters: [
      { timestamp: 0, title: 'Strategy Overview', description: 'Understanding different approaches' },
      { timestamp: 120, title: 'Timing Analysis', description: 'When to place your bids' },
      { timestamp: 300, title: 'Risk Management', description: 'Minimizing your risks' },
      { timestamp: 480, title: 'Case Studies', description: 'Real-world examples' },
      { timestamp: 600, title: 'Tools and Resources', description: 'Helpful resources' }
    ]
  }
]

export const mockKnowledgeBase: KnowledgeBaseArticle[] = [
  {
    id: 'kb-1',
    title: 'Understanding Smart Contracts',
    content: 'Smart contracts are self-executing contracts with the terms of the agreement directly written into code...',
    excerpt: 'Learn how smart contracts power our no-loss auction platform and ensure trustless transactions.',
    category: 'Technology',
    tags: ['smart-contracts', 'blockchain', 'technology'],
    author: 'Tech Team',
    publishedAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    readingTime: 8,
    difficulty: 'intermediate',
    helpful: 89,
    notHelpful: 4,
    views: 1567,
    related: ['kb-2', 'kb-5']
  },
  {
    id: 'kb-2',
    title: 'Gas Fees Explained',
    content: 'Gas fees are the costs associated with performing transactions on the Ethereum network...',
    excerpt: 'Understanding how gas fees work and how to optimize your transaction costs.',
    category: 'Technology',
    tags: ['gas-fees', 'ethereum', 'costs'],
    author: 'Tech Team',
    publishedAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-18'),
    readingTime: 6,
    difficulty: 'beginner',
    helpful: 92,
    notHelpful: 3,
    views: 2103,
    related: ['kb-1', 'kb-3']
  }
]

// Onboarding context
interface OnboardingContextType {
  // Tours
  tours: Tour[]
  activeTour: Tour | null
  currentTourStep: number
  isTourActive: boolean
  startTour: (tourId: string) => void
  nextTourStep: () => void
  previousTourStep: () => void
  skipTour: () => void
  endTour: () => void
  
  // Tutorials
  tutorials: Tutorial[]
  activeTutorial: Tutorial | null
  currentTutorialStep: number
  isTutorialActive: boolean
  startTutorial: (tutorialId: string) => void
  nextTutorialStep: () => void
  previousTutorialStep: () => void
  completeTutorialStep: () => void
  endTutorial: () => void
  
  // Tooltips
  tooltips: Tooltip[]
  showTooltip: (tooltipId: string) => void
  hideTooltip: (tooltipId: string) => void
  dismissTooltip: (tooltipId: string) => void
  
  // Progress
  userProgress: UserOnboardingProgress
  updateProgress: (updates: Partial<UserOnboardingProgress>) => void
  
  // Preferences
  preferences: UserOnboardingProgress['preferences']
  updatePreferences: (updates: Partial<UserOnboardingProgress['preferences']>) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

// Onboarding provider
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [tours] = useState<Tour[]>(mockTours)
  const [tutorials] = useState<Tutorial[]>(mockTutorials)
  const [tooltips] = useState<Tooltip[]>(mockTooltips)
  
  const [activeTour, setActiveTour] = useState<Tour | null>(null)
  const [currentTourStep, setCurrentTourStep] = useState(0)
  const [isTourActive, setIsTourActive] = useState(false)
  
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null)
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0)
  const [isTutorialActive, setIsTutorialActive] = useState(false)
  
  const [userProgress, setUserProgress] = useState<UserOnboardingProgress>({
    userId: 'user-123',
    completedTours: [],
    completedTutorials: [],
    tourProgress: {},
    tutorialProgress: {},
    skippedTours: [],
    dismissedTooltips: [],
    faqInteractions: {},
    videoWatchProgress: {},
    lastActivity: new Date(),
    preferences: {
      showTooltips: true,
      autoStartTours: true,
      enableHints: true,
      preferredLanguage: 'en'
    }
  })

  // Tour functions
  const startTour = useCallback((tourId: string) => {
    const tour = tours.find(t => t.id === tourId)
    if (tour) {
      setActiveTour(tour)
      setCurrentTourStep(0)
      setIsTourActive(true)
      
      // Update progress
      setUserProgress(prev => ({
        ...prev,
        tourProgress: { ...prev.tourProgress, [tourId]: 0 },
        lastActivity: new Date()
      }))
    }
  }, [tours])

  const nextTourStep = useCallback(() => {
    if (activeTour && currentTourStep < activeTour.steps.length - 1) {
      const nextStep = currentTourStep + 1
      setCurrentTourStep(nextStep)
      
      // Update progress
      setUserProgress(prev => ({
        ...prev,
        tourProgress: { ...prev.tourProgress, [activeTour.id]: nextStep },
        lastActivity: new Date()
      }))
      
      // Execute step actions
      const step = activeTour.steps[nextStep]
      if (step.onNext) {
        step.onNext()
      }
    } else {
      endTour()
    }
  }, [activeTour, currentTourStep])

  const previousTourStep = useCallback(() => {
    if (activeTour && currentTourStep > 0) {
      const prevStep = currentTourStep - 1
      setCurrentTourStep(prevStep)
      
      // Update progress
      setUserProgress(prev => ({
        ...prev,
        tourProgress: { ...prev.tourProgress, [activeTour.id]: prevStep },
        lastActivity: new Date()
      }))
      
      // Execute step actions
      const step = activeTour.steps[prevStep]
      if (step.onPrevious) {
        step.onPrevious()
      }
    }
  }, [activeTour, currentTourStep])

  const skipTour = useCallback(() => {
    if (activeTour) {
      // Execute skip action
      const step = activeTour.steps[currentTourStep]
      if (step.onSkip) {
        step.onSkip()
      }
      
      // Update progress
      setUserProgress(prev => ({
        ...prev,
        skippedTours: [...prev.skippedTours, activeTour.id],
        lastActivity: new Date()
      }))
      
      endTour()
    }
  }, [activeTour, currentTourStep])

  const endTour = useCallback(() => {
    if (activeTour) {
      // Mark as completed if all steps were viewed
      if (currentTourStep === activeTour.steps.length - 1) {
        setUserProgress(prev => ({
          ...prev,
          completedTours: [...prev.completedTours, activeTour.id],
          lastActivity: new Date()
        }))
      }
      
      setActiveTour(null)
      setCurrentTourStep(0)
      setIsTourActive(false)
    }
  }, [activeTour, currentTourStep])

  // Tutorial functions
  const startTutorial = useCallback((tutorialId: string) => {
    const tutorial = tutorials.find(t => t.id === tutorialId)
    if (tutorial) {
      setActiveTutorial(tutorial)
      setCurrentTutorialStep(0)
      setIsTutorialActive(true)
      
      // Update progress
      setUserProgress(prev => ({
        ...prev,
        tutorialProgress: { ...prev.tutorialProgress, [tutorialId]: 0 },
        lastActivity: new Date()
      }))
    }
  }, [tutorials])

  const nextTutorialStep = useCallback(() => {
    if (activeTutorial && currentTutorialStep < activeTutorial.steps.length - 1) {
      const nextStep = currentTutorialStep + 1
      setCurrentTutorialStep(nextStep)
      
      // Update progress
      setUserProgress(prev => ({
        ...prev,
        tutorialProgress: { ...prev.tutorialProgress, [activeTutorial.id]: nextStep },
        lastActivity: new Date()
      }))
    } else {
      endTutorial()
    }
  }, [activeTutorial, currentTutorialStep])

  const previousTutorialStep = useCallback(() => {
    if (activeTutorial && currentTutorialStep > 0) {
      const prevStep = currentTutorialStep - 1
      setCurrentTutorialStep(prevStep)
      
      // Update progress
      setUserProgress(prev => ({
        ...prev,
        tutorialProgress: { ...prev.tutorialProgress, [activeTutorial.id]: prevStep },
        lastActivity: new Date()
      }))
    }
  }, [activeTutorial, currentTutorialStep])

  const completeTutorialStep = useCallback(() => {
    if (activeTutorial) {
      const step = activeTutorial.steps[currentTutorialStep]
      
      // Validate step if required
      if (step.validation) {
        const element = document.querySelector(step.validation.target) as HTMLElement
        if (element) {
          let isValid = false
          
          if (step.validation.validator) {
            isValid = step.validation.validator(element)
          } else if (step.validation.expectedValue !== undefined) {
            isValid = element.value === step.validation.expectedValue
          } else {
            isValid = true // Default validation for click actions
          }
          
          if (!isValid) {
            return // Don't proceed if validation fails
          }
        }
      }
      
      nextTutorialStep()
    }
  }, [activeTutorial, currentTutorialStep, nextTutorialStep])

  const endTutorial = useCallback(() => {
    if (activeTutorial) {
      // Mark as completed if all steps were completed
      if (currentTutorialStep === activeTutorial.steps.length - 1) {
        setUserProgress(prev => ({
          ...prev,
          completedTutorials: [...prev.completedTutorials, activeTutorial.id],
          lastActivity: new Date()
        }))
      }
      
      setActiveTutorial(null)
      setCurrentTutorialStep(0)
      setIsTutorialActive(false)
    }
  }, [activeTutorial, currentTutorialStep])

  // Tooltip functions
  const showTooltip = useCallback((tooltipId: string) => {
    // In a real implementation, this would show the tooltip
    console.log('Show tooltip:', tooltipId)
  }, [])

  const hideTooltip = useCallback((tooltipId: string) => {
    // In a real implementation, this would hide the tooltip
    console.log('Hide tooltip:', tooltipId)
  }, [])

  const dismissTooltip = useCallback((tooltipId: string) => {
    setUserProgress(prev => ({
      ...prev,
      dismissedTooltips: [...prev.dismissedTooltips, tooltipId],
      lastActivity: new Date()
    }))
  }, [])

  // Progress functions
  const updateProgress = useCallback((updates: Partial<UserOnboardingProgress>) => {
    setUserProgress(prev => ({ ...prev, ...updates, lastActivity: new Date() }))
  }, [])

  // Preference functions
  const updatePreferences = useCallback((updates: Partial<UserOnboardingProgress['preferences']>) => {
    setUserProgress(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
      lastActivity: new Date()
    }))
  }, [])

  // Auto-start tours on first login
  useEffect(() => {
    if (userProgress.preferences.autoStartTours && userProgress.completedTours.length === 0) {
      const welcomeTour = tours.find(t => t.id === 'welcome-tour' && t.autoStart)
      if (welcomeTour) {
        // Delay tour start to allow page to load
        setTimeout(() => startTour(welcomeTour.id), 1000)
      }
    }
  }, [userProgress.completedTours.length, userProgress.preferences.autoStartTours, tours, startTour])

  const value: OnboardingContextType = {
    tours,
    activeTour,
    currentTourStep,
    isTourActive,
    startTour,
    nextTourStep,
    previousTourStep,
    skipTour,
    endTour,
    tutorials,
    activeTutorial,
    currentTutorialStep,
    isTutorialActive,
    startTutorial,
    nextTutorialStep,
    previousTutorialStep,
    completeTutorialStep,
    endTutorial,
    tooltips,
    showTooltip,
    hideTooltip,
    dismissTooltip,
    userProgress,
    updateProgress,
    preferences: userProgress.preferences,
    updatePreferences
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

// Hook to use onboarding
export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

// Utility functions
export const onboardingUtils = {
  // Check if user should see a tour
  shouldShowTour: (tour: Tour, userProgress: UserOnboardingProgress): boolean => {
    if (userProgress.completedTours.includes(tour.id)) return false
    if (userProgress.skippedTours.includes(tour.id)) return false
    if (tour.targetAudience !== 'all' && tour.targetAudience !== 'new') return false
    return true
  },

  // Get available tours for user
  getAvailableTours: (tours: Tour[], userProgress: UserOnboardingProgress): Tour[] => {
    return tours.filter(tour => onboardingUtils.shouldShowTour(tour, userProgress))
  },

  // Calculate tour completion percentage
  getTourCompletion: (tourId: string, userProgress: UserOnboardingProgress): number => {
    if (userProgress.completedTours.includes(tourId)) return 100
    const currentStep = userProgress.tourProgress[tourId] || 0
    const tour = mockTours.find(t => t.id === tourId)
    if (!tour) return 0
    return (currentStep / tour.steps.length) * 100
  },

  // Get recommended tutorials
  getRecommendedTutorials: (tutorials: Tutorial[], userProgress: UserOnboardingProgress): Tutorial[] => {
    return tutorials.filter(tutorial => {
      // Don't recommend completed tutorials
      if (userProgress.completedTutorials.includes(tutorial.id)) return false
      
      // Check prerequisites
      if (tutorial.prerequisites) {
        const hasPrerequisites = tutorial.prerequisites.every(prereq => 
          userProgress.completedTutorials.includes(prereq)
        )
        if (!hasPrerequisites) return false
      }
      
      return true
    }).sort((a, b) => {
      // Prioritize featured and beginner tutorials
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      if (a.difficulty === 'beginner' && b.difficulty !== 'beginner') return -1
      if (a.difficulty !== 'beginner' && b.difficulty === 'beginner') return 1
      return 0
    })
  },

  // Format duration
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  },

  // Get difficulty color
  getDifficultyColor: (difficulty: Tutorial['difficulty']): string => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
}
