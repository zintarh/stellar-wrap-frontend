import dynamic from 'next/dynamic';

const TransactionsOfFury = dynamic(() => import('../../components/TransactionsOfFury'), {
  loading: () => <div className="min-h-[400px] animate-pulse rounded-xl bg-black/10" aria-label="Loading dashboard" />,
});

export default function TransactionsOfFuryPage() {
  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <TransactionsOfFury />
  </main>
}
