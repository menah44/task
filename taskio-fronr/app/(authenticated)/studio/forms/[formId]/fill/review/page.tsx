"use client";

/**
 * Route: /forms/:id/fill/review
 *
 * ASSUMPTIONS — please adjust to match your real setup:
 *
 * 1. API client: I couldn't see your shared fetch wrapper, so this file
 *    imports a placeholder `apiClient` from '@/lib/api-client'. Swap the
 *    import path below for your real client once you share it. It's expected
 *    to expose `.get<T>(url)` and `.post<T>(url, body?)` and to already
 *    attach auth headers.
 *
 * 2. Submit endpoint: not specified in the ticket, so `submitResponse()`
 *    below is stubbed as `POST /responses/:id/submit`. Change the URL/method
 *    to match whatever you wire up.
 *
 * 3. Data shape from GET /responses/:id/full: assumed to look like
 *    `FullResponse` below (sections -> answers, each answer carrying
 *    whether it's required and its current value). Adjust the type + the
 *    `isMissing` check if your API shapes this differently.
 *
 * 4. Thank-you page: assumed to live at /forms/:id/fill/thank-you. Update
 *    the router.push target if yours is named differently.
 *
 * 5. Styling: uses styled-components. If you're on the App Router, make
 *    sure your root layout already wraps children in a
 *    StyledComponentsRegistry (Next.js's documented pattern for
 *    styled-components + App Router SSR) — this file assumes that registry
 *    already exists somewhere above it in the tree.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import apiClient from "@/lib/api/client";
import { useTranslation } from "react-i18next";

// ---------- Types ----------

interface Answer {
  questionId: string;
  label: string;
  required: boolean;
  value: string | number | boolean | string[] | null;
}

interface Section {
  id: string;
  title: string;
  answers: Answer[];
}

interface FullResponse {
  id: string;
  formTitle: string;
  sections: Section[];
}

// ---------- Helpers ----------

function isMissing(answer: Answer): boolean {
  if (!answer.required) return false;
  const { value } = answer;
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function formatValue(value: Answer["value"], t: any): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? t("fillReview.yes") : t("fillReview.no");
  return String(value);
}

async function fetchFullResponse(id: string): Promise<FullResponse> {
  const response = await apiClient.get<FullResponse>(`/responses/${id}/full`);
  return response.data;
}

async function submitResponse(id: string): Promise<void> {
  // TODO: confirm the real submit contract with backend and update this.
  await apiClient.post(`/responses/${id}/submit`);
}

// ---------- Page ----------

export default function ReviewPage() {
  const { formId } = useParams<{ formId: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [data, setData] = useState<FullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetchFullResponse(formId);
      setData(response);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("fillReview.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    load();
  }, [load]);

  const missingCount =
    data?.sections.reduce(
      (count, section) => count + section.answers.filter(isMissing).length,
      0,
    ) ?? 0;

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitResponse(formId);
      router.push(`/studio/forms/${formId}/fill/thank-you`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t("fillReview.submitFailed"),
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <StatusText>{t("fillReview.loading")}</StatusText>
      </Wrapper>
    );
  }

  if (loadError || !data) {
    return (
      <Wrapper>
        <StatusText role="alert">
          {loadError ?? t("fillReview.somethingWentWrong")}
        </StatusText>
        <RetryButton onClick={load}>{t("fillReview.tryAgain")}</RetryButton>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>
        <Title>{data.formTitle}</Title>
        <Subtitle>{t("fillReview.subtitle")}</Subtitle>
      </Header>

      {missingCount > 0 && (
        <MissingBanner role="alert">
          {t("fillReview.missingBanner", { count: missingCount, plural: missingCount === 1 ? t("fillReview.missingBannerOne") : t("fillReview.missingBannerMany") })}
        </MissingBanner>
      )}

      {data.sections.map((section) => (
        <SectionBlock key={section.id}>
          <SectionTitle>{section.title}</SectionTitle>
          <AnswerList>
            {section.answers.map((answer) => {
              const missing = isMissing(answer);
              return (
                <AnswerRow key={answer.questionId} $missing={missing}>
                  <AnswerLabel>{answer.label}</AnswerLabel>
                  {missing ? (
                    <MissingValue>{t("fillReview.missingValue")}</MissingValue>
                  ) : (
                    <AnswerValue>
                      {formatValue(answer.value, t) || "—"}
                    </AnswerValue>
                  )}
                </AnswerRow>
              );
            })}
          </AnswerList>
        </SectionBlock>
      ))}

      <SubmitBar>
        {submitError && (
          <SubmitErrorText role="alert">{submitError}</SubmitErrorText>
        )}
        <SubmitButton
          onClick={() => setShowConfirm(true)}
          disabled={submitting}>
          {t("fillReview.submitBtn")}
        </SubmitButton>
      </SubmitBar>

      {showConfirm && (
        <ModalOverlay onClick={() => !submitting && setShowConfirm(false)}>
          <ModalCard onClick={(e: any) => e.stopPropagation()}>
            <ModalTitle>{t("fillReview.modalTitle")}</ModalTitle>
            <ModalBody>
              {t("fillReview.modalBody")}
              {missingCount > 0 && (
                <ModalWarning>
                  {" "}
                  {t("fillReview.modalWarning", { count: missingCount, plural: missingCount === 1 ? t("fillReview.missingBannerOne") : t("fillReview.missingBannerMany") })}
                </ModalWarning>
              )}
            </ModalBody>
            <ModalActions>
              <CancelButton
                onClick={() => setShowConfirm(false)}
                disabled={submitting}>
                {t("fillReview.cancelBtn")}
              </CancelButton>
              <ConfirmButton
                onClick={handleConfirmSubmit}
                disabled={submitting}>
                {submitting ? t("fillReview.submitting") : t("fillReview.confirmBtn")}
              </ConfirmButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}

// ---------- Styled components ----------

const Wrapper = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
`;

const StatusText = styled.p`
  font-size: 0.95rem;
  color: #4b5563;
  text-align: center;
  margin-top: 3rem;
`;

const RetryButton = styled.button`
  display: block;
  margin: 1rem auto 0;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
`;

const MissingBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
`;

const SectionBlock = styled.section`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 1.25rem;
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  background: #f9fafb;
  margin: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const AnswerList = styled.dl`
  margin: 0;
`;

const AnswerRow = styled.div<{ $missing: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  background: ${(p: any) => (p.$missing ? "#fef2f2" : "transparent")};

  &:last-child {
    border-bottom: none;
  }
`;

const AnswerLabel = styled.dt`
  font-size: 0.875rem;
  color: #4b5563;
  flex: 1;
`;

const AnswerValue = styled.dd`
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
  text-align: right;
  margin: 0;
  flex: 1;
`;

const MissingValue = styled.dd`
  font-size: 0.875rem;
  color: #dc2626;
  font-weight: 600;
  text-align: right;
  margin: 0;
  flex: 1;
`;

const SubmitBar = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
`;

const SubmitErrorText = styled.p`
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0;
`;

const SubmitButton = styled.button`
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: #111827;
`;

const ModalBody = styled.p`
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
  margin: 0 0 1.5rem;
`;

const ModalWarning = styled.span`
  color: #b91c1c;
  font-weight: 600;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const CancelButton = styled.button`
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled.button`
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: none;
  background: #dc2626;
  color: #fff;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
