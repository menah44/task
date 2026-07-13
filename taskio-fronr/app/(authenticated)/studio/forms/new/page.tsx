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
  { id: "t-01", name: "Contact Form", description: "Simple contact form with name, email, message", icon: <FileText className="w-6 h-6 text-primary" /> },
  { id: "t-02", name: "Survey Form", description: "Multi-step survey with rating scales", icon: <Layout className="w-6 h-6 text-primary" /> },
  { id: "t-03", name: "Job Application", description: "Full job application with file upload", icon: <CheckCircle className="w-6 h-6 text-success" /> },
  { id: "t-04", name: "Event Registration", description: "Event sign-up with attendance options", icon: <HelpCircle className="w-6 h-6 text-warning" /> },
];

const TEMPLATE_STRUCTURES: Record<string, any[]> = {
  "t-01": [
    {
      id: "sec-contact",
      title: "Contact Information",
      questions: [
        { id: "q-1", type: "text", label: "Full Name", required: true, placeholder: "Enter your full name" },
        { id: "q-2", type: "email", label: "Email Address", required: true, placeholder: "you@example.com" },
        { id: "q-3", type: "text", label: "Phone Number", required: false, placeholder: "e.g., +1 234 567 8900" },
        { id: "q-4", type: "text", label: "Subject", required: true, placeholder: "What is this regarding?" },
        { id: "q-5", type: "textarea", label: "Message", required: true, placeholder: "Type your message here..." }
      ]
    }
  ],
  "t-02": [
    {
      id: "sec-survey-1",
      title: "Basic Info",
      questions: [
        { id: "q-1", type: "text", label: "Full Name", required: true, placeholder: "Enter your full name" },
        { id: "q-2", type: "email", label: "Email Address", required: true, placeholder: "you@example.com" },
      ]
    },
    {
      id: "sec-survey-2",
      title: "Feedback",
      questions: [
        { id: "q-3", type: "number", label: "Overall satisfaction (1-5)", required: true, placeholder: "1 = Poor, 5 = Excellent" },
        { id: "q-4", type: "textarea", label: "How satisfied are you with our service?", required: true, placeholder: "Please explain..." },
        { id: "q-5", type: "textarea", label: "What did you like the most?", required: false, placeholder: "Share your thoughts" },
        { id: "q-6", type: "textarea", label: "What can we improve?", required: false, placeholder: "Let us know how we can do better" },
        { id: "q-7", type: "radio", label: "Would you recommend us to others?", required: true, options: ["Yes", "No"] },
        { id: "q-8", type: "textarea", label: "Additional comments", required: false, placeholder: "Any other feedback?" }
      ]
    }
  ],
  "t-03": [
    {
      id: "sec-job-1",
      title: "Personal Information",
      questions: [
        { id: "q-1", type: "text", label: "Full Name", required: true, placeholder: "Enter your full name" },
        { id: "q-2", type: "email", label: "Email Address", required: true, placeholder: "you@example.com" },
        { id: "q-3", type: "text", label: "Phone Number", required: true, placeholder: "e.g., +1 234 567 8900" },
        { id: "q-4", type: "text", label: "Address", required: true, placeholder: "Enter your home address" },
        { id: "q-5", type: "date", label: "Date of Birth", required: true }
      ]
    },
    {
      id: "sec-job-2",
      title: "Professional Details",
      questions: [
        { id: "q-6", type: "text", label: "Position Applying For", required: true, placeholder: "e.g., Frontend Developer" },
        { id: "q-7", type: "number", label: "Years of Experience", required: true, placeholder: "e.g., 5" },
        { id: "q-8", type: "textarea", label: "Education", required: true, placeholder: "University, Degree, Year" },
        { id: "q-9", type: "textarea", label: "Skills", required: true, placeholder: "List your relevant skills" },
        { id: "q-10", type: "file", label: "Upload Resume", required: true },
        { id: "q-11", type: "textarea", label: "Why do you want to join us?", required: true, placeholder: "Tell us about your motivation..." }
      ]
    }
  ],
  "t-04": [
    {
      id: "sec-event-1",
      title: "Attendee Information",
      questions: [
        { id: "q-1", type: "text", label: "Full Name", required: true, placeholder: "Enter your full name" },
        { id: "q-2", type: "email", label: "Email Address", required: true, placeholder: "you@example.com" },
        { id: "q-3", type: "text", label: "Phone Number", required: true, placeholder: "e.g., +1 234 567 8900" },
        { id: "q-4", type: "text", label: "Company / Organization", required: false, placeholder: "Your company name" },
        { id: "q-5", type: "text", label: "Job Title", required: false, placeholder: "Your title" }
      ]
    },
    {
      id: "sec-event-2",
      title: "Event Details",
      questions: [
        { id: "q-6", type: "number", label: "Number of Attendees", required: true, placeholder: "e.g., 1" },
        { id: "q-7", type: "textarea", label: "Dietary Restrictions", required: false, placeholder: "e.g., Vegan, Gluten-free" },
        { id: "q-8", type: "textarea", label: "Special Requirements", required: false, placeholder: "e.g., Wheelchair access" },
        { id: "q-9", type: "radio", label: "Do you need parking?", required: true, options: ["Yes", "No"] },
        { id: "q-10", type: "textarea", label: "Additional Notes", required: false, placeholder: "Anything else we should know?" }
      ]
    }
  ]
};

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
      
      const structure = TEMPLATE_STRUCTURES[selectedTemplate];
      if (structure) {
        await apiClient.put(`/forms/${res.data.id}`, { sections: structure });
      }
      
      router.push(`/studio/forms/${res.data.id}/builder`);
    } catch {
      setError("Failed to create form from template.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="hidden" /> {/* Dummy element to satisfy Next.js auto-scroll logic */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm" dir="ltr">
      <div className="bg-card rounded-[24px] border border-border w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border/60">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Create New Form</h2>
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Step 1: Choose blank or template */}
        {step === "choose" && (
          <div className="p-8 space-y-6">
            <p className="text-base text-muted-foreground">How would you like to start building your form?</p>

            {/* Form Title Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Form Title
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly Performance Feedback"
                value={formTitle}
                onChange={(e) => { setFormTitle(e.target.value); setError(""); }}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-all shadow-sm"
              />
              {error && <p className="text-error text-xs mt-1.5">{error}</p>}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Start Blank */}
              <button
                onClick={handleCreateBlank}
                disabled={isLoading}
                className="flex flex-col items-center justify-center gap-3 p-8 border border-border rounded-[20px] bg-background hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <div className="mt-2">
                  <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors tracking-tight">Start Blank</p>
                  <p className="text-sm text-muted-foreground mt-1">Build from scratch</p>
                </div>
              </button>

              {/* Use Template */}
              <button
                onClick={() => setStep("template")}
                className="flex flex-col items-center justify-center gap-3 p-8 border border-border rounded-[20px] bg-background hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <Layout className="w-7 h-7 text-primary" />
                </div>
                <div className="mt-2">
                  <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors tracking-tight">Use Template</p>
                  <p className="text-sm text-muted-foreground mt-1">Start from pre-made cards</p>
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
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <p className="text-sm font-medium text-muted-foreground">Pick a template to start with:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted0/5 flex items-center justify-center border border-border">
                    {template.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
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
                  ? "bg-primary border-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                  : "bg-muted border-border text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isLoading ? "Creating..." : "Create from Template →"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 bg-muted/30 border-t border-border/60 text-sm text-muted-foreground text-center">
          You can always rename the form title later in the builder editor.
        </div>
      </div>
    </div>
    </>
  );
}
