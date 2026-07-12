"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { Settings2, ExternalLink, Eye, Save, Loader2 } from "lucide-react";
import AnswerField, { AnswerValue } from "@/components/AnswerField";
import BuilderTopNav from "@/components/builder/BuilderTopNav";
import apiClient from "@/lib/api/client";
import {
  ConditionalRule,
  FormStructure,
  Question,
  QuestionType,
  Section,
  readLocalFormStructure,
  writeLocalFormStructure,
} from "@/lib/types/form";
import {
  toAnswerQuestion,
  questionOptionValues,
} from "@/lib/types/forms/answerFieldAdapter";

const QUESTION_TYPES: { type: QuestionType; label: string; icon: string }[] = [
  { type: "text", label: "Short Text", icon: "📝" },
  { type: "textarea", label: "Long Text", icon: "📄" },
  { type: "radio", label: "Multiple Choice", icon: "🔘" },
  { type: "checkbox", label: "Checkboxes", icon: "☑️" },
  { type: "select", label: "Dropdown", icon: "🔽" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "number", label: "Number", icon: "🔢" },
  { type: "email", label: "Email", icon: "📧" },
  { type: "file", label: "File Upload", icon: "📎" },
];

const FILE_UPLOAD_DEFAULTS = {
  maxSizeBytes: 100 * 1024 * 1024,
  accept: "image/*,application/pdf",
};

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
          : "border-border bg-background hover:border-blue-500/50 hover:bg-muted"
      }`}>
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 text-muted-foreground hover:text-muted-foreground cursor-grab active:cursor-grabbing text-lg leading-none"
        onClick={(e) => e.stopPropagation()}>
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{qType?.icon}</span>
          <span className="text-sm font-medium text-foreground truncate">
            {question.label}
          </span>
          {question.required && <span className="text-error text-xs">*</span>}
          {question.conditional && (
            <span
              className="text-[10px] text-primary border border-purple-400/30 rounded px-1.5 py-0.5"
              title={`Shown only when another question = "${question.conditional.showWhen}"`}>
              conditional
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{qType?.label}</p>
      </div>
    </div>
  );
}

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
          ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
      }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-muted-foreground cursor-grab active:cursor-grabbing text-lg leading-none"
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
            ? "text-blue-300 hover:text-foreground"
            : "text-muted-foreground hover:text-error"
        }`}>
        ✕
      </button>
    </div>
  );
}

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
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Form Preview</h2>
            <p className="text-xs text-muted-foreground">
              This is how the form will look to end users. Conditional logic is
              live here too.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none transition-colors">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {sections.map((sec) => {
            const visible = sec.questions.filter((q) => {
              if (!q.conditional) return true;
              const depVal = answers[q.conditional.dependsOn];
              return String(depVal ?? "") === q.conditional.showWhen;
            });
            return (
              <div key={sec.id} className="space-y-4">
                <h3 className="text-base font-bold text-foreground border-b border-border pb-2">
                  {sec.title}
                </h3>
                {visible.map((q) => (
                  <AnswerField
                    key={q.id}
                    question={toAnswerQuestion(q)}
                    value={answers[q.id] ?? null}
                    onChange={(val) => setAnswer(q.id, val)}
                    mode="fill"
                    showValidation={showValidation}
                  />
                ))}
                {visible.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No questions to show in this section yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Preview only — answers here are not saved.
          </p>
          <button
            onClick={() => setShowValidation(true)}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-medium rounded-lg transition-colors">
            Test Submit (Check Validation)
          </button>
        </div>
      </div>
    </div>
  );
}

