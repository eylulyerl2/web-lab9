function StatsPanel({ stats, error }) {
  if (error) {
    return <p className="error">Could not load statistics: {error}</p>;
  }

  if (!stats) {
    return <p>Loading statistics...</p>;
  }

  return (
    <section className="stats">
      <h2>Statistics</h2>
      <ul>
        <li>Total: {stats.total}</li>
        <li>Read: {stats.read}</li>
        <li>Unread: {stats.unread}</li>
        <li>Average rating: {stats.averageRating ?? '–'}</li>
      </ul>
      <p className="by-genre">
        {Object.entries(stats.byGenre)
          .map(([genre, count]) => `${genre}: ${count}`)
          .join(' · ')}
      </p>
    </section>
  );
}

export default StatsPanel;