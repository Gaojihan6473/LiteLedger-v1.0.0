import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AIChatArea, Message } from '../components/AIChatArea';
import { AIEditModal } from '../components/AIEditModal';
import { useStore } from '../store';
import { analyzeTransaction, ParsedTransaction, CategoryInfo, ChannelInfo } from '../lib/minimax';
import { iflytekRecorder } from '../lib/iflytek';
import { SoundWaves } from '../components/AIVoiceRecorder';

export const AIPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, channels, addRecord } = useStore();
  const idCounter = useRef(0);

  // 生成唯一 ID
  const genId = () => `${Date.now()}-${++idCounter.current}`;

  // 输入模式
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  // 文字输入
  const [textInput, setTextInput] = useState('');
  // 消息列表
  const [messages, setMessages] = useState<Message[]>([]);
  // 是否正在处理
  const [isProcessing, setIsProcessing] = useState(false);
  // 正在确认记账的消息 ID
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);
  // 当前编辑的消息 ID
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  // 当前编辑的 ParsedTransaction
  const [editingTransaction, setEditingTransaction] = useState<ParsedTransaction | null>(null);

  // 录音相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [tempText, setTempText] = useState('');
  const textHistoryRef = useRef<string[]>([]);
  const lastTextRef = useRef<string>('');
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [_error, setError] = useState<string | null>(null);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (isProcessing) return;

    setTempText('');
    setIsRecording(true);
    setError(null);
    textHistoryRef.current = [];
    lastTextRef.current = '';

    try {
      await iflytekRecorder.start({
        onResult: (text) => {
          const trimmedText = text.trim().replace(/^[,，.。]+/, '');
          if (!trimmedText) return;

          const currentText = textHistoryRef.current.length > 0
            ? textHistoryRef.current[textHistoryRef.current.length - 1]
            : '';

          if (trimmedText === currentText || trimmedText === lastTextRef.current) return;

          let finalText: string;
          if (!currentText) {
            finalText = trimmedText;
          } else {
            let commonLength = 0;
            const minLen = Math.min(currentText.length, trimmedText.length);
            for (let i = 0; i < minLen; i++) {
              if (currentText[i] === trimmedText[i]) commonLength++;
              else break;
            }
            if (commonLength >= 2) {
              const newPart = trimmedText.substring(commonLength).trim();
              finalText = newPart ? `${currentText} ${newPart}` : trimmedText;
            } else {
              finalText = trimmedText.includes(currentText) ? trimmedText : `${currentText} ${trimmedText}`;
            }
          }

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
          const a = iflytekRecorder.getAnalyser();
          if (a) setAnalyser(a);
        },
        onEnd: () => {
          setIsRecording(false);
          setAnalyser(null);
        },
      });
    } catch (error) {
      console.error('Start recording error:', error);
      setError('无法启动录音，请检查麦克风权限');
      setIsRecording(false);
    }
  }, [isProcessing]);

  // 停止录音
  const stopRecording = useCallback(() => {
    iflytekRecorder.stop();
    setIsRecording(false);
  }, []);

  // 添加用户消息
  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: genId(),
      role: 'user',
      type: 'text',
      content,
    }]);
  }, []);

  // 添加 processing 消息
  const addProcessingMessage = useCallback(() => {
    const id = genId();
    setMessages(prev => [...prev, {
      id,
      role: 'assistant',
      type: 'processing',
    }]);
    return id;
  }, []);

  // 添加记账卡片消息
  const addTransactionMessage = useCallback((parsed: ParsedTransaction) => {
    setMessages(prev => [...prev, {
      id: genId(),
      role: 'assistant',
      type: 'transaction',
      parsedData: parsed,
      confirmed: false,
    }]);
  }, []);

  // 添加 AI 文本消息
  const addAssistantMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: genId(),
      role: 'assistant',
      type: 'text',
      content,
    }]);
  }, []);

  // 移除 processing 消息
  const removeProcessingMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  // 标记记账卡片为已确认
  const markTransactionConfirmed = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, confirmed: true }
        : m
    ));
  }, []);

  // 处理语音输入确认
  const handleVoiceConfirm = useCallback(async (text: string) => {
    if (isProcessing) return;

    // 添加用户消息
    addUserMessage(text);

    // 添加 processing 状态
    const processingId = addProcessingMessage();
    setIsProcessing(true);

    try {
      // 准备分类和渠道信息
      const categoryInfos: CategoryInfo[] = categories.map(c => ({
        name: c.name,
        subCategories: c.subCategories?.map(s => s.name),
      }));
      const channelInfos: ChannelInfo[] = channels.map(c => ({ name: c.name }));

      // 调用 MiniMax 解析
      const parsed = await analyzeTransaction(text, categoryInfos, channelInfos);

      // 移除 processing 消息
      removeProcessingMessage(processingId);

      if (parsed) {
        // 添加记账卡片
        addTransactionMessage(parsed);
      } else {
        // 解析失败
        addAssistantMessage('无法解析记账信息，请重试或手动输入');
      }
    } catch (error) {
      console.error('Parse error:', error);
      removeProcessingMessage(processingId);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addAssistantMessage(`解析失败: ${errorMessage}，请重试`);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, categories, channels, addUserMessage, addProcessingMessage, removeProcessingMessage, addTransactionMessage, addAssistantMessage]);

  // 处理文字输入提交
  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim() || isProcessing) return;

    const userText = textInput.trim();
    setTextInput('');

    // 添加用户消息
    addUserMessage(userText);

    // 添加 processing 状态
    const processingId = addProcessingMessage();
    setIsProcessing(true);

    try {
      // 准备分类和渠道信息
      const categoryInfos: CategoryInfo[] = categories.map(c => ({
        name: c.name,
        subCategories: c.subCategories?.map(s => s.name),
      }));
      const channelInfos: ChannelInfo[] = channels.map(c => ({ name: c.name }));

      // 调用 MiniMax 解析
      const parsed = await analyzeTransaction(userText, categoryInfos, channelInfos);

      // 移除 processing 消息
      removeProcessingMessage(processingId);

      if (parsed) {
        // 添加记账卡片
        addTransactionMessage(parsed);
      } else {
        // 解析失败
        addAssistantMessage('无法解析记账信息，请重试或手动输入');
      }
    } catch (error) {
      console.error('Parse error:', error);
      removeProcessingMessage(processingId);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addAssistantMessage(`解析失败: ${errorMessage}，请重试`);
    } finally {
      setIsProcessing(false);
    }
  }, [textInput, isProcessing, categories, channels, addUserMessage, addProcessingMessage, removeProcessingMessage, addTransactionMessage, addAssistantMessage]);

  // 确认记账
  const handleTransactionConfirm = useCallback(async (messageId: string, parsed: ParsedTransaction) => {
    setProcessingMessageId(messageId);
    try {
      // 查找分类
      let category;
      if (parsed.type === 'transfer') {
        category = categories.find(c => c.type === 'transfer');
      } else {
        category = categories.find(
          c => c.name === parsed.category && c.type !== 'transfer'
        );
      }

      // 模糊匹配渠道
      const findChannel = (name: string) => {
        if (!name) return undefined;
        const exact = channels.find(c => c.name === name);
        if (exact) return exact;
        return channels.find(c => c.name.includes(name) || name.includes(c.name));
      };

      const channel = parsed.channel ? findChannel(parsed.channel) : undefined;
      let toChannelId: string | undefined;
      if (parsed.type === 'transfer' && parsed.toChannel) {
        const toChannel = findChannel(parsed.toChannel);
        toChannelId = toChannel?.id;
      }

      // 处理日期
      const finalDate = parsed.date || new Date().toISOString().split('T')[0];

      if (parsed.type === 'transfer') {
        // 转账逻辑
        if (!channel) {
          alert(`未找到转出账户"${parsed.channel}"`);
          return;
        }
        if (!toChannelId) {
          alert(`未找到转入账户"${parsed.toChannel}"`);
          return;
        }

        const transferAmount = parseFloat(parsed.amount as string);
        const transferCategory = categories.find(c => c.type === 'transfer');
        const transferInSub = transferCategory?.subCategories?.find(sc => sc.name === '转入');
        const transferOutSub = transferCategory?.subCategories?.find(sc => sc.name === '转出');

        if (!transferCategory || !transferInSub || !transferOutSub) {
          alert('转账分类未加载');
          return;
        }

        // 获取账户名称用于备注
        const fromChannelName = channel.name;
        const toChannelName = channels.find(c => c.id === toChannelId)?.name || '';

        // 创建转出记录
        await addRecord({
          amount: -transferAmount,
          categoryId: transferCategory.id,
          subCategoryId: transferOutSub.id,
          channelId: channel.id,
          toChannelId: toChannelId,
          type: 'transfer',
          date: new Date(finalDate).toISOString(),
          note: parsed.note ? `转出至${toChannelName}-${parsed.note}` : `转出至${toChannelName}`,
        });

        // 创建转入记录
        await addRecord({
          amount: transferAmount,
          categoryId: transferCategory.id,
          subCategoryId: transferInSub.id,
          channelId: toChannelId,
          toChannelId: channel.id,
          type: 'transfer',
          date: new Date(finalDate).toISOString(),
          note: parsed.note ? `从${fromChannelName}转入-${parsed.note}` : `从${fromChannelName}转入`,
        });
      } else {
        // 支出/收入逻辑
        await addRecord({
          amount: parseFloat(parsed.amount as string),
          categoryId: category?.id || '',
          channelId: channel?.id || '',
          type: parsed.type,
          date: new Date(finalDate).toISOString(),
          note: parsed.note,
        });
      }

      // 标记记账卡片为已确认
      markTransactionConfirmed(messageId);

    } catch (error) {
      console.error('Confirm error:', error);
      alert('保存失败，请重试');
    } finally {
      setProcessingMessageId(null);
    }
  }, [categories, channels, addRecord, markTransactionConfirmed, addAssistantMessage]);

  // 返回
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // 处理编辑
  const handleEdit = useCallback((parsed: ParsedTransaction, messageId: string) => {
    setEditingMessageId(messageId);
    setEditingTransaction(parsed);
  }, []);

  // 处理编辑完成
  const handleEditConfirm = useCallback((edited: ParsedTransaction) => {
    if (!editingMessageId) return;
    // 更新消息中的 editedData
    setMessages(prev => prev.map(m =>
      m.id === editingMessageId
        ? { ...m, editedData: edited }
        : m
    ));
    setEditingMessageId(null);
    setEditingTransaction(null);
  }, [editingMessageId]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* 顶部栏 */}
      <div className="fixed top-0 left-0 right-0 z-40 h-12 bg-gradient-to-b from-white via-slate-50/90 to-slate-100/40 border-b border-slate-200/50 shadow-[0_4px_20px_-3px_rgba(0,0,0,0.06)]">
        <div className="h-full max-w-2xl mx-auto px-4 flex items-center justify-between">
          {/* 返回按钮 */}
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-2"
          >
            <Icon name="ChevronLeft" size={24} className="text-slate-600" />
          </button>

          {/* 标题 */}
          <span className="font-bold text-slate-800">AI 助手</span>

          {/* 占位 */}
          <div className="w-10" />
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 pt-14">
        <AIChatArea messages={messages} onConfirm={handleTransactionConfirm} onEdit={handleEdit} processingMessageId={processingMessageId} />
      </div>

      {/* 底部输入区域 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200/50 p-4 shadow-[0_-4px_20px_-3px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto">
          {/* 输入区域 */}
          {inputMode === 'voice' ? (
            <div className="flex flex-col">
              {/* 录音文本显示区域 - 开始录音后显示 */}
              {isRecording && (
                <div className="w-full mb-3 px-4 py-3 min-h-[48px] bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center">
                  <p className="text-sm text-slate-700 leading-relaxed">{tempText || '等待录音...'}</p>
                </div>
              )}

              {/* 底部三栏布局 */}
              <div className="flex items-center gap-3">
                {/* 切换按钮 */}
                <button
                  onClick={() => setInputMode('text')}
                  className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-violet-500 hover:bg-slate-200 transition-colors shrink-0"
                >
                  <Icon name="Pencil" size={20} />
                </button>

                {/* 中间录音按钮 */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`
                    flex-1 h-12 rounded-xl flex items-center justify-center transition-all
                    ${isProcessing
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isRecording
                        ? 'bg-red-50 border-2 border-red-200'
                        : 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white shadow-md hover:opacity-90 active:scale-[0.98]'
                    }
                  `}
                >
                  {isRecording ? (
                    <div className="w-full h-8 flex items-center justify-center">
                      <SoundWaves analyser={analyser} />
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-white">开始录音</span>
                  )}
                </button>

                {/* 发送按钮 */}
                <button
                  onClick={() => { if (isRecording) stopRecording(); handleVoiceConfirm(tempText); setTempText(''); }}
                  disabled={!tempText || isProcessing}
                  className="w-12 h-12 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0"
                >
                  <Icon name="Send" size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* 切换按钮 */}
              <button
                onClick={() => setInputMode('voice')}
                className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-violet-500 hover:bg-slate-200 transition-colors shrink-0"
              >
                <Icon name="Mic" size={20} />
              </button>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                placeholder="输入记账内容..."
                disabled={isProcessing}
                className="flex-1 h-12 px-4 bg-slate-100 rounded-xl outline-none text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-violet-300 transition-shadow disabled:opacity-50"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                className="w-12 h-12 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                <Icon name="Send" size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingTransaction && (
        <AIEditModal
          data={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onConfirm={handleEditConfirm}
        />
      )}
    </div>
  );
};
