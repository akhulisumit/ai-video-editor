import React, { useState, useEffect, useCallback } from 'react';
import { Player } from '@remotion/player';
import axios from 'axios';
import { Send, Settings, Sparkles, RefreshCw } from 'lucide-react';
import { MyVideo } from './VideoComposition';
import './EditorPage.css';

// Default dimensions
const VIDEO_WIDTH = 1920; // Or dynamic from metadata
const VIDEO_HEIGHT = 1080;

const EditorPage = () => {
  // Load initial data from sample.json (assuming it's available via import or fetch)
  // Since we are in Vite context, reading local file dynamically is tricky without backend.
  // We will assume the processing backend wrote to src/sample.json which Vite handles, 
  // BUT Vite HMR might be needed. 
  // Better approach: Fetch from backend API or direct import if acceptable.
  // For now, let's try direct import with a key to force re-render.
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Welcome to the AI Editor! Ask me to change captions, colors, or styles.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initial Data Load (Simulated via dynamic import or direct)
  useEffect(() => {
    // In a real app, we'd fetch from an API like GET /api/project
    // Here we can rely on the dynamic import of the JSON we already have in src
    import('./sample.json?t=' + Date.now()) // Bust cache
      .then((module) => {
        setData(module.default);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load project", err);
        setLoading(false);
      });
  }, [refreshKey]);


  const handleSend = async () => {
    if (!prompt.trim() || isProcessing) return;

    const userMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsProcessing(true);

    try {
      const response = await axios.post('http://localhost:3000/api/edit-video', {
        prompt: userMessage.content
      });

      if (response.data.status === 'ok') {
        const aiMessage = { role: 'system', content: 'Changes applied! Preview updated.' };
        setMessages(prev => [...prev, aiMessage]);
        
        // Update local state with new data
        // We received the full data object back from backend (if we modify endpoint to return it)
        // Or re-fetch.
        if (response.data.data) {
             setData(response.data.data);
             // Force player re-mount if needed, though props change should handle it
             setRefreshKey(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'error', content: 'Failed to apply changes. Try again.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading || !data) {
    return <div className="editor-loading">Loading Editor...</div>;
  }

  // Calculate duration
  const segments = data.editPlan?.segments || [];
  const durationInFrames = Math.ceil(
     (segments.length > 0 ? Math.max(...segments.map(s => s.end)) : 5) * 30
  );

  return (
    <div className="editor-container">
      {/* LEFT: Chat & Controls */}
      <div className="editor-sidebar">
        <div className="sidebar-header">
           <Sparkles className="icon-purple" />
           <h2>AI Assistant</h2>
        </div>

        <div className="chat-history">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isProcessing && <div className="chat-bubble system processing">AI is thinking...</div>}
        </div>

        <div className="chat-input-area">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 'Make the captions yellow and bigger'"
          />
          <button onClick={handleSend} disabled={isProcessing}>
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* RIGHT: Player */}
      <div className="editor-preview">
        <div className="player-wrapper">
          <Player
            key={refreshKey}
            component={MyVideo}
            durationInFrames={durationInFrames}
            compositionWidth={data.metadata?.width || 1920}
            compositionHeight={data.metadata?.height || 1080}
            fps={30}
            controls
            inputProps={{
              videoSrc: "/video.mp4", // Served from Public
              audioSrc: "/audio.wav", // Served from Public
              segments: data.editPlan?.segments || [],
              // Add any new global styles here if we move them to root Props
            }}
            style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: 'black'
            }}
          />
        </div>
        <div className="editor-toolbar">
           <button className="tool-btn" onClick={() => setRefreshKey(k => k+1)}>
             <RefreshCw size={16} /> Reload Preview
           </button>
           {/* Add Export button later */}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
