<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Todo;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class TodoController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Todo::class);
        $user = $request->user();

        if($user->isAdmin()) {
            $todos = Todo::with('user')
                ->withTrashed()
                ->orderBy('created_at', 'desc')
                ->paginate(10); 
        } else {
            $todos = Todo::with('user')
                ->withTrashed()
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(10);
        }

        return Inertia::render('Todos/Index', [
            'todos' => $todos,
            'statuses' => Todo::statuses(),
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Todo::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
        ]);    
            
        Todo::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => Todo::STATUS_TODO,
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('todos.index')->with('success', '✅ Task created successfully!');
    }

    public function update(Request $request, Todo $todo)
    {
        Gate::authorize('update', $todo);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $todo->update($validated);
        return redirect()->route('todos.index')->with('success', '✅ Task updated successfully!');
    }

    public function destroy(Todo $todo)
    {
        Gate::authorize('delete', $todo);

        $todo->delete();
        return back()->with('success', '🗑️ Task moved to trash!');
    }

    public function restore($id)
    {
        $todo = Todo::withTrashed()->findOrFail($id);
        Gate::authorize('restore', $todo);
        
        $todo->restore();
        return back()->with('success', '↺ Task restored successfully!');
    }

    public function forceDelete($id)
    {
        $todo = Todo::withTrashed()->findOrFail($id);
        Gate::authorize('forceDelete', $todo);
        
        $todo->forceDelete();
        return back()->with('success', '❌ Task permanently deleted!');
    }

    public function updateStatus(Request $request, Todo $todo)
    {
        Gate::authorize('update', $todo);

        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,done'
        ]);

        $todo->update(['status' => $validated['status']]);
        return back()->with('success', '✅ Task status updated!');
    }
}