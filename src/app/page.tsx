"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

interface HistoryItem {
  id: string;
  text: string;
  voice: string;
  fileName: string;
  language: string;
  type: 'minimax' | 'kokoro';
  createdAt: string;
}

interface SoundEffectHistoryItem {
  id: string;
  text: string;
  fileName: string;
  createdAt: string;
  filePath: string;
  duration_seconds?: number;
}

// Kokoro英文音色选项（仅做演示，可按需调整）
const voices = [
  { id: "af_nicole", name: "Nicole" },
  { id: "af", name: "默认 (Bella & Sarah 混合)" },
  { id: "af_bella", name: "Bella" },
  { id: "af_sarah", name: "Sarah" },
  { id: "am_adam", name: "Adam" },
  { id: "am_michael", name: "Michael" },
  { id: "bf_emma", name: "Emma (英式)" },
  { id: "bf_isabella", name: "Isabella (英式)" },
  { id: "bm_george", name: "George (英式)" },
  { id: "bm_lewis", name: "Lewis (英式)" },
  { id: "af_sky", name: "Sky" },
] as const;

// MiniMax中文音色选项
const chineseVoices = [
  { value: 'female-shaonv', label: '少女音色' },
  { value: 'male-qn-qingse', label: '青涩青年音色' },
  { value: 'male-qn-jingying', label: '精英青年音色' },
  { value: 'male-qn-badao', label: '霸道青年音色' },
  { value: 'male-qn-daxuesheng', label: '青年大学生音色' },
  { value: 'female-yujie', label: '御姐音色' },
  { value: 'female-chengshu', label: '成熟女性音色' },
  { value: 'female-tianmei', label: '甜美女性音色' },
  { value: 'presenter_male', label: '男性主持人' },
  { value: 'presenter_female', label: '女性主持人' },
  { value: 'audiobook_male_1', label: '男性有声书1' },
  { value: 'audiobook_male_2', label: '男性有声书2' },
  { value: 'audiobook_female_1', label: '女性有声书1' },
  { value: 'audiobook_female_2', label: '女性有声书2' },
  { value: 'male-qn-qingse-jingpin', label: '青涩青年音色-beta' },
  { value: 'male-qn-jingying-jingpin', label: '精英青年音色-beta' },
  { value: 'male-qn-badao-jingpin', label: '霸道青年音色-beta' },
  { value: 'male-qn-daxuesheng-jingpin', label: '青年大学生音色-beta' },
  { value: 'female-shaonv-jingpin', label: '少女音色-beta' },
  { value: 'female-yujie-jingpin', label: '御姐音色-beta' },
  { value: 'female-chengshu-jingpin', label: '成熟女性音色-beta' },
  { value: 'female-tianmei-jingpin', label: '甜美女性音色-beta' },
  { value: 'clever_boy', label: '聪明男童' },
  { value: 'cute_boy', label: '可爱男童' },
  { value: 'lovely_girl', label: '萌萌女童' },
  { value: 'cartoon_pig', label: '卡通猪小琪' },
  { value: 'bingjiao_didi', label: '病娇弟弟' },
  { value: 'junlang_nanyou', label: '俊朗男友' },
  { value: 'chunzhen_xuedi', label: '纯真学弟' },
  { value: 'lengdan_xiongzhang', label: '冷淡学长' },
  { value: 'badao_shaoye', label: '霸道少爷' },
  { value: 'tianxin_xiaoling', label: '甜心小玲' },
  { value: 'qiaopi_mengmei', label: '俏皮萌妹' },
  { value: 'wumei_yujie', label: '妩媚御姐' },
  { value: 'diadia_xuemei', label: '嗲嗲学妹' },
  { value: 'danya_xuejie', label: '淡雅学姐' },
];

// For storing newly generated effect results
interface GeneratedEffect {
  filePath: string;
  text: string;
  createdAt: string;
}

