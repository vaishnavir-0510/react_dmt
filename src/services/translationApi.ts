// services/translationApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface TranslationFile {
  file_id: string;
  filename: string;
  label: string;
  file_type: string;
  file_format: string;
  size: string;
  record_count: number;
  fields_count: number;
  language: string;
  s3_path: string;
  s3_bucket: string;
  project_id: string;
  environment_id: string;
  status: string;
  created_date: string;
  modified_date: string | null;
  description: string | null;
  parent_file_id: string | null;
}

export interface SupportedLanguage {
  id: number;
  label: string;
  locale_code: string;
  language_type: string;
  is_active: boolean;
}

export interface TranslationRequest {
  source_file_id: string;
  target_language: string;
  target_language_code: string;
}

export interface TranslationResponse {
  success: boolean;
  source_file_id: string;
  translated_file_id: string;
  source_filename: string;
  translated_filename: string;
  target_language: string;
  target_language_code: string;
  total_keys: number;
  successful_translations: number;
  avg_confidence: number;
  s3_path: string;
  message: string;
}

export interface TranslationItem {
  key: string;
  source_text: string;
  translated_text: string;
  confidence: number;
}

export interface TranslationComparison {
  source_file_id: string;
  translated_file_id: string;
  source_filename: string;
  translated_filename: string;
  source_language: string;
  target_language: string;
  items: TranslationItem[];
  pagination: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
  };
  search: string | null;
}

export interface UpdateTranslationRequest {
  file_id: string;
  key_updates: Record<string, string>;
}

export interface TranslationHistoryItem {
  date: string;
  name: string;
  url: string;
  file_path: string;
  file_id: string;
  file_type: string;
  language: string;
  size: string;
  record_count: number;
  status: string;
  created_by: string;
}

export interface TranslationDashboardData {
  overview: {
    project_name: string;
    source_language: string;
    overall_progress: number;
    total_keys: number;
    target_languages: number;
    needs_manual_review: number;
  };
  languages: Array<{
    language: string;
    status: string;
    progress: number;
    avg_confidence: number;
    review_count: number;
    actions_available: string[];
  }>;
  confidence_distribution: {
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
    distribution_data: {
      ">90%": number;
      "75-89%": number;
      "<75%": number;
    };
  };
}

export const translationApi = createApi({
  reducerPath: 'translationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['TranslationFiles', 'SupportedLanguages', 'Translations', 'TranslationHistory', 'TranslationDashboard'],
  endpoints: (builder) => ({
    // Get latest STF file
    getLatestStfFile: builder.query<TranslationFile, void>({
      query: () => ({
        url: '/translation/api/stf/latest',
        method: 'GET',
      }),
      providesTags: ['TranslationFiles'],
    }),

    // Upload STF file
    uploadStfFile: builder.mutation<{
      success: boolean;
      file_id: string;
      filename: string;
      language: string;
      key_count: number;
      s3_path: string;
      file_type: string;
      message: string;
    }, FormData>({
      query: (formData) => ({
        url: '/translation/api/stf/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['TranslationFiles'],
    }),

    // Get supported languages
    getSupportedLanguages: builder.query<SupportedLanguage[], void>({
      query: () => ({
        url: '/translation/api/supported/languages',
        method: 'GET',
      }),
      providesTags: ['SupportedLanguages'],
    }),

    // Generate AI translation
    generateTranslation: builder.mutation<TranslationResponse, TranslationRequest>({
      query: (translationRequest) => ({
        url: '/translation/api/stf/translate',
        method: 'POST',
        body: translationRequest,
      }),
      invalidatesTags: ['Translations'],
    }),

    // Get translation comparison
    getTranslationComparison: builder.query<TranslationComparison, { translatedFileId: string; page?: number; pageSize?: number }>({
      query: ({ translatedFileId, page = 1, pageSize = 10 }) => ({
        url: `/translation/api/stf/compare/${translatedFileId}`,
        method: 'GET',
        params: { page, page_size: pageSize },
      }),
      providesTags: ['Translations'],
    }),

    // Update translation
    updateTranslation: builder.mutation<any, UpdateTranslationRequest>({
      query: (updateRequest) => ({
        url: '/translation/api/stf/update',
        method: 'PUT',
        body: updateRequest,
      }),
      invalidatesTags: ['Translations'],
    }),

    // Note: File downloads are handled directly in components to avoid Redux serialization issues

    // Get translation history
    getTranslationHistory: builder.query<TranslationHistoryItem[], void>({
      query: () => ({
        url: '/translation/api/history',
        method: 'GET',
      }),
      providesTags: ['TranslationHistory'],
    }),

    // Get translation dashboard data
    getTranslationDashboard: builder.query<TranslationDashboardData, void>({
      query: () => ({
        url: '/translation/api/dashboard/data',
        method: 'GET',
      }),
      providesTags: ['TranslationDashboard'],
    }),
  }),
});

export const {
  useGetLatestStfFileQuery,
  useUploadStfFileMutation,
  useGetSupportedLanguagesQuery,
  useGenerateTranslationMutation,
  useGetTranslationComparisonQuery,
  useUpdateTranslationMutation,
  useGetTranslationHistoryQuery,
  useGetTranslationDashboardQuery,
} = translationApi;