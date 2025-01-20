import Replicate from "replicate";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text, language, voice } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: language === 'zh' ? "文本不能为空" : "Text is required" },
        { status: 400 }
      );
    }

    // 如果是中文，使用MiniMax TTS API
    if (language === 'zh') {
      if (!process.env.MINIMAX_API_KEY || !process.env.MINIMAX_GROUP_ID) {
        console.error('缺少必要的环境变量:', {
          hasMiniMaxKey: !!process.env.MINIMAX_API_KEY,
          hasGroupId: !!process.env.MINIMAX_GROUP_ID
        });
        return NextResponse.json(
          { error: "缺少 MINIMAX_API_KEY 或 MINIMAX_GROUP_ID" },
          { status: 500 }
        );
      }

      try {
        console.log('准备调用MiniMax TTS API，文本长度:', text.length);
        console.log('使用音色:', voice);
        
        const apiUrl = `https://api.minimax.chat/v1/t2a_v2?GroupId=${process.env.MINIMAX_GROUP_ID}`;
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
          },
          body: JSON.stringify({
            model: "speech-01-turbo",
            text: text,
            stream: false,
            voice_setting: {
              voice_id: voice,
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
          })
        });

        console.log('MiniMax API响应状态:', response.status);
        console.log('MiniMax API响应头:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`MiniMax API请求失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('MiniMax API响应内容:', JSON.stringify(data).substring(0, 100) + '...');

        // 检查API响应状态
        if (data.base_resp?.status_code !== 0) {
          console.error('MiniMax API返回错误:', data.base_resp);
          throw new Error(data.base_resp?.status_msg || 'API调用失败');
        }

        // 检查音频数据
        if (!data.data?.audio) {
          console.error('无效的API响应:', data);
          throw new Error('API返回的数据格式无效');
        }

        console.log('成功获取音频数据');

        const timestamp = new Date().toISOString();
        const fileName = `${timestamp.replace(/[:]/g, '-')}-${text.substring(0, 30).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')}.wav`;

        return NextResponse.json({
          output: data.data.audio,
          timestamp,
          text,
          voice,
          fileName,
          language: 'zh',
          type: 'minimax'
        });
      } catch (error) {
        console.error('MiniMax TTS API错误:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : '生成语音失败' },
          { status: 500 }
        );
      }
    }

    // 如果是英文，使用Kokoro API
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "Missing Replicate API token" },
        { status: 500 }
      );
    }

    // 调用 Kokoro API 生成语音
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      },
      body: JSON.stringify({
        version: "dfdf537ba482b029e0a761699e6f55e9162cfd159270bfe0e44857caa5f275a6",
        input: {
          text,
          voice,
          speed: 1.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Kokoro API请求失败: ${response.status}`);
    }

    const result = await response.json();
    console.log('Kokoro API响应:', result);

    // 等待生成完成
    const predictionId = result.id;
    let prediction = result;
    
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );
      prediction = await statusResponse.json();
      console.log('Kokoro API状态:', prediction.status);
    }

    if (prediction.status === 'failed') {
      throw new Error('音频生成失败: ' + prediction.error);
    }

    // 下载音频文件
    const audioUrl = prediction.output;
    console.log('音频文件URL:', audioUrl);
    
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('下载音频文件失败');
    }

    // 将音频数据转换为base64
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('hex');

    const timestamp = new Date().toISOString();
    const fileName = `${timestamp.replace(/[:]/g, '-')}-${text.substring(0, 30).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')}.wav`;

    return NextResponse.json({
      output: audioBase64,
      timestamp,
      text,
      voice,
      fileName,
      language: 'en',
      type: 'kokoro'
    });
  } catch (error) {
    console.error("生成语音错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成语音失败，请重试" },
      { status: 500 }
    );
  }
}
