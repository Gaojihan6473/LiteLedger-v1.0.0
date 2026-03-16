import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';
import { useStore } from '../store';
import { iflytekRecorder } from '../lib/iflytek';
import { analyzeTransaction, ParsedTransaction } from '../lib/minimax';
import { TransactionType } from '../types';

interface AIVoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    type: TransactionType;
    amount: string;
    date: string;
    categoryId: string;
    subCategoryId?: string;
    channelId: string;           // 支出/收入时的账户
    fromChannelId?: string;      // 转账时的转出账户
    toChannelId?: string;        // 转账时的转入账户
    note: string;
  }) => void;
}

export const AIVoiceRecordingModal: React.FC<AIVoiceRecordingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { categories, channels } = useStore();

  const [isRecording, setIsRecording] = useState(false);
  const [audioText, setAudioText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const textHistoryRef = useRef<string[]>([]); // 保存历史文本列表

  // 启动录音
  const startRecording = useCallback(async () => {
    setError(null);
    setAudioText('');

    try {
      await iflytekRecorder.start({
        onResult: (text, isFinal) => {
          const trimmedText = text.trim().replace(/^[,，.。]+/, '');
          if (!trimmedText) return;

          console.log('New text:', trimmedText);

          // 获取当前显示的文本（最新的一条）
          const currentText = textHistoryRef.current.length > 0
            ? textHistoryRef.current[textHistoryRef.current.length - 1]
            : '';

          // 如果完全相同，不更新（科大讯飞累积返回）
          if (trimmedText === currentText) {
            return;
          }

          let finalText: string;

          if (!currentText) {
            // 没有任何历史，直接用新文本
            finalText = trimmedText;
          } else {
            // 已有历史，找出与当前文本的最长公共前缀
            // 从头开始逐字符比较
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
              // 取新文本中公共前缀之后的部分作为新增内容
              const newPart = trimmedText.substring(commonLength).trim();
              if (newPart) {
                finalText = `${currentText} ${newPart}`;
              } else {
                finalText = trimmedText;
              }
            } else {
              // 没有足够公共前缀，可能是真正的新句子
              // 检查新文本是否包含当前文本的任意部分
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
            setAudioText(finalText);
            console.log('Updated text:', finalText);
          }
        },
        onError: (err) => {
          setError(err);
          setIsRecording(false);
        },
        onStart: () => {
          setIsRecording(true);
        },
        onEnd: () => {
          setIsRecording(false);
        },
      });
    } catch (err) {
      setError('无法启动录音，请检查麦克风权限');
      setIsRecording(false);
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(() => {
    iflytekRecorder.stop();
    setIsRecording(false);
  }, []);

  // 重新录音
  const handleReRecord = useCallback(() => {
    if (isRecording) {
      iflytekRecorder.stop();
    }
    setAudioText('');
    textHistoryRef.current = []; // 清理历史文本
    setError(null);
    setTimeout(() => {
      startRecording();
    }, 100);
  }, [startRecording, isRecording]);

  // 确认记账
  const handleConfirm = async () => {
    if (!audioText.trim()) {
      setError('请先录音或输入记账内容');
      return;
    }

    // 如果正在录音，先停止
    if (isRecording) {
      iflytekRecorder.stop();
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 准备分类和渠道信息（包含transfer分类用于转账识别）
      const categoryInfos = categories
        .map(c => ({
          name: c.name,
          subCategories: c.subCategories?.map(s => s.name),
        }));

      const channelInfos = channels.map(c => ({
        name: c.name,
      }));

      const parsed = await analyzeTransaction(audioText, categoryInfos, channelInfos);

      if (!parsed) {
        setError('无法解析记账信息，请重试或手动输入');
        setIsProcessing(false);
        return;
      }

      // 查找分类ID（转账类型用转账分类，支出/收入用对应分类）
      // 如果分类为空，则不查找
      let category;
      if (parsed.type === 'transfer') {
        category = categories.find(c => c.type === 'transfer');
      } else if (parsed.category) {
        category = categories.find(
          c => c.name === parsed.category && c.type !== 'transfer'
        );
      }

      // 模糊匹配函数：优先精确匹配，其次包含关系
      const findChannel = (name: string) => {
        if (!name) return undefined;
        // 精确匹配
        const exact = channels.find(c => c.name === name);
        if (exact) return exact;
        // 包含匹配（如 "微信" 匹配 "微信钱包"）
        const contains = channels.find(c => c.name.includes(name) || name.includes(c.name));
        return contains;
      };

      // 查找渠道ID（如果渠道为空，则不查找）
      const channel = parsed.channel ? findChannel(parsed.channel) : undefined;

      // 查找转账目标渠道ID
      let toChannelId: string | undefined;
      if (parsed.type === 'transfer' && parsed.toChannel) {
        const toChannel = findChannel(parsed.toChannel);
        toChannelId = toChannel?.id;
      }

      // 处理日期：空则使用今天
      const finalDate = parsed.date || new Date().toISOString().split('T')[0];

      // 转账类型的数据结构处理
      let finalChannelId: string = '';
      let finalSubCategoryId: string | undefined;
      let finalNote: string;
      let finalFromChannelId: string | undefined;
      let finalToChannelId: string | undefined;

      if (parsed.type === 'transfer') {
        // 转账类型 - 转出和转入账户必须填写
        if (!channel) {
          setError(`未找到转出账户"${parsed.channel}"，请重试或手动选择`);
          setIsProcessing(false);
          return;
        }
        if (!toChannelId) {
          setError(`未找到转入账户"${parsed.toChannel}"，请重试或手动选择`);
          setIsProcessing(false);
          return;
        }

        // 转账时：fromChannelId = 转出账户，toChannelId = 转入账户
        finalFromChannelId = channel.id;
        finalToChannelId = toChannelId;
        finalChannelId = channel.id;
        finalSubCategoryId = undefined; // 转账不需要二级分类
        finalNote = parsed.note;
      } else {
        // 非转账类型 - 渠道和分类可以为空
        // 渠道为空时不报错，允许用户手动选择
        if (channel) {
          finalChannelId = channel.id;
        }

        // 分类为空时不报错，允许用户手动选择
        if (category && parsed.category) {
          // 查找二级分类ID
          if (parsed.subCategory && category.subCategories) {
            const subCategory = category.subCategories.find(
              s => s.name === parsed.subCategory
            );
            finalSubCategoryId = subCategory?.id;
          }
        }

        finalNote = parsed.note;
      }

      // 如果分类为空但类型是转账，仍然需要分类
      if (!category && parsed.type === 'transfer') {
        setError(`未找到分类"${parsed.category}"，请重试或手动选择`);
        setIsProcessing(false);
        return;
      }
      // 非转账类型且分类为空时，不报错，允许用户手动选择

      // 关闭弹窗并返回解析结果
      if (parsed.type === 'transfer') {
        // 转账时返回 fromChannelId 和 toChannelId
        onConfirm({
          type: parsed.type,
          amount: parsed.amount.toString(),
          date: finalDate,
          categoryId: category?.id || '',
          subCategoryId: finalSubCategoryId,
          channelId: finalChannelId,
          fromChannelId: finalFromChannelId,
          toChannelId: finalToChannelId,
          note: finalNote,
        });
      } else {
        // 非转账时返回 channelId
        onConfirm({
          type: parsed.type,
          amount: parsed.amount.toString(),
          date: finalDate,
          categoryId: category?.id || '',
          subCategoryId: finalSubCategoryId,
          channelId: finalChannelId,
          note: finalNote,
        });
      }

      // 重置状态
      setAudioText('');
      setIsProcessing(false);
    } catch (err) {
      console.error('Confirm error:', err);
      setError('处理失败，请重试');
      setIsProcessing(false);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    if (isRecording) {
      iflytekRecorder.stop();
    }
    setAudioText('');
    textHistoryRef.current = []; // 清理历史文本
    setError(null);
    setIsRecording(false);
    onClose();
  };

  // 绘制波形
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const analyser = iflytekRecorder.getAnalyser();
      if (!analyser) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制波形条
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // 渐变色
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#d946ef');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen]);

  // 自动启动录音
  useEffect(() => {
    if (isOpen && !isRecording && !audioText) {
      const timer = setTimeout(() => {
        startRecording();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 弹窗打开时重置所有状态
  useEffect(() => {
    if (isOpen) {
      setAudioText('');
      textHistoryRef.current = [];
      setError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // 组件卸载时停止录音
  useEffect(() => {
    return () => {
      if (isRecording) {
        iflytekRecorder.stop();
      }
    };
  }, [isRecording]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-[90%] sm:max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 渐变光边框 */}
        <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 -z-10" />
        {/* 头部 */}
        <div className="px-4 p-2 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-slate-900">AI语音记账</h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-4 p-2 space-y-3 overflow-y-auto scrollbar-thin flex-1 min-h-0">
          {/* 文本输入区域 */}
          <div>
            <textarea
              value={audioText}
              onChange={(e) => !isRecording && setAudioText(e.target.value)}
              placeholder={isRecording ? '正在录音...' : '点击输入或语音记账...'}
              disabled={isRecording}
              className="w-full h-16 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition-colors outline-none text-sm text-slate-700 resize-none placeholder-slate-400"
            />
          </div>

          {/* 录音可视化区域 */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            {/* 波形画布 */}
            <canvas
              ref={canvasRef}
              width={280}
              height={60}
              className={`w-full h-14 rounded-lg ${isRecording ? 'opacity-100' : 'opacity-40'}`}
            />

            {/* 录音按钮 - 改为圆形 */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-50 text-red-600 border-4 border-red-200 hover:bg-red-100'
                  : 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:opacity-90'
              } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg`}
            >
              {isRecording ? (
                <div className="w-4 h-4 rounded-sm bg-red-500" />
              ) : (
                <Icon name="Mic" size={22} className="text-white" />
              )}
            </button>

          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 rounded-lg py-2 px-3">
              {error}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-4 p-2 border-t border-slate-100 shrink-0 flex gap-3">
          <button
            onClick={handleReRecord}
            disabled={isProcessing}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            重新录音
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || (!audioText.trim() && !isRecording)}
            className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>分析中...</span>
              </>
            ) : (
              '确认记账'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
