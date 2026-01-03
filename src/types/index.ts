// types.ts - Fix the naming conflict
export interface User {
  user_id: string;
  user: string;
  tenant_id: string;
  role_id: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  domain_name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  environment?: string;
  created?: string;
  
  // API specific fields
  project_id?: string;
  project_name?: string;
  account_name?: string;
  active?: boolean;
  
  // Add missing properties from API response
  start_date?: string;
  end_date?: string;
  client?: string;
  client_website?: string;
  business_function?: string;
  project_type?: 'migration' | 'backup' | 'translation' | 'file migration' | 'filemigration';
  owner_id?: string;
  owner_name?: string;
  project_manager?: string;
  created_date?: string;
  modified_date?: string;
  created_by?: string;
  modified_by?: string;
  is_deleted?: boolean;
  tenant_key?: string;
  user_count?: number;
}

export interface ApiProject {
  project_id: string;
  project_name: string;
  account_name: string;
  status: string;
  start_date: string;
  end_date: string;
  active: boolean;
  owner_id: string;
  owner_name: string;
  project_manager: string;
  client: string;
  client_website: string;
  business_function: string;
  description: string;
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_deleted: boolean;
  tenant_key: string;
  user_count: number;
   project_type: 'migration' | 'backup' | 'translation' | 'file migration' | 'filemigration';
}

export interface System {
  id: string;
  name: string;
  type: 'source' | 'target';
  owner_username: string;
  owner: string;
  project: string;
  account: string;
  tenant_key: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
  is_deleted: boolean;
}

export interface Environment {
  id: string;
  name: string;
  owner_name: string;
  owner_id: string;
  project: string;
  system_id: string | null;
  is_prod: boolean;
  type: string;
  start_date: string | null;
  end_date: string | null;
  created_date: string;
  modified_date: string;
  modified_by: string;
  is_deleted: boolean;
}

export interface Workspace {
  user: string;
  project: string;
  environment: string | null;
}

export interface WorkspaceResponse {
  message: string;
  workspace: Workspace;
}

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  phone_no: string;
  status: 'active' | 'inactive' | 'rejected';
  role: string;
  role_id: string;
  tenant_id: string;
  is_deleted: boolean;
  is_external: boolean;
  is_registered: boolean;
  mfa_active: boolean;
  is_logged_in: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
}

export interface SystemUsersResponse {
  users?: SystemUser[];
  data?: SystemUser[];
  [key: string]: any;
}

export interface ProjectUser {
  user_id: string;
  firstname: string;
  lastname: string;
  rolename: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
  tenant_key: string;
  active: boolean;
}

export interface AddUserRequest {
  user_id: string;
  project_id: string;
  role_id: string;
}

export interface InviteUserRequest {
  email: string;
  role: string;
}

export interface UpdateUserRequest {
  id: string;
  username?: string;
  email?: string;
  phone_no?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'rejected';
  mfa_active?: boolean;
}

// Renamed from 'Account' to 'AccountData' to avoid conflict
export interface AccountData {
  id: string;
  owner: string;
  name: string;
  tenant_key: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
  is_deleted: boolean;
}

export interface Summary {
  project_count: number;
  active_project_count: number;
  user_count: number;
  user_active_count: number;
}

// Add to your types.ts file
export interface ObjectEstimator {
  object_id: string;
  Object_name: string;
  project_id: string;
  environment_id: string;
  activity: string;
  completion: number;
  is_completed: boolean;
}

export interface ObjectEstimatorResponse {
  [key: string]: ObjectEstimator[];
}

// REMOVED DUPLICATE ObjectData interface - keeping only one definition
export interface ObjectData {
  object_id: string;
  project: string;
  system: string;
  field_count: number;
  criteria: string;
  migration_count: string;
  created_by: string;
  modified_by: string;
  is_deleted: boolean;
  tenant_key: string;
  created_date: string;
  modified_date: string;
  name: string;
  description: string;
  notes: string | null;
  records_count: string;
  post_mig_strategy: string;
  operation: string;
  system_name: string;
  owner_name: string;
  is_completed: boolean;
}

// types.ts - Add these interfaces with different names
export interface ProjectEstimatorActivity {
  activity: string;
  name: string;
  phase: string;
  range_min: number;
  range_max: number;
  project_id: string;
  id: string;
  dev_set_value: number;
  uat_set_value: number;
  prod_set_value: number;
  qa_set_value: number;
  dev_recc_effort: number;
  tenant_key: string;
  created_by: string;
  modified_by: string;
  is_deleted: boolean;
  created_date: string;
  modified_date: string;
  project_est_data: boolean;
}

export interface ProjectObjectEstimation {
  Object_name: string;
  Info: Array<{
    activity: string;
    efforts: number;
  }>;
  total_efforts: number;
}

// types.ts - Add migration types
export interface MigrationObject {
  object_id: string;
  object_name: string;
  system_id: string;
  system_name: string;
  project_id: string;
  records_count: string;
  field_count: number;
  operation: string;
  description: string;
  is_completed: boolean;
  migration_name?: string;
}

export interface MigrationState {
  selectedObject: MigrationObject | null;
  activeTab: string;
  migrationName: string;
  // Tab-specific data
  summaryData: any;
  relationshipData: any;
  filterData: any;
  metadataData: any;
  cleanupData: any;
  transformData: any;
  mappingData: any;
  validateData: any;
  loadData: any;
  errorData: any;
  workflowsData: any;
}

export const MIGRATION_TABS = [
  'summary',
  'relationship',
  'filter',
  'metadata',
  'cleanup',
  'transform',
  'mapping',
  'validate',
  'load',
  'error',
  'workflows'
] as const;

export type MigrationTab = typeof MIGRATION_TABS[number];

