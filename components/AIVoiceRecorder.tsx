import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from './Icon';
import { iflytekRecorder } from '../lib/iflytek';

// 声波条组件
const WaveBar: React.FC<{ height: number; delay: number; width?: number }> = ({ height, delay, width = 2 }) => (
  <div
    className="bg-gradient-to-t from-red-400 to-red-500 rounded-full"
    style={{
      height: `${height}%`,
      width: `${width}px`,
      animationDelay: `${delay}ms`,
      transition: 'height 40ms ease-out',
    }}
  />
);

// 声波组件（根据音量动态显示，更细粒度）
const SoundWaves: React.FC<{ analyser: AnalyserNode | null }> = ({ analyser }) => {
  const [bars, setBars] = useState<number[]>(Array(13).fill(15));
  const animationRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    analyserRef.current = analyser;
  }, [analyser]);

  useEffect(() => {
    if (!analyser) {
      // 当停止录音时，重置状态
      setBars(Array(13).fill(15));
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const bufferLength = analyser.frequencyBinCount;

    let lastUpdate = 0;
    const updateBars = (timestamp: number) => {
      // 节流：每16ms更新一次（约60fps）
      if (timestamp - lastUpdate < 16) {
        animationRef.current = requestAnimationFrame(updateBars);
        return;
      }
      lastUpdate = timestamp;

      const currentAnalyser = analyserRef.current;
      if (!currentAnalyser) return;

      currentAnalyser.getByteFrequencyData(dataArray);

      const now = Date.now();

      const newBars = Array.from({ length: 13 }, (_, i) => {
        // 计算当前条对应的频段索引
        const segIndex = Math.floor((i / 13) * bufferLength);
        const nextSegIndex = Math.floor(((i + 1) / 13) * bufferLength);

        // 获取该频段的平均值
        let sum = 0;
        let count = 0;
        for (let j = segIndex; j < nextSegIndex && j < bufferLength; j++) {
          sum += dataArray[j];
          count++;
        }
        const average = count > 0 ? sum / count : 0;

        // 基础高度映射（使用对数刻度让人声更明显）
        const normalizedHeight = Math.max(12, Math.min(100, Math.pow(average / 255, 0.7) * 100));

        // 每个条独立的相位偏移，更细致的变化
        const phase1 = Math.sin(now / 150 + i * 0.8) * 10;
        const phase2 = Math.sin(now / 280 + i * 1.5) * 5;

        return Math.max(10, Math.min(100, normalizedHeight + phase1 + phase2));
      });

      setBars(newBars);
      animationRef.current = requestAnimationFrame(updateBars);
    };

    animationRef.current = requestAnimationFrame(updateBars);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  return (
    <div className="flex items-center gap-0.5 h-14">
      {bars.map((height, i) => (
        <WaveBar key={i} height={height} delay={i * 20} width={3} />
      ))}
    </div>
  );
};

interface AIVoiceRecorderProps {
  onConfirm: (text: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const AIVoiceRecorder: React.FC<AIVoiceRecorderProps> = ({
  onConfirm,
  onCancel,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [tempText, setTempText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const textHistoryRef = useRef<string[]>([]);
  const lastTextRef = useRef<string>('');

  // 开始录音
  const startRecording = useCallback(async () => {
    if (disabled) return;

    setTempText('');
    setShowActions(false);
    setError(null);
    textHistoryRef.current = [];
    lastTextRef.current = '';

    try {
      await iflytekRecorder.start({
        onResult: (text, isFinal) => {
          const trimmedText = text.trim().replace(/^[,，.。]+/, '');
          if (!trimmedText) return;

          // 获取当前显示的文本
          const currentText = textHistoryRef.current.length > 0
            ? textHistoryRef.current[textHistoryRef.current.length - 1]
            : '';

          // 如果完全相同，不更新（科大讯飞累积返回）
          if (trimmedText === currentText || trimmedText === lastTextRef.current) {
            return;
          }

          let finalText: string;

          if (!currentText) {
            // 没有任何历史，直接用新文本
            finalText = trimmedText;
          } else {
            // 已有历史，找出与当前文本的最长公共前缀
            let commonLength = 0;
            const minLen = Math.min(currentText.length, trimmedText.length);
            for (let i = 0; i < minLen; i++) {
              if (currentText[i] === trimmedText[i]) {
                commonLength++;
              } else {
                break;
              }
            }

            // 公共前缀 >= 2，认为是同一句话的修正版
            if (commonLength >= 2) {
              const newPart = trimmedText.substring(commonLength).trim();
              if (newPart) {
                finalText = `${currentText} ${newPart}`;
              } else {
                finalText = trimmedText;
              }
            } else {
              // 没有足够公共前缀，可能是真正的新句子
              if (trimmedText.includes(currentText)) {
                finalText = trimmedText;
              } else {
                // 真正的新句子，追加
                finalText = `${currentText} ${trimmedText}`;
              }
            }
          }

          // 只有当最终文本确实变化时才更新
          if (finalText && finalText !== currentText) {
            textHistoryRef.current.push(finalText);
            lastTextRef.current = finalText;
            setTempText(finalText);
          }
        },
        onError: (err) => {
          console.error('Recording error:', err);
          setError(err);
          setIsRecording(false);
          setAnalyser(null);
        },
        onStart: () => {
          setIsRecording(true);
          setError(null);
          // 获取分析器用于声波显示
          const a = iflytekRecorder.getAnalyser();
          if (a) {
            setAnalyser(a);
          }
        },
        onEnd: () => {
          setIsRecording(false);
          setAnalyser(null);
          // 录音结束时显示确认按钮
          if (tempText || lastTextRef.current) {
            setShowActions(true);
          }
        },
      });
    } catch (error) {
      console.error('Start recording error:', error);
      setError('无法启动录音，请检查麦克风权限');
      setIsRecording(false);
    }
  }, [disabled, tempText]);

  // 停止录音
  const stopRecording = useCallback(() => {
    iflytekRecorder.stop();
    setIsRecording(false);
    if (tempText || lastTextRef.current) {
      setShowActions(true);
    }
  }, [tempText]);

  // 确认发送
  const handleConfirm = useCallback(() => {
    const textToSend = tempText || lastTextRef.current;
    if (textToSend) {
      onConfirm(textToSend);
    }
    setTempText('');
    setShowActions(false);
    setError(null);
    textHistoryRef.current = [];
    lastTextRef.current = '';
  }, [tempText, onConfirm]);

  // 取消重录
  const handleCancel = useCallback(() => {
    setTempText('');
    setShowActions(false);
    setError(null);
    textHistoryRef.current = [];
    lastTextRef.current = '';
    onCancel();
  }, [onCancel]);

  return (
    <div className="flex flex-col items-center">
      {/* 临时文本显示区域 */}
      {tempText && (
        <div className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-700 leading-relaxed flex-1">{tempText}</p>

            {/* 确认/取消按钮 */}
            {showActions && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleConfirm}
                  className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 active:scale-95 transition-all shadow-sm"
                >
                  <Icon name="Check" size={18} />
                </button>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-sm"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 录音按钮 + 声波 */}
      <div className="flex items-center gap-4">
        {/* 左侧声波 */}
        <div className={`transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
          <SoundWaves analyser={analyser} />
        </div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg
            ${disabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : isRecording
                ? 'bg-red-50 text-red-600 border-4 border-red-200 animate-pulse'
                : 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:opacity-90 active:scale-95'
            }
          `}
        >
          {isRecording ? (
            <div className="w-6 h-6 rounded-sm bg-red-500" />
          ) : (
            <Icon name="Mic" size={28} className="text-white" />
          )}
        </button>

        {/* 右侧声波 */}
        <div className={`transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
          <SoundWaves analyser={analyser} />
        </div>
      </div>

      {/* 提示文字 */}
      <span className={`text-xs mt-3 ${isRecording ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
        {disabled ? '录音不可用' : isRecording ? '点击结束' : '开始录音'}
      </span>

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
};
