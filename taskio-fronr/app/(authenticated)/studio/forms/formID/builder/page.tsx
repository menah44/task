"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ======================== Types ========================
type QuestionType = "text" | "textarea" | "radio" | "checkbox" | "select" | "date" | "number" | "email";

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

// ======================== Question Types ========================
const QUESTION_TYPES: { type: QuestionType; label: string; icon: string }[] = [
  { type: "text", label: "Short Text", icon: "📝" },
  { type: "textarea", label: "Long Text", icon: "📄" },
  { type: "radio", label: "Multiple Choice", icon: "🔘" },
  { type: "checkbox", label: "Checkboxes", icon: "☑️" },
  { type: "select", label: "Dropdown", icon: "🔽" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "number", label: "Number", icon: "🔢" },
  { type: "email", label: "Email", icon: "📧" },
];

// ======================== Mock Initial Data ========================
const INITIAL_SECTIONS: Section[] = [
  {
    id: "sec-1",
    title: "Personal Information",
    questions: [
      { id: "q-1", type: "text", label: "Full Name", required: true, placeholder: "Enter your name" },
      { id: "q-2", type: "email", label: "Email Address", required: true, placeholder: "you@example.com" },
    ],
  },
  {
    id: "sec-2",
    title: "Feedback",
    questions: [
      { id: "q-3", type: "radio", label: "How did you hear about us?", required: false, options: ["Social Media", "Friend", "Google", "Other"] },
      { id: "q-4", type: "textarea", label: "Additional Comments", required: false, placeholder: "Your feedback..." },
    ],
  },
];

