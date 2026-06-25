import { useState, useEffect, useCallback, useRef } from 'react';

interface ContextMenu {
  x: number;
  y: number;
  msg: any;
}

interface UseMessageActionsProps {
  onDeleteMessage?: (msgId: string) => void;
  onDeleteMultipleMessages?: (msgIds: string[]) => void;
}

export const useMessageActions = ({ onDeleteMessage, onDeleteMultipleMessages }: UseMessageActionsProps = {}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<any[]>([]);
  
  const isDraggingRef = useRef(false);
  const startIdRef = useRef<string | null>(null);

  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    const x = e.pageX > window.innerWidth - 160 ? e.pageX - 160 : e.pageX;
    const y = e.pageY > window.innerHeight - 200 ? e.pageY - 150 : e.pageY;
    
    setContextMenu({ x, y, msg });
  };

  const startSelection = (e: React.MouseEvent, msg: any) => {
    if (e.button !== 0) return; 
    isDraggingRef.current = true;
    startIdRef.current = msg.id;
    
    if (!e.shiftKey && !selectedMessages.some(m => m.id === msg.id)) {
      setSelectedMessages([msg]);
    }
  };

  const enterSelection = (msg: any) => {
    if (!isDraggingRef.current || !startIdRef.current) return;

    setSelectedMessages((prev) => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    closeMenu();
  };

  const copySelectedText = () => {
    const textToCopy = selectedMessages
      .map(m => m.content)
      .filter(content => content && !content.startsWith("IMAGE_URL:") && !content.startsWith("FILE_URL:"))
      .join('\n');
    if (textToCopy) navigator.clipboard.writeText(textToCopy);
  };

  const deleteSingleMessage = (msgId: string) => {
    if (onDeleteMessage) onDeleteMessage(msgId);
    closeMenu();
  };

  const deleteSelectedMessages = () => {
    if (onDeleteMultipleMessages) {
      onDeleteMultipleMessages(selectedMessages.map(m => m.id));
    } else if (onDeleteMessage) {
      selectedMessages.forEach(m => onDeleteMessage(m.id));
    }
    setSelectedMessages([]);
  };

  const clearSelection = () => {
    setSelectedMessages([]);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      startIdRef.current = null;
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    if (contextMenu) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [contextMenu, closeMenu]);

  return {
    contextMenu,
    selectedMessages,
    setSelectedMessages,
    startSelection,
    enterSelection,
    handleContextMenu,
    copyMessage,
    copySelectedText,
    deleteSingleMessage,
    deleteSelectedMessages,
    clearSelection,
    closeMenu
  };
};