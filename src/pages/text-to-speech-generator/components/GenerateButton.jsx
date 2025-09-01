import React from 'react';
import Button from '../../../components/ui/Button';

const GenerateButton = ({ 
  onGenerate, 
  isGenerating, 
  canGenerate, 
  progress 
}) => {
  return (
    <div className="w-full">
      <Button
        variant="default"
        size="lg"
        iconName={isGenerating ? "Loader2" : "Mic"}
        iconPosition="left"
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        loading={isGenerating}
        fullWidth
        className="py-4"
      >
        {isGenerating ? `Generating Audio... ${progress}%` : 'Generate Voice'}
      </Button>

      {!canGenerate && (
        <p className="text-sm text-muted-foreground text-center mt-2">
          Please enter text and select voice options to generate audio
        </p>
      )}

      {isGenerating && (
        <div className="mt-4 space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Processing your text with selected voice settings...
          </p>
        </div>
      )}
    </div>
  );
};

export default GenerateButton;