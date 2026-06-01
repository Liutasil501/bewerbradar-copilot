'use client';

import { useState, useCallback } from 'react';
import type { Resume } from '@/types/resume';
import { toast } from 'sonner';

function getHeaders() {
  const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('br_fingerprint') : null;
  return {
    'Content-Type': 'application/json',
    ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
  };
}

export function useResume() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchResumes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/resume', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to fetch resumes');
      }
    } catch (error: any) {
      console.error('Failed to fetch resumes:', error);
      toast.error(error.message || 'Failed to fetch resumes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createResume = useCallback(async (data: { title?: string; template?: string; language?: string; sections?: Array<{ type: string; title: string; sortOrder: number; visible: boolean; content: unknown }> }) => {
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resume = await res.json();
        setResumes((prev) => [resume, ...prev]);
        return resume;
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to create resume');
      }
    } catch (error: any) {
      console.error('Failed to create resume:', error);
      toast.error(error.message || 'Failed to create resume');
    }
    return null;
  }, []);

  const deleteResume = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/resume/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to delete resume');
      }
    } catch (error: any) {
      console.error('Failed to delete resume:', error);
      toast.error(error.message || 'Failed to delete resume');
    }
    return false;
  }, []);

  const renameResume = useCallback(async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/resume/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setResumes((prev) => prev.map((r) => r.id === id ? { ...r, title } : r));
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to rename resume');
      }
    } catch (error: any) {
      console.error('Failed to rename resume:', error);
      toast.error(error.message || 'Failed to rename resume');
    }
    return false;
  }, []);

  const duplicateResume = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/resume/${id}/duplicate`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        const resume = await res.json();
        setResumes((prev) => [resume, ...prev]);
        return resume;
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to duplicate resume');
      }
    } catch (error: any) {
      console.error('Failed to duplicate resume:', error);
      toast.error(error.message || 'Failed to duplicate resume');
    }
    return null;
  }, []);

  return {
    resumes,
    isLoading,
    fetchResumes,
    createResume,
    deleteResume,
    renameResume,
    duplicateResume,
  };
}
