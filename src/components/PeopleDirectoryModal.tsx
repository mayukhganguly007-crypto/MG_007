import React, { useState } from 'react';
import { X, Plus, Trash2, Camera, Upload, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { RegisteredPerson } from '../types';
import { soundEngine } from '../services/soundEngine';

interface PeopleDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: RegisteredPerson[];
  onAddPerson: (person: RegisteredPerson) => void;
  onDeletePerson: (id: string) => void;
  currentFrameBase64?: string;
}

export const PeopleDirectoryModal: React.FC<PeopleDirectoryModalProps> = ({
  isOpen,
  onClose,
  people,
  onAddPerson,
  onDeletePerson,
  currentFrameBase64,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isEnrollingAI, setIsEnrollingAI] = useState(false);

  if (!isOpen) return null;

  const handleCaptureCurrentFrame = () => {
    if (currentFrameBase64) {
      setPhotoUrl(currentFrameBase64);
      soundEngine.playFaceRecognizedChime();
    } else {
      alert('No camera frame currently available.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAIDescriptor = async () => {
    if (!photoUrl || !name.trim()) {
      alert('Please provide a name and photo first.');
      return;
    }

    setIsEnrollingAI(true);
    try {
      const res = await fetch('/api/enroll-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoUrl,
          name: name.trim(),
          relationship,
        }),
      });

      const data = await res.json();
      if (data.profileNotes) {
        setNotes(data.profileNotes);
        soundEngine.speak(`Face profile generated for ${name}.`);
      }
    } catch (err) {
      console.error('Error generating face profile:', err);
    } finally {
      setIsEnrollingAI(false);
    }
  };

  const handleSavePerson = () => {
    if (!name.trim()) {
      alert('Please enter a name.');
      return;
    }

    const newPerson: RegisteredPerson = {
      id: `person-${Date.now()}`,
      name: name.trim(),
      relationship: relationship.trim() || 'Contact',
      notes: notes.trim() || 'Recognized companion.',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      enrolledAt: new Date().toISOString().split('T')[0],
    };

    onAddPerson(newPerson);
    soundEngine.playFaceRecognizedChime();
    soundEngine.speak(`Enrolled ${newPerson.name} into known people directory.`);

    // Reset form
    setName('');
    setRelationship('Friend');
    setNotes('');
    setPhotoUrl('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-neutral-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Facial Recognition & Known People</h3>
              <p className="text-xs text-zinc-400">
                Enroll companions, guides, and family so "Have a look" can identify them aloud in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4">
          {!isAdding ? (
            <div>
              {/* Top Action */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Enrolled Individuals ({people.length})
                </span>

                <button
                  onClick={() => setIsAdding(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enroll New Person</span>
                </button>
              </div>

              {/* People Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-emerald-500/40 flex items-start gap-3 transition-all"
                  >
                    <img
                      src={person.photoUrl}
                      alt={person.name}
                      className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0 bg-zinc-800"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white truncate">{person.name}</h4>
                        <button
                          onClick={() => onDeletePerson(person.id)}
                          className="text-zinc-500 hover:text-red-400 p-1"
                          title="Remove from directory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-emerald-400 font-medium">{person.relationship}</div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {person.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Enrollment Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider font-mono">
                  Enroll New Face Profile
                </h4>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo Preview / Capture */}
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-zinc-700 rounded-2xl bg-zinc-950/60 text-center">
                  {photoUrl ? (
                    <div className="relative">
                      <img
                        src={photoUrl}
                        alt="Face snapshot"
                        className="w-32 h-32 object-cover rounded-xl border border-emerald-500/50 shadow-lg"
                      />
                      <button
                        onClick={() => setPhotoUrl('')}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-8 h-8 text-zinc-500" />
                      <span className="text-xs text-zinc-400">Select or snap a photo of this person</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    {currentFrameBase64 && (
                      <button
                        type="button"
                        onClick={handleCaptureCurrentFrame}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Snap Camera</span>
                      </button>
                    )}

                    <label className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sarah Miller"
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Relationship</label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
                    >
                      <option value="Sister">Sister</option>
                      <option value="Brother">Brother</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague / Co-worker</option>
                      <option value="Guide">Guide / Assistant</option>
                      <option value="Doctor">Doctor / Caregiver</option>
                      <option value="Neighbor">Neighbor</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-400">Appearance Notes & Traits</label>
                      {photoUrl && name && (
                        <button
                          type="button"
                          onClick={handleGenerateAIDescriptor}
                          disabled={isEnrollingAI}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{isEnrollingAI ? 'Generating...' : 'Auto-Extract with AI'}</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Short dark hair, wears tortoiseshell glasses, warm voice."
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePerson}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                >
                  Save Person to Directory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
