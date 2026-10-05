export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${s} animate-spin border-4 border-primary border-t-transparent rounded-full`} />
    </div>
  )
}