// SINGLE MetadataField interface definition - remove duplicates
export interface MetadataField {
  id: number;
  name: string;
  label: string;
  datatype: string;
  type: string;
  max_length: string;
  length: string;
  is_required: string;
  is_unique: string;
  is_pk: string;
  is_fk: string;
  description: string;
  sample_value: string;
  data_count: string;
  unique_values_count: string;
  null_count: string;
  data_quality: string;
  field_source: string;
  for_migrate: string;
  
  // Data Type and Structure fields
  min_length: string;
  is_fixed_length: string;
  float_precision: string;
  is_float: string;
  is_integer: string;
  is_text: string;
  is_html: string;
  is_encoded: string;
  nullable: string;
  
  // Date and Time Management fields
  timezone: string;
  date_format: string;
  duration_unit: string;
  is_timezone: string;
  is_date: string;
  is_time: string;
  is_datetime: string;
  is_duration: string;
  
  // Currency fields
  currency_code: string;
  
  // General Information fields
  permission: string;
  owner: string;
  
  // Validation and Formatting fields
  text_case: string;
  security_class: string;
  data_format: string;
  mask: string;
  is_case_sensitive: string;
  is_picklist: string;
  is_null: string;
  
  // Identification and Key Relationships fields
  fk_system: string;
  fk_object: string;
  fk_field: string;
  externalid: string;
  
  // Geographical and Contact Information fields
  is_address_line: string;
  is_email: string;
  is_link: string;
  is_country: string;
  is_state: string;
  is_phone: string;
  is_pincode: string;
  is_city: string;
  
  // Data Source and Migration fields
  field_id: string;
  object_id: string;
  system_id: string;
  
  // Data Properties & Characteristics fields
  max_value: string;
  min_value: string;
  average_value: string;
  standard_deviation: string;
  mean_value: string;
  mode_value: string;
  median_value: string;
  
  // Identification & Encoding fields
  text_encoding: string;
  entity: string;
  is_noun: string;
  
  // Data Count & Uniqueness fields
  outliers: string;
  is_multi_picklist: string;
  picklist_values: string;
  
  // Data Trends & Distribution fields
  data_trend: string;
  data_distribution: string;
  data_trend_direction: string;
  data_density: string;
  
  // Additional numeric value counts
  lt_zero_count: string;
  gt_zero_count: string;
  eq_zero_count: string;
  lt_mean_count: string;
  gt_mean_count: string;
  eq_mean_count: string;
  lt_median_count: string;
  gt_median_count: string;
  eq_median_count: string;
  
  // Additional fields
  autoNumber: string;
  
  // System fields
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;
  tenant_id: string;
  
  // Allow any other fields that might come from the API
  [key: string]: any;
}
export interface MappedObject {
  id: string;
  name: string;
  system: string;
  project: string;
  description: string;
  operation: string;
  created_date: string;
  modified_date: string;
}// Add to your types.ts file
export interface CleanupField {
  field_name: string;
  target_field_name: string | null;
  metadata_attribute: string | null;
  affected_rows: number;
  old_value: string | null;
  new_value: string | null;
  change_log_id: number | null;
}

export interface CleanupResponse {
  changelog: CleanupField[];
}// Add to your types.ts file
export interface CleanupDataRecord {
  [key: string]: string | number;
  Index: number;
  "Customer Id": string;
  "First Name": string;
  "Last Name": string;
  "Company": string;
  "City": string;
  "Country": string;
  "Phone 1": string;
  "Phone 2": string;
  "Email": string;
  "Subscription Date": string;
  "Website": string;
}

export interface CleanupDataResponse {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  data: CleanupDataRecord[];
}// Add to your types.ts file
export interface CleanupFunctionValidation {
  message: string;
  rule: string;
  value?: any;
  pattern?: string;
  api?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    value: string;
  }>;
}

export interface CleanupFunctionParameter {
  attribute: string;
  label: string;
  tool_tip: string;
  ui_component: 'dropdown' | 'textbox' | 'checkbox' | 'textarea';
  validation: CleanupFunctionValidation[];
  optional: boolean;
  default: string;
  default_type: 'static' | 'dynamic';
  placeholder: string;
  hint: string;
  values: string[];
  hidden_if: Record<string, any>;
}

export interface CleanupFunctionConfig {
  function_name: string;
  title: string;
  description: string;
  helptext: string;
  parameters: Record<string, string>;
  configuration: CleanupFunctionParameter[];
}

export interface CleanupFunction {
  "JSON Configuration": CleanupFunctionConfig;
  cleanup_function_name: string;
  cleanup_fun_id: number;
  change_log_id: number;
  affected_rows: number;
  params: Record<string, string>;
}

export interface CleanupFunctionsResponse {
  data: CleanupFunction[];
}// types.ts - Add new interfaces
export interface CleanupTask {
  task_id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'ERROR';
  progress: number;
  stage: string;
  result: any;
  error: string | null;
  change_log_id?: number;
  field_name?: string;
  timestamp?: number;
}

export interface CleanupRuleRequest {
  change_log_id: number;
  cleanup_fun_id: number;
  function_name: string;
  object_id: string;
  params: Record<string, any>;
  sequence?: number;
  tab_name?: string;
  validation_fun_id?: number | null;
}
export interface TransformDataRecord {
  [key: string]: string | number;
  Index: number;
  "Customer Id": string;
  "First Name": string;
  "Last Name": string;
  "Company": string;
  "City": string;
  "Country": string;
  "Phone 1": string;
  "Phone 2": string;
  "Email": string;
  "Subscription Date": string;
  "Website": string;
}

export interface FilterDataRecord {
  [key: string]: string | number;
}

export interface FilterDataResponse {
  filename: string;
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  contents: FilterDataRecord[];
}
