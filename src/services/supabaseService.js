import { supabase } from '../lib/supabase';

/**
 * Supabase Service for TTS App
 * Handles database operations for audio generations and voice presets
 */
class SupabaseService {
  /**
   * Saves generated audio information to the database
   * @param {Object} audioData - Audio generation data
   * @returns {Promise<Object>} - Saved audio generation record
   */
  static async saveAudioGeneration(audioData) {
    try {
      const { 
        text_content, 
        audio_url, 
        duration_seconds, 
        preset_id,
        user_id 
      } = audioData;

      const { data, error } = await supabase?.from('audio_generations')?.insert({
          text_content,
          audio_url,
          duration_seconds,
          preset_id,
          user_id
        })?.select()?.single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error saving audio generation:', error);
      throw error;
    }
  }

  /**
   * Gets user's audio generation history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} - Array of audio generation records
   */
  static async getAudioGenerations(userId, limit = 50) {
    try {
      const { data, error } = await supabase?.from('audio_generations')?.select(`
          *,
          voice_presets (
            name,
            voice_style,
            voice_speed,
            voice_pitch,
            emotion,
            character
          )
        `)?.eq('user_id', userId)?.order('generated_at', { ascending: false })?.limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching audio generations:', error);
      throw error;
    }
  }

  /**
   * Saves or updates a voice preset
   * @param {Object} presetData - Voice preset data
   * @returns {Promise<Object>} - Saved voice preset record
   */
  static async saveVoicePreset(presetData) {
    try {
      const { 
        id,
        name,
        voice_style,
        voice_speed,
        voice_pitch,
        emotion,
        character,
        user_id,
        is_default = false
      } = presetData;

      let query;
      
      if (id) {
        // Update existing preset
        query = supabase?.from('voice_presets')?.update({
            name,
            voice_style,
            voice_speed,
            voice_pitch,
            emotion,
            character,
            is_default
          })?.eq('id', id)?.eq('user_id', user_id); // Ensure user can only update their own presets
      } else {
        // Create new preset
        query = supabase?.from('voice_presets')?.insert({
            name,
            voice_style,
            voice_speed,
            voice_pitch,
            emotion,
            character,
            user_id,
            is_default
          });
      }

      const { data, error } = await query?.select()?.single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error saving voice preset:', error);
      throw error;
    }
  }

  /**
   * Gets user's voice presets
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of voice preset records
   */
  static async getVoicePresets(userId) {
    try {
      const { data, error } = await supabase?.from('voice_presets')?.select('*')?.eq('user_id', userId)?.order('is_default', { ascending: false })?.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching voice presets:', error);
      throw error;
    }
  }

  /**
   * Deletes a voice preset
   * @param {string} presetId - Preset ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteVoicePreset(presetId, userId) {
    try {
      const { error } = await supabase?.from('voice_presets')?.delete()?.eq('id', presetId)?.eq('user_id', userId); // Ensure user can only delete their own presets

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting voice preset:', error);
      throw error;
    }
  }

  /**
   * Gets user profile information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile data
   */
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Updates user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated profile data
   */
  static async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update(profileData)?.eq('id', userId)?.select()?.single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Gets current authenticated user
   * @returns {Promise<Object|null>} - User object or null
   */
  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Checks if user has premium access
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Premium status
   */
  static async checkPremiumAccess(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.role === 'premium' && profile?.subscription_active === true;
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  }

  /**
   * Gets usage statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Usage statistics
   */
  static async getUserUsageStats(userId) {
    try {
      const { data, error } = await supabase?.from('audio_generations')?.select('id, duration_seconds, generated_at')?.eq('user_id', userId);

      if (error) throw error;

      const totalGenerations = data?.length || 0;
      const totalDuration = data?.reduce((sum, item) => sum + (item?.duration_seconds || 0), 0) || 0;
      
      // Get current month generations
      const currentMonth = new Date();
      currentMonth?.setDate(1);
      currentMonth?.setHours(0, 0, 0, 0);
      
      const thisMonthGenerations = data?.filter(item => 
        new Date(item.generated_at) >= currentMonth
      )?.length || 0;

      return {
        totalGenerations,
        totalDurationSeconds: totalDuration,
        thisMonthGenerations,
        averageDuration: totalGenerations > 0 ? Math.round(totalDuration / totalGenerations) : 0
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return {
        totalGenerations: 0,
        totalDurationSeconds: 0,
        thisMonthGenerations: 0,
        averageDuration: 0
      };
    }
  }
}

export default SupabaseService;