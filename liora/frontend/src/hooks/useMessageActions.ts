import { useState, useEffect, useCallback } from 'react';

interface ContextMenu {
  x: number;
  y: number;
  msg: any;
}

export const useMessageActions = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    const x = e.pageX > window.innerWidth - 160 ? e.pageX - 160 : e.pageX;
    const y = e.pageY > window.innerHeight - 200 ? e.pageY - 150 : e.pageY;
    
    setContextMenu({ x, y, msg });
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    closeMenu();
  };

  const deleteMessage = (msgId: string) => {
    console.log(`Запрос на удаление сообщения: ${msgId}`);
    closeMenu();
  };

  useEffect(() => {
    if (contextMenu) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [contextMenu, closeMenu]);

  return {
    contextMenu,
    handleContextMenu,
    copyMessage,
    deleteMessage,
    closeMenu
  };
};