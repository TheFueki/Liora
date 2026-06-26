import { useState, useEffect, useCallback, useRef } from 'react';

interface ContextMenu {
  x: number;
  y: number;
  msg: any;
}

interface UseMessageActionsProps {
  currentUserId: string;
  onDeleteMessage?: (msgId: string) => void;
  onDeleteMultipleMessages?: (msgIds: string[]) => void;
}

export const useMessageActions = ({ currentUserId, onDeleteMessage, onDeleteMultipleMessages }: UseMessageActionsProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<any[]>([]);
  
  const isDraggingRef = useRef(false);
  const startIdRef = useRef<string | null>(null);
  const hasMovedRef = useRef(false);

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
    hasMovedRef.current = false;
  };

  const enterSelection = (msg: any) => {
    if (!isDraggingRef.current || !startIdRef.current) return;
    hasMovedRef.current = true;

    setSelectedMessages((prev) => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const endSelection = (e: React.MouseEvent, msg: any) => {
    if (!isDraggingRef.current) return;
    
    if (!hasMovedRef.current) {
      setSelectedMessages((prev) => {
        const isAlreadySelected = prev.some(m => m.id === msg.id);
        if (isAlreadySelected) {
          return prev.filter(m => m.id !== msg.id);
        } else {
          return [...prev, msg];
        }
      });
    }

    isDraggingRef.current = false;
    startIdRef.current = null;
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

  const deleteSingleMessage = (msgId: string, msgOwnerId: string) => {
    if (msgOwnerId !== currentUserId) return;
    
    if (onDeleteMessage) onDeleteMessage(msgId);
    closeMenu();
  };

  const deleteSelectedMessages = () => {
    const onlyMyMessages = selectedMessages.filter(m => m.sender_id === currentUserId);
    
    if (onlyMyMessages.length === 0) return;

    if (onDeleteMultipleMessages) {
      onDeleteMultipleMessages(onlyMyMessages.map(m => m.id));
    } else if (onDeleteMessage) {
      onlyMyMessages.forEach(m => onDeleteMessage(m.id));
    }
    setSelectedMessages([]);
  };

  const clearSelection = () => {
    setSelectedMessages([]);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      startIdRef.current = null;
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
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
    endSelection,
    handleContextMenu,
    copyMessage,
    copySelectedText,
    deleteSingleMessage,
    deleteSelectedMessages,
    clearSelection,
    closeMenu
  };
};