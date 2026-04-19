interface MovementHeaderSectionProps {
  onOpenModal: () => void;
}

export default function MovementHeaderSection({
  onOpenModal,
}: MovementHeaderSectionProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <div>
        <div className="mr-h1">Movement Register</div>
        <div className="mr-sub" style={{ marginBottom: 0 }}>
          Welcome to your approvals board! Here you can approve the movement
          requests by Employees.
        </div>
      </div>
      <button className="mr-add" onClick={onOpenModal}>
        <svg
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Apply Movement
      </button>
    </div>
  );
}
