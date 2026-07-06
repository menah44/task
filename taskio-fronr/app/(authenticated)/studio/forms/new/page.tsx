"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Layout, FileText, CheckCircle, HelpCircle } from "lucide-react";
import apiClient from "@/lib/api/client";

// Types
interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// Mock templates
const TEMPLATES: Template[] = [
  { id: "t-01", name: "Contact Form", description: "Simple contact form with name, email, message", icon: <FileText className="w-6 h-6 text-blue-400" /> },
  { id: "t-02", name: "Survey Form", description: "Multi-step survey with rating scales", icon: <Layout className="w-6 h-6 text-purple-400" /> },
  { id: "t-03", name: "Job Application", description: "Full job application with file upload", icon: <CheckCircle className="w-6 h-6 text-green-400" /> },
  { id: "t-04", name: "Event Registration", description: "Event sign-up with attendance options", icon: <HelpCircle className="w-6 h-6 text-yellow-400" /> },
];

export default function NewFormPage() {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "template">("choose");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Create empty (Blank) form
  const handleCreateBlank = async () => {
    if (!formTitle.trim()) {
      setError("Please enter a form title.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/forms", { title: formTitle });
      router.push(`/studio/forms/${res.data.id}/builder`);
    } catch {
      setError("Failed to create form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Create form from Template
  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;
    setIsLoading(true);
    setError("");
    try {
      const title = formTitle || TEMPLATES.find(t => t.id === selectedTemplate)?.name;
      const res = await apiClient.post(`/forms`, { title });
      // In reality you would copy template elements, but for now we just create a blank form with that title.
      router.push(`/studio/forms/${res.data.id}/builder`);
    } catch {
      setError("Failed to create form from template.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" dir="ltr">
      <div className="bg-[#161b22] rounded-3xl border border-[#30363d] w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#30363d]">
          <h2 className="text-xl font-bold text-white">Create New Form</h2>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Step 1: Choose blank or template */}
        {step === "choose" && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-gray-400">How would you like to start building your form?</p>

            {/* Form Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Form Title
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly Performance Feedback"
                value={formTitle}
                onChange={(e) => { setFormTitle(e.target.value); setError(""); }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Start Blank */}
              <button
                onClick={handleCreateBlank}
                disabled={isLoading}
                className="flex flex-col items-center justify-center gap-3 p-8 border border-dashed border-[#30363d] rounded-2xl bg-[#0d1117] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-blue-400 transition-colors">Start Blank</p>
                  <p className="text-xs text-gray-400 mt-1">Build from scratch</p>
                </div>
              </button>

              {/* Use Template */}
              <button
                onClick={() => setStep("template")}
                className="flex flex-col items-center justify-center gap-3 p-8 border border-dashed border-[#30363d] rounded-2xl bg-[#0d1117] hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group text-center"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Layout className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-purple-400 transition-colors">Use Template</p>
                  <p className="text-xs text-gray-400 mt-1">Start from pre-made cards</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Template */}
        {step === "template" && (
          <div className="p-6 space-y-4">
            <button
              onClick={() => setStep("choose")}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <p className="text-sm font-medium text-gray-300">Pick a template to start with:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    selectedTemplate === template.id
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-[#30363d] bg-[#0d1117] hover:border-purple-500/30 hover:bg-purple-500/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-500/5 flex items-center justify-center border border-[#30363d]">
                    {template.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{template.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Confirm Template */}
            <button
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplate || isLoading}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all border ${
                selectedTemplate
                  ? "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md"
                  : "bg-[#21262d] border-[#30363d] text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Creating..." : "Create from Template →"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0d1117] border-t border-[#30363d] text-xs text-gray-400 text-center">
          You can always rename the form title later in the builder editor.
        </div>
      </div>
    </div>
  );
}
