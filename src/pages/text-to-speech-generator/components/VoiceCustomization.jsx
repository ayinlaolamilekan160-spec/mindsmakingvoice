import React from 'react';
import Select from '../../../components/ui/Select';

const VoiceCustomization = ({ 
  voiceStyle, 
  setVoiceStyle,
  voiceSpeed,
  setVoiceSpeed,
  voicePitch,
  setVoicePitch,
  emotion,
  setEmotion,
  character,
  setCharacter,
  isGenerating
}) => {
  const voiceStyleOptions = [
    { value: 'children', label: '👶 Children/Kid' },
    { value: 'female', label: '👩 Female' },
    { value: 'male', label: '👨 Male' },
    { value: 'adult', label: '🧑 Adult' }
  ];

  const voiceSpeedOptions = [
    { value: 'slow', label: 'Slow (0.75x)' },
    { value: 'normal', label: 'Normal (1.0x)' },
    { value: 'fast', label: 'Fast (1.25x)' }
  ];

  const voicePitchOptions = [
    { value: 'low', label: 'Low Pitch' },
    { value: 'medium', label: 'Medium Pitch' },
    { value: 'high', label: 'High Pitch' }
  ];

  const emotionOptions = [
    { value: 'neutral', label: '😐 Neutral' },
    { value: 'happy', label: '😊 Happy' },
    { value: 'sad', label: '😢 Sad' },
    { value: 'serious', label: '😤 Serious' },
    { value: 'excited', label: '🤩 Excited' }
  ];

  // Updated character options with OpenAI voice mapping
  const characterOptions = [
    { value: 'chloe', label: 'Chloe (Alloy)', description: 'Balanced and versatile voice' },
    { value: 'kelly', label: 'Kelly (Echo)', description: 'Clear and articulate female voice' },
    { value: 'racheal', label: 'Racheal (Fable)', description: 'Warm and expressive voice' },
    { value: 'david', label: 'David (Onyx)', description: 'Deep and authoritative male voice' },
    { value: 'alex', label: 'Alex (Nova)', description: 'Young and energetic voice' },
    { value: 'sarah', label: 'Sarah (Shimmer)', description: 'Soft and gentle voice' }
  ];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Voice Customization</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label="Voice Style"
          options={voiceStyleOptions}
          value={voiceStyle}
          onChange={setVoiceStyle}
          placeholder="Select voice style"
          disabled={isGenerating}
          className="w-full"
        />

        <Select
          label="Voice Speed"
          options={voiceSpeedOptions}
          value={voiceSpeed}
          onChange={setVoiceSpeed}
          placeholder="Select speed"
          disabled={isGenerating}
          className="w-full"
        />

        <Select
          label="Voice Pitch"
          options={voicePitchOptions}
          value={voicePitch}
          onChange={setVoicePitch}
          placeholder="Select pitch"
          disabled={isGenerating}
          className="w-full"
        />

        <Select
          label="Emotion/Tone"
          options={emotionOptions}
          value={emotion}
          onChange={setEmotion}
          placeholder="Select emotion"
          disabled={isGenerating}
          className="w-full"
        />

        <Select
          label="Character Voice"
          options={characterOptions?.map(char => ({
            value: char?.value,
            label: char?.label
          }))}
          value={character}
          onChange={setCharacter}
          placeholder="Select character"
          disabled={isGenerating}
          className="w-full lg:col-span-2"
        />
      </div>
      {/* Voice Preview Information */}
      {character && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Selected Voice: {characterOptions?.find(c => c?.value === character)?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {characterOptions?.find(c => c?.value === character)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Speed and Quality Information */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">🎵 Audio Quality</h4>
          <p className="text-xs text-muted-foreground">
            Generated using OpenAI's advanced TTS with high-quality MP3 output
          </p>
        </div>
        
        <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">⚡ Processing Speed</h4>
          <p className="text-xs text-muted-foreground">
            Real-time generation with progress tracking and error handling
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceCustomization;