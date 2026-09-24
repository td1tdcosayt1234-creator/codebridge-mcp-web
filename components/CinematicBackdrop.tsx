export default function CinematicBackdrop() {
  return (
    <div className="cine" aria-hidden="true">
      <div className="cine-aurora">
        <span className="aurora aurora--violet" />
        <span className="aurora aurora--mint" />
        <span className="aurora aurora--rose" />
        <span className="aurora aurora--deep" />
      </div>
      <div className="cine-beams">
        <i />
        <i />
        <i />
      </div>
      <div className="cine-stars" />
      <span className="cine-shoot cine-shoot--1" />
      <span className="cine-shoot cine-shoot--2" />
      <div className="cine-horizon" />
      <div className="cine-grid" />
      <div className="cine-vignette" />
      <div className="cine-scan" />
      <div className="cine-grain" />
    </div>
  );
}
