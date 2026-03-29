// src/pages/DepartmentsSection.tsx
import { useState } from "react";

interface Department {
  id: number;
  name: string;
}

export function DepartmentsSection() {
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: "Human Resources" },
    { id: 2, name: "Engineering" },
  ]);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newDep: Department = { id: Date.now(), name: newName.trim() };
    setDepartments(prev => [...prev, newDep]);
    setNewName("");
  };

  return (
    <section className="mb-6">
      <h2 className="text-xl font-medium mb-3">Departments</h2>
      <div className="grid grid-cols-1 gap-3">
        {departments.map(d => (
          <div key={d.id} className="border p-3 rounded">
            {d.name}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="New department name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="border rounded py-1 px-2 flex-1"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
        >
          Add
        </button>
      </div>
    </section>
  );
}
