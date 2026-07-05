"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
import AnswerField, {
  AnswerQuestion,
  AnswerValue,
  QuestionType as AnswerQuestionType,
} from "@/components/AnswerField";
import BuilderTopNav from "@/components/builder/BuilderTopNav";

// ============================================================
// TYPES (متطابقة مع الـ API المطلوب)
// ============================================================
export type QuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "select"
  | "date"
  | "number"
  | "email";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

// ============================================================
// HELPERS: تحويل لأنواع AnswerField
// ============================================================
function toAnswerType(type: QuestionType): AnswerQuestionType {
  switch (type) {
    case "text":
    case "textarea":
    case "email":
      return "TEXT";
    case "number":
      return "NUMBER";
    case "date":
      return "DATE";
    case "radio":
    case "select":
      return "SINGLE_CHOICE";
    case "checkbox":
      return "MULTI_CHOICE";
    default:
      return "TEXT";
  }
}

function toAnswerQuestion(q: Question): AnswerQuestion {
  return {
    id: q.id,
    type: toAnswerType(q.type),
    label: q.label,
    required: q.required,
    placeholder: q.placeholder,
    options: q.options,
  };
}

// ============================================================
// UI CONSTANTS (أنواع الأسئلة المعروضة)
// ============================================================
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

// ============================================================
// COMPONENT: سؤال قابل للسحب (Sortable)
// ============================================================
function SortableQuestion({
  question,
  isSelected,
  onClick,
}: {
  question: Question;
  isSelected: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

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
          ? "border-blue-500 bg-blue-500/10"
          : "border-[#30363d] bg-[#0d1117] hover:border-blue-500/50 hover:bg-[#1f242c]"
      }`}>
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing text-lg leading-none"
        onClick={(e) => e.stopPropagation()}>
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{qType?.icon}</span>
          <span className="text-sm font-medium text-white truncate">
            {question.label}
          </span>
          {question.required && <span className="text-red-400 text-xs">*</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{qType?.label}</p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: قسم قابل للسحب (Sortable)
// ============================================================
function SortableSection({
  section,
  index,
  isSelected,
  onClick,
  onDelete,
}: {
  section: Section;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all border ${
        isSelected
          ? "bg-blue-600/10 text-blue-400 border-blue-600/20"
          : "text-gray-300 hover:bg-[#21262d] hover:text-white border-transparent"
      }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing text-lg leading-none"
          onClick={(e) => e.stopPropagation()}>
          ⠿
        </button>
        <span className="truncate">
          {index + 1}. {section.title}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={`opacity-0 group-hover:opacity-100 text-xs ml-1 transition-opacity ${
          isSelected
            ? "text-blue-300 hover:text-white"
            : "text-gray-500 hover:text-red-400"
        }`}>
        ✕
      </button>
    </div>
  );
}

// ============================================================
// COMPONENT: معاينة النموذج (Preview Modal)
// ============================================================
function PreviewModal({
  sections,
  onClose,
}: {
  sections: Section[];
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [showValidation, setShowValidation] = useState(false);

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d]">
          <div>
            <h2 className="text-lg font-bold text-white">Form Preview</h2>
            <p className="text-xs text-gray-500">
              This is how the form will look to end users.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none transition-colors">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {sections.map((sec) => (
            <div key={sec.id} className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-[#30363d] pb-2">
                {sec.title}
              </h3>
              {sec.questions.map((q) => (
                <AnswerField
                  key={q.id}
                  question={toAnswerQuestion(q)}
                  value={answers[q.id] ?? null}
                  onChange={(val) => setAnswer(q.id, val)}
                  mode="fill"
                  showValidation={showValidation}
                />
              ))}
              {sec.questions.length === 0 && (
                <p className="text-xs text-gray-500 italic">
                  No questions in this section yet.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-[#30363d] flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Preview only — answers here are not saved.
          </p>
          <button
            onClick={() => setShowValidation(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Test Submit (Check Validation)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DATA INITIAL (بيانات افتراضية)
// ============================================================
const DEFAULT_SECTIONS: Section[] = [
  {
    id: "sec-1",
    title: "Personal Information",
    questions: [
      {
        id: "q-1",
        type: "text",
        label: "Full Name",
        required: true,
        placeholder: "Enter your full name",
      },
      {
        id: "q-2",
        type: "email",
        label: "Email Address",
        required: true,
        placeholder: "you@example.com",
      },
    ],
  },
  {
    id: "sec-2",
    title: "Feedback",
    questions: [
      {
        id: "q-3",
        type: "radio",
        label: "How did you hear about us?",
        required: false,
        options: ["Social Media", "Friend", "Google", "Other"],
      },
      {
        id: "q-4",
        type: "textarea",
        label: "Additional Comments",
        required: false,
        placeholder: "Your feedback...",
      },
    ],
  },
];

// ============================================================
// MAIN PAGE
// ============================================================
export default function FormBuilderPage() {
  const params = useParams<{ formId: string }>();
  const formId = params?.formId;

  // ===== STATE =====
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [showTypePickerFor, setShowTypePickerFor] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFieldFlash, setSavedFieldFlash] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // ===== SENSORS for Drag & Drop =====
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ===== LOAD DATA (من localStorage أو البيانات الافتراضية) =====
  useEffect(() => {
    if (!formId) {
      setError("Form ID is missing.");
      setIsLoading(false);
      return;
    }

    // محاولة استرجاع البيانات المخزنة محليًا
    const stored = localStorage.getItem(`form-${formId}`);
    let initialData: Section[];

    if (stored) {
      try {
        initialData = JSON.parse(stored);
      } catch {
        initialData = DEFAULT_SECTIONS;
      }
    } else {
      initialData = DEFAULT_SECTIONS;
    }

    setSections(initialData);
    if (initialData.length > 0) {
      setSelectedSectionId(initialData[0].id);
    }
    setIsLoading(false);
  }, [formId]);

  // ===== HELPERS =====
  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedQuestion =
    selectedSection?.questions.find((q) => q.id === selectedQuestionId) ?? null;

  // ===== حفظ البيانات في localStorage (محاكاة الـ Save) =====
  const persistToLocalStorage = useCallback(() => {
    if (formId) {
      localStorage.setItem(`form-${formId}`, JSON.stringify(sections));
    }
  }, [formId, sections]);

  // ===== ADD SECTION =====
  const handleAddSection = () => {
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      title: "New Section",
      questions: [],
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setSelectedQuestionId(null);
    persistToLocalStorage();
  };

  // ===== DELETE SECTION =====
  const handleDeleteSection = (sectionId: string) => {
    if (sections.length <= 1) {
      setError("You must have at least one section.");
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(sections[0]?.id ?? null);
      setSelectedQuestionId(null);
    }
    persistToLocalStorage();
  };

  // ===== ADD QUESTION =====
  const handleAddQuestion = (type: QuestionType) => {
    if (!selectedSectionId) return;
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      label: `New ${QUESTION_TYPES.find((t) => t.type === type)?.label ?? "Question"}`,
      required: false,
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? { ...s, questions: [...s.questions, newQ] }
          : s,
      ),
    );
    setSelectedQuestionId(newQ.id);
    setShowTypePickerFor(null);
    persistToLocalStorage();
  };

  // ===== DELETE QUESTION =====
  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedSectionId) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s,
      ),
    );
    if (selectedQuestionId === questionId) setSelectedQuestionId(null);
    persistToLocalStorage();
  };

  // ===== UPDATE QUESTION PROPERTY =====
  const updateQuestion = (
    field: keyof Question,
    value: string | boolean | string[],
  ) => {
    if (!selectedSectionId || !selectedQuestionId) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === selectedQuestionId ? { ...q, [field]: value } : q,
              ),
            }
          : s,
      ),
    );
    persistToLocalStorage();
  };

  // عند فقدان التركيز: نحاكي حفظ الخصائص (فلاش أخضر)
  const handleFieldBlur = (
    field: keyof Question,
    value: string | boolean | string[],
  ) => {
    updateQuestion(field, value);
    setSavedFieldFlash(field as string);
    setTimeout(() => setSavedFieldFlash(null), 900);
  };

  // ===== UPDATE SECTION TITLE =====
  const handleSectionTitleBlur = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    );
    persistToLocalStorage();
  };

  // ===== REORDER SECTIONS =====
  const handleReorderSections = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(sections, oldIndex, newIndex);

      setSections(reordered);
      persistToLocalStorage();
    },
    [sections],
  );

  // ===== REORDER QUESTIONS =====
  const handleReorderQuestions = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !selectedSectionId) return;

      const section = sections.find((s) => s.id === selectedSectionId);
      if (!section) return;

      const oldIndex = section.questions.findIndex((q) => q.id === active.id);
      const newIndex = section.questions.findIndex((q) => q.id === over.id);
      const reordered = arrayMove(section.questions, oldIndex, newIndex);

      setSections((prev) =>
        prev.map((s) =>
          s.id === selectedSectionId ? { ...s, questions: reordered } : s,
        ),
      );
      persistToLocalStorage();
    },
    [sections, selectedSectionId],
  );

  // ===== SAVE BUTTON (حفظ في localStorage + رسالة نجاح) =====
  const handleSave = () => {
    setIsSaving(true);
    setError(null);
    try {
      persistToLocalStorage();
      setTimeout(() => {
        setIsSaving(false);
        alert("✅ Form structure saved successfully!");
      }, 500);
    } catch (err) {
      setError("Failed to save data.");
      setIsSaving(false);
    }
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading form structure...</p>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* ═══ LEFT PANEL: Sections List ═══ */}
      <aside className="w-56 bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Sections
          </h2>
          <button
            onClick={handleAddSection}
            className="text-blue-400 hover:text-blue-300 text-xl leading-none font-bold"
            title="Add section">
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleReorderSections}>
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}>
              {sections.map((sec, idx) => (
                <SortableSection
                  key={sec.id}
                  section={sec}
                  index={idx}
                  isSelected={selectedSectionId === sec.id}
                  onClick={() => {
                    setSelectedSectionId(sec.id);
                    setSelectedQuestionId(null);
                  }}
                  onDelete={() => handleDeleteSection(sec.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {sections.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">
              No sections yet. Click + to add.
            </p>
          )}
        </div>
      </aside>

      {/* ═══ CENTER PANEL: Canvas ═══ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Shared top nav — Builder / Map / Settings tabs stay in sync across all form pages */}
        <BuilderTopNav
          formId={formId}
          subtitle={`Form ID: ${formId} — ${sections.length} sections`}
          actions={
            <>
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-1.5 bg-[#21262d] hover:bg-[#2d333b] border border-[#30363d] text-gray-200 text-sm font-medium rounded-lg transition-colors">
                👁 Preview
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                {isSaving ? "Saving..." : " Save Form"}
              </button>
            </>
          }
        />

        {/* Error Banner */}
        {error && (
          <div className="px-6 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-xs flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0d1117]">
          {selectedSection ? (
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Section Title */}
              <input
                value={selectedSection.title}
                onChange={(e) => {
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === selectedSectionId
                        ? { ...s, title: e.target.value }
                        : s,
                    ),
                  );
                }}
                onBlur={(e) =>
                  handleSectionTitleBlur(selectedSection.id, e.target.value)
                }
                className="w-full text-xl font-bold text-white bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-1 transition-colors"
              />

              {/* Questions List */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleReorderQuestions}>
                <SortableContext
                  items={selectedSection.questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}>
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
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-red-400 transition-all">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Question Button */}
              {showTypePickerFor === selectedSectionId ? (
                <div className="border border-[#30363d] rounded-xl bg-[#161b22] p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    Pick Question Type
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {QUESTION_TYPES.map((qt) => (
                      <button
                        key={qt.type}
                        onClick={() => handleAddQuestion(qt.type)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-blue-600/10 hover:border-blue-500/30 border border-transparent transition-all text-center">
                        <span className="text-xl">{qt.icon}</span>
                        <span className="text-xs text-gray-300">
                          {qt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTypePickerFor(null)}
                    className="mt-3 text-xs text-gray-500 hover:text-gray-300">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTypePickerFor(selectedSectionId)}
                  className="w-full py-2.5 border-2 border-dashed border-[#30363d] rounded-xl text-sm text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-all">
                  + Add Question
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {sections.length === 0
                ? "Add a section to start building your form."
                : "Select a section to start"}
            </div>
          )}
        </div>
      </main>

      {/* ═══ RIGHT PANEL: Properties ═══ */}
      <aside className="w-64 bg-[#161b22] border-l border-[#30363d] flex flex-col overflow-y-auto shrink-0">
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Properties
          </h2>
          {savedFieldFlash && (
            <span className="text-[10px] text-green-400 font-medium animate-pulse">
              Saved ✓
            </span>
          )}
        </div>

        {selectedQuestion ? (
          <div className="p-4 space-y-4">
            {/* Label */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Label
              </label>
              <input
                value={selectedQuestion.label}
                onChange={(e) => updateQuestion("label", e.target.value)}
                onBlur={(e) => handleFieldBlur("label", e.target.value)}
                className={`w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  savedFieldFlash === "label"
                    ? "border-green-500/50"
                    : "border-[#30363d]"
                }`}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Type
              </label>
              <select
                value={selectedQuestion.type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  updateQuestion("type", newType);
                  handleFieldBlur("type", newType);
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {QUESTION_TYPES.map((qt) => (
                  <option key={qt.type} value={qt.type}>
                    {qt.icon} {qt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Placeholder */}
            {["text", "textarea", "email", "number"].includes(
              selectedQuestion.type,
            ) && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Placeholder
                </label>
                <input
                  value={selectedQuestion.placeholder ?? ""}
                  onChange={(e) =>
                    updateQuestion("placeholder", e.target.value)
                  }
                  onBlur={(e) => handleFieldBlur("placeholder", e.target.value)}
                  className={`w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    savedFieldFlash === "placeholder"
                      ? "border-green-500/50"
                      : "border-[#30363d]"
                  }`}
                />
              </div>
            )}

            {/* Options */}
            {["radio", "checkbox", "select"].includes(
              selectedQuestion.type,
            ) && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Options (one per line)
                </label>
                <textarea
                  rows={4}
                  value={(selectedQuestion.options ?? []).join("\n")}
                  onChange={(e) =>
                    updateQuestion("options", e.target.value.split("\n"))
                  }
                  onBlur={(e) =>
                    handleFieldBlur("options", e.target.value.split("\n"))
                  }
                  className={`w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                    savedFieldFlash === "options"
                      ? "border-green-500/50"
                      : "border-[#30363d]"
                  }`}
                />
              </div>
            )}

            {/* Required */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">
                Required
              </label>
              <button
                onClick={() => {
                  const newVal = !selectedQuestion.required;
                  updateQuestion("required", newVal);
                  handleFieldBlur("required", newVal);
                }}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${
                  selectedQuestion.required ? "bg-blue-600" : "bg-[#30363d]"
                }`}>
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    selectedQuestion.required
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-gray-500">
              Select a question to edit its properties
            </p>
          </div>
        )}
      </aside>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          sections={sections}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
