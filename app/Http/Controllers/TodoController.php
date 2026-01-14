<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Todo;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;


class TodoController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Todo::class);
        $user = $request->user();

        if($user->isAdmin()) {
            $todos = Todo::withTrashed()->orderBy('created_at', 'desc')->paginate(10); //withTrashed: slinmis=silinmemis tum kayitlar.
        } else {
            $todos = Todo::where('user_id', $user->id)->orderBy('created_at', 'desc')->paginate(10);
        }

        return Inertia::render('Todos/Index', [
            'todos' => $todos,
            'statuses' => Todo::statuses(),
            'isAdmin' => $user->isAdmin(),
        ]);
    }
}
