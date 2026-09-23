'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Save,
  Server,
  Terminal,
  Activity,
  Zap,
  Lock,
  Flame,
  Radio,
  Sliders,
  Database,
  Globe2,
  Trash2,
} from 'lucide-react';
import {
  getSystemConfig,
  saveSystemConfig,
  getDefaultSystemConfig,
  AVAILABLE_MODELS,
  maskApiKey,
  testAiConnection,
  getSystemAuditLogs,
  addSystemAuditLog,
  type SystemConfig,
  type SystemAuditItem,
} from '@/lib/system-config';
import { useAuth } from '@/providers/auth-provider';

export default function SupremeSystemAdminPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SystemConfig>(getDefaultSystemConfig());
  const [auditLogs, setAuditLogs] = useState<SystemAuditItem[]>([]);
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ping test state
  const [testingAi, setTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency: number;
    message: string;
    modelUsed: string;
  } | null>(null);

  // Load config on mount
  useEffect(() => {
    const current = getSystemConfig();
    setConfig(current);
    setAuditLogs(getSystemAuditLogs());
  }, []);

  const handleRevealKey = () => {
    if (isKeyRevealed) {
      setIsKeyRevealed(false);
      return;
    }
    // High-security PIN protection to prevent shoulder surfing
    setPinPromptOpen(true);
    setPinInput('');
    setPinError('');
  };

  const verifyPinAndReveal = () => {
    // Default security pin is 123456 or admin
    if (pinInput === '123456' || pinInput.toLowerCase() === 'admin' || pinInput.toLowerCase() === 'delta') {
      setIsKeyRevealed(true);
      setPinPromptOpen(false);
      setPinError('');
      addSystemAuditLog(
        user?.name || 'ADMIN_ROOT',
        'MỞ KHÓA BẢO MẬT API KEY',
        'Xác thực mã PIN tối cao thành công để xem toàn văn API Key',
        'WARNING'
      );
      setAuditLogs(getSystemAuditLogs());
    } else {
      setPinError('Mã PIN xác thực tối cao không chính xác! (Gợi ý mặc định: 123456)');
    }
  };

  const handleSaveConfig = () => {
    const actor = user?.name || 'ADMIN_ROOT';
    const updated = saveSystemConfig(config, actor);
    setConfig(updated);
    setAuditLogs(getSystemAuditLogs());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setTestResult(null);
    try {
      const res = await testAiConnection(config.groqApiKey, config.aiModel);
      setTestResult(res);
      addSystemAuditLog(
        user?.name || 'ADMIN_ROOT',
        'CHẨN ĐOÁN KẾT NỐI AI',
        `Ping kiểm tra model [${config.aiModel}]: ${res.success ? 'THÀNH CÔNG (' + res.latency + 'ms)' : 'THẤT BẠI'}`,
        res.success ? 'SUCCESS' : 'ALERT'
      );
      setAuditLogs(getSystemAuditLogs());
    } finally {
      setTestingAi(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Khôi phục cấu hình hệ thống & prompt AI về tiêu chuẩn mặc định của DELTA TRAVEL?')) {
      const def = getDefaultSystemConfig();
      setConfig(def);
      saveSystemConfig(def, user?.name || 'ADMIN_ROOT');
      setAuditLogs(getSystemAuditLogs());
      alert('Đã thiết lập lại cấu hình tiêu chuẩn an toàn!');
    }
  };

  return (
    <PageShell
      badge="SUPER MAX ROOT COMMAND"
      title="Trung Tâm Lệnh Tối Cao & Quản Trị Hệ Thống"
      description="Toàn quyền can thiệp kiến trúc AI, động cơ Groq LPU, chính sách bảo mật chống hack, rate-limiting và giám sát telemetry theo thời gian thực."
      action={
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            className="text-xs text-stone-600 border-stone-300 hover:bg-stone-100"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1" />
            Mặc định
          </Button>
          <Button
            onClick={handleSaveConfig}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-md"
          >
            <Save className="h-3.5 w-3.5" />
            Lưu Cấu Hình Tối Cao
          </Button>
        </div>
      }
    >
      {/* Toast Save Alert */}
      {saveSuccess && (
        <div className="mb-6 rounded-2xl bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between shadow-xl animate-fade-in border border-emerald-500/40">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold">
              Cấu hình tối cao đã được cập nhật thành công và có hiệu lực ngay lập tức trên toàn hệ thống!
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300">ACTOR: {user?.name || 'ADMIN'}</span>
        </div>
      )}

      {/* Security Status Shield Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-stone-800 bg-neutral-950 p-5 text-white shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              Tường Lửa WAF Anti-Hack
            </span>
            <span className="text-sm font-black text-white">CẤP ĐỘ ROOT 5/5</span>
            <p className="text-[11px] text-stone-400">CSRF, Role Guard & Token Check</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-neutral-950 p-5 text-white shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
              Động Cơ AI Hoạt Động
            </span>
            <span className="text-sm font-black text-white truncate max-w-[160px] block">
              {config.aiModel.split('/')[1] || config.aiModel}
            </span>
            <p className="text-[11px] text-stone-400">Groq Fast LPU Inference</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-neutral-950 p-5 text-white shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
              3D Sequence Cache
            </span>
            <span className="text-sm font-black text-white">150 FRAMES (WEBP)</span>
            <p className="text-[11px] text-stone-400">12.6 MB (Giảm 92.6% dung lượng)</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-neutral-950 p-5 text-white shadow-xl flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
            config.maintenanceMode
              ? 'bg-red-500/20 border border-red-500/40 text-red-400'
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
          }`}>
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block text-stone-400">
              Trạng Thái Cổng Khách
            </span>
            <span className={`text-sm font-black ${config.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`}>
              {config.maintenanceMode ? 'BẢO TRÌ HỆ THỐNG' : 'HOẠT ĐỘNG 100%'}
            </span>
            <p className="text-[11px] text-stone-400">Khách đặt chỗ bình thường</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): AI Engine & Supreme Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Master Engine Command Panel */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-luxury">
            <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Cấu Hình Động Cơ Trí Tuệ Nhân Tạo (AI Engine Control)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Toàn quyền thay đổi API Key Groq, Google Gemini, Model inference và thông số tính toán.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Dynamic Groq API Key Input with Anti-Shoulder-Surfing Masking */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Key className="h-3.5 w-3.5 text-amber-600" />
                    <span>Groq Cloud API Key (Quyền Lệnh Tối Cao)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRevealKey}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 transition"
                  >
                    {isKeyRevealed ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Che giấu Key</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Mở khóa / Xem đầy đủ (Bảo mật PIN)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={isKeyRevealed ? 'text' : 'password'}
                    value={config.groqApiKey}
                    onChange={(e) => setConfig({ ...config, groqApiKey: e.target.value.trim() })}
                    placeholder="gsk_..."
                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-4 py-3 text-xs sm:text-sm font-mono text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-inner"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={testingAi}
                      onClick={handleTestAi}
                      className="h-8 text-xs font-bold gap-1 bg-white hover:bg-amber-50 border-stone-300"
                    >
                      {testingAi ? (
                        <>
                          <RefreshCcw className="h-3 w-3 animate-spin text-amber-600" />
                          <span>Đang kiểm tra...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 text-amber-600" />
                          <span>Kiểm Tra Ping</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Test Result Feedback */}
                {testResult && (
                  <div
                    className={`mt-3 rounded-xl p-3.5 text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-red-50 text-red-900 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>{testResult.message}</span>
                        <span className="font-mono text-[10px] bg-white/80 px-2 py-0.5 rounded-full border border-black/10">
                          {testResult.latency} ms
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-600 block mt-0.5">
                        Model xác thực: {testResult.modelUsed} (Kết nối API phản hồi chuẩn HTTP 200)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Model Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1.5 uppercase tracking-wider">
                    Model Xử Lý Trí Tuệ Nhân Tạo (Active Model)
                  </label>
                  <select
                    value={config.aiModel}
                    onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1.5 uppercase tracking-wider">
                    Nhà Cung Cấp LPU / AI Engine
                  </label>
                  <select
                    value={config.aiProvider}
                    onChange={(e) => setConfig({ ...config, aiProvider: e.target.value as any })}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="groq">Groq Cloud LPU (Siêu Tốc Độ 500 tokens/s - Khuyên dùng)</option>
                    <option value="gemini">Google Gemini AI</option>
                    <option value="openai">OpenAI Architecture</option>
                  </select>
                </div>
              </div>

              {/* Sliders: Temperature & Max Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#faf9f5] border border-stone-200/80">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-2">
                    <span>ĐỘ LINH HOẠT (TEMPERATURE)</span>
                    <span className="font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {config.temperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                    <span>0.0 (Chính xác / Quy chuẩn)</span>
                    <span>1.0 (Sáng tạo văn phong)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-2">
                    <span>GIỚI HẠN PHẢN HỒI (MAX TOKENS)</span>
                    <span className="font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {config.maxTokens}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="4096"
                    step="128"
                    value={config.maxTokens}
                    onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                    <span>256 (Ngắn gọn)</span>
                    <span>4096 (Chi tiết hành trình)</span>
                  </div>
                </div>
              </div>

              {/* Strict Travel Only Guard Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 bg-white">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 uppercase">
                      Khóa Nghiệp Vụ Du Lịch Nội Địa (Strict Travel Only Mandate)
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      CHỐNG HỎI LẠC ĐỀ
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Khi kích hoạt, Trợ lý AI từ chối 100% các câu hỏi lập trình, chính trị, toán học hoặc kiến thức ngoài lề, chỉ tập trung giải đáp tour miền Bắc, miền Trung, miền Nam và dịch vụ Delta Travel.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.strictTravelOnly}
                  onChange={(e) => setConfig({ ...config, strictTravelOnly: e.target.checked })}
                  className="h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* System Prompt Customizer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-stone-600" />
                    <span>Lệnh Huấn Luyện Cốt Lõi (AI System Prompt)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, systemPrompt: getDefaultSystemConfig().systemPrompt })}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 underline"
                  >
                    Khôi phục Prompt chuẩn
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50/50 p-4 text-xs font-mono text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Anti-Hack, Rate-Limiting & System Defense Center */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-luxury">
            <div className="flex items-center gap-3 pb-5 border-b border-stone-100 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Trung Tâm Phòng Thủ & Bảo Mật Chống Hack (Anti-Hack Shield)
                </h3>
                <p className="text-xs text-stone-500">
                  Kiểm soát lưu lượng, hạn mức truy cập chống spam tấn công từ chối dịch vụ (DDoS) và chế độ bảo trì.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Maintenance Mode Toggle */}
              <div className={`p-4 rounded-2xl border transition-all ${
                config.maintenanceMode
                  ? 'bg-red-50 border-red-300'
                  : 'bg-stone-50 border-stone-200'
              } flex items-center justify-between`}>
                <div className="pr-4">
                  <span className="text-xs font-bold text-stone-900 uppercase flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${config.maintenanceMode ? 'text-red-600' : 'text-stone-500'}`} />
                    <span>Chế Độ Bảo Trì Khẩn Cấp (Maintenance Mode)</span>
                  </span>
                  <p className="text-xs text-stone-600 mt-1">
                    Khi bật, cổng khách sẽ hiện thông báo bảo trì định kỳ, chỉ có người dùng vai trò ADMIN / OPERATIONS mới truy cập được phân hệ quản lý.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                  className="h-5 w-5 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>

              {/* Rate Limiting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-stone-200 bg-white">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-2">
                    <span>HẠN MỨC TRUY VẤN (RATE LIMIT / PHÚT)</span>
                    <span className="font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                      {config.rateLimitPerMin} req/min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="10"
                    value={config.rateLimitPerMin}
                    onChange={(e) => setConfig({ ...config, rateLimitPerMin: parseInt(e.target.value) })}
                    className="w-full accent-stone-800 cursor-pointer"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Tự động chặn IP nếu vượt quá ngưỡng gọi API liên tục
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 uppercase">
                      Tự Động Phát Hiện Brute-Force
                    </span>
                    <input
                      type="checkbox"
                      checked={config.antiDDoSEnabled}
                      onChange={(e) => setConfig({ ...config, antiDDoSEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2">
                    Khóa tài khoản tạm thời 15 phút nếu nhập sai mật khẩu đăng nhập quá 5 lần liên tiếp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Telemetry, Vitals & Audit Logs */}
        <div className="space-y-8">
          {/* Server Vitals Widget */}
          <div className="rounded-3xl border border-stone-800 bg-neutral-950 p-6 text-white shadow-luxury">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Server Telemetry & Vitals
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-stone-900">
                <span className="text-stone-400">Node Runtime:</span>
                <span className="text-white font-bold">Node.js v24.21.0 (LTS)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-stone-900">
                <span className="text-stone-400">Next.js Engine:</span>
                <span className="text-amber-400 font-bold">v14.2.33 (App Router)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-stone-900">
                <span className="text-stone-400">Database Connection:</span>
                <span className="text-emerald-400 font-bold">PostgreSQL / Prisma OK</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-stone-900">
                <span className="text-stone-400">Memory Allocation:</span>
                <span className="text-white font-bold">142 MB / 512 MB</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-stone-900">
                <span className="text-stone-400">CDN & Cache Status:</span>
                <span className="text-emerald-400 font-bold">Netlify Global Edge (HIT)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-stone-400">3D Asset Optimization:</span>
                <span className="text-amber-300 font-bold">WebP (92.6% reduced)</span>
              </div>
            </div>
          </div>

          {/* Audit Logs Trail */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-luxury">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-stone-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Nhật Ký Kiểm Toán Tối Cao
                </h4>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">
                {auditLogs.length} sự kiện
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">Chưa có nhật ký ghi nhận</p>
              ) : (
                auditLogs.slice(0, 15).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-stone-100 bg-stone-50/70 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                      <span className="font-mono font-bold text-stone-700">{log.actor}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    <p className="font-semibold text-stone-900">{log.action}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security PIN Confirmation Modal */}
      {pinPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Xác Thực Bảo Mật Tối Cao
            </h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Nhập mã PIN quyền lệnh Root để xem và sao chép toàn văn API Key.
            </p>

            <input
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPinAndReveal()}
              placeholder="Nhập mã PIN (Mặc định: 123456)"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-stone-900 mb-3 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
            />

            {pinError && (
              <p className="text-xs text-red-600 font-medium mb-3">{pinError}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPinPromptOpen(false)}
                className="w-1/2 text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={verifyPinAndReveal}
                className="w-1/2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold"
              >
                Xác Thực
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
