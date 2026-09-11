export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          <span>{t.message}</span>
          <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>✕</span>
        </div>
      ))}
    </div>
  )
}