import React, { useState, useEffect } from 'react';
import { Settings, Bot, CreditCard, Save, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';

export const SettingsManager: React.FC = () => {
  const [telegramSettings, setTelegramSettings] = useState({
    botToken: '',
    botUsername: 'StoreProBot',
    miniAppUrl: 'http://localhost:3000/store',
    welcomeMessage: '',
    supportContact: '@StoreSupport',
    broadcastChannel: '@StoreAnnouncements',
    autoDeliveryEnabled: true,
    isBotActive: true
  });

  const [bakongSettings, setBakongSettings] = useState({
    merchantId: 'devb_retail',
    merchantName: 'DIGITAL STORE PRO',
    merchantCity: 'Phnom Penh',
    bakongAccountId: 'devb_retail@devb',
    acquireId: 'DEVB',
    apiToken: '',
    apiUrl: 'https://api-bakong.nbc.gov.kh/v1',
    isSandbox: true,
    qrExpiryMinutes: 15,
    pollIntervalSeconds: 3
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [tgRes, bakongRes] = await Promise.all([
        api.get('/admin/settings/telegram'),
        api.get('/admin/settings/bakong')
      ]);
      if (tgRes.data.settings) setTelegramSettings(tgRes.data.settings);
      if (bakongRes.data.settings) setBakongSettings(bakongRes.data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings/telegram', telegramSettings);
      setStatusMessage('Telegram bot settings updated successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving telegram settings: ' + err.message);
    }
  };

  const handleSaveBakong = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings/bakong', bakongSettings);
      setStatusMessage('Bakong KHQR gateway configuration saved successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving Bakong settings: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">System & Gateway Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Bakong KHQR credentials, Telegram Bot tokens, and automated instant fulfillment.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Bakong KHQR Settings Card */}
      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e1251b] flex items-center justify-center text-white font-black text-xs">
              KH
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bakong KHQR Gateway Configuration</h2>
              <p className="text-xs text-slate-400">NBC EMVCo Dynamic QR generation & verification service</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-800/50">
            <span className="text-xs font-semibold text-slate-300">Mode:</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                bakongSettings.isSandbox ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {bakongSettings.isSandbox ? 'SANDBOX (MOCK/DEV)' : 'PRODUCTION (LIVE BAKONG)'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveBakong} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bakong Account ID</label>
              <input
                type="text"
                required
                value={bakongSettings.bakongAccountId}
                onChange={(e) => setBakongSettings({ ...bakongSettings, bakongAccountId: e.target.value })}
                placeholder="e.g. devb_retail@devb"
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Merchant Display Name</label>
              <input
                type="text"
                required
                value={bakongSettings.merchantName}
                onChange={(e) => setBakongSettings({ ...bakongSettings, merchantName: e.target.value })}
                placeholder="DIGITAL STORE PRO"
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Merchant City</label>
              <input
                type="text"
                value={bakongSettings.merchantCity}
                onChange={(e) => setBakongSettings({ ...bakongSettings, merchantCity: e.target.value })}
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">QR Expiry Minutes</label>
              <input
                type="number"
                value={bakongSettings.qrExpiryMinutes}
                onChange={(e) => setBakongSettings({ ...bakongSettings, qrExpiryMinutes: parseInt(e.target.value, 10) || 15 })}
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Poll Interval (Sec)</label>
              <input
                type="number"
                value={bakongSettings.pollIntervalSeconds}
                onChange={(e) => setBakongSettings({ ...bakongSettings, pollIntervalSeconds: parseInt(e.target.value, 10) || 3 })}
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bakong Open API URL</label>
              <input
                type="text"
                value={bakongSettings.apiUrl}
                onChange={(e) => setBakongSettings({ ...bakongSettings, apiUrl: e.target.value })}
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bakong Bearer Token (Live API)</label>
              <input
                type="password"
                value={bakongSettings.apiToken}
                onChange={(e) => setBakongSettings({ ...bakongSettings, apiToken: e.target.value })}
                placeholder="Bearer eyJhbGciOi..."
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-purple-950/80 px-3 py-2 rounded-xl border border-purple-800/40">
              <input
                type="checkbox"
                checked={bakongSettings.isSandbox}
                onChange={(e) => setBakongSettings({ ...bakongSettings, isSandbox: e.target.checked })}
                className="rounded bg-purple-950 border-purple-800 text-purple-600"
              />
              <span className="text-slate-200 font-semibold">Enable Sandbox / Mock Provider (For Dev & Testing)</span>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Bakong Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Telegram Bot Settings Card */}
      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-purple-900/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Telegram Customer Bot Settings</h2>
            <p className="text-xs text-slate-400">Bot token, Telegram Mini App URL and notifications</p>
          </div>
        </div>

        <form onSubmit={handleSaveTelegram} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Telegram Bot Token</label>
              <input
                type="password"
                value={telegramSettings.botToken}
                onChange={(e) => setTelegramSettings({ ...telegramSettings, botToken: e.target.value })}
                placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWxYz..."
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Telegram Mini App URL</label>
              <input
                type="text"
                value={telegramSettings.miniAppUrl}
                onChange={(e) => setTelegramSettings({ ...telegramSettings, miniAppUrl: e.target.value })}
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Support Contact Handle</label>
              <input
                type="text"
                value={telegramSettings.supportContact}
                onChange={(e) => setTelegramSettings({ ...telegramSettings, supportContact: e.target.value })}
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Broadcast Channel</label>
              <input
                type="text"
                value={telegramSettings.broadcastChannel}
                onChange={(e) => setTelegramSettings({ ...telegramSettings, broadcastChannel: e.target.value })}
                className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Welcome Greeting Message</label>
            <textarea
              rows={3}
              value={telegramSettings.welcomeMessage}
              onChange={(e) => setTelegramSettings({ ...telegramSettings, welcomeMessage: e.target.value })}
              className="w-full bg-purple-950/70 border border-purple-800/40 rounded-xl px-3 py-2 text-white font-sans"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-purple-950/80 px-3 py-2 rounded-xl border border-purple-800/40">
              <input
                type="checkbox"
                checked={telegramSettings.autoDeliveryEnabled}
                onChange={(e) => setTelegramSettings({ ...telegramSettings, autoDeliveryEnabled: e.target.checked })}
                className="rounded bg-purple-950 border-purple-800 text-purple-600"
              />
              <span className="text-slate-200 font-semibold">Enable Instant Telegram Delivery Notification</span>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Bot Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
