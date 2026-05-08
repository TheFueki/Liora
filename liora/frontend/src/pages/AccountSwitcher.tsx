import { useState, useEffect } from 'react';
import { User, Plus, Key, ShieldCheck } from 'lucide-react';
// @ts-ignore
import { GetAvailableAccounts } from '../../wailsjs/go/main/App';
import '../styles/AccountSwitcher.scss';

interface Account {
  id: string;
  username: string;
  avatarUrl?: string;
}

export default function AccountSwitcher({ onSelect, onAddNew }: any) {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    GetAvailableAccounts().then((data: Account[]) => {
      setAccounts(data || []);
    });
  }, []);

  return (
    <div className="account-switcher glass-morphism animate-in">
      <div className="switcher-header">
        <ShieldCheck size={20} className="text-green" />
        <h3>Active Identities</h3>
      </div>
      
      <div className="accounts-list">
        {accounts.map((acc) => (
          <div key={acc.id} className="account-item" onClick={() => onSelect(acc.id)}>
            <div className="avatar-wrapper">
              {acc.avatarUrl ? (
                <img src={acc.avatarUrl} alt={acc.username} className="account-avatar" />
              ) : (
                <div className="avatar-stub">
                  {acc.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="status-indicator online"></div>
            </div>
            
            <div className="account-info">
              <span className="account-name">{acc.username}</span>
              <span className="account-id">{acc.id.slice(0, 8)}...{acc.id.slice(-4)}</span>
            </div>
          </div>
        ))}

        <button className="add-account-btn" onClick={onAddNew}>
          <div className="plus-icon">
            <Plus size={18} />
          </div>
          <span>Add New Identity</span>
        </button>
      </div>
    </div>
  );
}