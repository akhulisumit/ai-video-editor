import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import axios from 'axios';
import { Upload, Video, Zap, Layers, CheckCircle } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading and analyzing...');

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:3000/api/process-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'ok') {
        console.log("Backend processing complete. Redirecting to Editor...");
        setUploadStatus('Success! Redirecting...');
        // Redirect to internal Vite route
        window.location.href = '/AutoEditor';
      }
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      setUploadStatus('Error processing video. Please try again.');
    }
  };

  if (isUploading) {
    return (
      <div className="landing-container full-height center-content">
        <div className="status-card">
          <div className="lottie-wrapper">
             <DotLottieReact
              src="https://lottie.host/225cf260-1020-4319-bed8-55452dcc7201/Km2eUpFv32.lottie"
              loop
              autoplay
            />
          </div>
          <h2 className="status-title gradient-text">
            Processing Your Video
          </h2>
          <p className="status-desc">
            {uploadStatus || "Our AI is segmenting and editing your clip..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo-section">
            <div className="logo-icon">
              <Video size={18} color="white" />
            </div>
            <span className="logo-text">OnDaGo</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Create viral clips <br />
            <span className="gradient-text">
              in seconds.
            </span>
          </h1>
          <p className="hero-subtitle">
            Upload your raw footage and let our AI automatically edit, caption, and style it into engaging short-form content.
          </p>
          
          {/* Upload Area */}
          <div className="upload-wrapper">
             <div className="upload-glow"></div>
             <label className="upload-card">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div className="upload-content">
                  <div className="upload-icon-circle">
                    <Upload size={32} className="icon-purple" />
                  </div>
                  <div className="upload-text-group">
                    <span className="upload-main-text">Upload Video to Edit</span>
                    <span className="upload-sub-text">Drag & drop or click to browse</span>
                  </div>
                </div>
             </label>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          <FeatureCard 
            icon={<Zap size={24} className="icon-yellow" />}
            title="Instant Processing"
            description="AI analyzes your video in real-time to identify the best moments."
          />
          <FeatureCard 
            icon={<Layers size={24} className="icon-blue" />}
            title="Smart Segmentation"
            description="Automatically splits long content into viral-ready short segments."
          />
          <FeatureCard 
            icon={<CheckCircle size={24} className="icon-green" />}
            title="Auto Editing"
            description="Applies captions, zooms, and effects without you lifting a finger."
          />
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon-wrapper">
      {icon}
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">
      {description}
    </p>
  </div>
);

export default LandingPage;