function FormSettingsPopover({
  title,
  description,
  showProgress,
  hasBoundary,
  onChange,
  onClose,
}: {
  title: string;
  description: string;
  showProgress: boolean;
  hasBoundary: boolean;
  onChange: (
    patch: Partial<{
      title: string;
      description: string;
      showProgress: boolean;
      hasBoundary: boolean;
    }>,
  ) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Form Settings</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-lg leading-none">
          ×
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Description
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Show progress bar</p>
          <p className="text-[11px] text-muted-foreground">
            Section X of Y + % on the fill page
          </p>
        </div>
        <button
          onClick={() => onChange({ showProgress: !showProgress })}
          className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${
            showProgress ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" : "bg-accent"
          }`}>
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              showProgress ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Requires GPS location
          </p>
          <p className="text-[11px] text-muted-foreground">
            Captures respondent's location; attached on submit
          </p>
        </div>
        <button
          onClick={() => onChange({ hasBoundary: !hasBoundary })}
          className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${
            hasBoundary ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" : "bg-accent"
          }`}>
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              hasBoundary ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

const DEFAULT_FORM: FormStructure = {
  id: crypto.randomUUID(),
  title: "Untitled Form",
  description: "",
  showProgress: true,
  hasBoundary: false,
  sections: [],
};

export default function FormBuilderPage() {
  const params = useParams<{ formId: string }>();
  const formId = params?.formId;

  const [title, setTitle] = useState(DEFAULT_FORM.title);
  const [description, setDescription] = useState(
    DEFAULT_FORM.description ?? "",
  );
  const [showProgress, setShowProgress] = useState(DEFAULT_FORM.showProgress);
  const [hasBoundary, setHasBoundary] = useState(DEFAULT_FORM.hasBoundary);
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
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!formId) {
      setError("Form ID is missing.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await apiClient.get(`/forms/${formId}/structure`);
        const data = res.data;
        // Always use title/description/settings from the API — never overwrite with localStorage
        setTitle(data.title);
        setDescription(data.description ?? "");
        setShowProgress(data.showProgress);
        setHasBoundary(data.hasBoundary);

        if (data.sections && data.sections.length > 0) {
          setSections(data.sections);
          setSelectedSectionId(data.sections[0].id);
        } else {
          // No sections saved yet — try localStorage for draft sections only
          const stored = readLocalFormStructure(formId);
          const sections = stored?.sections ?? DEFAULT_FORM.sections;
          setSections(sections);
          if (sections.length > 0) {
            setSelectedSectionId(sections[0].id);
          }
        }
      } catch {
        const stored = readLocalFormStructure(formId);
        const initial = stored ?? DEFAULT_FORM;
        setTitle(initial.title);
        setDescription(initial.description ?? "");
        setShowProgress(initial.showProgress);
        setHasBoundary(initial.hasBoundary);
        setSections(initial.sections);
        if (initial.sections.length > 0) {
          setSelectedSectionId(initial.sections[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [formId]);

  useEffect(() => {
    if (!formId || isLoading) return;
    writeLocalFormStructure(formId, {
      title,
      description,
      showProgress,
      hasBoundary,
      sections,
    });
  }, [
    formId,
    isLoading,
    title,
    description,
    showProgress,
    hasBoundary,
    sections,
  ]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedQuestion =
    selectedSection?.questions.find((q) => q.id === selectedQuestionId) ?? null;

  const allQuestions = useMemo(
    () =>
      sections.flatMap((s) =>
        s.questions.map((q) => ({ ...q, sectionTitle: s.title })),
      ),
    [sections],
  );

  const conditionalDependsOnQuestion = selectedQuestion?.conditional
    ? allQuestions.find((q) => q.id === selectedQuestion.conditional!.dependsOn)
    : undefined;

  const handleAddSection = () => {
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      title: "New Section",
      questions: [],
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setSelectedQuestionId(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length <= 1) {
      setError("You must have at least one section.");
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (selectedSectionId === sectionId) {
      const remaining = sections.filter((s) => s.id !== sectionId);
      setSelectedSectionId(remaining[0]?.id ?? null);
      setSelectedQuestionId(null);
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    if (!selectedSectionId) return;
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      label: `New ${QUESTION_TYPES.find((t) => t.type === type)?.label ?? "Question"}`,
      required: false,
      ...(type === "file"
        ? {
            maxSizeBytes: FILE_UPLOAD_DEFAULTS.maxSizeBytes,
            accept: FILE_UPLOAD_DEFAULTS.accept,
          }
        : {}),
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
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedSectionId) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? {
              ...s,
              questions: s.questions.filter((q) => q.id !== questionId),
            }
          : s,
      ),
    );
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        questions: s.questions.map((q) =>
          q.conditional?.dependsOn === questionId
            ? { ...q, conditional: undefined }
            : q,
        ),
      })),
    );
    if (selectedQuestionId === questionId) setSelectedQuestionId(null);
  };

  const updateQuestion = (
    field: keyof Question,
    value: string | boolean | string[] | number | ConditionalRule | undefined,
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
  };

  const handleFieldBlur = (
    field: keyof Question,
    value: string | boolean | string[] | number,
  ) => {
    updateQuestion(field, value);
    setSavedFieldFlash(field as string);
    setTimeout(() => setSavedFieldFlash(null), 900);
  };

  const handleConditionalDependsOnChange = (dependsOn: string) => {
    if (!dependsOn) {
      updateQuestion("conditional", undefined);
      return;
    }
    updateQuestion("conditional", { dependsOn, showWhen: "" });
  };

  const handleConditionalShowWhenChange = (showWhen: string) => {
    if (!selectedQuestion?.conditional) return;
    updateQuestion("conditional", {
      dependsOn: selectedQuestion.conditional.dependsOn,
      showWhen,
    });
  };

  const handleSectionTitleBlur = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    );
  };

  const handleReorderSections = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      setSections((prev) => arrayMove(prev, oldIndex, newIndex));
    },
    [sections],
  );

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
    },
    [sections, selectedSectionId],
  );

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (formId) {
        writeLocalFormStructure(formId, {
          title,
          description,
          showProgress,
          hasBoundary,
          sections,
        });

        await apiClient.put(`/forms/${formId}`, {
          title,
          description,
          settings: {
            hasBoundary,
            showProgress,
          },
          sections: sections.map(sec => ({
            title: sec.title,
            questions: sec.questions.map(q => ({
              type: q.type,
              label: q.label,
              required: q.required,
              placeholder: q.placeholder,
              options: q.options,
            }))
          }))
        });
      }
      setIsSaving(false);
      alert("✅ Form structure saved successfully!");
    } catch (err) {
      setError("Failed to save data.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading form structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-56 bg-card border-r border-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sections
          </h2>
          <button
            onClick={handleAddSection}
            className="text-primary hover:text-primary/80 text-xl leading-none font-bold"
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
            <p className="text-xs text-muted-foreground text-center py-4">
              No sections yet. Click + to add.
            </p>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <BuilderTopNav
          formId={formId}
          subtitle={`Form ID: ${formId} — ${sections.length} sections`}
          actions={
            <>
              <div className="relative">
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  title="Form settings"
                  aria-label="Form settings"
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                    showSettings
                      ? "bg-muted border-blue-500/40 text-primary"
                      : "bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                  <Settings2 className="w-4 h-4" />
                </button>
                {showSettings && (
                  <FormSettingsPopover
                    title={title}
                    description={description}
                    showProgress={showProgress}
                    hasBoundary={hasBoundary}
                    onChange={(patch) => {
                      if (patch.title !== undefined) setTitle(patch.title);
                      if (patch.description !== undefined)
                        setDescription(patch.description);
                      if (patch.showProgress !== undefined)
                        setShowProgress(patch.showProgress);
                      if (patch.hasBoundary !== undefined)
                        setHasBoundary(patch.hasBoundary);
                    }}
                    onClose={() => setShowSettings(false)}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/studio/forms/${formId}/fill`}
                  className="flex items-center gap-1.5 h-9 px-3.5 bg-transparent hover:bg-muted border border-border text-muted-foreground hover:text-foreground text-sm font-medium rounded-lg transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Fill Form
                </Link>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 h-9 px-3.5 bg-transparent hover:bg-muted border border-border text-muted-foreground hover:text-foreground text-sm font-medium rounded-lg transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>

              <div className="w-px h-6 bg-accent" />

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Form
                  </>
                )}
              </button>
            </>
          }
        />

        {error && (
          <div className="px-6 py-2 bg-warning/15 border-b border-warning/20 text-warning text-xs flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {selectedSection ? (
            <div className="max-w-2xl mx-auto space-y-3">
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
                className="w-full text-xl font-bold text-foreground bg-transparent border-b-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background focus:outline-none pb-1 transition-colors"
              />

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
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-error transition-all">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {showTypePickerFor === selectedSectionId ? (
                <div className="border border-border rounded-xl bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Pick Question Type
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {QUESTION_TYPES.map((qt) => (
                      <button
                        key={qt.type}
                        onClick={() => handleAddQuestion(qt.type)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm/10 hover:border-blue-500/30 border border-transparent transition-all text-center">
                        <span className="text-xl">{qt.icon}</span>
                        <span className="text-xs text-muted-foreground">
                          {qt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTypePickerFor(null)}
                    className="mt-3 text-xs text-muted-foreground hover:text-muted-foreground">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTypePickerFor(selectedSectionId)}
                  className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-blue-500/50 hover:text-primary/80 transition-all">
                  + Add Question
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {sections.length === 0
                ? "Add a section to start building your form."
                : "Select a section to start"}
            </div>
          )}
        </div>
      </main>

      <aside className="w-64 bg-card border-l border-border flex flex-col overflow-y-auto shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Properties
          </h2>
          {savedFieldFlash && (
            <span className="text-[10px] text-success font-medium animate-pulse">
              Saved ✓
            </span>
          )}
        </div>

        {selectedQuestion ? (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Label
              </label>
              <input
                value={selectedQuestion.label}
                onChange={(e) => updateQuestion("label", e.target.value)}
                onBlur={(e) => handleFieldBlur("label", e.target.value)}
                className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  savedFieldFlash === "label"
                    ? "border-green-500/50"
                    : "border-border"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Type
              </label>
              <select
                value={selectedQuestion.type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  updateQuestion("type", newType);
                  handleFieldBlur("type", newType);
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                {QUESTION_TYPES.map((qt) => (
                  <option key={qt.type} value={qt.type}>
                    {qt.icon} {qt.label}
                  </option>
                ))}
              </select>
            </div>

            {["text", "textarea", "email", "number"].includes(
              selectedQuestion.type,
            ) && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Placeholder
                </label>
                <input
                  value={selectedQuestion.placeholder ?? ""}
                  onChange={(e) =>
                    updateQuestion("placeholder", e.target.value)
                  }
                  onBlur={(e) => handleFieldBlur("placeholder", e.target.value)}
                  className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    savedFieldFlash === "placeholder"
                      ? "border-green-500/50"
                      : "border-border"
                  }`}
                />
              </div>
            )}

            {["radio", "checkbox", "select"].includes(
              selectedQuestion.type,
            ) && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
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
                  className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                    savedFieldFlash === "options"
                      ? "border-green-500/50"
                      : "border-border"
                  }`}
                />
              </div>
            )}

            {selectedQuestion.type === "file" && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Max file size (MB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={Math.round(
                      (selectedQuestion.maxSizeBytes ??
                        FILE_UPLOAD_DEFAULTS.maxSizeBytes) /
                        (1024 * 1024),
                    )}
                    onChange={(e) => {
                      const mb = Math.min(
                        100,
                        Math.max(1, Number(e.target.value) || 1),
                      );
                      updateQuestion("maxSizeBytes", mb * 1024 * 1024);
                    }}
                    onBlur={(e) => {
                      const mb = Math.min(
                        100,
                        Math.max(1, Number(e.target.value) || 1),
                      );
                      handleFieldBlur("maxSizeBytes", mb * 1024 * 1024);
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Hard cap is 100MB per the platform upload limit.
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Accepted file types: images and PDF (fixed).
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Required
              </label>
              <button
                onClick={() => {
                  const newVal = !selectedQuestion.required;
                  updateQuestion("required", newVal);
                  handleFieldBlur("required", newVal);
                }}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${
                  selectedQuestion.required ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" : "bg-accent"
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

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Conditional Logic
                </label>
                {selectedQuestion.conditional && (
                  <button
                    onClick={() => handleConditionalDependsOnChange("")}
                    className="text-[10px] text-error hover:text-red-300">
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Only show this question when another question has a specific
                answer.
              </p>

              <select
                value={selectedQuestion.conditional?.dependsOn ?? ""}
                onChange={(e) =>
                  handleConditionalDependsOnChange(e.target.value)
                }
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2">
                <option value="">Always show</option>
                {allQuestions
                  .filter((q) => q.id !== selectedQuestion.id)
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.sectionTitle} — {q.label}
                    </option>
                  ))}
              </select>

              {selectedQuestion.conditional?.dependsOn &&
                (() => {
                  const optionValues = conditionalDependsOnQuestion
                    ? questionOptionValues(conditionalDependsOnQuestion)
                    : null;
                  return optionValues ? (
                    <select
                      value={selectedQuestion.conditional.showWhen}
                      onChange={(e) =>
                        handleConditionalShowWhenChange(e.target.value)
                      }
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select a value…</option>
                      {optionValues.map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={selectedQuestion.conditional.showWhen}
                      onChange={(e) =>
                        handleConditionalShowWhenChange(e.target.value)
                      }
                      placeholder="Exact answer value…"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  );
                })()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Select a question to edit its properties
            </p>
          </div>
        )}
      </aside>

      {showPreview && (
        <PreviewModal
          sections={sections}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

