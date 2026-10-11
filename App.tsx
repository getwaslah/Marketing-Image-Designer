
import React, { useState, useRef, useCallback } from 'react';
import { MARKETING_STYLES, ASPECT_RATIOS } from './constants';
import { AspectRatio, GeneratedImage, MarketingStyle, LogoPosition } from './types';
import StyleCard from './components/StyleCard';
import { generateProductImage } from './services/geminiService';

const App: React.FC = () => {
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<MarketingStyle>(MARKETING_STYLES[0]);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // States
  const [productImage, setProductImage] = useState<string | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [headlineText, setHeadlineText] = useState('');
  const [contactPosition, setContactPosition] = useState<LogoPosition>("bottom-left");
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("top-right");
  const [logoSize, setLogoSize] = useState<number>(15);
  const [showCamera, setShowCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoSidebarInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBrandLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStyleImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('لا يمكن الوصول إلى الكاميرا. تأكد من منح الأذونات اللازمة.');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setProductImage(canvas.toDataURL('image/png'));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim() && !productImage) {
      setError('يرجى إدخال وصف للمنتج أو إضافة صورة له');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await generateProductImage(
        description,
        selectedStyle.promptPrefix,
        selectedRatio,
        productImage || undefined,
        brandLogo || undefined,
        styleImage || undefined
      );
      const newImage: GeneratedImage = {
        url: imageUrl,
        prompt: description || `صورة منتج بأسلوب ${selectedStyle.name}`,
        style: styleImage ? "محاكاة نمط مرئي" : selectedStyle.name,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newImage, ...prev]);
      if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imgUrl: string, filename: string) => {
    const hasOverlay = brandLogo || address || whatsapp || website;
    
    if (!hasOverlay) {
      const link = document.createElement('a');
      link.href = imgUrl;
      link.download = `${filename}.png`;
      link.click();
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainImg = new Image();
    const logoImg = new Image();
    
    const promises: Promise<any>[] = [
      new Promise(res => { mainImg.onload = res; mainImg.src = imgUrl; })
    ];
    
    if (brandLogo) {
      promises.push(new Promise(res => { logoImg.onload = res; logoImg.src = brandLogo; }));
    }
    
    await Promise.all(promises);

    canvas.width = mainImg.width;
    canvas.height = mainImg.height;
    ctx.drawImage(mainImg, 0, 0);

    if (brandLogo) {
      const lSize = (canvas.width * logoSize) / 100;
      const padding = canvas.width * 0.04;
      const lWidth = lSize;
      const lHeight = (logoImg.height / logoImg.width) * lWidth;

      let lx = 0, ly = 0;
      switch(logoPosition) {
        case 'top-right': lx = canvas.width - lWidth - padding; ly = padding; break;
        case 'top-left': lx = padding; ly = padding; break;
        case 'bottom-right': lx = canvas.width - lWidth - padding; ly = canvas.height - lHeight - padding; break;
        case 'bottom-left': lx = padding; ly = canvas.height - lHeight - padding; break;
      }

      ctx.drawImage(logoImg, lx, ly, lWidth, lHeight);
    }

    // Draw Contact Info
    if (address || whatsapp || website) {
      const fontSize = Math.max(20, canvas.width * 0.025);
      ctx.font = `bold ${fontSize}px Cairo, sans-serif`;
      
      const textPadding = canvas.width * 0.04;
      let currentY = 0;
      let currentX = 0;

      // Calculate initial Y based on position
      if (contactPosition.startsWith('top')) {
        currentY = textPadding + fontSize;
        ctx.textBaseline = 'top';
      } else {
        currentY = canvas.height - textPadding;
        ctx.textBaseline = 'bottom';
      }

      // Calculate X and alignment based on position
      if (contactPosition.endsWith('right')) {
        currentX = canvas.width - textPadding;
        ctx.textAlign = 'right';
      } else {
        currentX = textPadding;
        ctx.textAlign = 'left';
      }

      // Draw background for readability if needed, or just shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "white";

      const lines = [];
      if (address) lines.push(address);
      if (whatsapp) lines.push(`واتساب: ${whatsapp}`);
      if (website) lines.push(website);

      // If bottom position, we draw from bottom up
      if (contactPosition.startsWith('bottom')) {
        for (let i = lines.length - 1; i >= 0; i--) {
          ctx.fillText(lines[i], currentX, currentY);
          currentY -= fontSize * 1.4;
        }
      } else {
        // If top position, we draw from top down
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], currentX, currentY);
          currentY += fontSize * 1.4;
        }
      }
      
      // Reset shadow and baseline
      ctx.shadowBlur = 0;
      ctx.textBaseline = 'alphabetic';
    }

    // Draw Headline Text with Lines
    if (headlineText) {
      const fontSize = Math.max(40, canvas.width * 0.05);
      ctx.font = `bold ${fontSize}px Cairo, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 15;

      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.2; // Positioned at 20% from top

      ctx.fillText(headlineText, centerX, centerY);

      // Draw decorative lines below
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "white";
      ctx.lineWidth = Math.max(2, canvas.width * 0.003);
      
      const textWidth = ctx.measureText(headlineText).width;
      const lineY = centerY + fontSize * 0.8;
      const lineLength = textWidth * 0.8;

      // Draw two lines
      ctx.beginPath();
      ctx.moveTo(centerX - lineLength / 2, lineY);
      ctx.lineTo(centerX + lineLength / 2, lineY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX - lineLength / 3, lineY + fontSize * 0.2);
      ctx.lineTo(centerX + lineLength / 3, lineY + fontSize * 0.2);
      ctx.stroke();
    }
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${filename}.png`;
    link.click();
  };

  const getLogoPositionClasses = () => {
    switch(logoPosition) {
      case 'top-right': return 'top-[4%] right-[4%]';
      case 'top-left': return 'top-[4%] left-[4%]';
      case 'bottom-right': return 'bottom-[4%] right-[4%]';
      case 'bottom-left': return 'bottom-[4%] left-[4%]';
    }
  };

  const getContactPositionClasses = () => {
    switch(contactPosition) {
      case 'top-right': return 'top-[4%] right-[4%] text-right';
      case 'top-left': return 'top-[4%] left-[4%] text-left';
      case 'bottom-right': return 'bottom-[4%] right-[4%] text-right';
      case 'bottom-left': return 'bottom-[4%] left-[4%] text-left';
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 pb-20 lg:pb-0">
      <header className="sticky top-0 z-[60] glass-effect py-4 px-6 border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              <button 
                onClick={() => logoInputRef.current?.click()}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 overflow-hidden shadow-sm ${
                  brandLogo ? 'border-blue-500 bg-white' : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {brandLogo ? <img src={brandLogo} alt="Logo" className="w-full h-full object-contain" /> : <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              </button>
            </div>
            <div className="flex items-center gap-3 pr-2 border-r border-gray-100">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-blue-700 to-blue-500">مصمم الصور التسويقية</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Output Column */}
          <div className="order-1 lg:order-2 space-y-8 min-h-[500px]">
            {isGenerating ? (
              <div className="bg-white rounded-[32px] p-12 flex flex-col items-center justify-center text-center shadow-sm border border-dashed border-blue-200 animate-pulse min-h-[500px]">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6"><svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
                <h3 className="text-xl font-bold text-gray-700">جاري الإبداع ومحاكاة النمط...</h3>
                <p className="text-sm text-gray-400 mt-2">نعمل على دمج منتجك مع الإضاءة والجو الفني المطلوب</p>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-8">
                <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 relative group">
                  <div className="aspect-auto max-h-[700px] overflow-hidden bg-gray-50 flex items-center justify-center relative">
                    <img src={history[0].url} className="w-full h-full object-contain" />
                    {brandLogo && (
                      <div className={`absolute ${getLogoPositionClasses()} pointer-events-none transition-all duration-300`} style={{ width: `${logoSize}%` }}>
                        <img src={brandLogo} className="w-full h-auto drop-shadow-lg" />
                      </div>
                    )}
                    {headlineText && (
                      <div className="absolute top-[15%] left-0 right-0 text-center pointer-events-none px-4">
                        <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] inline-block relative">
                          {headlineText}
                          <div className="mt-2 flex flex-col items-center gap-1">
                            <div className="h-1 w-[80%] bg-white rounded-full shadow-lg"></div>
                            <div className="h-1 w-[50%] bg-white rounded-full shadow-lg"></div>
                          </div>
                        </h2>
                      </div>
                    )}
                    {(address || whatsapp || website) && (
                      <div className={`absolute ${getContactPositionClasses()} text-white pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] space-y-1`}>
                        {address && <p className="text-sm font-bold">{address}</p>}
                        {whatsapp && <p className="text-sm font-bold">واتساب: {whatsapp}</p>}
                        {website && <p className="text-sm font-bold">{website}</p>}
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col md:flex-row gap-4 justify-between items-center border-t border-gray-50">
                    <div>
                      <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-2 inline-block">{history[0].style}</span>
                      <p className="text-sm text-gray-500 line-clamp-2">{history[0].prompt}</p>
                    </div>
                    <button onClick={() => downloadImage(history[0].url, `ad-${Date.now()}`)} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-700 shadow-xl flex items-center gap-2 active:scale-95 transition-all shrink-0">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      تحميل الصورة
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-[32px] border border-gray-100 min-h-[500px] shadow-sm">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-400"><svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                <h3 className="text-xl font-bold text-gray-700">بانتظار لمستك الإبداعية</h3>
                <p className="text-gray-500 mt-2 max-w-sm">ارفع صورة لمنتجك واختر نمطاً أو ارفع صورة ملهمة لنقوم بمحاكاتها لك.</p>
              </div>
            )}
          </div>

          {/* Input Column */}
          <div className="order-2 lg:order-1 lg:sticky lg:top-24 self-start pb-10">
            <div className="space-y-6">
              <section className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="w-2 h-8 bg-blue-600 rounded-full"></span>خطوة 1: منتجك</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">الصورة الأصلية للمنتج</label>
                    {!productImage ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-2xl hover:bg-blue-100/50 group transition-colors">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-blue-500 group-hover:scale-110 transition-transform"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
                          <span className="text-xs font-bold text-blue-700">رفع صورة</span>
                        </button>
                        <button onClick={startCamera} className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-100 group transition-colors">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-gray-400 group-hover:scale-110 transition-transform"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                          <span className="text-xs font-bold text-gray-500">التقاط صورة</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-50 border border-gray-100 group">
                        <img src={productImage} className="w-full h-full object-contain" />
                        <button onClick={() => setProductImage(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">وصف المنتج (اختياري)</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: ساعة يد رجالية فاخرة بلمسة كلاسيكية..." className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-right transition-all" dir="rtl" />
                  </div>
                </div>
              </section>

              {/* NEW: Style Reference Section */}
              <section className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                  خطوة 2: محاكاة النمط البصري
                </h2>
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    ارفع صورة لنمط إضاءة أو بيئة تعجبك، وسيقوم الذكاء الاصطناعي بنقل "روح" هذه الصورة وتطبيقها على منتجك.
                  </p>
                  {!styleImage ? (
                    <button onClick={() => styleInputRef.current?.click()} className="w-full p-8 border-2 border-dashed border-purple-100 bg-purple-50/20 rounded-2xl flex flex-col items-center gap-3 text-purple-400 hover:bg-purple-50 transition-all group">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-500 group-hover:scale-110 transition-transform">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-bold text-purple-700">ارفع صورة النمط المطلوب</span>
                      <input type="file" ref={styleInputRef} className="hidden" accept="image/*" onChange={handleStyleUpload} />
                    </button>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-50 border border-purple-200 group">
                      <img src={styleImage} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-xs px-3 py-1 bg-purple-600 rounded-full">نمط مفعل</span>
                      </div>
                      <button onClick={() => setStyleImage(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-90 transition-all">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="w-2 h-8 bg-green-500 rounded-full"></span>خطوة 3: الشعار والأبعاد</h2>
                <div className="space-y-6">
                  {!brandLogo ? (
                    <button onClick={() => logoSidebarInputRef.current?.click()} className="w-full p-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-all">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <span className="font-bold">أضف شعار البراند</span>
                      <input type="file" ref={logoSidebarInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </button>
                  ) : (
                    <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-gray-700">إعدادات الشعار</h3>
                        <button onClick={() => setBrandLogo(null)} className="text-red-500 text-xs font-bold hover:underline">إزالة</button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2">موقع الشعار</label>
                          <select 
                            value={logoPosition} 
                            onChange={(e) => setLogoPosition(e.target.value as LogoPosition)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                          >
                            <option value="top-right">أعلى اليمين</option>
                            <option value="top-left">أعلى اليسار</option>
                            <option value="bottom-right">أسفل اليمين</option>
                            <option value="bottom-left">أسفل اليسار</option>
                          </select>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-500">حجم الشعار</label>
                            <span className="text-xs font-bold text-blue-600">{logoSize}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="5" 
                            max="40" 
                            value={logoSize} 
                            onChange={(e) => setLogoSize(parseInt(e.target.value))} 
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-700">نص إعلاني (Headline)</h3>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        value={headlineText} 
                        onChange={(e) => setHeadlineText(e.target.value)} 
                        placeholder="مثال: عرض خاص لفترة محدودة" 
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center font-bold"
                      />
                      <p className="text-[10px] text-gray-400 text-center">سيظهر النص في أعلى الصورة مع خطوط زخرفية</p>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-700">بيانات التواصل</h3>
                      <select 
                        value={contactPosition} 
                        onChange={(e) => setContactPosition(e.target.value as LogoPosition)}
                        className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg outline-none border-none cursor-pointer"
                      >
                        <option value="bottom-left">أسفل اليسار</option>
                        <option value="bottom-right">أسفل اليمين</option>
                        <option value="top-left">أعلى اليسار</option>
                        <option value="top-right">أعلى اليمين</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">العنوان</label>
                        <input 
                          type="text" 
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)} 
                          placeholder="مثال: الرياض، حي النرجس" 
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">رقم الواتساب</label>
                        <input 
                          type="text" 
                          value={whatsapp} 
                          onChange={(e) => setWhatsapp(e.target.value)} 
                          placeholder="مثال: 9665XXXXXXXX" 
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">الموقع الإلكتروني</label>
                        <input 
                          type="text" 
                          value={website} 
                          onChange={(e) => setWebsite(e.target.value)} 
                          placeholder="مثال: www.example.com" 
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <h3 className="font-bold text-gray-700 mb-4">الأنماط الجاهزة (في حال عدم رفع صورة نمط)</h3>
                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {MARKETING_STYLES.map((style) => (
                        <StyleCard key={style.id} style={style} isSelected={selectedStyle.id === style.id && !styleImage} onClick={() => setSelectedStyle(style)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-700 mb-4">أبعاد الصورة</h3>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button key={ratio.value} onClick={() => setSelectedRatio(ratio.value as AspectRatio)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${selectedRatio === ratio.value ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-3"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</div>}
                  
                  <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-5 rounded-2xl font-bold text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${isGenerating ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-700 to-blue-600 text-white hover:shadow-2xl active:scale-95'}`}>
                    {isGenerating ? (
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> إنشاء إعلان احترافي</>
                    )}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <video ref={videoRef} autoPlay playsInline className="w-full object-cover" />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
              <button onClick={stopCamera} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-white/30 p-1 shadow-2xl active:scale-95 transition-all"><div className="w-full h-full rounded-full border-2 border-slate-900 bg-white"></div></button>
              <div className="w-14"></div>
            </div>
          </div>
          <p className="text-white mt-8 font-medium">قم بتصوير منتجك في إضاءة جيدة</p>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 px-6 z-50 lg:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-lg transition-all ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white shadow-lg active:scale-95'}`}>
          {isGenerating ? 'جاري العمل...' : 'إنشاء إعلان الآن'}
        </button>
      </footer>
    </div>
  );
};

export default App;
