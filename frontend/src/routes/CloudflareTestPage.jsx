import React, { useState } from 'react';
import { API_BASE_URL } from '../api/config';

export default function CloudflareTestPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Defaults to your working file trace, but automatically updates on new uploads
  const [savedKey, setSavedKey] = useState('test-folder/1784299135232_sample.pdf');
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please pick a file first!");
    setUploadStatus('Processing upload engine...');
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/test/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        setUploadStatus('Uploaded Successfully! 🎉');
        setSavedKey(data.savedS3Key);
        setDownloadUrl(''); // Clear stale download urls
      } else {
        setUploadStatus(`Server Rejected: ${data.error || 'Unknown Error'}`);
      }
    } catch (err) {
      setUploadStatus(`Network Pipeline Exception: ${err.message}`);
    }
  };

  const handleFetchDownloadUrl = async () => {
    if (!savedKey.trim()) return alert("Enter an object path key!");
    try {
      const response = await fetch(`${API_BASE_URL}/test/download?key=${encodeURIComponent(savedKey.trim())}`);
      const data = await response.json();
      
      if (response.ok) {
        setDownloadUrl(data.downloadUrl);
      } else {
        alert(`Failed to request access: ${data.error || 'Check server logs'}`);
      }
    } catch (err) {
      alert(`Network Pipeline Exception: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '650px', margin: '0 auto', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '10px' }}>☁️ Cloudflare R2 Storage Control</h2>
      
      {/* SECTION 1: STORAGE ENTRY */}
      <div style={{ margin: '25px 0', padding: '20px', border: '1px solid #e1e4e8', borderRadius: '6px', background: '#fafbfc' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>1. Upload Gateway</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="file" onChange={handleFileChange} style={{ fontSize: '14px' }} />
          <button 
            onClick={handleUpload} 
            style={{ padding: '8px 16px', background: '#24292e', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '500', cursor: 'pointer' }}
          >
            Upload to R2
          </button>
        </div>
        {uploadStatus && <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#586069', fontStyle: 'italic' }}>{uploadStatus}</p>}
      </div>

      {/* SECTION 2: DOWNSTREAM DELIVERY */}
      <div style={{ margin: '25px 0', padding: '20px', border: '1px solid #e1e4e8', borderRadius: '6px', background: '#fafbfc' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>2. Object Retrieval</h3>
        <p style={{ fontSize: '14px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#444' }}>Target Reference Key Path:</p>
        <input 
          type="text" 
          value={savedKey} 
          onChange={(e) => setSavedKey(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5da', fontFamily: 'monospace', fontSize: '13px', boxSizing: 'border-box' }} 
        />
        
        <button 
          onClick={handleFetchDownloadUrl} 
          style={{ marginTop: '15px', padding: '10px 18px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '500', cursor: 'pointer', width: '100%' }}
        >
          Verify Assets & Issue Direct Access Token
        </button>

        {downloadUrl && (
          <div style={{ marginTop: '20px', borderTop: '2px dashed #e1e4e8', paddingTop: '20px' }}>
            <p style={{ color: '#28a745', margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
              ✓ Presigned URL successfully issued (Valid for 15 minutes)
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ flex: 1, textAlign: 'center', display: 'block', padding: '10px', background: '#4a5568', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: '500', fontSize: '14px' }}
              >
                👁️ View Asset
              </a>

              <a 
                href={downloadUrl} 
                download
                style={{ flex: 1, textAlign: 'center', display: 'block', padding: '10px', background: '#2f855a', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: '500', fontSize: '14px' }}
              >
                📥 Save Locally
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}