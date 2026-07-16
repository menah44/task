"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Layout, FileText, CheckCircle, HelpCircle } from "lucide-react";
import apiClient from "@/lib/api/client";
import { useTranslation } from "react-i18next";

// Types
interface Template {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

// Mock templates
const TEMPLATES: Template[] = [
  { id: "t-01", nameKey: "newForm.templateContactName", descriptionKey: "newForm.templateContactDesc", icon: <FileText className="w-6 h-6 text-primary" /> },
  { id: "t-02", nameKey: "newForm.templateSurveyName", descriptionKey: "newForm.templateSurveyDesc", icon: <Layout className="w-6 h-6 text-primary" /> },
  { id: "t-03", nameKey: "newForm.templateJobName", descriptionKey: "newForm.templateJobDesc", icon: <CheckCircle className="w-6 h-6 text-success" /> },
  { id: "t-04", nameKey: "newForm.templateEventName", descriptionKey: "newForm.templateEventDesc", icon: <HelpCircle className="w-6 h-6 text-warning" /> },
];

// Moved inside component to use translation hook
const getTemplateStructures = (t: any): Record<string, any[]> => ({
  "t-01": [
    {
      id: "sec-contact",
      title: t("newForm.contactInfo"),
      questions: [
        { id: "q-1", type: "text", label: t("newForm.fullName"), required: true, placeholder: t("newForm.enterFullName") },
        { id: "q-2", type: "email", label: t("newForm.emailAddress"), required: true, placeholder: t("newForm.emailPlaceholder") },
        { id: "q-3", type: "text", label: t("newForm.phoneNumber"), required: false, placeholder: t("newForm.phonePlaceholder") },
        { id: "q-4", type: "text", label: t("newForm.subject"), required: true, placeholder: t("newForm.subjectPlaceholder") },
        { id: "q-5", type: "textarea", label: t("newForm.message"), required: true, placeholder: t("newForm.messagePlaceholder") }
      ]
    }
  ],
  "t-02": [
    {
      id: "sec-survey-1",
      title: t("newForm.basicInfo"),
      questions: [
        { id: "q-1", type: "text", label: t("newForm.fullName"), required: true, placeholder: t("newForm.enterFullName") },
        { id: "q-2", type: "email", label: t("newForm.emailAddress"), required: true, placeholder: t("newForm.emailPlaceholder") },
      ]
    },
    {
      id: "sec-survey-2",
      title: t("newForm.feedback"),
      questions: [
        { id: "q-3", type: "number", label: t("newForm.satisfaction"), required: true, placeholder: t("newForm.satisfactionPlaceholder") },
        { id: "q-4", type: "textarea", label: t("newForm.howSatisfied"), required: true, placeholder: t("newForm.howSatisfiedPlaceholder") },
        { id: "q-5", type: "textarea", label: t("newForm.likedMost"), required: false, placeholder: t("newForm.likedMostPlaceholder") },
        { id: "q-6", type: "textarea", label: t("newForm.canImprove"), required: false, placeholder: t("newForm.canImprovePlaceholder") },
        { id: "q-7", type: "radio", label: t("newForm.recommend"), required: true, options: [t("newForm.yes"), t("newForm.no")] },
        { id: "q-8", type: "textarea", label: t("newForm.additionalComments"), required: false, placeholder: t("newForm.additionalCommentsPlaceholder") }
      ]
    }
  ],
  "t-03": [
    {
      id: "sec-job-1",
      title: t("newForm.personalInfo"),
      questions: [
        { id: "q-1", type: "text", label: t("newForm.fullName"), required: true, placeholder: t("newForm.enterFullName") },
        { id: "q-2", type: "email", label: t("newForm.emailAddress"), required: true, placeholder: t("newForm.emailPlaceholder") },
        { id: "q-3", type: "text", label: t("newForm.phoneNumber"), required: true, placeholder: t("newForm.phonePlaceholder") },
        { id: "q-4", type: "text", label: t("newForm.address"), required: true, placeholder: t("newForm.addressPlaceholder") },
        { id: "q-5", type: "date", label: t("newForm.dob"), required: true }
      ]
    },
    {
      id: "sec-job-2",
      title: t("newForm.profDetails"),
      questions: [
        { id: "q-6", type: "text", label: t("newForm.position"), required: true, placeholder: t("newForm.positionPlaceholder") },
        { id: "q-7", type: "number", label: t("newForm.yoe"), required: true, placeholder: t("newForm.yoePlaceholder") },
        { id: "q-8", type: "textarea", label: t("newForm.education"), required: true, placeholder: t("newForm.educationPlaceholder") },
        { id: "q-9", type: "textarea", label: t("newForm.skills"), required: true, placeholder: t("newForm.skillsPlaceholder") },
        { id: "q-10", type: "file", label: t("newForm.uploadResume"), required: true },
        { id: "q-11", type: "textarea", label: t("newForm.whyJoin"), required: true, placeholder: t("newForm.whyJoinPlaceholder") }
      ]
    }
  ],
  "t-04": [
    {
      id: "sec-event-1",
      title: t("newForm.attendeeInfo"),
      questions: [
        { id: "q-1", type: "text", label: t("newForm.fullName"), required: true, placeholder: t("newForm.enterFullName") },
        { id: "q-2", type: "email", label: t("newForm.emailAddress"), required: true, placeholder: t("newForm.emailPlaceholder") },
        { id: "q-3", type: "text", label: t("newForm.phoneNumber"), required: true, placeholder: t("newForm.phonePlaceholder") },
        { id: "q-4", type: "text", label: t("newForm.company"), required: false, placeholder: t("newForm.companyPlaceholder") },
        { id: "q-5", type: "text", label: t("newForm.jobTitle"), required: false, placeholder: t("newForm.jobTitlePlaceholder") }
      ]
    },
    {
      id: "sec-event-2",
      title: t("newForm.eventDetails"),
      questions: [
        { id: "q-6", type: "number", label: t("newForm.numAttendees"), required: true, placeholder: t("newForm.numAttendeesPlaceholder") },
        { id: "q-7", type: "textarea", label: t("newForm.dietary"), required: false, placeholder: t("newForm.dietaryPlaceholder") },
        { id: "q-8", type: "textarea", label: t("newForm.specialReq"), required: false, placeholder: t("newForm.specialReqPlaceholder") },
        { id: "q-9", type: "radio", label: t("newForm.needParking"), required: true, options: [t("newForm.yes"), t("newForm.no")] },
        { id: "q-10", type: "textarea", label: t("newForm.additionalNotes"), required: false, placeholder: t("newForm.additionalNotesPlaceholder") }
      ]
    }
  ]
});

export default function NewFormPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<"choose" | "template">("choose");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Create empty (Blank) form
  const handleCreateBlank = async () => {
    if (!formTitle.trim()) {
      setError(t("newForm.enterTitle"));
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/forms", { title: formTitle });
      router.push(`/studio/forms/${res.data.id}/builder`);
    } catch {
      setError(t("newForm.failedCreate"));
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
      const templateItem = TEMPLATES.find(t => t.id === selectedTemplate);
      const title = formTitle || (templateItem ? t(templateItem.nameKey) : "");
      const res = await apiClient.post(`/forms`, { title });
      
      const templateStructures = getTemplateStructures(t);
      const structure = templateStructures[selectedTemplate];
      if (structure) {
        await apiClient.put(`/forms/${res.data.id}`, { sections: structure });
      }
      
      router.push(`/studio/forms/${res.data.id}/builder`);
    } catch {
      setError(t("newForm.failedCreateTemplate"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="hidden" /> {/* Dummy element to satisfy Next.js auto-scroll logic */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-[24px] border border-border w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border/60">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("newForm.title")}</h2>
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
            <p className="text-base text-muted-foreground">{t("newForm.howToStart")}</p>

            {/* Form Title Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                {t("newForm.formTitle")}
              </label>
              <input
                type="text"
                placeholder={t("newForm.formTitlePlaceholder")}
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
                  <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors tracking-tight">{t("newForm.startBlank")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("newForm.buildFromScratch")}</p>
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
                  <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors tracking-tight">{t("newForm.useTemplate")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("newForm.startFromPreMade")}</p>
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
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("newForm.back")}
            </button>

            <p className="text-sm font-medium text-muted-foreground">{t("newForm.pickTemplate")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pe-1">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`text-start p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted0/5 flex items-center justify-center border border-border">
                    {template.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{t(template.nameKey)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t(template.descriptionKey)}</p>
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
              {isLoading ? t("newForm.creating") : t("newForm.createFromTemplateBtn")}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 bg-muted/30 border-t border-border/60 text-sm text-muted-foreground text-center">
          {t("newForm.renameLaterInfo")}
        </div>
      </div>
    </div>
    </>
  );
}
