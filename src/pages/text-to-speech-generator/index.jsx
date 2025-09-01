import React, { useState, useCallback, useEffect } from 'react';
import Header from '../../components/ui/Header';
import TextInputArea from './components/TextInputArea';
import VoiceCustomization from './components/VoiceCustomization';
import PresetManager from './components/PresetManager';
import GenerateButton from './components/GenerateButton';
import AudioPlayer from './components/AudioPlayer';
import TTSService from '../../services/ttsService';
import SupabaseService from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';

const TextToSpeechGenerator = () => {
  // Text input state
  const [text, setText] = useState('');

  // Voice customization states
  const [voiceStyle, setVoiceStyle] = useState('female');
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const [voicePitch, setVoicePitch] = useState('medium');
  const [emotion, setEmotion] = useState('neutral');
  const [character, setCharacter] = useState('chloe');

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState('');
  const [currentPresetId, setCurrentPresetId] = useState(null);

  // Authentication
  const { user } = useAuth();

  // Get current voice settings
  const getCurrentSettings = () => ({
    voiceStyle,
    voiceSpeed,
    voicePitch,
    emotion,
    character
  });

  // Load preset settings
  const handleLoadPreset = useCallback((settings, presetId = null) => {
    setVoiceStyle(settings?.voiceStyle || 'female');
    setVoiceSpeed(settings?.voiceSpeed || 'normal');
    setVoicePitch(settings?.voicePitch || 'medium');
    setEmotion(settings?.emotion || 'neutral');
    setCharacter(settings?.character || 'chloe');
    setCurrentPresetId(presetId);
  }, []);

  // Check if generation is possible
  const canGenerate = text?.trim()?.length > 0 && voiceStyle && voiceSpeed && voicePitch && emotion && character;

  // Real text-to-speech generation using OpenAI
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setProgress(0);
    setError('');
    setAudioUrl(null);
    setAudioBlob(null);

    try {
      const voiceSettings = getCurrentSettings();

      // Generate speech using TTS service
      const result = await TTSService?.generateSpeechWithFallback(
        text,
        voiceSettings,
        setProgress
      );

      setAudioUrl(result?.audioUrl);
      setAudioBlob(result?.audioBlob);

      // Save to database if user is authenticated
      if (user?.id) {
        try {
          await SupabaseService?.saveAudioGeneration({
            text_content: text,
            audio_url: null, // We're not storing the actual file URL for now
            duration_seconds: result?.duration,
            preset_id: currentPresetId,
            user_id: user?.id
          });
        } catch (dbError) {
          console.warn('Failed to save generation to database:', dbError);
          // Don't block the user experience for database errors
        }
      }

      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 1500);

    } catch (err) {
      setError(err?.message || 'Failed to generate audio. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle audio download with improved filename
  const handleDownload = () => {
    if (!audioBlob) return;

    const currentSettings = getCurrentSettings();
    const timestamp = new Date()?.toISOString()?.slice(0, 19)?.replace(/[:.]/g, '-');
    const filename = `tts-${currentSettings?.character}-${currentSettings?.voiceSpeed}-${timestamp}.mp3`;
    
    TTSService?.downloadAudio(audioBlob, filename);
  };

  // Clean up audio URLs when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Text-to-Speech Generator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your written content into natural-sounding speech with AI-powered voice generation, 
              customizable settings, and professional quality audio output.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-error text-sm font-medium">{error}</p>
              {error?.includes('API key') && (
                <p className="text-error/80 text-xs mt-2">
                  Configure your OpenAI API key in the .env file: VITE_OPENAI_API_KEY=your_key_here
                </p>
              )}
            </div>
          )}

          {/* API Key Warning */}
          {(!import.meta.env?.VITE_OPENAI_API_KEY || import.meta.env?.VITE_OPENAI_API_KEY === 'your-openai-api-key-here') && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-warning text-sm font-medium">
                ⚠️ OpenAI API key not configured. Please add your API key to use real text-to-speech generation.
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-8">
            {/* Step 1: Text Input */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  1
                </div>
                <h2 className="text-xl font-semibold text-foreground">Enter Your Text</h2>
              </div>
              <TextInputArea 
                text={text}
                setText={setText}
                isGenerating={isGenerating}
              />
            </div>

            {/* Step 2: Voice Customization */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  2
                </div>
                <h2 className="text-xl font-semibold text-foreground">Customize Voice Settings</h2>
              </div>
              <VoiceCustomization
                voiceStyle={voiceStyle}
                setVoiceStyle={setVoiceStyle}
                voiceSpeed={voiceSpeed}
                setVoiceSpeed={setVoiceSpeed}
                voicePitch={voicePitch}
                setVoicePitch={setVoicePitch}
                emotion={emotion}
                setEmotion={setEmotion}
                character={character}
                setCharacter={setCharacter}
                isGenerating={isGenerating}
              />
            </div>

            {/* Step 3: Preset Management */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  3
                </div>
                <h2 className="text-xl font-semibold text-foreground">Manage Presets</h2>
              </div>
              <PresetManager
                currentSettings={getCurrentSettings()}
                onLoadPreset={handleLoadPreset}
                isGenerating={isGenerating}
              />
            </div>

            {/* Step 4: Generate Audio */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  4
                </div>
                <h2 className="text-xl font-semibold text-foreground">Generate Audio</h2>
              </div>
              <GenerateButton
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                canGenerate={canGenerate}
                progress={progress}
              />
            </div>

            {/* Step 5: Audio Player */}
            <AudioPlayer
              audioUrl={audioUrl}
              isVisible={!!audioUrl}
              onDownload={handleDownload}
            />
          </div>

          {/* Usage Tips */}
          <div className="mt-12 bg-muted rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">💡 Tips for Better Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">Text Optimization</h4>
                <ul className="space-y-1">
                  <li>• Use proper punctuation for natural pauses</li>
                  <li>• Spell out numbers and abbreviations</li>
                  <li>• Keep sentences under 20 words for clarity</li>
                  <li>• Add commas for natural breathing points</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Voice Settings</h4>
                <ul className="space-y-1">
                  <li>• Match character voice to your content type</li>
                  <li>• Use slower speeds for educational content</li>
                  <li>• Save presets for consistent branding</li>
                  <li>• Test different voices for best results</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Information */}
          <div className="mt-8 bg-info/10 border border-info/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">🔊 Audio Generation</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Powered by OpenAI's advanced text-to-speech technology</p>
              <p>• High-quality MP3 audio output with natural voice synthesis</p>
              <p>• Real-time generation with progress tracking</p>
              <p>• Automatic error handling and fallback mechanisms</p>
              {user ? (
                <p>• Your generated audio history is automatically saved</p>
              ) : (
                <p>• Sign in to save your audio generation history</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TextToSpeechGenerator;