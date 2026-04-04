// 科大讯飞中英识别大模型实时语音转写服务
// 使用 Web Crypto API 进行签名

const APPID = 'd28be69f';
const APISECRET = 'MjEyM2Q4NTRkYjVkMDgwOTJhZDgxNGY0';
const APIKEY = '82c03bf4702c77087d8025eca561754a';
const WS_URL = 'wss://iat.xf-yun.com/v1';

// 将字符串转换为 ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  return encoded.buffer as ArrayBuffer;
}

// ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 使用 Web Crypto API 生成 HMAC-SHA256 签名
async function hmacSha256(key: string, data: string): Promise<string> {
  const keyBuffer = stringToArrayBuffer(key);
  const dataBuffer = stringToArrayBuffer(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return arrayBufferToBase64(signature);
}

// 生成 RFC1123 格式的 UTC 时间
function getRFC1123Date(): string {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[now.getUTCDay()];
  const day = String(now.getUTCDate()).padStart(2, '0');
  const month = months[now.getUTCMonth()];
  const year = now.getUTCFullYear();
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');

  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
}

// 生成 WebSocket URL (新版本鉴权方式)
async function generateWsUrl(): Promise<string> {
  const host = 'iat.xf-yun.com';
  const date = getRFC1123Date();

  console.log('========== iFlytek 鉴权调试 ==========');
  console.log('APPID:', APPID);
  console.log('APIKEY:', APIKEY);
  console.log('APISECRET:', APISECRET);
  console.log('DATE:', date);

  // 1. 生成 signature_origin
  const requestLine = 'GET /v1 HTTP/1.1';
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;

  console.log('Signature origin:\n', signatureOrigin);

  // 2. 使用 HMAC-SHA256 签名
  const signature = await hmacSha256(APISECRET, signatureOrigin);
  console.log('Signature (base64):', signature);

  // 3. 生成 authorization_origin
  const authorizationOrigin = `api_key="${APIKEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  console.log('Authorization origin:\n', authorizationOrigin);

  // 4. Base64 编码得到 authorization
  const authorization = btoa(authorizationOrigin);
  console.log('Authorization (base64):', authorization);

  // 5. 拼接 URL
  const wsUrl = `${WS_URL}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
  console.log('Final WebSocket URL:', wsUrl);
  console.log('=====================================');

  return wsUrl;
}

// 解析转写结果 (新版本返回格式)
function parseResult(data: any): string {
  try {
    console.log('parseResult input:', JSON.stringify(data));

    const header = data.header;
    const payload = data.payload;

    // 检查错误
    if (header?.code !== 0) {
      console.error('iFlytek error:', header?.code, header?.message);
      return '';
    }

    // 获取识别结果
    const result = payload?.result;
    if (!result?.text) {
      console.log('No text in result, status:', result?.status);
      return '';
    }

    // text 是 base64 编码的 JSON，需要正确处理 UTF-8
    let textJson: string;
    try {
      // 使用 TextDecoder 正确解码 UTF-8 字符
      const binaryString = atob(result.text);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      textJson = new TextDecoder('utf-8').decode(bytes);
      console.log('Base64 decoded text:', textJson);
    } catch (e) {
      console.error('Decode error:', e);
      return '';
    }

    // 尝试解析为 JSON
    let textData: any;
    try {
      textData = JSON.parse(textJson);
      console.log('Parsed JSON:', JSON.stringify(textData));
    } catch (e) {
      // 如果不是 JSON，直接返回原始文本
      console.log('Not JSON, returning raw text');
      return textJson;
    }

    // 解析识别文本
    const ws = textData.ws || [];
    const words = ws.map((w: any) => {
      const cw = w.cw || [];
      return cw.map((c: any) => c.w).join('');
    }).join('');

    console.log('Parsed words:', words);
    return words;
  } catch (e) {
    console.error('Parse result error:', e);
  }
  return '';
}

export interface IflytekCallbacks {
  onResult?: (text: string, isFinal: boolean, segId?: number) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class IflytekRecorder {
  private ws: WebSocket | null = null;
  private audioStream: MediaStream | null = null;
  private callbacks: IflytekCallbacks = {};
  private isConnected = false;
  private sessionId: string | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private wsUrl: string = '';
  private seq: number = 0; // 消息序号

  // 获取音频分析器（用于波形可视化）
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  async start(callbacks: IflytekCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.seq = 0;

    console.log('========== IflytekRecorder.start() 开始 ==========');

    try {
      // 1. 先生成 WebSocket URL
      console.log('Step 1: 生成 WebSocket URL...');
      this.wsUrl = await generateWsUrl();
      console.log('Step 1 完成, URL:', this.wsUrl);

      // 2. 获取麦克风权限
      console.log('Step 2: 获取麦克风权限...');
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 3. 设置音频分析器（用于波形可视化）和音频处理
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.audioStream);

      // 创建分析器用于波形显示
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      // 创建 ScriptProcessor 直接捕获 PCM 数据
      const bufferSize = 1024;
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);

        // 转换为 16 位 PCM
        const pcmData = this.floatTo16BitPCM(inputData);

        // 发送到服务器
        this.sendAudioData(pcmData);
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      // 4. 连接 WebSocket
      console.log('Step 3: 连接 WebSocket...');
      this.connectWebSocket();
      console.log('Step 3 调用完成');

      this.callbacks.onStart?.();
      console.log('IflytekRecorder.start() 完成');
    } catch (error) {
      console.error('========== IflytekRecorder.start() 异常 ==========');
      console.error('Error:', error);
      console.error('================================================');
      this.callbacks.onError?.('无法获取麦克风权限');
      throw error;
    }
  }

  // 将 Float32 转换为 16 位 PCM
  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const length = float32Array.length;
    const buffer = new ArrayBuffer(length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return buffer;
  }

  // 发送音频数据 (新版本 JSON 格式)
  private sendAudioData(pcmData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.seq++;
      const base64Audio = arrayBufferToBase64(pcmData);

      // 确定状态
      let status: number;
      if (this.seq === 1) {
        status = 0; // 首帧
      } else {
        status = 1; // 中间帧
      }

      // 构建请求 JSON
      const requestData: any = {
        header: {
          app_id: APPID,
          res_id: 'hot_words',
          status: status,
        },
        payload: {
          audio: {
            encoding: 'raw',
            sample_rate: 16000,
            channels: 1,
            bit_depth: 16,
            seq: this.seq,
            status: status,
            audio: base64Audio,
          },
        },
      };

      // 首帧需要包含 parameter
      if (this.seq === 1) {
        requestData.parameter = {
          iat: {
            domain: 'slm',
            language: 'zh_cn',
            accent: 'mandarin',
            eos: 6000,
            vinfo: 1,
            // 关闭动态修正，避免重复显示
            // dwa: 'wpgs',
            result: {
              encoding: 'utf8',
              compress: 'raw',
              format: 'json',
            },
          },
        };
      }

      this.ws.send(JSON.stringify(requestData));
      // console.log('Sent audio frame:', this.seq, 'status:', status);
    } catch (e) {
      console.error('Send audio error:', e);
    }
  }

  private connectWebSocket(): void {
    console.log('========== WebSocket 连接调试 ==========');
    console.log('Connecting to:', this.wsUrl);
    console.log('WebSocket state before connect:', this.ws?.readyState);

    this.ws = new WebSocket(this.wsUrl);

    console.log('WebSocket created, readyState:', this.ws.readyState);

    this.ws.onopen = () => {
      console.log('WebSocket onopen fired - CONNECTED!');
      console.log('WebSocket readyState:', this.ws?.readyState);
      this.isConnected = true;
    };

    this.ws.onmessage = (event) => {
      console.log('WebSocket onmessage received, data:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message parsed:', JSON.stringify(data));

        // 检查错误
        if (data.header?.code !== 0) {
          const errorMsg = `错误码${data.header?.code}: ${data.header?.message}`;
          console.error('iFlytek error:', errorMsg);
          this.callbacks.onError?.(errorMsg);
          return;
        }

        // 保存 sessionId
        if (data.header?.sid) {
          this.sessionId = data.header.sid;
        }

        const status = data.header?.status;
        const result = data.payload?.result;

        if (result?.text) {
          const text = parseResult(data);
          if (text) {
            // status = 2 表示最后一帧
            const isFinal = status === 2;
            this.callbacks.onResult?.(text, isFinal, this.seq);
          }
        }

        // 如果是最后一帧，结束会话
        if (status === 2) {
          console.log('Recognition completed');
        }
      } catch (e) {
        console.error('Parse message error:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('========== WebSocket onerror ==========');
      console.error('WebSocket error event:', error);
      console.error('WebSocket readyState at error:', this.ws?.readyState);
      console.error('WebSocket URL:', this.ws?.url);
      console.error('======================================');
      this.callbacks.onError?.('WebSocket连接失败，请检查网络或API配置');
    };

    this.ws.onclose = (event) => {
      console.log('========== WebSocket onclose ==========');
      console.log('WebSocket closed, code:', event.code, 'reason:', event.reason);
      console.log('WebSocket readyState at close:', this.ws?.readyState);
      console.log('======================================');
      this.isConnected = false;
    };
  }

  stop(): void {
    // 发送结束帧
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.seq++;
      const endFrame = {
        header: {
          app_id: APPID,
          res_id: 'hot_words',
          status: 2,
        },
        payload: {
          audio: {
            encoding: 'raw',
            sample_rate: 16000,
            channels: 1,
            bit_depth: 16,
            seq: this.seq,
            status: 2,
            audio: '',
          },
        },
      };
      this.ws.send(JSON.stringify(endFrame));
    }

    // 关闭 WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // 断开 ScriptProcessor
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    // 关闭音频流
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.isConnected = false;
    this.sessionId = null;
    this.seq = 0;

    this.callbacks.onEnd?.();
  }

  isRecording(): boolean {
    return this.scriptProcessor !== null && this.audioContext !== null;
  }
}

// 导出单例
export const iflytekRecorder = new IflytekRecorder();
