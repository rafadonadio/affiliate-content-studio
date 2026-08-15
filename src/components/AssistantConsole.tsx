import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Bot, X } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

export function AssistantConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceRecognition();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening, transcript]);

  // Handle voice transcript updates
  useEffect(() => {
    if (transcript && isListening) {
      setInputText(transcript);
    }
  }, [transcript, isListening]);

  // Send command to backend
  const handleSendCommand = async (command: string) => {
    if (!command.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: command }]);
    setInputText('');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, context: { currentPath: window.location.pathname } })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      
      // Perform UI actions based on data.action if necessary
      if (data.action === "NAVIGATE" && data.payload?.route) {
          // Just as an example, normally we'd use a router hook
          window.location.href = data.payload.route;
      }

      // Simple Text-to-Speech
      const utterance = new SpeechSynthesisUtterance(data.reply);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error("Assistant error", error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Hubo un error de conexión.' }]);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
      if (inputText) {
        handleSendCommand(inputText);
      }
    } else {
      startListening();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-all z-50 flex items-center justify-center"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <h3 className="font-semibold text-lg">Jarvis</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:text-indigo-200">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 h-80 overflow-y-auto flex flex-col gap-3 bg-gray-50 dark:bg-gray-900/50">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 p-3 rounded-lg rounded-tl-none self-start max-w-[85%] text-sm">
          Hola, ¿en qué te puedo ayudar hoy?
        </div>
        
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`p-3 rounded-lg text-sm max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none self-end' 
                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-tl-none self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        
        {isListening && transcript && (
          <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tr-none self-end max-w-[85%] text-sm opacity-50 italic">
            {transcript}...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2 items-center">
        {isSupported && (
          <button 
            onClick={handleToggleVoice}
            className={`p-2 rounded-full transition-colors ${
              isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
        
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendCommand(inputText)}
          placeholder="Escribe un comando..."
          className="flex-1 bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white"
        />
        
        <button 
          onClick={() => handleSendCommand(inputText)}
          disabled={!inputText.trim() && !isListening}
          className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}
