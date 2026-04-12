export default function Sidebar({ myID }: { myID: string }) {
  return (
    <aside className="sidebar">
      <div className="logo">LIORA</div>
      <div className="identity-box">
        <span>YOUR PUBLIC ID</span>
        <code>{myID.substring(0, 24)}...</code>
      </div>
      <nav className="menu">
        <button className="active">Messages</button>
        <button>Contacts</button>
        <button>Settings</button>
      </nav>
    </aside>
  );
}