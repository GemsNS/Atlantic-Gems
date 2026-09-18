/** Plate-shaped placeholders so the grid does not jump when items land. */
export default function InventoryLoading() {
  return (
    <section className="section" style={{ borderTop: 0 }}>
      <div className="wrap">
        <p className="result-line">
          <span>Bringing out the tray…</span>
        </p>
        <div className="skel-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skel-card" aria-hidden="true">
              <div className="skel skel-frame" />
              <div className="skel-body">
                <div className="skel skel-line w-40" />
                <div className="skel skel-line w-70" />
                <div className="skel skel-line w-55" />
              </div>
            </div>
          ))}
        </div>
        <p className="sr-only" role="status">
          Loading the collection
        </p>
      </div>
    </section>
  );
}