export default function Home() {
  // ======== 左侧状态 ========
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("zh");
  const [miniMaxVoice, setMiniMaxVoice] = useState("female-shaonv");
  const [kokoroVoice, setKokoroVoice] = useState("af_nicole");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generateMode, setGenerateMode] = useState<'single' | 'multiple'>('single');
  const [inputMode, setInputMode] = useState<'manual' | 'generate'>('generate');
  const [promptCount, setPromptCount] = useState(6);
  const [soundEffectCount, setSoundEffectCount] = useState(10);

  // ======== 右侧状态 ========
  const [soundEffectHistory, setSoundEffectHistory] = useState<SoundEffectHistoryItem[]>([]);
  const [isSoundEffectHistoryExpanded, setIsSoundEffectHistoryExpanded] = useState(false);
  const [generatingEffects, setGeneratingEffects] = useState<boolean[]>([]);
  const [isGeneratingAllEffects, setIsGeneratingAllEffects] = useState(false);
  const [isGeneratingSoundEffect, setIsGeneratingSoundEffect] = useState(false);
  const [suggestedSoundEffects, setSuggestedSoundEffects] = useState<string[]>([]);
  const [soundEffectResults, setSoundEffectResults] = useState<GeneratedEffect[]>([]);
  const [placementGuide, setPlacementGuide] = useState<string>("");
  const [isGeneratingPlacement, setIsGeneratingPlacement] = useState(false);

  const [prompts, setPrompts] = useState<Array<{ 
    description: string; 
    prompt: string; 
    position: string;
    style_tags?: string[];
    text_snippet?: string;
    importance?: string;
  }>>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadSoundEffectHistory();
    }
  }, [isClient]);

  const loadSoundEffectHistory = async () => {
    try {
      const response = await fetch('/api/sound-effects/history');
      if (!response.ok) {
        throw new Error('加载音效历史记录失败');
      }
      const data = await response.json();
      setSoundEffectHistory(data);
    } catch (error) {
      console.error('加载音效历史记录失败:', error);
      setSoundEffectHistory([]);
    }
  };

  const splitIntoParagraphs = (text: string): string[] => {
    return text
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };

  const generateAudioForParagraph = async (paragraph: string): Promise<any> => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: paragraph,
        voice: language === 'zh' ? miniMaxVoice : kokoroVoice,
        language
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "生成音频失败");
    }

    if (!data.output) {
      throw new Error("未能生成音频");
    }

    // 保存音频文件
    const formData = new FormData();
    formData.append('file', new Blob([Buffer.from(data.output, 'hex')], { type: 'audio/wav' }), data.fileName);
    formData.append('metadata', JSON.stringify({
      id: Date.now().toString(),
      timestamp: data.timestamp,
      text: data.text,
      voice: data.voice,
      fileName: data.fileName,
      language: data.language,
      type: data.type
    }));
    
    await fetch('/api/save-audio', {
      method: 'POST',
      body: formData
    });

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setAudioUrls([]);
    
    try {
      const paragraphs = splitIntoParagraphs(text);
      
      if (generateMode === 'single') {
        setProgress({ current: 0, total: 1 });
        const response = await generateAudioForParagraph(text);
        
        setAudioUrls([`/output/${response.fileName}`]);
        setProgress({ current: 1, total: 1 });
      } else {
        setProgress({ current: 0, total: paragraphs.length });
        const urls: string[] = [];
        for (let i = 0; i < paragraphs.length; i++) {
          const response = await generateAudioForParagraph(paragraphs[i]);
          
          urls.push(`/output/${response.fileName}`);
          setProgress({ current: i + 1, total: paragraphs.length });
        }
        setAudioUrls(urls);
      }
    } catch (err) {
      console.error("错误:", err);
      setError(err instanceof Error ? err.message : "生成语音失败，请重试");
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const renderAudioPlayers = () => {
    return (
      <div className="mt-4 space-y-4">
        {audioUrls.map((url, index) => (
          <div key={index} className="flex flex-col space-y-2">
            <div className="text-sm text-gray-500">
              段落 {index + 1}:
            </div>
            <audio
              controls
              className="w-full"
              src={url}
              onError={(e) => {
                console.error('音频加载错误:', e);
                const audio = e.target as HTMLAudioElement;
                console.log('音频URL:', audio.src);
              }}
            >
              您的浏览器不支持音频播放。
            </audio>
          </div>
        ))}
      </div>
    );
  };

  const generateStory = async () => {
    if (!topic) return;
    setIsGeneratingStory(true);
    setError("");
    setText("");
    setSuggestedSoundEffects([]);

    try {
      const response = await fetch("/api/story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, language }),
      });

      if (!response.ok) {
        throw new Error("生成故事失败");
      }

      const data = await response.json();
      setText(data.story);
    } catch (error) {
      console.error("生成故事错误:", error);
      setError("生成故事失败，请重试");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const generateSoundEffectSuggestions = async () => {
    if (!text) return;
    setIsGeneratingSoundEffect(true);
    setError("");
    setSuggestedSoundEffects([]);

    try {
      const response = await fetch("/api/sound-effects/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text, 
          language,
          count: soundEffectCount 
        }),
      });

      if (!response.ok) {
        throw new Error("生成音效建议失败");
      }

      const data = await response.json();
      setSuggestedSoundEffects(data.soundEffects);
      setGeneratingEffects(new Array(data.soundEffects.length).fill(false));
    } catch (error) {
      console.error("生成音效建议错误:", error);
      setError("生成音效建议失败，请重试");
    } finally {
      setIsGeneratingSoundEffect(false);
    }
  };

  const generateSoundEffect = async (index: number, prompt: string) => {
    setGeneratingEffects(prev => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
    setError("");

    try {
      const response = await fetch("/api/sound-effects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: null,
          prompt_influence: 0.3,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "生成音效失败");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error("生成音效失败");
      }

      const newItem: GeneratedEffect = {
        filePath: data.filePath,
        text: prompt,
        createdAt: new Date().toISOString()
      };
      setSoundEffectResults(prev => [...prev, newItem]);

      loadSoundEffectHistory();
      
      console.log('音效生成成功:', data.fileName);
    } catch (error) {
      console.error("生成音效时出错:", error);
      setError(error instanceof Error ? error.message : "生成音效失败");
    } finally {
      setGeneratingEffects(prev => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };

  const generateAllSoundEffects = async () => {
    setIsGeneratingAllEffects(true);
    setError("");

    try {
      const effectsToGenerate = [...suggestedSoundEffects];
      if (!effectsToGenerate.length) {
        throw new Error("当前没有可用的音效提示词");
      }

      const response = await fetch("/api/sound-effects/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effects: effectsToGenerate
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "批量生成音效失败");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error("批量生成音效失败");
      }

      if (data.errors && data.errors.length > 0) {
        console.warn('部分音效生成失败:', data.errors);
        setError(`${data.errors.length}个音效生成失败`);
      }

      if (data.results && Array.isArray(data.results)) {
        const newItems: GeneratedEffect[] = data.results.map((item: any) => ({
          filePath: item.filePath,
          text: item.text,
          createdAt: item.createdAt
        }));
        setSoundEffectResults(prev => [...prev, ...newItems]);
      }

      loadSoundEffectHistory();
      
      console.log('批量音效生成完成');
    } catch (error) {
      console.error("批量生成音效时出错:", error);
      setError(error instanceof Error ? error.message : "批量生成音效失败");
    } finally {
      setIsGeneratingAllEffects(false);
    }
  };

  const generatePlacementGuide = async () => {
    if (!text || !suggestedSoundEffects.length) return;
    setIsGeneratingPlacement(true);
    setError("");

    try {
      const response = await fetch("/api/sound-effects/placement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story: text,
          soundEffects: suggestedSoundEffects,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("生成音效位置建议失败");
      }

      const data = await response.json();
      setPlacementGuide(data.placementGuide);
    } catch (error) {
      console.error("生成音效位置建议错误:", error);
      setError("生成音效位置建议失败，请重试");
    } finally {
      setIsGeneratingPlacement(false);
    }
  };

  const downloadPlacementGuide = () => {
    if (!placementGuide) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sound-effects-placement-${timestamp}.md`;
    const content = `# 音效位置建议\n\n${placementGuide}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getVoiceName = (voiceId: string) => {
    return voices.find(v => v.id === voiceId)?.name || voiceId;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const generatePrompts = async () => {
    if (!text) return;
    
    setIsGeneratingPrompts(true);
    setError("");
    
    try {
      const response = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text,
          count: promptCount
        }),
      });

      if (!response.ok) {
        throw new Error("生成提示词失败");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setPrompts(data.prompts);
    } catch (err) {
      console.error("生成提示词错误:", err);
      setError(err instanceof Error ? err.message : "生成提示词失败，请重试");
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const generateMarkdown = () => {
    if (!prompts.length) return '';

    const content = [
      '# 绘本场景提示词',
      '\n## 故事文本',
      `\n${text}`,
      '\n## 场景提示词',
      ...prompts.map((item, index) => `
### 场景 ${index + 1}

**场景描述：**
${item.description}

**对应文本：**
${item.text_snippet || '无'}

**重要性：**
${item.importance || '未指定'} / 5

**提示词：**
\`\`\`
${item.prompt}
\`\`\`

**风格标签：**
${item.style_tags?.join(', ') || '无'}

---`)
    ];

    return content.join('\n');
  };

  const downloadMarkdown = () => {
    const content = generateMarkdown();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `绘本场景提示词-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-center text-white mb-8">
              AI 故事配音与绘图助手
            </h1>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* 输入模式选择 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-white mb-2">
                    输入模式
                  </label>
                  <select
                    value={inputMode}
                    onChange={(e) => setInputMode(e.target.value as 'manual' | 'generate')}
                    className="block w-full px-4 py-2.5 bg-white/90 backdrop-blur border-0 text-gray-900 rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="manual">手动输入</option>
                    <option value="generate">AI生成故事</option>
                  </select>
                </div>

                {/* 语言选择 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-white mb-2">
                    语言
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white/90 backdrop-blur border-0 text-gray-900 rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                {/* 音色选择 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-white mb-2">
                    音色
                  </label>
                  {language === 'zh' ? (
                    <select
                      value={miniMaxVoice}
                      onChange={(e) => setMiniMaxVoice(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-white/90 backdrop-blur border-0 text-gray-900 rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                    >
                      {chineseVoices.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={kokoroVoice}
                      onChange={(e) => setKokoroVoice(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-white/90 backdrop-blur border-0 text-gray-900 rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                    >
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 故事主题输入 */}
              {inputMode === 'generate' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">
                    故事主题
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="输入故事主题..."
                      className="block w-full px-4 py-2.5 bg-white/90 backdrop-blur border-0 text-gray-900 rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={generateStory}
                      disabled={isGeneratingStory || !topic}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGeneratingStory ? "生成中..." : "生成故事"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* 左侧：输入区域 */}
            <div className="w-full">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 要转换的文本 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    要转换的文本
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="输入要转换的文本..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 生成模式 + 提交 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成模式
                  </label>
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="single"
                        checked={generateMode === 'single'}
                        onChange={(e) => setGenerateMode(e.target.value as 'single' | 'multiple')}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-700">合并为单个音频</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="multiple"
                        checked={generateMode === 'multiple'}
                        onChange={(e) => setGenerateMode(e.target.value as 'single' | 'multiple')}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-700">每段单独生成</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-6"
                  >
                    {isLoading 
                      ? `生成中... (${progress.current}/${progress.total})` 
                      : "生成语音"}
                  </button>

                  {/* 生成的语音在页面显示 */}
                  {audioUrls.length > 0 && (
                    <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                      <h2 className="text-xl font-semibold mb-4">生成的语音：</h2>
                      {renderAudioPlayers()}
                    </div>
                  )}
                </div>
              </form>

              {/* 按钮组 */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* 生成提示词按钮 */}
                <button
                  onClick={generatePrompts}
                  disabled={!text || isGeneratingPrompts}
                  className={`px-4 py-2 rounded-lg ${
                    !text || isGeneratingPrompts
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  } text-white font-medium transition-colors duration-200`}
                >
                  {isGeneratingPrompts ? "生成提示词中..." : "生成绘图提示词"}
                </button>

                {/* 生成音效建议按钮 */}
                <button
                  type="button"
                  onClick={generateSoundEffectSuggestions}
                  disabled={isGeneratingStory || !text}
                  className={`px-4 py-2 rounded-lg ${
                    !text || isGeneratingStory
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white font-medium transition-colors duration-200`}
                >
                  生成音效建议
                </button>
              </div>

              {/* 数量选择控件组 */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {/* 提示词数量选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成图片数量：
                  </label>
                  <select
                    value={promptCount}
                    onChange={(e) => setPromptCount(Number(e.target.value))}
                    className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}张</option>
                    ))}
                  </select>
                </div>

                {/* 音效建议数量选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成音效建议数量：
                  </label>
                  <select
                    value={soundEffectCount}
                    onChange={(e) => setSoundEffectCount(Number(e.target.value))}
                    className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}个</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 显示提示词 */}
              {prompts.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">绘图提示词建议：</h2>
                    <button
                      onClick={downloadMarkdown}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      下载Markdown文件
                    </button>
                  </div>
                  <div className="grid gap-6">
                    {prompts.map((item, index) => (
                      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">场景 {index + 1}</h3>
                            {item.importance && (
                              <span className="px-3 py-1 text-sm font-medium text-purple-700 bg-white rounded-full">
                                重要性: {item.importance}/5
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                          {/* 场景描述 */}
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-purple-800 mb-2">场景描述：</h4>
                            <p className="text-gray-700">{item.description}</p>
                          </div>
                          
                          {/* 对应文本 */}
                          {item.text_snippet && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-blue-800 mb-2">对应文本：</h4>
                              <p className="text-gray-700 italic">{item.text_snippet}</p>
                            </div>
                          )}
                          
                          {/* 提示词 */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-gray-800">提示词：</h4>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.prompt);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                复制提示词
                              </button>
                            </div>
                            <div className="mt-2">
                              <div 
                                className="font-mono text-sm bg-white p-4 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap"
                                style={{ 
                                  maxHeight: '6em',
                                  overflowY: 'auto'
                                }}
                              >
                                {item.prompt}
                              </div>
                            </div>
                          </div>
                          
                          {/* 风格标签 */}
                          {item.style_tags && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {item.style_tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：音效生成 */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
          {suggestedSoundEffects.length > 0 && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">建议的音效：</h3>
                <button
                  type="button"
                  onClick={generateAllSoundEffects}
                  disabled={isGeneratingAllEffects}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isGeneratingAllEffects ? '生成中...' : '一键生成所有音效'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {suggestedSoundEffects.map((effect, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                  >
                    <span className="text-sm text-gray-700 flex-1 mr-4">{effect}</span>
                    <button
                      type="button"
                      onClick={() => generateSoundEffect(index, effect)}
                      disabled={generatingEffects[index] || isGeneratingAllEffects}
                      className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {generatingEffects[index] ? '生成中...' : '生成音效'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {soundEffectResults.length > 0 && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">生成的音效：</h3>
              <div className="space-y-4">
                {soundEffectResults.map((item, i) => (
                  <div key={i} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">提示词: {item.text}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      生成时间: {formatDate(item.createdAt)}
                    </p>
                    <audio controls className="w-full">
                      <source src={item.filePath} type="audio/mpeg" />
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                ))}
              </div>
            </div>
          )}

          {soundEffectHistory.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                className="flex items-center justify-between cursor-pointer w-full bg-gray-100 p-3 rounded-lg hover:bg-gray-200"
                onClick={() => setIsSoundEffectHistoryExpanded(!isSoundEffectHistoryExpanded)}
              >
                <h2 className="text-xl font-semibold">已生成的音效历史</h2>
                <span className="text-gray-500">
                  {isSoundEffectHistoryExpanded ? '收起' : '展开'}
                </span>
              </button>

              {isSoundEffectHistoryExpanded && (
                <div className="space-y-4 mt-4">
                  {soundEffectHistory.map((item) => (
                    <div key={item.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm text-gray-700 mb-1">提示词: {item.text}</p>
                          <p className="text-xs text-gray-500">
                            生成时间: {new Date(item.createdAt).toLocaleString()}
                          </p>
                          {item.duration_seconds && (
                            <p className="text-xs text-gray-500">
                              时长: {item.duration_seconds}秒
                            </p>
                          )}
                        </div>
                        <a
                          href={item.filePath}
                          download
                          className="text-blue-500 hover:text-blue-600 text-sm"
                        >
                          下载
                        </a>
                      </div>
                      <audio controls className="w-full">
                        <source src={item.filePath} type="audio/mpeg" />
                        您的浏览器不支持音频播放
                      </audio>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {suggestedSoundEffects.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={generatePlacementGuide}
                disabled={isGeneratingPlacement || !text}
                className="w-full bg-purple-600 text-white p-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingPlacement ? "生成音效位置建议中..." : "生成音效位置建议"}
              </button>
            </div>
          )}

          {placementGuide && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">音效位置建议：</h3>
                <button
                  type="button"
                  onClick={downloadPlacementGuide}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  下载为 Markdown
                </button>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown 
                  className="whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200 text-sm"
                >
                  {placementGuide}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}