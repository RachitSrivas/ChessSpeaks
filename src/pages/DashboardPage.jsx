import Dashboard from '../components/Dashboard';

export default function DashboardPage({ session }) {
  if (!session) return <div style={{ padding: '2rem', textAlign: 'center' }}>Please sign in to view dashboard.</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Dashboard session={session} />
    </div>
  );
}
