<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NoteController extends Controller
{
    use ApiResponse;

    /**
     * GET /notes/latest
     *
     * Returns the active note for the caller's couple.
     * Includes whether the caller is the author or receiver.
     * If no active note exists, returns null.
     */
    public function latest(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->couple_id) {
            return $this->error('You must be linked with a partner to use notes.', 422);
        }

        $note = Note::query()
            ->where('couple_id', $user->couple_id)
            ->whereNull('replaced_at')
            ->latest()
            ->first();

        if (! $note) {
            return $this->success(['note' => null]);
        }

        return $this->success([
            'note' => $this->presentNote($note, $user),
        ]);
    }

    /**
     * POST /notes
     *
     * Write a new note. Replaces any existing active note for the couple.
     * The receiver's fog is reset; they must wipe again to reveal the new message.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'content' => ['required', 'string', 'max:280', 'min:1'],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! $user->couple_id) {
            return $this->error('You must be linked with a partner to write notes.', 422);
        }

        $note = DB::transaction(function () use ($user, $request): Note {
            // Archive any previous active note
            Note::query()
                ->where('couple_id', $user->couple_id)
                ->whereNull('replaced_at')
                ->update(['replaced_at' => now()]);

            // Create the new note
            return Note::create([
                'couple_id' => $user->couple_id,
                'author_id' => $user->id,
                'content'   => $request->string('content')->trim(),
            ]);
        });

        return $this->success([
            'note' => $this->presentNote($note, $user),
        ], 201);
    }

    /**
     * POST /notes/{note}/reveal
     *
     * Receiver taps to wipe the fog — marks the note as revealed.
     * Only the *receiver* (not the author) can reveal.
     */
    public function reveal(Request $request, string $noteId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $note = Note::query()
            ->where('id', $noteId)
            ->where('couple_id', $user->couple_id)
            ->whereNull('replaced_at')
            ->firstOrFail();

        if ($note->author_id === $user->id) {
            return $this->error('You cannot reveal your own note — that\'s your partner\'s surprise.', 403);
        }

        if ($note->revealed_at) {
            // Already revealed — return as-is (idempotent)
            return $this->success(['note' => $this->presentNote($note, $user)]);
        }

        $note->update(['revealed_at' => now()]);

        return $this->success(['note' => $this->presentNote($note->fresh(), $user)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentNote(Note $note, User $viewer): array
    {
        $isAuthor = $note->author_id === $viewer->id;

        return [
            'id'          => $note->id,
            // Content is always shown to the author.
            // For the receiver it is hidden until revealed_at is set.
            'content'     => ($isAuthor || $note->revealed_at !== null)
                ? $note->content
                : null,
            'is_author'   => $isAuthor,
            'is_revealed' => $note->revealed_at !== null,
            'revealed_at' => $note->revealed_at?->toIso8601String(),
            'created_at'  => $note->created_at?->toIso8601String(),
        ];
    }
}
