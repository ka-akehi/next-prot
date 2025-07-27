import { ToDo } from '@/types/todo';

type Props = {
  todos: ToDo[];
  onDelete: (id: string) => void;
};

export function ToDoList({ todos, onDelete }: Props) {
  return (
    <ul className="mt-6 space-y-2">
      {todos.map((todo) => (
        <li key={todo.id} className="flex justify-between border-b pb-2">
          <span>{todo.text}</span>
          <button className="text-red-500 hover:underline" onClick={() => onDelete(todo.id)}>
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
