import React from 'react';

const TextInputArea = ({ text, setText, isGenerating }) => {
  const handleTextChange = (e) => {
    setText(e?.target?.value);
  };

  return (
    <div className="w-full">
      <label htmlFor="text-input" className="block text-sm font-medium text-foreground mb-2">
        Enter Text to Convert
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={handleTextChange}
        disabled={isGenerating}
        placeholder="Type or paste your text here... For example: 'Welcome to MindsMakingVoice, where your words come to life with our advanced text-to-speech technology. Choose from various voice styles, adjust speed and pitch, and create the perfect audio experience for your content.'"
        className="w-full h-40 px-4 py-3 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        maxLength={5000}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">
          {text?.length}/5000 characters
        </span>
        {text?.length > 4500 && (
          <span className="text-xs text-warning">
            Approaching character limit
          </span>
        )}
      </div>
    </div>
  );
};

export default TextInputArea;