import { Disc } from 'lucide-react';

export default function Sidebar({ myID }: { myID: string }) {
  return (
    <aside className="sidebar">
      <div className="logo">Liora</div>
      <div className="identity-box">
        <span>Your public ID</span>
        <code>{myID.substring(0, 24)}...</code>
      </div>
      <nav className="menu">
        <button className="active">Messages</button>
        <button>Contacts</button>
         <button className="discord-btn" onClick={() => window.open('https://discord.gg/your-link', '_blank')}>
          <Disc size={18} />
          <span>Discord</span>
        </button>
        <button>Settings</button>
      </nav>
    </aside>
  );
}