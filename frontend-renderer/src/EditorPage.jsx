import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import axios from 'axios';
import { Send, Sparkles, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { MyVideo } from './VideoComposition';
import './EditorPage.css';

const EditorPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Welcome to the AI Editor! Ask me to change captions, colors, or styles.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // FETCH DATA from API instead of import
  const fetchProjectData = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/project');
      setData(res.data);
      setLoading(false);
      // Force refresh player when data changes significantly
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error("Failed to load project:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

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
        
        // Re-fetch data to update player WITHOUT reloading page
        if (response.data.data) {
             setData(response.data.data);
             setRefreshKey(prev => prev + 1);
        } else {
             fetchProjectData();
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

  if (loading) {
    return <div className="editor-loading">Loading Editor...</div>;
  }

  if (!data) {
    return <div className="editor-loading">No Project Found. Please upload a video first.</div>;
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
           <div className="header-left">
             <Sparkles className="icon-purple" />
             <h2>AI Assistant</h2>
           </div>
           
           {/* New Controls */}
           <div className="header-actions">
              <a 
                href="http://localhost:3002" 
                target="_blank" 
                rel="noreferrer"
                className="icon-btn"
                title="Open Advanced Timeline"
              >
                <ExternalLink size={18} />
              </a>
           </div>
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
            placeholder="e.g. 'Make the captions yellow'"
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
              videoSrc: "/video.mp4",
              audioSrc: "/audio.wav",
              segments: data.editPlan?.segments || [],
            }}
            style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: 'black'
            }}
          />
        </div>
        
        <div className="editor-toolbar">
           <button className="tool-btn" onClick={fetchProjectData}>
             <RefreshCw size={16} /> Reload Preview
           </button>
           
           <button className="tool-btn primary" onClick={() => alert("Render triggered! (Implement Backend)")}>
             <Download size={16} /> Export Video
           </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