// ======================== Sortable Question Item ========================
function SortableQuestion({
  question,
  isSelected,
  onClick,
}: {
  question: Question;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const qType = QUESTION_TYPES.find((t) => t.type === question.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-lg leading-none"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{qType?.icon}</span>
          <span className="text-sm font-medium text-gray-800 truncate">{question.label}</span>
          {question.required && <span className="text-red-500 text-xs">*</span>}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{qType?.label}</p>
      </div>
    </div>
  );
}

// ======================== Main Builder Page ========================
export default function FormBuilderPage({ params }: { params: { formId: string } }) {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(INITIAL_SECTIONS[0].id);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showTypePickerFor, setShowTypePickerFor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedQuestion = selectedSection?.questions.find((q) => q.id === selectedQuestionId) ?? null;

  // ── Drag End (reorder questions) ──
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== selectedSectionId) return sec;
          const oldIndex = sec.questions.findIndex((q) => q.id === active.id);
          const newIndex = sec.questions.findIndex((q) => q.id === over.id);
          const reordered = arrayMove(sec.questions, oldIndex, newIndex);

          // PUT /forms/:formId/sections/:sectionId/questions/reorder
          fetch(`/api/forms/${params.formId}/sections/${sec.id}/questions/reorder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: reordered.map((q) => q.id) }),
          }).catch(() => {});

          return { ...sec, questions: reordered };
        })
      );
    },
    [selectedSectionId, params.formId]
  );

  // ── Add Section ──
  const handleAddSection = async () => {
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      title: "New Section",
      questions: [],
    };
    try {
      await fetch(`/api/forms/${params.formId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSection.title }),
      });
    } catch {}
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setSelectedQuestionId(null);
  };

  // ── Delete Section ──
  const handleDeleteSection = async (sectionId: string) => {
    try {
      await fetch(`/api/forms/${params.formId}/sections/${sectionId}`, { method: "DELETE" });
    } catch {}
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(sections[0]?.id ?? "");
      setSelectedQuestionId(null);
    }
  };

  // ── Add Question ──
  const handleAddQuestion = async (type: QuestionType) => {
    if (!selectedSectionId) return;
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      label: `New ${QUESTION_TYPES.find((t) => t.type === type)?.label ?? "Question"}`,
      required: false,
    };
    try {
      await fetch(`/api/forms/${params.formId}/sections/${selectedSectionId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQ),
      });
    } catch {}
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId ? { ...s, questions: [...s.questions, newQ] } : s
      )
    );
    setSelectedQuestionId(newQ.id);
    setShowTypePickerFor(null);
  };

  // ── Delete Question ──
  const handleDeleteQuestion = async (questionId: string) => {
    const sec = sections.find((s) => s.id === selectedSectionId);
    if (!sec) return;
    try {
      await fetch(`/api/forms/${params.formId}/sections/${selectedSectionId}/questions/${questionId}`, {
        method: "DELETE",
      });
    } catch {}
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      )
    );
    if (selectedQuestionId === questionId) setSelectedQuestionId(null);
  };

  // ── Update Question Property ──
  const updateQuestion = (field: keyof Question, value: string | boolean | string[]) => {
    if (!selectedQuestionId) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === selectedQuestionId ? { ...q, [field]: value } : q
              ),
            }
          : s
      )
    );
  };

  // ── Save (mock) ──
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ════ LEFT PANEL: Section List ════ */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sections</h2>
          <button
            onClick={handleAddSection}
            className="text-blue-600 hover:text-blue-800 text-xl leading-none font-bold"
            title="Add section"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              onClick={() => { setSelectedSectionId(sec.id); setSelectedQuestionId(null); }}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                selectedSectionId === sec.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="truncate">{idx + 1}. {sec.title}</span>
              {sections.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec.id); }}
                  className={`opacity-0 group-hover:opacity-100 text-xs ml-1 transition-opacity ${
                    selectedSectionId === sec.id ? "text-blue-200 hover:text-white" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ════ CENTER PANEL: Question Canvas ════ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-gray-800">Form Builder</h1>
            <p className="text-xs text-gray-400">Form ID: {params.formId}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedSection ? (
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Section Title */}
              <input
                value={selectedSection.title}
                onChange={(e) =>
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === selectedSectionId ? { ...s, title: e.target.value } : s
                    )
                  )
                }
                className="w-full text-xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-1 transition-colors"
              />

              {/* Questions (Drag & Drop) */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedSection.questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {selectedSection.questions.map((q) => (
                      <div key={q.id} className="relative group">
                        <SortableQuestion
                          question={q}
                          isSelected={selectedQuestionId === q.id}
                          onClick={() => setSelectedQuestionId(q.id)}
                        />
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-gray-300 hover:text-red-500 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Question Button / Type Picker */}
              {showTypePickerFor === selectedSectionId ? (
                <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Pick Question Type</p>
                  <div className="grid grid-cols-4 gap-2">
                    {QUESTION_TYPES.map((qt) => (
                      <button
                        key={qt.type}
                        onClick={() => handleAddQuestion(qt.type)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-transparent transition-all text-center"
                      >
                        <span className="text-xl">{qt.icon}</span>
                        <span className="text-xs text-gray-600">{qt.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTypePickerFor(null)}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTypePickerFor(selectedSectionId)}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                >
                  + Add Question
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a section to start
            </div>
          )}
        </div>
      </main>

      {/* ════ RIGHT PANEL: Properties ════ */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</h2>
        </div>

        {selectedQuestion ? (
          <div className="p-4 space-y-4">
            {/* Label */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input
                value={selectedQuestion.label}
                onChange={(e) => updateQuestion("label", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={selectedQuestion.type}
                onChange={(e) => updateQuestion("type", e.target.value as QuestionType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {QUESTION_TYPES.map((qt) => (
                  <option key={qt.type} value={qt.type}>
                    {qt.icon} {qt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Placeholder */}
            {["text", "textarea", "email", "number"].includes(selectedQuestion.type) && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                <input
                  value={selectedQuestion.placeholder ?? ""}
                  onChange={(e) => updateQuestion("placeholder", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Options (radio/checkbox/select) */}
            {["radio", "checkbox", "select"].includes(selectedQuestion.type) && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Options (one per line)</label>
                <textarea
                  rows={4}
                  value={(selectedQuestion.options ?? []).join("\n")}
                  onChange={(e) => updateQuestion("options", e.target.value.split("\n"))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            {/* Required */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Required</label>
              <button
                onClick={() => updateQuestion("required", !selectedQuestion.required)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  selectedQuestion.required ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    selectedQuestion.required ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-400">Select a question to edit its properties</p>
          </div>
        )}
      </aside>
    </div>
  );
}
