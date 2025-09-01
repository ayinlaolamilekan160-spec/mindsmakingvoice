import React, { useState, useRef, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const AudioPlayer = ({ audioUrl, isVisible, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio?.currentTime || 0);
    const updateDuration = () => setDuration(audio?.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e) => {
      console.warn('Audio loading error:', e);
      setIsPlaying(false);
    };
    const handleLoadedData = () => {
      // Audio loaded successfully
      setDuration(audio?.duration || 0);
    };

    audio?.addEventListener('timeupdate', updateTime);
    audio?.addEventListener('loadedmetadata', updateDuration);
    audio?.addEventListener('loadeddata', handleLoadedData);
    audio?.addEventListener('ended', handleEnded);
    audio?.addEventListener('error', handleError);

    return () => {
      audio?.removeEventListener('timeupdate', updateTime);
      audio?.removeEventListener('loadedmetadata', updateDuration);
      audio?.removeEventListener('loadeddata', handleLoadedData);
      audio?.removeEventListener('ended', handleEnded);
      audio?.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    const audio = audioRef?.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio?.pause();
        setIsPlaying(false);
      } else {
        await audio?.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.warn('Audio playback error:', error);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef?.current;
    if (!audio) return;

    const rect = e?.currentTarget?.getBoundingClientRect();
    const clickX = e?.clientX - rect?.left;
    const newTime = (clickX / rect?.width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e?.target?.value);
    setVolume(newVolume);
    if (audioRef?.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds?.toString()?.padStart(2, '0')}`;
  };

  if (!isVisible || !audioUrl) {
    return null;
  }

  return (
    <div className="w-full bg-card border border-border rounded-lg p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Icon name="Volume2" size={20} className="mr-2" />
        Generated Audio
      </h3>

      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
        onError={(e) => console.warn('Audio element error:', e)}
        onLoadedData={() => console.log('Audio loaded successfully')}
      />

      {/* Main Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <Button
          variant="default"
          size="lg"
          iconName={isPlaying ? "Pause" : "Play"}
          onClick={togglePlayPause}
          className="flex-shrink-0"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>

        <Button
          variant="outline"
          iconName="Download"
          iconPosition="left"
          onClick={onDownload}
        >
          Download
        </Button>

        <div className="flex items-center space-x-2 ml-auto">
          <Icon name="Volume2" size={16} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div 
          className="w-full h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Audio Info */}
      <div className="mt-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status:</span>
          <span className="text-success font-medium">Ready to play</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Duration:</span>
          <span className="text-foreground">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;