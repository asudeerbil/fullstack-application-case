import { Head } from '@inertiajs/react';

type Todo = {
    id: number;
    title: string;
    status: string;
};

type Props = {
    todos: {
        data: Todo[];
    };
    statuses: string[];
    isAdmin: boolean;
};

export default function TodosIndex({ todos, statuses, isAdmin }: Props) {
    return (
        <>
            <Head title="Todos" />

            <div style={{ padding: 24 }}>
                <h1>Todos</h1>

                <p>
                    <strong>Admin:</strong> {isAdmin ? 'Yes' : 'No'}
                </p>

                <h2>Statuses</h2>
                <ul>
                    {statuses.map((status) => (
                        <li key={status}>{status}</li>
                    ))}
                </ul>

                <h2>Todos</h2>

                {todos.data.length === 0 ? (
                    <p>No todos yet.</p>
                ) : (
                    <ul>
                        {todos.data.map((todo) => (
                            <li key={todo.id}>
                                {todo.title} ({todo.status})
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}