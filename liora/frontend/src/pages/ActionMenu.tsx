import { useState, useRef, useEffect } from 'react';
import { Plus, Users, Radio, MessageSquarePlus, UserPlus } from 'lucide-react';
import '../styles/ActionMenu.scss';

export default function ActionMenu({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actions = [
    { id: 'chat', label: 'New Chat', icon: <MessageSquarePlus size={18} />, path: 'new-chat' },
    { id: 'group', label: 'Create Group', icon: <Users size={18} />, path: 'create-group' },
    { id: 'channel', label: 'Create Channel', icon: <Radio size={18} />, path: 'create-channel' },
    { id: 'contact', label: 'Add Contact', icon: <UserPlus size={18} />, path: 'add-contact' },
  ];

  return (
    <div className="action-menu-wrapper" ref={menuRef}>
      <button 
        className={`main-plus-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus size={22} />
      </button>

      {isOpen && (
        <div className="actions-dropdown glass-morphism animate-pop">
          {actions.map((action) => (
            <button 
              key={action.id} 
              className="action-item"
              onClick={() => {
                onNavigate(action.path);
                setIsOpen(false);
              }}
            >
              <div className="icon-box">{action.icon}</div>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}