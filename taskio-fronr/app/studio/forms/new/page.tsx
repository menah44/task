"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Types
interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Mock templates - هيتبدل بـ API لما يكون جاهز
const TEMPLATES: Template[] = [
  { id: "t-01", name: "Contact Form", description: "Simple contact form with name, email, message", icon: "📋" },
  { id: "t-02", name: "Survey", description: "Multi-step survey with rating scales", icon: "📊" },
  { id: "t-03", name: "Job Application", description: "Full job application with file upload", icon: "💼" },
  { id: "t-04", name: "Event Registration", description: "Event sign-up with attendance options", icon: "🎟️" },
];

export default function NewFormPage() {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "template">("choose");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // إنشاء فورم فاضي (Blank)
  const handleCreateBlank = async () => {
    if (!formTitle.trim()) {
      setError("Please enter a form title.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/studio/forms/${data.id}/builder`);
      } else {
        // Mock navigation لو الـ API مش جاهز
        router.push(`/studio/forms/new-form/builder`);
      }
    } catch {
      // Mock navigation لو الـ Backend مش شغال
      router.push(`/studio/forms/new-form/builder`);
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء فورم من Template
  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/templates/${selectedTemplate}/create-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle || TEMPLATES.find(t => t.id === selectedTemplate)?.name }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/studio/forms/${data.id}/builder`);
      } else {
        router.push(`/studio/forms/new-form/builder`);
      }
    } catch {
      router.push(`/studio/forms/new-form/builder`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Form</h2>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors">
            ×
          </button>
        </div>

        {/* Step 1: Choose blank or template */}
        {step === "choose" && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500">How do you want to start?</p>

            {/* Form Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Title
              </label>
              <input
                type="text"
                placeholder="Enter form title..."
                value={formTitle}
                onChange={(e) => { setFormTitle(e.target.value); setError(""); }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Blank */}
              <button
                onClick={handleCreateBlank}
                disabled={isLoading}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                <span className="text-4xl">📄</span>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 group-hover:text-blue-700">Start Blank</p>
                  <p className="text-xs text-gray-500 mt-1">Build from scratch</p>
                </div>
              </button>

              {/* From Template */}
              <button
                onClick={() => setStep("template")}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
                <span className="text-4xl">🗂️</span>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 group-hover:text-purple-700">Use Template</p>
                  <p className="text-xs text-gray-500 mt-1">Start with a template</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pick a template */}
        {step === "template" && (
          <div className="p-6 space-y-4">
            <button
              onClick={() => setStep("choose")}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
              ← Back
            </button>

            <p className="text-sm font-medium text-gray-700">Pick a template:</p>

            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate === template.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}>
                  <span className="text-2xl">{template.icon}</span>
                  <p className="font-semibold text-sm text-gray-800 mt-2">{template.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                </button>
              ))}
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplate || isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedTemplate
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}>
              {isLoading ? "Creating..." : "Create from Template →"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
          You can always change the form title later in the builder.
        </div>
      </div>
    </div>
  );
}
