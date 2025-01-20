import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: language === 'zh' ? "文本不能为空" : "Text cannot be empty" },
        { status: 400 }
      );
    }

    if (language === 'zh') {
      // 使用 MiniMax TTS API
      if (!process.env.MINIMAX_API_KEY || !process.env.MINIMAX_GROUP_ID) {
        return NextResponse.json(
          { error: "缺少 MINIMAX_API_KEY 或 MINIMAX_GROUP_ID" },
          { status: 500 }
        );
      }

      const response = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${process.env.MINIMAX_GROUP_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: "speech-01-turbo",
          text,
          stream: false,
          voice_setting: {
            voice_id: "female-shaonv",
            speed: 1,
            vol: 1,
            pitch: 0,
            emotion: "neutral"
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "wav",
            channel: 1
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`MiniMax API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json({ output: data.data.audio });
    } else {
      // 使用 Replicate Kokoro API
      if (!process.env.REPLICATE_API_TOKEN) {
        return NextResponse.json(
          { error: "Missing REPLICATE_API_TOKEN" },
          { status: 500 }
        );
      }

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
        body: JSON.stringify({
          version: "2b017d9b67edd2ee618519c49a38f47db650ed11c8d057cee68b0dac76c9823e",
          input: {
            text,
            voice_preset: "v2/en_speaker_9",
            top_k: 50,
            top_p: 0.6,
            temperature: 0.6,
            decoder_iterations: 30,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Replicate API request failed: ${response.statusText}`);
      }

      const prediction = await response.json();
      return NextResponse.json({ output: prediction.urls.get });
    }
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: language === 'zh' ? "生成语音失败，请重试" : "Failed to generate speech, please try again" },
      { status: 500 }
    );
  }
}
