import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceRecognitionProps {
  onFinalTranscript?: (text: string) => void;
  continuousMode?: boolean;
}

export function useVoiceRecognition({ onFinalTranscript, continuousMode = false }: UseVoiceRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  
  // Ref to track if we should auto-restart
  const shouldListenRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      
      // If continuousMode is true, we want the API to keep running as much as possible
      rec.continuous = continuousMode;
      rec.interimResults = true;
      rec.lang = 'es-ES'; // Can be made dynamic

      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        let currentTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            currentTranscript += transcriptPart;
          }
        }
        
        setTranscript(currentTranscript || finalTranscript);
        
        if (finalTranscript.trim() && onFinalTranscript) {
          onFinalTranscript(finalTranscript.trim());
          setTranscript(''); // Clear interim
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          shouldListenRef.current = false;
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Auto restart if in continuous mode and we haven't manually stopped
        if (continuousMode && shouldListenRef.current) {
          try {
            rec.start();
          } catch (e) {
            console.error("Restart error", e);
          }
        }
      };

      setRecognition(rec);
    }
  }, [continuousMode, onFinalTranscript]);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('');
      shouldListenRef.current = true;
      try {
        recognition.start();
      } catch (e) {
        console.error("Recognition already started");
      }
    } else {
      console.warn("Speech recognition not supported");
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      shouldListenRef.current = false;
      recognition.stop();
    }
  }, [recognition]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!recognition
  };
}
