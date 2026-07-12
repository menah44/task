export default function EmptyState() {
  return (
    <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl bg-background/50 flex flex-col items-center justify-center m-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-foreground">No Forms Found</h2>

      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
        Create your first form to get started.
      </p>
    </div>
  );
}
