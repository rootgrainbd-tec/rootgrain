"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { addInternalNoteAction, deleteInternalNoteAction } from "@/app/actions/admin.mto";

export default function AdminNotes({ orderId, notes }: { orderId: string; notes: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    startTransition(async () => {
      const res = await addInternalNoteAction(orderId, newNote);
      if (res.success) {
        toast.success("Note added");
        setNewNote("");
      } else {
        toast.error(res.error || "Failed to add note");
      }
    });
  };

  const handleDelete = (noteId: string) => {
    if (!confirm("Delete this internal note?")) return;
    startTransition(async () => {
      const res = await deleteInternalNoteAction(noteId, orderId);
      if (res.success) {
        toast.success("Note deleted");
      } else {
        toast.error(res.error || "Failed to delete note");
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-sm border shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Admin Internal Notes</h3>
      <p className="text-xs text-muted-foreground mb-4 bg-yellow-50 p-2 border border-yellow-200 rounded">
        These notes are strictly internal and never visible to the customer.
      </p>

      <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No internal notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-3 bg-gray-50 rounded-sm border group relative">
              <p className="text-sm text-gray-800 whitespace-pre-wrap pr-8">{note.content}</p>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>By {note.createdBy}</span>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <button 
                onClick={() => handleDelete(note.id)}
                disabled={isPending}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 pt-2 border-t">
        <Textarea 
          placeholder="Add a new internal note..." 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          disabled={isPending}
          className="text-sm min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleAddNote} 
            disabled={isPending || !newNote.trim()}
            size="sm"
            className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]"
          >
            {isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
}
