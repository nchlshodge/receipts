export function ScanningScreen({
  photoUrl,
  status,
  onCancel,
}: {
  photoUrl: string | null;
  status: string;
  onCancel: () => void;
}) {
  return (
    <div className="screen scanning-screen">
      <button className="link-btn" onClick={onCancel}>
        Cancel
      </button>
      <div className="photo-area">
        {photoUrl ? (
          <img src={photoUrl} alt="Receipt" className="photo-preview" />
        ) : (
          <span className="photo-label">receipt photo</span>
        )}
      </div>
      <div className="scanning-status">{status}</div>
    </div>
  );
}
