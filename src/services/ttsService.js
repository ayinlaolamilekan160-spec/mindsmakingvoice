import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

/**
 * Text-to-Speech Service
 * Handles conversion of text to speech using OpenAI's TTS API
 */
class TTSService {
  /**
   * Converts voice settings from UI format to OpenAI TTS format
   * @param {Object} settings - Voice customization settings
   * @returns {Object} - OpenAI compatible settings
   */
  static mapVoiceSettings(settings) {
    const { voiceStyle, voiceSpeed, character, emotion } = settings;

    // Map character names to OpenAI voice names
    const voiceMapping = {
      'chloe': 'alloy',
      'kelly': 'echo',
      'racheal': 'fable',
      'david': 'onyx',
      'alex': 'nova',
      'sarah': 'shimmer'
    };

    // Map speed settings
    const speedMapping = {
      'slow': 0.75,
      'normal': 1.0,
      'fast': 1.25
    };

    return {
      voice: voiceMapping?.[character] || 'alloy',
      speed: speedMapping?.[voiceSpeed] || 1.0,
      model: 'tts-1', // Use tts-1-hd for higher quality but slower processing
    };
  }

  /**
   * Generates speech from text using OpenAI TTS API
   * @param {string} text - Text to convert to speech
   * @param {Object} voiceSettings - Voice customization settings
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<{audioUrl: string, duration: number}>}
   */
  static async generateSpeech(text, voiceSettings, onProgress) {
    try {
      if (!import.meta.env?.VITE_OPENAI_API_KEY || import.meta.env?.VITE_OPENAI_API_KEY === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
      }

      if (!text?.trim()) {
        throw new Error('Text content is required for speech generation.');
      }

      onProgress?.(10); // Initial progress

      const ttsSettings = this.mapVoiceSettings(voiceSettings);
      
      onProgress?.(30); // API call starting

      const response = await openai?.audio?.speech?.create({
        model: ttsSettings?.model,
        voice: ttsSettings?.voice,
        input: text,
        speed: ttsSettings?.speed,
        response_format: 'mp3'
      });

      onProgress?.(70); // Audio received

      // Convert response to blob
      const audioBlob = new Blob([await response.arrayBuffer()], { 
        type: 'audio/mpeg' 
      });

      onProgress?.(90); // Processing audio

      // Create object URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);

      // Calculate estimated duration (rough approximation: ~150 words per minute)
      const wordCount = text?.trim()?.split(/\s+/)?.length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60); // in seconds

      onProgress?.(100); // Complete

      return {
        audioUrl,
        audioBlob,
        duration: estimatedDuration,
        fileSize: audioBlob?.size,
        format: 'mp3'
      };

    } catch (error) {
      console.error('TTS Generation Error:', error);
      
      // Handle specific OpenAI errors
      if (error?.message?.includes('API key')) {
        throw new Error('Invalid or missing OpenAI API key. Please check your configuration.');
      }
      
      if (error?.message?.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your account limits.');
      }
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }

      throw new Error(`Speech generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Enhanced speech generation with Google Cloud TTS fallback
   * @param {string} text - Text to convert to speech
   * @param {Object} voiceSettings - Voice customization settings
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<{audioUrl: string, duration: number}>}
   */
  static async generateSpeechWithFallback(text, voiceSettings, onProgress) {
    try {
      // Try OpenAI TTS first
      return await this.generateSpeech(text, voiceSettings, onProgress);
    } catch (openaiError) {
      console.warn('OpenAI TTS failed, attempting Google Cloud TTS fallback:', openaiError);
      
      // Fallback to Google Cloud TTS (if implemented)
      try {
        return await this.generateSpeechWithGoogleCloud(text, voiceSettings, onProgress);
      } catch (googleError) {
        console.error('Google Cloud TTS also failed:', googleError);
        throw new Error('Both OpenAI and Google Cloud TTS services are unavailable. Please try again later.');
      }
    }
  }

  /**
   * Google Cloud TTS implementation (placeholder for future integration)
   * @param {string} text - Text to convert to speech
   * @param {Object} voiceSettings - Voice customization settings
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<{audioUrl: string, duration: number}>}
   */
  static async generateSpeechWithGoogleCloud(text, voiceSettings, onProgress) {
    // This is a placeholder for Google Cloud TTS integration
    // For now, we'll throw an error to indicate it's not implemented throw new Error('Google Cloud TTS fallback is not yet implemented.');
    
    /*
    // Future Google Cloud TTS implementation would go here:
    // 1. Configure Google Cloud TTS client
    // 2. Map voice settings to Google Cloud format
    // 3. Make API call to Google Cloud TTS
    // 4. Process response and return audio data
    */
  }

  /**
   * Downloads the generated audio file
   * @param {Blob} audioBlob - Audio blob to download
   * @param {string} filename - Filename for download
   */
  static downloadAudio(audioBlob, filename = null) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(audioBlob);
    link.download = filename || `tts-audio-${Date.now()}.mp3`;
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
    
    // Clean up object URL after download
    setTimeout(() => URL.revokeObjectURL(link?.href), 1000);
  }

  /**
   * Validates voice settings
   * @param {Object} settings - Voice settings to validate
   * @returns {boolean} - Whether settings are valid
   */
  static validateVoiceSettings(settings) {
    const required = ['voiceStyle', 'voiceSpeed', 'voicePitch', 'emotion', 'character'];
    return required?.every(key => settings?.[key]);
  }

  /**
   * Gets available voice options for the UI
   * @returns {Object} - Available voice options
   */
  static getVoiceOptions() {
    return {
      characters: [
        { value: 'chloe', label: 'Chloe', openaiVoice: 'alloy' },
        { value: 'kelly', label: 'Kelly', openaiVoice: 'echo' },
        { value: 'racheal', label: 'Racheal', openaiVoice: 'fable' },
        { value: 'david', label: 'David', openaiVoice: 'onyx' },
        { value: 'alex', label: 'Alex', openaiVoice: 'nova' },
        { value: 'sarah', label: 'Sarah', openaiVoice: 'shimmer' }
      ],
      speeds: [
        { value: 'slow', label: 'Slow (0.75x)', multiplier: 0.75 },
        { value: 'normal', label: 'Normal (1.0x)', multiplier: 1.0 },
        { value: 'fast', label: 'Fast (1.25x)', multiplier: 1.25 }
      ],
      models: [
        { value: 'tts-1', label: 'Standard Quality', description: 'Faster processing' },
        { value: 'tts-1-hd', label: 'High Quality', description: 'Better audio quality, slower' }
      ]
    };
  }
}

export default TTSService;