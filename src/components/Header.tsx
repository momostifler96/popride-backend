interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
        {description && <p className="text-slate-600">{description}</p>}
      </div>
    </div>
  );
}
