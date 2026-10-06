import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  QrCode,
  Bot,
  MessageSquare,
  Send,
  Radio,
  Settings,
  RefreshCw,
  Power,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Users
} from 'lucide-react';

interface SessionState {
  id: string;
  status: string;
  qrCode?: string | null;
  phoneNumber?: string | null;
}

interface MessageLog {
  from: string;
  fromName?: string;
  body: string;
  timestamp: string;
  isAI?: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'qr' | 'ai' | 'chats' | 'broadcast' | 'sandbox'>('qr');
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem('wa_api_token') || '');
  const [serverUrl, setServerUrl] = useState<string>(() => localStorage.getItem('wa_server_url') || 'http://localhost:3001');

  // Status & Socket
  const [session, setSession] = useState<SessionState>({ id: 'default', status: 'disconnected' });
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash',
    systemPrompt: '',
    temperature: 0.7
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Manual Send State
  const [manualPhone, setManualPhone] = useState('');
  const [manualText, setManualText] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  // Broadcast State
  const [broadcastPhones, setBroadcastPhones] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastResult, setBroadcastResult] = useState('');

  // Sandbox State
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxHistory, setSandboxHistory] = useState<Array<{ role: string; text: string }>>([]);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Save Config to LocalStorage
  const handleSaveConfig = () => {
    localStorage.setItem('wa_api_token', apiToken);
    localStorage.setItem('wa_server_url', serverUrl);
    alert('Server URL & Token saved successfully!');
    fetchStatus();
  };

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiToken) {
      headers['X-WA-Token'] = apiToken;
    }
    return headers;
  };

  // Fetch Status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/whatsapp/status`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch {}
  };

  // Fetch AI Settings
  const fetchAISettings = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/agent/settings`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAiSettings({
          provider: data.provider || 'gemini',
          apiKey: data.apiKey || '',
          model: data.model || 'gemini-2.0-flash',
          systemPrompt: data.systemPrompt || '',
          temperature: data.temperature ?? 0.7
        });
      }
    } catch {}
  };

  // Socket.IO Connection
  useEffect(() => {
    fetchStatus();
    fetchAISettings();

    const socket: Socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('whatsapp:status', (data) => {
      setSession(prev => ({ ...prev, status: data.status }));
    });

    socket.on('whatsapp:qr', (data) => {
      setSession(prev => ({ ...prev, qrCode: data.qr, status: 'qr' }));
    });

    socket.on('whatsapp:ready', (data) => {
      setSession(prev => ({ ...prev, status: 'ready', phoneNumber: data.phone, qrCode: null }));
    });

    socket.on('whatsapp:disconnected', () => {
      setSession(prev => ({ ...prev, status: 'disconnected', qrCode: null }));
    });

    socket.on('whatsapp:message', (msg) => {
      setMessages(prev => [
        {
          from: msg.from,
          fromName: msg.fromName,
          body: msg.body,
          timestamp: new Date().toLocaleTimeString(),
          isAI: false
        },
        ...prev.slice(0, 99)
      ]);
    });

    socket.on('whatsapp:reply', (data) => {
      setMessages(prev => [
        {
          from: data.to,
          fromName: 'AI Bot',
          body: data.reply,
          timestamp: new Date().toLocaleTimeString(),
          isAI: true
        },
        ...prev.slice(0, 99)
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  // Connect / Disconnect handlers
  const handleConnect = async () => {
    setLoading(true);
    try {
      await fetch(`${serverUrl}/api/whatsapp/connect`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sessionId: 'default' })
      });
      fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch(`${serverUrl}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sessionId: 'default' })
      });
      fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  // Save AI Settings
  const handleSaveAISettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/agent/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(aiSettings)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Send Manual Message
  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone || !manualText) return;
    try {
      const res = await fetch(`${serverUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone: manualPhone, message: manualText })
      });
      if (res.ok) {
        setSendSuccess('Message sent successfully!');
        setManualText('');
        setTimeout(() => setSendSuccess(''), 3000);
      }
    } catch {}
  };

  // Send Broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const phones = broadcastPhones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    if (phones.length === 0 || !broadcastMsg) return;

    try {
      const res = await fetch(`${serverUrl}/api/whatsapp/broadcast`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phones, message: broadcastMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastResult(`${data.queued} messages queued for sending!`);
        setBroadcastMsg('');
        setBroadcastPhones('');
        setTimeout(() => setBroadcastResult(''), 4000);
      }
    } catch {}
  };

  // AI Sandbox Playground Test
  const handleSandboxSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxInput.trim()) return;

    const userMsg = sandboxInput.trim();
    setSandboxInput('');
    setSandboxHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setSandboxLoading(true);

    try {
      const res = await fetch(`${serverUrl}/api/agent/test`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setSandboxHistory(prev => [...prev, { role: 'ai', text: data.reply || 'No reply generated.' }]);
    } catch (err: any) {
      setSandboxHistory(prev => [...prev, { role: 'ai', text: 'Error connecting to AI server.' }]);
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: '#111827',
        borderRight: '1px solid #1f2937',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>MLHK AI</h1>
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>WhatsApp Dashboard</p>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '10px 14px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: session.status === 'ready' ? '#10b981' : session.status === 'qr' ? '#f59e0b' : '#ef4444'
            }} />
            <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>
              {session.status === 'ready' ? 'Connected' : session.status === 'qr' ? 'Scan QR' : 'Disconnected'}
            </span>
          </div>
          <button onClick={fetchStatus} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('qr')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'qr' ? '#2563eb' : 'transparent',
              color: activeTab === 'qr' ? '#fff' : '#9ca3af',
              fontWeight: '600',
              textAlign: 'left'
            }}
          >
            <QrCode size={18} />
            <span>Connection & QR</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'ai' ? '#2563eb' : 'transparent',
              color: activeTab === 'ai' ? '#fff' : '#9ca3af',
              fontWeight: '600',
              textAlign: 'left'
            }}
          >
            <Bot size={18} />
            <span>AI Brain Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'chats' ? '#2563eb' : 'transparent',
              color: activeTab === 'chats' ? '#fff' : '#9ca3af',
              fontWeight: '600',
              textAlign: 'left'
            }}
          >
            <MessageSquare size={18} />
            <span>Live Chats ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'broadcast' ? '#2563eb' : 'transparent',
              color: activeTab === 'broadcast' ? '#fff' : '#9ca3af',
              fontWeight: '600',
              textAlign: 'left'
            }}
          >
            <Radio size={18} />
            <span>Broadcast Sender</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'sandbox' ? '#2563eb' : 'transparent',
              color: activeTab === 'sandbox' ? '#fff' : '#9ca3af',
              fontWeight: '600',
              textAlign: 'left'
            }}
          >
            <Sparkles size={18} />
            <span>AI Sandbox Test</span>
          </button>
        </nav>

        {/* Server & Token Setup */}
        <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', fontWeight: '700' }}>CONNECTION SETTINGS</p>
          <input
            type="text"
            placeholder="Server URL (e.g. http://localhost:3001)"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', fontSize: '12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff', marginBottom: '6px' }}
          />
          <input
            type="password"
            placeholder="API Token (optional)"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', fontSize: '12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#fff', marginBottom: '8px' }}
          />
          <button
            onClick={handleSaveConfig}
            style={{ width: '100%', padding: '6px', fontSize: '12px', backgroundColor: '#374151', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
          >
            Save Credentials
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {/* TAB 1: QR & CONNECTION */}
        {activeTab === 'qr' && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>WhatsApp Connection</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Scan the QR code below using WhatsApp on your phone (Linked Devices) to activate the AI Agent.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* QR Display Card */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Scan QR Code</h3>
                {session.status === 'qr' && session.qrCode ? (
                  <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', display: 'inline-block' }}>
                    <img src={session.qrCode} alt="WhatsApp QR Code" style={{ width: '240px', height: '240px', display: 'block' }} />
                  </div>
                ) : session.status === 'ready' ? (
                  <div style={{ padding: '40px 20px', backgroundColor: '#064e3b', borderRadius: '12px', border: '1px solid #059669' }}>
                    <Smartphone size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ color: '#34d399', fontSize: '18px', fontWeight: '700' }}>WhatsApp Connected!</h4>
                    <p style={{ color: '#a7f3d0', fontSize: '14px', marginTop: '4px' }}>Phone: +{session.phoneNumber || 'Active'}</p>
                  </div>
                ) : (
                  <div style={{ padding: '60px 20px', backgroundColor: '#1f2937', borderRadius: '12px' }}>
                    <p style={{ color: '#9ca3af' }}>No QR code active. Click "Connect / Generate QR" to start.</p>
                  </div>
                )}
              </div>

              {/* Actions & Instructions */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Connection Controls</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {session.status !== 'ready' ? (
                    <button
                      onClick={handleConnect}
                      disabled={loading}
                      style={{
                        padding: '12px',
                        backgroundColor: '#10b981',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Power size={18} />
                      {loading ? 'Connecting...' : 'Connect / Generate QR'}
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnect}
                      disabled={loading}
                      style={{
                        padding: '12px',
                        backgroundColor: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Power size={18} />
                      Disconnect WhatsApp
                    </button>
                  )}

                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#d1d5db' }}>How to link:</h4>
                    <ol style={{ paddingLeft: '20px', color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                      <li>Open WhatsApp on your mobile phone</li>
                      <li>Tap <b>Menu (⋮)</b> or <b>Settings</b></li>
                      <li>Select <b>Linked Devices</b></li>
                      <li>Tap <b>Link a Device</b> and point camera at QR code</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI BRAIN SETTINGS */}
        {activeTab === 'ai' && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>AI Brain Configuration</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Customize how the AI talks to customers, choose the LLM model, and adjust rules.</p>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>LLM Provider</label>
                <select
                  value={aiSettings.provider}
                  onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="gemini">Google Gemini (Recommended - Free Tier Available)</option>
                  <option value="openrouter">OpenRouter (DeepSeek, Llama, Claude, etc.)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>Model Name</label>
                <input
                  type="text"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                  placeholder="e.g. gemini-2.0-flash or google/gemma-2-9b-it:free"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>API Key</label>
                <input
                  type="password"
                  value={aiSettings.apiKey}
                  onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                  placeholder="Paste your Gemini or OpenRouter API key"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>
                  System Prompt (The Agent's Personality & Instructions)
                </label>
                <textarea
                  rows={6}
                  value={aiSettings.systemPrompt}
                  onChange={(e) => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
                  placeholder="You are a friendly sales assistant. Help customers with prices and product details..."
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>
                  Creativity / Temperature: {aiSettings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiSettings.temperature}
                  onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              {saveSuccess && (
                <div style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                  Settings saved and applied successfully!
                </div>
              )}

              <button
                onClick={handleSaveAISettings}
                disabled={loading}
                style={{
                  padding: '12px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Saving...' : 'Save AI Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE CHATS */}
        {activeTab === 'chats' && (
          <div style={{ maxWidth: '900px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Live Messages & Chats</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Watch incoming customer messages and AI replies in real-time.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Message Feed */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', height: '600px', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#9ca3af' }}>Recent Activity Feed</h3>
                {messages.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '100px' }}>No messages received yet. Send a test WhatsApp message to your linked number!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor: m.isAI ? '#1e1b4b' : '#1f2937',
                          border: m.isAI ? '1px solid #3730a3' : '1px solid #374151',
                          alignSelf: m.isAI ? 'flex-end' : 'flex-start',
                          maxWidth: '85%'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: m.isAI ? '#818cf8' : '#34d399' }}>
                            {m.isAI ? '🤖 AI Response' : `👤 ${m.fromName || m.from}`}
                          </span>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>{m.timestamp}</span>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Send Drawer */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Send Manual Message</h3>
                <form onSubmit={handleSendManual} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 919893496163"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Message Text</label>
                    <textarea
                      rows={4}
                      placeholder="Type message..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff', resize: 'none' }}
                    />
                  </div>
                  {sendSuccess && <p style={{ color: '#34d399', fontSize: '12px' }}>{sendSuccess}</p>}
                  <button
                    type="submit"
                    style={{
                      padding: '10px',
                      backgroundColor: '#2563eb',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BROADCAST SENDER */}
        {activeTab === 'broadcast' && (
          <div style={{ maxWidth: '700px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Broadcast Campaigns</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Send bulk messages to customer numbers safely via the background queue.</p>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
              <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>
                    Phone Numbers (One per line or comma-separated)
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastPhones}
                    onChange={(e) => setBroadcastPhones(e.target.value)}
                    placeholder="919893496163&#10;919165100124&#10;918888888888"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>
                    Broadcast Message Content
                  </label>
                  <textarea
                    rows={5}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="*Big Sale Alert!* 🎉&#10;&#10;Get flat 15% discount on all laptops this weekend only. Reply to order!"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                {broadcastResult && (
                  <div style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                    {broadcastResult}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    padding: '12px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={18} />
                  Queue Broadcast Messages
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: AI SANDBOX TEST */}
        {activeTab === 'sandbox' && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>AI Sandbox Playground</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Chat with your configured AI Agent directly here to verify responses before answering customers.</p>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', height: '500px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
                {sandboxHistory.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', margin: 'auto' }}>Type a test query below (e.g. "Laptop under 30000 dikhao") to see how the AI Agent replies.</p>
                ) : (
                  sandboxHistory.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: m.role === 'user' ? '#2563eb' : '#1f2937',
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                      }}
                    >
                      <p style={{ fontSize: '14px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{m.text}</p>
                    </div>
                  ))
                )}
                {sandboxLoading && <p style={{ color: '#9ca3af', fontSize: '13px' }}>AI is thinking...</p>}
              </div>

              <form onSubmit={handleSandboxSend} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Ask the AI agent..."
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                />
                <button
                  type="submit"
                  disabled={sandboxLoading}
                  style={{ padding: '12px 20px', backgroundColor: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
