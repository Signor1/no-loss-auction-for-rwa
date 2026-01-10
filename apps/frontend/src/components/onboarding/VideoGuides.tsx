'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useOnboarding, mockVideoGuides } from '@/lib/onboarding'
import { useTheme } from '@/lib/design-system'

// Video player component
interface VideoPlayerProps {
  video: any
  onProgress: (seconds: number) => void
  onComplete: () => void
}

function VideoPlayer({ video, onProgress, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [currentChapter, setCurrentChapter] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
    }
  }

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }

  // Handle fullscreen
  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }

  // Show/hide controls
  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  // Handle chapter navigation
  const goToChapter = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      setCurrentTime(timestamp)
    }
  }

  // Update current chapter based on time
  useEffect(() => {
    if (video.chapters) {
      const chapter = video.chapters.findIndex((ch: any, index: number) => {
        const nextChapter = video.chapters[index + 1]
        return currentTime >= ch.timestamp && (!nextChapter || currentTime < nextChapter.timestamp)
      })
      if (chapter !== -1 && chapter !== currentChapter) {
        setCurrentChapter(chapter)
      }
    }
  }, [currentTime, video.chapters, currentChapter])

  return (
    <div className="bg-black rounded-lg overflow-hidden relative group">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.url}
        className="w-full aspect-video"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime
          setCurrentTime(time)
          onProgress(time)
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
        }}
        onEnded={onComplete}
        onClick={togglePlay}
        onMouseMove={showControlsTemporarily}
      />

      {/* Video Overlay Controls */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseMove={showControlsTemporarily}
      >
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium">{video.title}</h3>
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Center Play Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zM12.828 7.757a1 1 0 011.414 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.758 4.243 1 1 0 01-1.414-1.414A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Playback Speed */}
              <div className="flex items-center space-x-2">
                <button className="text-white hover:text-gray-300 transition-colors text-sm">
                  {playbackRate}x
                </button>
                <div className="flex flex-col">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`text-xs px-1 py-0.5 rounded transition-colors ${
                        playbackRate === rate
                          ? 'bg-blue-600 text-white'
                          : 'text-white hover:bg-gray-600'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Like Button */}
            <button className="text-white hover:text-red-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chapters */}
      {video.chapters && video.chapters.length > 0 && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-2 max-h-64 overflow-y-auto">
          <h4 className="text-white text-sm font-medium mb-2">Chapters</h4>
          <div className="space-y-1">
            {video.chapters.map((chapter: any, index: number) => (
              <button
                key={index}
                onClick={() => goToChapter(chapter.timestamp)}
                className={`block w-full text-left p-2 rounded text-xs transition-colors ${
                  currentChapter === index
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{chapter.title}</div>
                <div className="text-gray-400">{formatTime(chapter.timestamp)}</div>
                {chapter.description && (
                  <div className="text-gray-400 text-xs mt-1">{chapter.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Video card component
interface VideoCardProps {
  video: any
  onWatch: (video: any) => void
  userProgress?: number
}

function VideoCard({ video, onWatch, userProgress = 0 }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const progressPercentage = (userProgress / video.duration) * 100

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'General': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Auctions': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Wallet': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'Technical': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Play Button Overlay */}
        <div
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onWatch(video)}
        >
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
        </div>

        {/* Progress Bar */}
        {userProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Featured Badge */}
        {video.featured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded font-medium">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
          {video.title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {video.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <span className={getCategoryColor(video.category)}>
              {video.category}
            </span>
            <span>{video.views.toLocaleString()} views</span>
            <span>{video.likes} likes</span>
          </div>
        </div>

        {/* Tags */}
        {video.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{video.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Video player modal
interface VideoPlayerModalProps {
  video: any
  isOpen: boolean
  onClose: () => void
}

function VideoPlayerModal({ video, isOpen, onClose }: VideoPlayerModalProps) {
  const { updateProgress, userProgress } = useOnboarding()
  const [watchProgress, setWatchProgress] = useState(userProgress.videoWatchProgress[video.id] || 0)

  const handleProgress = (seconds: number) => {
    setWatchProgress(seconds)
  }

  const handleComplete = () => {
    updateProgress({
      videoWatchProgress: {
        ...userProgress.videoWatchProgress,
        [video.id]: video.duration
      }
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {video.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Player */}
        <div className="aspect-video">
          <VideoPlayer
            video={video}
            onProgress={handleProgress}
            onComplete={handleComplete}
          />
        </div>

        {/* Video Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {video.description}
          </p>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main video guides component
export default function VideoGuides() {
  const { videoGuides, userProgress } = useOnboarding()
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'featured'>('all')
  const [category, setCategory] = useState('all')

  // Filter videos
  const filteredVideos = videoGuides.filter(video => {
    const featuredMatch = filter === 'all' || (filter === 'featured' && video.featured)
    const categoryMatch = category === 'all' || video.category === category
    return featuredMatch && categoryMatch
  })

  const handleWatchVideo = (video: any) => {
    setSelectedVideo(video)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedVideo(null)
  }

  const categories = [...new Set(videoGuides.map(v => v.category))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Video Guides
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Learn through our comprehensive video tutorials and guides
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Videos</option>
            <option value="featured">Featured Only</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onWatch={handleWatchVideo}
            userProgress={userProgress.videoWatchProgress[video.id] || 0}
          />
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No videos found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
