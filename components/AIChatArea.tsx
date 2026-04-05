import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { AITransactionCard } from './AITransactionCard';
import { ParsedTransaction } from '../lib/minimax';

// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'processing' | 'transaction';
  content?: string;
  parsedData?: ParsedTransaction;
  editedData?: ParsedTransaction;
  confirmed?: boolean;
}

interface AIChatAreaProps {
  messages: Message[];
  onConfirm: (messageId: string, parsed: ParsedTransaction) => void;
  onEdit: (parsed: ParsedTransaction) => void;
  processingMessageId?: string | null;
}

export const AIChatArea: React.FC<AIChatAreaProps> = ({ messages, onConfirm, onEdit, processingMessageId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 计算可用高度：100vh - 顶部栏(3.5rem) - 底部输入区(约8rem)
  const chatHeight = 'calc(100vh - 3.5rem - 8rem)';

  return (
    <div className="flex-1 overflow-y-auto px-4" style={{ minHeight: chatHeight }}>
      {/* 空状态 - 居中显示 */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center text-slate-400" style={{ minHeight: chatHeight }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 flex items-center justify-center mb-4 shadow-sm">
            <Icon name="Sparkles" size={32} className="text-violet-500" />
          </div>
          <p className="text-sm">开始语音或文字记账</p>
          <p className="text-xs mt-1 opacity-60">点击底部按钮开始说话</p>
        </div>
      )}

      {/* 消息列表 */}
      {messages.length > 0 && (
        <div className="py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              {/* 用户文本消息 */}
              {msg.type === 'text' && msg.role === 'user' && (
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-br-md shadow-sm">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              )}

              {/* AI 文本消息 */}
              {msg.type === 'text' && msg.role === 'assistant' && (
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 rounded-bl-md">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              )}

              {/* Processing 状态 */}
              {msg.type === 'processing' && (
                <div className="bg-slate-100 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-150" />
                    </div>
                    <span className="text-sm text-slate-500">AI 解析中...</span>
                  </div>
                </div>
              )}

              {/* 记账卡片 */}
              {msg.type === 'transaction' && msg.parsedData && (
                <AITransactionCard
                  data={msg.parsedData}
                  editedData={msg.editedData}
                  onConfirm={() => onConfirm(msg.id, msg.editedData || msg.parsedData!)}
                  onEdit={!msg.confirmed ? () => onEdit(msg.editedData || msg.parsedData!) : undefined}
                  confirmed={msg.confirmed}
                  isProcessing={processingMessageId === msg.id}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
