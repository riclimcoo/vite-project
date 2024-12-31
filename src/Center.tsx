export function Center({ children }: { children: any }) {
  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gray-900">
      {children}
    </div>
  );
}
