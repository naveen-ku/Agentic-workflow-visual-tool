import type { Execution } from "../../types/xray";

interface Props {
  executions: Execution[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ExecutionList({ executions, selectedId, onSelect }: Props) {
  return (
    <div className="w-72 border-r bg-gray-50 overflow-y-auto">
      <div className="p-4 font-semibold text-gray-700">Executions</div>

      {executions.map((exec) => (
        <div
          key={exec.executionId}
          onClick={() => onSelect(exec.executionId)}
          className={`cursor-pointer px-4 py-3 border-b text-sm
            ${
              exec.executionId === selectedId
                ? "bg-blue-100 text-blue-800"
                : "hover:bg-gray-100"
            }`}
        >
          <div className="font-medium">{exec.name}</div>
          <div className="text-xs text-gray-500">
            {new Date(exec.startedAt).toLocaleString()}
          </div>
          {!exec.endedAt && (
            <div className="mt-1 text-xs text-blue-600 font-semibold animate-pulse">
              In Progress...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
