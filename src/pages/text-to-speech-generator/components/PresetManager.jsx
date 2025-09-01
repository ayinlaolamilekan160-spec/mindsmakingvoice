import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const PresetManager = ({ 
  currentSettings, 
  onLoadPreset, 
  isGenerating 
}) => {
  const { user } = useAuth();
  const [presets, setPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load presets from Supabase on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadPresets();
    } else {
      // Fallback to localStorage for unauthenticated users
      const savedPresets = localStorage.getItem('tts-presets');
      if (savedPresets) {
        try {
          setPresets(JSON.parse(savedPresets));
        } catch (error) {
          console.error('Error loading presets from localStorage:', error);
        }
      }
    }
  }, [user?.id]);

  // Save to localStorage when presets change (fallback for non-authenticated users)
  useEffect(() => {
    if (!user?.id && presets?.length > 0) {
      localStorage.setItem('tts-presets', JSON.stringify(presets));
    }
  }, [presets, user?.id]);

  // Load presets from Supabase
  const loadPresets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase?.from('voice_presets')?.select('*')?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading presets:', error);
        setSaveError('Failed to load presets');
        return;
      }

      setPresets(data || []);
    } catch (error) {
      console.error('Error in loadPresets:', error);
      setSaveError('Failed to load presets');
    } finally {
      setLoading(false);
    }
  };

  // Save preset to Supabase or localStorage
  const handleSavePreset = async () => {
    setSaveError('');
    
    if (!presetName?.trim()) {
      setSaveError('Please enter a preset name');
      return;
    }

    if (presets?.some(preset => preset?.name?.toLowerCase() === presetName?.toLowerCase())) {
      setSaveError('A preset with this name already exists');
      return;
    }

    setLoading(true);

    try {
      if (user?.id) {
        // Save to Supabase for authenticated users
        const newPreset = {
          user_id: user?.id,
          name: presetName?.trim(),
          voice_style: currentSettings?.voiceStyle || 'female',
          voice_speed: currentSettings?.voiceSpeed || 'normal',
          voice_pitch: currentSettings?.voicePitch || 'medium',
          emotion: currentSettings?.emotion || 'neutral',
          character: currentSettings?.character || 'chloe',
          is_default: false
        };

        const { data, error } = await supabase?.from('voice_presets')?.insert([newPreset])?.select()?.single();

        if (error) {
          console.error('Error saving preset:', error);
          setSaveError('Failed to save preset. Please try again.');
          return;
        }

        setPresets(prev => [data, ...(prev || [])]);
      } else {
        // Fallback to localStorage for unauthenticated users
        const newPreset = {
          id: Date.now()?.toString(),
          name: presetName?.trim(),
          settings: { ...currentSettings },
          createdAt: new Date()?.toISOString()
        };

        setPresets(prev => [newPreset, ...(prev || [])]);
      }

      setPresetName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving preset:', error);
      setSaveError('Failed to save preset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load preset settings
  const handleLoadPreset = async (presetId) => {
    const preset = presets?.find(p => p?.id === presetId);
    if (!preset) return;

    try {
      if (user?.id) {
        // For Supabase presets, convert database format to component format
        const settings = {
          voiceStyle: preset?.voice_style || 'female',
          voiceSpeed: preset?.voice_speed || 'normal',
          voicePitch: preset?.voice_pitch || 'medium',
          emotion: preset?.emotion || 'neutral',
          character: preset?.character || 'chloe'
        };
        onLoadPreset?.(settings);
      } else {
        // For localStorage presets, use the settings object
        onLoadPreset?.(preset?.settings || {});
      }
    } catch (error) {
      console.error('Error loading preset:', error);
      setSaveError('Failed to load preset');
    }
  };

  // Delete preset
  const handleDeletePreset = async (presetId) => {
    if (!window.confirm('Are you sure you want to delete this preset?')) return;

    try {
      setLoading(true);

      if (user?.id) {
        // Delete from Supabase for authenticated users
        const { error } = await supabase?.from('voice_presets')?.delete()?.eq('id', presetId)?.eq('user_id', user?.id);

        if (error) {
          console.error('Error deleting preset:', error);
          setSaveError('Failed to delete preset');
          return;
        }
      }

      // Remove from local state (works for both authenticated and unauthenticated users)
      setPresets(prev => prev?.filter(p => p?.id !== presetId) || []);
    } catch (error) {
      console.error('Error deleting preset:', error);
      setSaveError('Failed to delete preset');
    } finally {
      setLoading(false);
    }
  };

  // Format preset options for the Select component
  const presetOptions = presets?.map(preset => ({
    value: preset?.id,
    label: preset?.name || 'Unnamed Preset',
    description: user?.id 
      ? `Created ${new Date(preset?.created_at || preset?.createdAt)?.toLocaleDateString()}`
      : `Created ${new Date(preset?.createdAt)?.toLocaleDateString()}`
  })) || [];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Preset Management
        {!user && (
          <span className="text-sm font-normal text-muted-foreground ml-2">
            (Sign in to sync across devices)
          </span>
        )}
      </h3>
      
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{saveError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Button
            variant="outline"
            iconName="Save"
            iconPosition="left"
            onClick={() => setShowSaveDialog(true)}
            disabled={isGenerating || loading}
            fullWidth
          >
            Save Current Settings
          </Button>
        </div>

        <div>
          <Select
            label="My Presets"
            options={presetOptions}
            value=""
            onChange={handleLoadPreset}
            placeholder={presets?.length > 0 ? "Select a preset to load" : "No saved presets"}
            disabled={isGenerating || loading || presets?.length === 0}
            className="w-full"
          />
        </div>
      </div>

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-foreground mb-4">Save Preset</h4>
            
            <Input
              label="Preset Name"
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e?.target?.value || '')}
              placeholder="Enter preset name"
              error={saveError}
              className="mb-4"
              disabled={loading}
            />

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName('');
                  setSaveError('');
                }}
                disabled={loading}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSavePreset}
                iconName="Save"
                iconPosition="left"
                disabled={loading || !presetName?.trim()}
                fullWidth
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preset List for Management */}
      {presets?.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Saved Presets ({presets?.length})
            {loading && <span className="text-muted-foreground ml-2">Loading...</span>}
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {presets?.map(preset => (
              <div key={preset?.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <span className="font-medium text-foreground">{preset?.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {user?.id 
                      ? new Date(preset?.created_at)?.toLocaleDateString()
                      : new Date(preset?.createdAt)?.toLocaleDateString()
                    }
                  </span>
                  {preset?.is_default && (
                    <span className="inline-block ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Play"
                    onClick={() => handleLoadPreset(preset?.id)}
                    disabled={isGenerating || loading}
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Trash2"
                    onClick={() => handleDeletePreset(preset?.id)}
                    disabled={isGenerating || loading}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetManager;