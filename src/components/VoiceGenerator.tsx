'use client';

import { useState, useEffect } from "react";

interface HistoryItem {
  id: string;
  timestamp: string;
  text: string;
  voice: string;
  fileName: string;
  filePath: string;
}

const voices = [
  { id: "af", name: "默认 (Bella & Sarah 混合)" },
  { id: "af_bella", name: "Bella" },
  { id: "af_sarah", name: "Sarah" },
  { id: "am_adam", name: "Adam" },
  { id: "am_michael", name: "Michael" },
  { id: "bf_emma", name: "Emma (英式)" },
  { id: "bf_isabella", name: "Isabella (英式)" },
  { id: "bm_george", name: "George (英式)" },
  { id: "bm_lewis", name: "Lewis (英式)" },
  { id: "af_nicole", name: "Nicole" },
  { id: "af_sky", name: "Sky" },
] as const;

export function VoiceGenerator() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<string>("af");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // 加载历史记录
  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        console.error('Failed to load history:', await response.text());
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // 将文本分成段落
  const splitIntoParagraphs = (text: string): string[] => {
    return text
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };

  // 生成单个段落的音频
  const generateAudioForParagraph = async (paragraph: string): Promise<string> => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: paragraph, voice }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "生成音频失败");
    }

    if (!data.output) {
      throw new Error("未能生成音频");
    }

    // 保存音频文件
    const saveResponse = await fetch("/api/save-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioUrl: data.output,
        text: paragraph,
        voice,
      }),
    });

    if (!saveResponse.ok) {
      throw new Error("保存音频失败");
    }

    return data.output;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setAudioUrls([]);
    
    try {
      const paragraphs = splitIntoParagraphs(text);
      setProgress({ current: 0, total: paragraphs.length });

      const urls = [];
      for (let i = 0; i < paragraphs.length; i++) {
        const url = await generateAudioForParagraph(paragraphs[i]);
        urls.push(url);
        setProgress({ current: i + 1, total: paragraphs.length });
      }

      setAudioUrls(urls);
      
      // 重新加载历史记录
      await loadHistory();
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "生成音频失败，请重试");
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左侧：生成表单 */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
            <h1 className="text-3xl font-bold text-center text-gray-800">Kokoro 语音生成</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择声音
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入文本（每个段落将单独生成音频）
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入要转换为语音的文本，用空行分隔不同段落..."
                  rows={6}
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading 
                  ? `生成中... (${progress.current}/${progress.total})` 
                  : "生成语音"}
              </button>
            </form>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {audioUrls.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">生成的语音：</h2>
                {audioUrls.map((url, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">段落 {index + 1}:</p>
                    <audio controls className="w-full">
                      <source src={url} type="audio/wav" />
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：历史记录 */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">历史记录</h2>
            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-500">
                        {formatDate(item.timestamp)}
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {getVoiceName(item.voice)}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-2">{item.text}</p>
                    <audio controls className="w-full">
                      <source src={item.filePath} type="audio/wav" />
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无历史记录</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
